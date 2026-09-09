import type { DraftRound, GameResult, Series, Team, Tournament } from './types';
import { DRAFT_REGION_GROUP_IDS } from './types';
import type { DraftAvailability } from './draft';

export const CAMPAIGN_SAVE_VERSION = 1;
export const CAMPAIGN_SAVE_KEY = 'draft-lendas.campaign';
export type CampaignScreen = 'draft' | 'team' | 'tournament' | 'match' | 'result';
export interface CampaignSettings {
  mode: 'detailed' | 'quick';
  speed: number;
  paused: boolean;
}
export interface CampaignState {
  screen: CampaignScreen;
  draftStep: number;
  draftAvailability?: DraftAvailability;
  remaining: number;
  rejected: string[];
  rounds: DraftRound[];
  team: Team;
  preview: number;
  tournament: Tournament;
  series: Series | null;
  settings: CampaignSettings;
  playResult: GameResult | null;
  momentIndex: number;
}
interface CampaignSave {
  version: number;
  datasetVersion: string;
  savedAt: string;
  campaign: CampaignState;
}
export interface CampaignStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStorage(): CampaignStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isCampaignState(value: unknown): value is CampaignState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CampaignState>;
  const tournament = candidate.tournament as Partial<Tournament> | undefined;
  const settings = candidate.settings as Partial<CampaignSettings> | undefined;
  const availability = candidate.draftAvailability;
  return (
    ['draft', 'team', 'tournament', 'match', 'result'].includes(candidate.screen ?? '') &&
    typeof candidate.draftStep === 'number' &&
    (availability === undefined ||
      (Number.isInteger(availability.startingExchanges) &&
        availability.startingExchanges >= 0 &&
        availability.startingExchanges <= 9 &&
        Array.isArray(availability.activeYears) &&
        availability.activeYears.every((year) => Number.isInteger(year) && year >= 2011 && year <= 2100) &&
        Array.isArray(availability.activeRegionGroups) &&
        availability.activeRegionGroups.every((group) =>
          (DRAFT_REGION_GROUP_IDS as readonly string[]).includes(group),
        ))) &&
    typeof candidate.remaining === 'number' &&
    Array.isArray(candidate.rejected) &&
    Array.isArray(candidate.rounds) &&
    Array.isArray(candidate.team) &&
    typeof candidate.preview === 'number' &&
    !!tournament &&
    ['swiss', 'quarters', 'semis', 'final'].includes(tournament.stage ?? '') &&
    typeof tournament.wins === 'number' &&
    typeof tournament.losses === 'number' &&
    Array.isArray(tournament.history) &&
    !!settings &&
    ['detailed', 'quick'].includes(settings.mode ?? '') &&
    [1, 2, 4].includes(settings.speed ?? 0) &&
    typeof settings.paused === 'boolean' &&
    typeof candidate.momentIndex === 'number'
  );
}

function migrate(save: unknown, datasetVersion: string): CampaignState | null {
  if (!save || typeof save !== 'object') return null;
  const candidate = save as Partial<CampaignSave>;
  if (
    candidate.version !== CAMPAIGN_SAVE_VERSION ||
    candidate.datasetVersion !== datasetVersion ||
    !isCampaignState(candidate.campaign)
  )
    return null;
  return candidate.campaign;
}

export function loadCampaign(
  datasetVersion: string,
  storage: CampaignStorage | null = browserStorage(),
): CampaignState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CAMPAIGN_SAVE_KEY);
    if (!raw) return null;
    const campaign = migrate(JSON.parse(raw), datasetVersion);
    if (!campaign) storage.removeItem(CAMPAIGN_SAVE_KEY);
    return campaign;
  } catch {
    try {
      storage.removeItem(CAMPAIGN_SAVE_KEY);
    } catch {
      // Browser privacy settings can block storage mutation as well.
    }
    return null;
  }
}

export function saveCampaign(
  campaign: CampaignState,
  datasetVersion: string,
  storage: CampaignStorage | null = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(
      CAMPAIGN_SAVE_KEY,
      JSON.stringify({
        version: CAMPAIGN_SAVE_VERSION,
        datasetVersion,
        savedAt: new Date().toISOString(),
        campaign,
      } satisfies CampaignSave),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearCampaign(storage: CampaignStorage | null = browserStorage()): void {
  try {
    storage?.removeItem(CAMPAIGN_SAVE_KEY);
  } catch {
    // Clearing an optional save must never block gameplay.
  }
}