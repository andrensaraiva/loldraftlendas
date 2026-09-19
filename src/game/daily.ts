import type { CampaignStorage } from './campaign';
import type { DraftAvailability } from './draft';
import { DRAFT_REGION_GROUP_IDS } from './types';
import type { Team, Tournament } from './types';
import { campaignSeedFromText } from './random';
import type { GameMode } from './mode';

export const DAILY_CHALLENGE_VERSION = 2;
export const DAILY_MODIFIER_CATALOG_VERSION = 1;
export const DAILY_ATTEMPTS_KEY = 'draft-lendas.daily-attempts';
export const DAILY_TIME_ZONE = 'America/Sao_Paulo';
const MAX_DAILY_ATTEMPTS = 100;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DailyModifierId =
  | 'no-exchanges'
  | 'single-exchange'
  | 'era-bridge'
  | 'all-or-nothing';

export interface DailyModifier {
  id: DailyModifierId;
  catalogVersion: typeof DAILY_MODIFIER_CATALOG_VERSION;
  label: string;
  title: string;
  description: string;
  objective: string;
  startingExchanges: number | null;
}

export const DAILY_MODIFIERS: readonly DailyModifier[] = [
  {
    id: 'no-exchanges',
    catalogVersion: DAILY_MODIFIER_CATALOG_VERSION,
    label: 'SEM SEGUNDA CHANCE',
    title: 'Olho clínico',
    description: 'As ofertas são definitivas: este draft começa sem trocas.',
    objective: 'Chegue aos playoffs.',
    startingExchanges: 0,
  },
  {
    id: 'single-exchange',
    catalogVersion: DAILY_MODIFIER_CATALOG_VERSION,
    label: 'MARGEM CURTA',
    title: 'Uma escolha para mudar tudo',
    description: 'Você tem apenas uma troca durante todo o draft.',
    objective: 'Vença pelo menos cinco jogos na campanha.',
    startingExchanges: 1,
  },
  {
    id: 'era-bridge',
    catalogVersion: DAILY_MODIFIER_CATALOG_VERSION,
    label: 'PONTES ENTRE ERAS',
    title: 'Cronologia impossível',
    description: 'Construa uma equipe que atravesse a história do Worlds.',
    objective: 'Termine o draft com jogadores de quatro edições diferentes.',
    startingExchanges: null,
  },
  {
    id: 'all-or-nothing',
    catalogVersion: DAILY_MODIFIER_CATALOG_VERSION,
    label: 'TUDO OU NADA',
    title: 'Só a taça importa',
    description: 'Sem trocas e sem objetivo intermediário: a campanha exige perfeição decisiva.',
    objective: 'Conquiste o título mundial.',
    startingExchanges: 0,
  },
] as const;

export interface DailyChallenge {
  id: string;
  date: string;
  seed: string;
  datasetVersion: string;
  gameMode: GameMode;
  availability: DraftAvailability;
  modifier: DailyModifier;
}

export type DailyAttemptKind = 'official' | 'friendly';

export interface DailyAttempt {
  id: string;
  challengeId: string;
  modifierId: DailyModifierId | null;
  kind: DailyAttemptKind;
  startedAt: string;
  completedAt: string | null;
  outcome: string | null;
  objectiveMet: boolean | null;
}

export interface DailyObjectiveContext {
  team: Team;
  tournament: Tournament;
}

function browserStorage(): CampaignStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function isDailyModifierId(value: unknown): value is DailyModifierId {
  return DAILY_MODIFIERS.some((modifier) => modifier.id === value);
}

