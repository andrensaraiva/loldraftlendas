import { ROLES } from './types';
import { draftRegionGroups, playerIsInDraftRegion } from './regions';
import type {
  DraftRegionGroupId,
  DraftRegionManifest,
  DraftRound,
  PlayerVersion,
  Role,
} from './types';

export const DRAFT_CONFIG = { exchanges: 3, choices: 3, selectionMs: 320, rollMs: 320 } as const;
export type Exchange = 'year' | 'region' | 'players';
export interface DraftAvailability {
  startingExchanges: number;
  activeYears: number[];
  activeRegionGroups: DraftRegionGroupId[];
}
type Random = () => number;
export type DraftPool = Omit<DraftRound, 'options'> & { players: PlayerVersion[] };
const choose = <T>(xs: T[], rng: Random): T =>
  xs[Math.min(xs.length - 1, Math.floor(rng() * xs.length))];
export function eligiblePools(
  players: PlayerVersion[],
  manifest?: DraftRegionManifest,
  availability?: DraftAvailability,
): DraftPool[] {
  const groups = new Map<string, DraftPool>();
  for (const year of new Set(players.map((player) => player.worldsYear))) {
    for (const region of draftRegionGroups(players, year, DRAFT_CONFIG.choices, manifest)) {
      for (const role of ROLES) {
        const poolPlayers = [
          ...new Map(
            players
              .filter(
                (player) =>
                  player.worldsYear === year &&
                  player.role === role &&
                  playerIsInDraftRegion(player, region),
              )
              .map((player) => [player.id, player]),
          ).values(),
        ];
        const key = `${year}/${region.id}/${role}`;
        groups.set(key, { year, region, role, players: poolPlayers });
      }
    }
  }
  return [...groups.values()].filter(
    (pool) =>
      pool.players.length >= DRAFT_CONFIG.choices &&
      (!availability ||
        (availability.activeYears.includes(pool.year) &&
          availability.activeRegionGroups.includes(pool.region.id))),
  );
}
export const offerKey = (r: DraftRound) =>
  `${r.role}/${r.year}/${r.region.id}/${r.options
    .map((p) => p.id)
    .sort()
    .join(',')}`;
function combinations(players: PlayerVersion[]): PlayerVersion[][] {
  const result: PlayerVersion[][] = [];
  for (let i = 0; i < players.length - 2; i++)
    for (let j = i + 1; j < players.length - 1; j++)
      for (let k = j + 1; k < players.length; k++)
        result.push([players[i], players[j], players[k]]);
  return result;
}
function diverseCombinations(players: PlayerVersion[]): PlayerVersion[][] {
  const options = combinations(players);
  const maxTeams = Math.max(...options.map((candidate) => new Set(candidate.map((p) => p.team)).size));
  return options.filter((candidate) => new Set(candidate.map((p) => p.team)).size === maxTeams);
}
export function rollRound(pools: DraftPool[], role: Role, rng: Random = Math.random): DraftRound {
  const valid = pools.filter((p) => p.role === role);
  if (!valid.length) throw new Error(`Sem pools válidos para ${role}`);
  const year = choose([...new Set(valid.map((p) => p.year))], rng);
  const pool = choose(
    valid.filter((p) => p.year === year),
    rng,
  );
  return { role, year, region: pool.region, options: choose(diverseCombinations(pool.players), rng) };
}
export function createDraft(
  players: PlayerVersion[],
  rng: Random = Math.random,
  manifest?: DraftRegionManifest,
  availability?: DraftAvailability,
): DraftRound[] {
  const pools = eligiblePools(players, manifest, availability);
  return ROLES.map((role) => rollRound(pools, role, rng));
}
export function exchangeAlternatives(
  round: DraftRound,
  pools: DraftPool[],
  kind: Exchange,
): DraftRound[] {
  return pools
    .filter(
      (p) =>
        p.role === round.role &&
        (kind === 'year'
          ? p.region.id === round.region.id && p.year !== round.year
          : kind === 'region'
            ? p.year === round.year && p.region.id !== round.region.id
            : p.year === round.year && p.region.id === round.region.id),
    )
    .flatMap((p) =>
      diverseCombinations(p.players).map((options) => ({
        role: p.role,
        year: p.year,
        region: p.region,
        options,
      })),
    )
    .filter((r) => offerKey(r) !== offerKey(round));
}
export function exchangeRound(
  round: DraftRound,
  pools: DraftPool[],
  kind: Exchange,
  remaining: number,
  rejected: string[],
  rng: Random = Math.random,
) {
  const unchanged = { round, remaining, rejected, changed: false };
  if (remaining <= 0) return unchanged;
  let alternatives = exchangeAlternatives(round, pools, kind);
  if (!alternatives.length) return unchanged;
  const history = [...rejected, offerKey(round)];
  const fresh = alternatives.filter((r) => !history.includes(offerKey(r)));
  if (fresh.length) alternatives = fresh;
  // For player-only exchanges maximize new faces before random tie breaking.
  if (kind === 'players') {
    const overlap = (r: DraftRound) =>
      r.options.filter((p) => round.options.some((x) => x.id === p.id)).length;
    const min = Math.min(...alternatives.map(overlap));
    alternatives = alternatives.filter((r) => overlap(r) === min);
  }
  // Equal chance per destination year/region, independent of its number of combinations.
  const destinations = [...new Set(alternatives.map((r) => `${r.year}/${r.region.id}`))];
  const destination = choose(destinations, rng);
  return {
    round: choose(
      alternatives.filter((r) => `${r.year}/${r.region.id}` === destination),
      rng,
    ),
    remaining: remaining - 1,
    rejected: history,
    changed: true,
  };
}
