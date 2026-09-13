import type { CampaignStorage } from './campaign';
import type { DraftAvailability } from './draft';
import { DRAFT_REGION_GROUP_IDS } from './types';
import { campaignSeedFromText } from './random';
import type { GameMode } from './mode';

export const DAILY_CHALLENGE_VERSION = 1;
export const DAILY_ATTEMPTS_KEY = 'draft-lendas.daily-attempts';
export const DAILY_TIME_ZONE = 'America/Sao_Paulo';
const MAX_DAILY_ATTEMPTS = 100;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DailyChallenge {
  id: string;
  date: string;
  seed: string;
  datasetVersion: string;
  gameMode: GameMode;
  availability: DraftAvailability;
}

export type DailyAttemptKind = 'official' | 'friendly';

export interface DailyAttempt {
  id: string;
  challengeId: string;
  kind: DailyAttemptKind;
  startedAt: string;
  completedAt: string | null;
  outcome: string | null;
}

function browserStorage(): CampaignStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function canonicalAvailability(availability: DraftAvailability): DraftAvailability {
  return {
    startingExchanges: availability.startingExchanges,
    activeYears: [...new Set(availability.activeYears)].sort((a, b) => a - b),
    activeRegionGroups: DRAFT_REGION_GROUP_IDS.filter((group) =>
      availability.activeRegionGroups.includes(group),
    ),
  };
}

export function dailyDateKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function previousDailyDate(date: string, days = 1): string {
  if (!DATE_KEY_PATTERN.test(date) || !Number.isInteger(days) || days < 0)
    throw new Error('Data diária inválida.');
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day - days, 12));
  return value.toISOString().slice(0, 10);
}

export function createDailyChallenge(
  date: string,
  datasetVersion: string,
  availability: DraftAvailability,
): DailyChallenge {
  if (!DATE_KEY_PATTERN.test(date) || !datasetVersion) throw new Error('Desafio diário inválido.');
  const rules = canonicalAvailability(availability);
  const identity = [
    `daily-v${DAILY_CHALLENGE_VERSION}`,
    date,
    datasetVersion,
    rules.startingExchanges,
    rules.activeYears.join(','),
    rules.activeRegionGroups.join(','),
    'almanac',
  ].join(':');
  return {
    id: `daily-v${DAILY_CHALLENGE_VERSION}-${date}-${datasetVersion}`,
    date,
    seed: campaignSeedFromText(identity),
    datasetVersion,
    gameMode: 'almanac',
    availability: rules,
  };
}

export function recentDailyChallenges(
  now: Date,
  count: number,
  datasetVersion: string,
  availability: DraftAvailability,
): DailyChallenge[] {
  const total = Math.max(1, Math.min(14, Math.floor(count)));
  const today = dailyDateKey(now);
  return Array.from({ length: total }, (_, index) =>
    createDailyChallenge(previousDailyDate(today, index), datasetVersion, availability),
  );
}

function isDailyAttempt(value: unknown): value is DailyAttempt {
  if (!value || typeof value !== 'object') return false;
  const attempt = value as Partial<DailyAttempt>;
  return (
    typeof attempt.id === 'string' &&
    typeof attempt.challengeId === 'string' &&
    ['official', 'friendly'].includes(attempt.kind ?? '') &&
    typeof attempt.startedAt === 'string' &&
    (attempt.completedAt === null || typeof attempt.completedAt === 'string') &&
    (attempt.outcome === null || typeof attempt.outcome === 'string')
  );
}

export function loadDailyAttempts(
  storage: CampaignStorage | null = browserStorage(),
): DailyAttempt[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(DAILY_ATTEMPTS_KEY) ?? '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter(isDailyAttempt).slice(-MAX_DAILY_ATTEMPTS) : [];
  } catch {
    return [];
  }
}

function persistDailyAttempts(attempts: DailyAttempt[], storage: CampaignStorage | null): void {
  try {
    storage?.setItem(DAILY_ATTEMPTS_KEY, JSON.stringify(attempts.slice(-MAX_DAILY_ATTEMPTS)));
  } catch {
    // Storage is an optional convenience; gameplay must still be available.
  }
}

function defaultAttemptId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function beginDailyAttempt(
  challengeId: string,
  storage: CampaignStorage | null = browserStorage(),
  now: () => Date = () => new Date(),
  createId: () => string = defaultAttemptId,
  officialAllowed = true,
): DailyAttempt {
  const attempts = loadDailyAttempts(storage);
  const kind: DailyAttemptKind =
    !officialAllowed ||
    attempts.some((attempt) => attempt.challengeId === challengeId && attempt.kind === 'official')
      ? 'friendly'
      : 'official';
  const attempt: DailyAttempt = {
    id: createId(),
    challengeId,
    kind,
    startedAt: now().toISOString(),
    completedAt: null,
    outcome: null,
  };
  persistDailyAttempts([...attempts, attempt], storage);
  return attempt;
}

export function completeDailyAttempt(
  attemptId: string,
  outcome: string,
  storage: CampaignStorage | null = browserStorage(),
  now: () => Date = () => new Date(),
): boolean {
  const attempts = loadDailyAttempts(storage);
  const index = attempts.findIndex((attempt) => attempt.id === attemptId);
  if (index < 0) return false;
  if (attempts[index].completedAt) return false;
  attempts[index] = {
    ...attempts[index],
    completedAt: now().toISOString(),
    outcome: outcome.slice(0, 80),
  };
  persistDailyAttempts(attempts, storage);
  return true;
}

export function officialDailyAttempt(
  challengeId: string,
  storage: CampaignStorage | null = browserStorage(),
): DailyAttempt | null {
  return (
    loadDailyAttempts(storage).find(
      (attempt) => attempt.challengeId === challengeId && attempt.kind === 'official',
    ) ?? null
  );
}
