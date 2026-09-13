import { isDraftAvailabilityEligible } from './draft';
import type { DraftAvailability } from './draft';
import { DRAFT_REGION_GROUP_IDS } from './types';
import type { DraftRegionGroupId, DraftRegionManifest } from './types';
import { isCampaignSeed } from './random';
import { isGameMode } from './mode';
import type { GameMode } from './mode';
import { isGamePlan } from './plan';
import type { GamePlan } from './plan';

export const CHALLENGE_VERSION = 1;
export const CHALLENGE_QUERY_PARAM = 'challenge';

export interface CampaignChallenge {
  version: typeof CHALLENGE_VERSION;
  seed: string;
  datasetVersion: string;
  gameMode: GameMode;
  gamePlan: GamePlan | null;
  availability: DraftAvailability;
}

interface CompactChallenge {
  v: number;
  s: string;
  d: string;
  e: number;
  y: number[];
  g: string[];
  m?: string;
  p?: string;
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

export function encodeChallenge(challenge: CampaignChallenge): string {
  const availability = sortedAvailability(challenge.availability);
  const compact: CompactChallenge = {
    v: challenge.version,
    s: challenge.seed,
    d: challenge.datasetVersion,
    e: availability.startingExchanges,
    y: availability.activeYears,
    g: availability.activeRegionGroups,
    m: challenge.gameMode,
    ...(challenge.gamePlan ? { p: challenge.gamePlan } : {}),
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
    if (!isDraftAvailabilityEligible(manifest, availability)) return null;
    const gameMode = compact.m === undefined ? 'classic' : compact.m;
    if (!isGameMode(gameMode)) return null;
    const gamePlan = compact.p === undefined ? null : compact.p;
    if (gamePlan !== null && !isGamePlan(gamePlan)) return null;
    return {
      version: CHALLENGE_VERSION,
      seed: compact.s,
      datasetVersion: compact.d,
      gameMode,
      gamePlan,
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
