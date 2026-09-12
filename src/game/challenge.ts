import type { DraftAvailability } from './draft';
import { DRAFT_REGION_GROUP_IDS } from './types';
import type { DraftRegionGroupId, DraftRegionManifest } from './types';
import { isCampaignSeed } from './random';

export const CHALLENGE_VERSION = 1;
export const CHALLENGE_QUERY_PARAM = 'challenge';

export interface CampaignChallenge {
  version: typeof CHALLENGE_VERSION;
  seed: string;
  datasetVersion: string;
  availability: DraftAvailability;
}

interface CompactChallenge {
  v: number;
  s: string;
  d: string;
  e: number;
  y: number[];
  g: string[];
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
  if (!/^[a-zA-Z0-9_-]{1,1000}$/.test(value)) throw new Error('Código de desafio inválido.');
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function sortedAvailability(availability: DraftAvailability): DraftAvailability {
  return {
    startingExchanges: availability.startingExchanges,
    activeYears: [...new Set(availability.activeYears)].sort((a, b) => a - b),
    activeRegionGroups: DRAFT_REGION_GROUP_IDS.filter((group) =>
      availability.activeRegionGroups.includes(group),
    ),
  };
}

function isValidAvailability(
  availability: DraftAvailability,
  manifest: DraftRegionManifest,
): boolean {
  const years = new Set(manifest.groups.map((entry) => entry.year));
  if (
    !Number.isInteger(availability.startingExchanges) ||
    availability.startingExchanges < 0 ||
    availability.startingExchanges > 9 ||
    availability.activeYears.length === 0 ||
    availability.activeRegionGroups.length === 0 ||
    availability.activeYears.some((year) => !Number.isInteger(year) || !years.has(year)) ||
    availability.activeRegionGroups.some(
      (group) => !(DRAFT_REGION_GROUP_IDS as readonly string[]).includes(group),
    )
  )
    return false;
  return manifest.groups.some(
    (entry) =>
      availability.activeYears.includes(entry.year) &&
      entry.groups.some((group) => availability.activeRegionGroups.includes(group.id)),
  );
}

export function encodeChallenge(challenge: CampaignChallenge): string {
  const availability = sortedAvailability(challenge.availability);
  const compact: CompactChallenge = {
    v: challenge.version,
    s: challenge.seed,
    d: challenge.datasetVersion,
    e: availability.startingExchanges,
    y: availability.activeYears,
    g: availability.activeRegionGroups,
  };
  return encodeBase64Url(JSON.stringify(compact));
}

export function decodeChallenge(
  value: string | null,
  manifest: DraftRegionManifest,
): CampaignChallenge | null {
  if (!value) return null;
  try {
    const compact = JSON.parse(decodeBase64Url(value)) as Partial<CompactChallenge>;
    if (
      compact.v !== CHALLENGE_VERSION ||
      !isCampaignSeed(compact.s) ||
      compact.d !== manifest.datasetVersion ||
      typeof compact.e !== 'number' ||
      !Array.isArray(compact.y) ||
      !Array.isArray(compact.g) ||
      !compact.g.every((group): group is DraftRegionGroupId => typeof group === 'string')
    )
      return null;
    const availability = sortedAvailability({
      startingExchanges: compact.e,
      activeYears: compact.y,
      activeRegionGroups: compact.g,
    });
    if (!isValidAvailability(availability, manifest)) return null;
    return {
      version: CHALLENGE_VERSION,
      seed: compact.s,
      datasetVersion: compact.d,
      availability,
    };
  } catch {
    return null;
  }
}

export function challengeCode(challenge: CampaignChallenge): string {
  return challenge.seed.slice(0, 4).toUpperCase() + '-' + challenge.seed.slice(4, 8).toUpperCase();
}

export function createChallengeUrl(challenge: CampaignChallenge, pageUrl: string): string {
  const url = new URL(pageUrl);
  url.search = '';
  url.hash = '';
  url.searchParams.set(CHALLENGE_QUERY_PARAM, encodeChallenge(challenge));
  return url.toString();
}
