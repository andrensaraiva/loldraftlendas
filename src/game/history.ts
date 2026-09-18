import type { CampaignStorage } from './campaign';
import type { GameMode } from './mode';
import type { GamePlan } from './plan';
import type { DailyAttemptKind } from './daily';
import type { Role } from './types';
import type { CampaignReportHighlights } from './report';

export const CAMPAIGN_HISTORY_VERSION = 2;
export const CAMPAIGN_HISTORY_KEY = 'draft-lendas.history';
export const MAX_CAMPAIGN_HISTORY = 30;

export interface CampaignHistoryPlayer {
  playerName: string;
  team: string;
  worldsYear: number;
  role: Role;
}

export interface CampaignSummary {
  id: string;
  completedAt: string;
  outcome: string;
  wins: number;
  losses: number;
  confrontations: number;
  source: 'organic' | 'challenge' | 'daily';
  gameMode: GameMode;
  gamePlan: GamePlan | null;
  dailyAttemptKind: DailyAttemptKind | null;
  report: CampaignReportHighlights | null;
  team: CampaignHistoryPlayer[];
}

export interface LocalAchievement {
  id:
    | 'first_campaign'
    | 'world_champion'
    | 'almanac_champion'
    | 'era_mixer'
    | 'undefeated'
    | 'daily_official';
  title: string;
  description: string;
}

const ACHIEVEMENTS: Array<LocalAchievement & { matches: (summary: CampaignSummary) => boolean }> = [
  {
    id: 'first_campaign',
    title: 'Primeiro capítulo',
    description: 'Conclua uma campanha.',
    matches: () => true,
  },
  {
    id: 'world_champion',
    title: 'Lendas mundiais',
    description: 'Conquiste o título mundial.',
    matches: (summary) => summary.outcome === 'Campeão mundial',
  },
  {
    id: 'almanac_champion',
    title: 'Mestre do Almanaque',
    description: 'Seja campeão sem consultar os ratings.',
    matches: (summary) => summary.outcome === 'Campeão mundial' && summary.gameMode === 'almanac',
  },
  {
    id: 'era_mixer',
    title: 'Pontes entre eras',
    description: 'Conclua com jogadores de quatro ou mais edições.',
    matches: (summary) => new Set(summary.team.map((player) => player.worldsYear)).size >= 4,
  },
  {
    id: 'undefeated',
    title: 'Campanha perfeita',
    description: 'Seja campeão mundial sem perder um jogo.',
    matches: (summary) => summary.outcome === 'Campeão mundial' && summary.losses === 0,
  },
  {
    id: 'daily_official',
    title: 'Compromisso diário',
    description: 'Conclua uma tentativa oficial do Desafio Diário.',
    matches: (summary) => summary.source === 'daily' && summary.dailyAttemptKind === 'official',
  },
];

function browserStorage(): CampaignStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isReportHighlights(value: unknown): value is CampaignReportHighlights {
  if (!value || typeof value !== 'object') return false;
  const report = value as Partial<CampaignReportHighlights>;
  return (
    Number.isInteger(report.strongestCompositionGame) &&
    report.strongestCompositionGame! >= 1 &&
    report.strongestCompositionGame! <= 5 &&
    Number.isInteger(report.weakestCompositionGame) &&
    report.weakestCompositionGame! >= 1 &&
    report.weakestCompositionGame! <= 5 &&
    typeof report.totalPlanEffect === 'number' &&
    (report.biggestUpset === null || typeof report.biggestUpset === 'string') &&
    (report.decisiveGame === null || typeof report.decisiveGame === 'string') &&
    (report.standoutPlayer === null || typeof report.standoutPlayer === 'string')
  );
}

function isSummary(value: unknown, legacy = false): value is CampaignSummary {
  if (!value || typeof value !== 'object') return false;
  const summary = value as Partial<CampaignSummary>;
  return (
    typeof summary.id === 'string' &&
    typeof summary.completedAt === 'string' &&
    !Number.isNaN(Date.parse(summary.completedAt)) &&
    typeof summary.outcome === 'string' &&
    Number.isInteger(summary.wins) &&
    summary.wins! >= 0 &&
    Number.isInteger(summary.losses) &&
    summary.losses! >= 0 &&
    Number.isInteger(summary.confrontations) &&
    summary.confrontations! >= 0 &&
    ['organic', 'challenge', 'daily'].includes(summary.source ?? '') &&
    ['classic', 'almanac'].includes(summary.gameMode ?? '') &&
    (summary.gamePlan === null ||
      ['aggression', 'teamfight', 'control_pick', 'scaling'].includes(summary.gamePlan ?? '')) &&
    (summary.dailyAttemptKind === null ||
      ['official', 'friendly'].includes(summary.dailyAttemptKind ?? '')) &&
    (legacy
      ? summary.report === undefined
      : summary.report === null || isReportHighlights(summary.report)) &&
    Array.isArray(summary.team) &&
    summary.team.length === 5 &&
    summary.team.every(
      (player) =>
        typeof player.playerName === 'string' &&
        typeof player.team === 'string' &&
        Number.isInteger(player.worldsYear) &&
        player.worldsYear >= 2011 &&
        player.worldsYear <= 2100 &&
        ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].includes(player.role),
    )
  );
}

export function loadCampaignHistory(
  storage: CampaignStorage | null = browserStorage(),
): CampaignSummary[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(CAMPAIGN_HISTORY_KEY) ?? '{}') as {
      version?: unknown;
      campaigns?: unknown;
    };
    if (!Array.isArray(parsed.campaigns)) return [];
    if (parsed.version === CAMPAIGN_HISTORY_VERSION)
      return parsed.campaigns.filter((summary) => isSummary(summary)).slice(0, MAX_CAMPAIGN_HISTORY);
    if (parsed.version === 1)
      return parsed.campaigns
        .filter((summary) => isSummary(summary, true))
        .map((summary) => ({ ...summary, report: null }))
        .slice(0, MAX_CAMPAIGN_HISTORY);
    return [];
  } catch {
    return [];
  }
}

export function recordCampaignSummary(
  summary: CampaignSummary,
  storage: CampaignStorage | null = browserStorage(),
): boolean {
  if (!storage || !isSummary(summary)) return false;
  const history = loadCampaignHistory(storage);
  if (history.some((campaign) => campaign.id === summary.id)) return false;
  try {
    storage.setItem(
      CAMPAIGN_HISTORY_KEY,
      JSON.stringify({
        version: CAMPAIGN_HISTORY_VERSION,
        campaigns: [summary, ...history].slice(0, MAX_CAMPAIGN_HISTORY),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearCampaignHistory(storage: CampaignStorage | null = browserStorage()): void {
  try {
    storage?.removeItem(CAMPAIGN_HISTORY_KEY);
  } catch {
    // Optional local history never blocks gameplay.
  }
}

export function campaignAchievements(history: CampaignSummary[]): LocalAchievement[] {
  return ACHIEVEMENTS.filter((achievement) => history.some(achievement.matches)).map(
    ({ matches: _matches, ...achievement }) => achievement,
  );
}

export function achievementsForCampaign(summary: CampaignSummary): LocalAchievement[] {
  return campaignAchievements([summary]);
}

export function exportCampaignHistory(history: CampaignSummary[], now: Date = new Date()): string {
  return JSON.stringify(
    {
      version: CAMPAIGN_HISTORY_VERSION,
      exportedAt: now.toISOString(),
      campaigns: history,
      achievements: campaignAchievements(history),
    },
    null,
    2,
  );
}