export function dailyModifier(id: DailyModifierId | null): DailyModifier | null {
  return DAILY_MODIFIERS.find((modifier) => modifier.id === id) ?? null;
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

export function isDailyModifierEligible(
  modifier: DailyModifier,
  availability: DraftAvailability,
): boolean {
  return modifier.id !== 'era-bridge' || new Set(availability.activeYears).size >= 4;
}

export function applyDailyModifierAvailability(
  availability: DraftAvailability,
  modifier: DailyModifier,
): DraftAvailability {
  return {
    ...availability,
    startingExchanges: modifier.startingExchanges ?? availability.startingExchanges,
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

function modifierIndex(identity: string, count: number): number {
  const token = campaignSeedFromText(identity);
  return [...token].reduce((total, character) => total + character.charCodeAt(0), 0) % count;
}

export function createDailyChallenge(
  date: string,
  datasetVersion: string,
  availability: DraftAvailability,
): DailyChallenge {
  if (!DATE_KEY_PATTERN.test(date) || !datasetVersion) throw new Error('Desafio diário inválido.');
  const rules = canonicalAvailability(availability);
  const eligibleModifiers = DAILY_MODIFIERS.filter((modifier) =>
    isDailyModifierEligible(modifier, rules),
  );
  if (!eligibleModifiers.length) throw new Error('Nenhum modificador diário elegível.');
  const index = modifierIndex(
    `${date}:${datasetVersion}:catalog-v${DAILY_MODIFIER_CATALOG_VERSION}`,
    eligibleModifiers.length,
  );
  const modifier = eligibleModifiers[index];
  const modifiedRules = applyDailyModifierAvailability(rules, modifier);
  const identity = [
    `daily-v${DAILY_CHALLENGE_VERSION}`,
    date,
    datasetVersion,
    modifier.id,
    modifiedRules.startingExchanges,
    modifiedRules.activeYears.join(','),
    modifiedRules.activeRegionGroups.join(','),
    'almanac',
  ].join(':');
  return {
    id: `daily-v${DAILY_CHALLENGE_VERSION}-${date}-${datasetVersion}-${modifier.id}`,
    date,
    seed: campaignSeedFromText(identity),
    datasetVersion,
    gameMode: 'almanac',
    availability: modifiedRules,
    modifier,
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

function normalizedDailyAttempt(value: unknown): DailyAttempt | null {
  if (!value || typeof value !== 'object') return null;
  const attempt = value as Partial<DailyAttempt>;
  if (
    typeof attempt.id !== 'string' ||
    typeof attempt.challengeId !== 'string' ||
    !['official', 'friendly'].includes(attempt.kind ?? '') ||
    typeof attempt.startedAt !== 'string' ||
    !(attempt.completedAt === null || typeof attempt.completedAt === 'string') ||
    !(attempt.outcome === null || typeof attempt.outcome === 'string')
  )
    return null;
  const modifierId = isDailyModifierId(attempt.modifierId) ? attempt.modifierId : null;
  const objectiveMet = typeof attempt.objectiveMet === 'boolean' ? attempt.objectiveMet : null;
  return { ...(attempt as DailyAttempt), modifierId, objectiveMet };
}

export function loadDailyAttempts(
  storage: CampaignStorage | null = browserStorage(),
): DailyAttempt[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(DAILY_ATTEMPTS_KEY) ?? '[]') as unknown;
    return Array.isArray(parsed)
      ? parsed
          .map(normalizedDailyAttempt)
          .filter((attempt): attempt is DailyAttempt => !!attempt)
          .slice(-MAX_DAILY_ATTEMPTS)
      : [];
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
  modifierId: DailyModifierId,
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
    modifierId,
    kind,
    startedAt: now().toISOString(),
    completedAt: null,
    outcome: null,
    objectiveMet: null,
  };
  persistDailyAttempts([...attempts, attempt], storage);
  return attempt;
}

export function completeDailyAttempt(
  attemptId: string,
  outcome: string,
  objectiveMet: boolean,
  storage: CampaignStorage | null = browserStorage(),
  now: () => Date = () => new Date(),
): boolean {
  const attempts = loadDailyAttempts(storage);
  const index = attempts.findIndex((attempt) => attempt.id === attemptId);
  if (index < 0 || attempts[index].completedAt) return false;
  attempts[index] = {
    ...attempts[index],
    completedAt: now().toISOString(),
    outcome: outcome.slice(0, 80),
    objectiveMet,
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

export function evaluateDailyObjective(
  modifierId: DailyModifierId,
  { team, tournament }: DailyObjectiveContext,
): boolean {
  const games = tournament.history.flatMap((series) => series.games);
  switch (modifierId) {
    case 'no-exchanges':
      return tournament.outcome !== null && tournament.outcome !== 'Eliminado no Suíço';
    case 'single-exchange':
      return games.filter((game) => game.won).length >= 5;
    case 'era-bridge':
      return new Set(team.map((player) => player.worldsYear)).size >= 4;
    case 'all-or-nothing':
      return tournament.outcome === 'Campeão mundial';
  }
}
