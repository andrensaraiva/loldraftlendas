import { ROLES } from './types';
import type {
  DraftRegionGroup,
  DraftRegionGroupId,
  DraftRegionManifest,
  PlayerVersion,
  Role,
} from './types';

const GROUPS: Record<DraftRegionGroupId, Omit<DraftRegionGroup, 'canonicalRegions'>> = {
  KOREA: { id: 'KOREA', label: 'KOREA' },
  CHINA: { id: 'CHINA', label: 'CHINA' },
  EUROPE: { id: 'EUROPE', label: 'EUROPA' },
  NORTH_AMERICA: { id: 'NORTH_AMERICA', label: 'AMÉRICA DO NORTE' },
  OTHER_REGIONS: { id: 'OTHER_REGIONS', label: 'OUTRAS REGIÕES' },
  EUROPE_NORTH_AMERICA: {
    id: 'EUROPE_NORTH_AMERICA',
    label: 'EUROPA + AMÉRICA DO NORTE',
  },
};

const REGION_FAMILIES: Record<Exclude<DraftRegionGroupId, 'EUROPE_NORTH_AMERICA'>, string[]> = {
  KOREA: ['LCK'],
  CHINA: ['LPL'],
  EUROPE: ['EU LCS', 'LEC'],
  NORTH_AMERICA: ['NA LCS', 'LCS'],
  OTHER_REGIONS: [],
};

export function canonicalRegionFor(player: PlayerVersion): string {
  return player.canonicalRegion ?? player.historicalLeague ?? player.region;
}

function familyFor(canonicalRegion: string): Exclude<DraftRegionGroupId, 'EUROPE_NORTH_AMERICA'> {
  return (
    (Object.entries(REGION_FAMILIES).find(([, regions]) => regions.includes(canonicalRegion))?.[0] as
      | Exclude<DraftRegionGroupId, 'EUROPE_NORTH_AMERICA'>
      | undefined) ?? 'OTHER_REGIONS'
  );
}

function group(id: DraftRegionGroupId, canonicalRegions: Iterable<string>): DraftRegionGroup {
  return { ...GROUPS[id], canonicalRegions: [...new Set(canonicalRegions)].sort() };
}

function isEligible(
  players: PlayerVersion[],
  year: number,
  canonicalRegions: string[],
  choices: number,
): boolean {
  return ROLES.every(
    (role) =>
      new Set(
        players
          .filter(
            (player) =>
              player.worldsYear === year &&
              player.role === role &&
              canonicalRegions.includes(canonicalRegionFor(player)),
          )
          .map((player) => player.id),
      ).size >= choices,
  );
}

export function draftRegionGroups(
  players: PlayerVersion[],
  year: number,
  choices: number,
  manifest?: DraftRegionManifest,
): DraftRegionGroup[] {
  const fromManifest = manifest?.groups.find((entry) => entry.year === year)?.groups;
  const canonicalRegions = canonicalRegionsForYear(players, year);
  if (
    fromManifest?.length &&
    fromManifest.every((entry) => isEligible(players, year, entry.canonicalRegions, choices)) &&
    canonicalRegions.length ===
      new Set(fromManifest.flatMap((entry) => entry.canonicalRegions)).size &&
    canonicalRegions.every((region) => fromManifest.some((entry) => entry.canonicalRegions.includes(region)))
  )
    return fromManifest;

  const regionsByFamily = new Map<Exclude<DraftRegionGroupId, 'EUROPE_NORTH_AMERICA'>, string[]>();
  for (const player of players.filter((candidate) => candidate.worldsYear === year)) {
    const family = familyFor(canonicalRegionFor(player));
    regionsByFamily.set(family, [...(regionsByFamily.get(family) ?? []), canonicalRegionFor(player)]);
  }

  const regions = (id: Exclude<DraftRegionGroupId, 'EUROPE_NORTH_AMERICA'>) =>
    [...new Set(regionsByFamily.get(id) ?? [])].sort();
  const europe = regions('EUROPE');
  const northAmerica = regions('NORTH_AMERICA');
  const other = regions('OTHER_REGIONS');
  const output: DraftRegionGroup[] = [];

  for (const id of ['KOREA', 'CHINA'] as const) {
    const canonicalRegions = regions(id);
    if (isEligible(players, year, canonicalRegions, choices)) output.push(group(id, canonicalRegions));
    else other.push(...canonicalRegions);
  }

  if (
    isEligible(players, year, europe, choices) &&
    isEligible(players, year, northAmerica, choices)
  ) {
    output.push(group('EUROPE', europe), group('NORTH_AMERICA', northAmerica));
  } else {
    const westernRegions = [...europe, ...northAmerica];
    if (isEligible(players, year, westernRegions, choices))
      output.push(group('EUROPE_NORTH_AMERICA', westernRegions));
    else other.push(...westernRegions);
  }

  if (isEligible(players, year, other, choices)) output.push(group('OTHER_REGIONS', other));
  return output;
}

export function playerIsInDraftRegion(player: PlayerVersion, region: DraftRegionGroup): boolean {
  return region.canonicalRegions.includes(canonicalRegionFor(player));
}

export function canonicalRegionsForYear(players: PlayerVersion[], year: number): string[] {
  return [...new Set(players.filter((p) => p.worldsYear === year).map(canonicalRegionFor))].sort();
}

export type DraftRegionGroupByRole = Record<Role, DraftRegionGroup[]>;