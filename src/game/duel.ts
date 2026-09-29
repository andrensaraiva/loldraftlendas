import { createDraftFromPlan, planDraft } from './draft';
import { seriesDone, simulateGame } from './engine';
import { isGamePlan } from './plan';
import { CAMPAIGN_RANDOM_VERSION, campaignRandom, isCampaignSeed } from './random';
import type { GameData } from '../data/repository';
import type { DraftRegionManifest, DraftRound, GameResult, Team } from './types';
import type { GamePlan } from './plan';
import { defaultDraftAvailability } from './product-config';

export const DUEL_SAVE_KEY = 'draft-lendas.local-duel';
export const DUEL_SAVE_VERSION = 1;

export interface DuelState {
  version: typeof DUEL_SAVE_VERSION;
  randomVersion: typeof CAMPAIGN_RANDOM_VERSION;
  datasetVersion: string;
  seed: string;
  phase: 'draft' | 'plan' | 'handoff' | 'result';
  turn: 0 | 1;
  picks: [string[], string[]];
  plans: [GamePlan | null, GamePlan | null];
}

export interface DuelResult {
  teams: [Team, Team];
  games: GameResult[];
  score: [number, number];
  winner: 0 | 1;
}

export function duelDraftPlan(manifest: DraftRegionManifest, seed: string) {
  return planDraft(
    manifest,
    defaultDraftAvailability({ draftRegionManifest: manifest }),
    campaignRandom(seed, 'duel/draft'),
  );
}

export function duelRounds(data: GameData, seed: string): DraftRound[] {
  return createDraftFromPlan(
    data.players,
    duelDraftPlan(data.draftRegionManifest, seed),
    data.draftRegionManifest,
  );
}

export function newDuel(seed: string, datasetVersion: string): DuelState {
  if (!isCampaignSeed(seed)) throw new Error('Seed inválida.');
  return {
    version: DUEL_SAVE_VERSION,
    randomVersion: CAMPAIGN_RANDOM_VERSION,
    datasetVersion,
    seed,
    phase: 'draft',
    turn: 0,
    picks: [[], []],
    plans: [null, null],
  };
}

export function validDuel(
  state: unknown,
  rounds: DraftRound[],
  datasetVersion: string,
): state is DuelState {
  if (!state || typeof state !== 'object') return false;
  const value = state as Partial<DuelState>;
  if (
    value.version !== DUEL_SAVE_VERSION ||
    value.randomVersion !== CAMPAIGN_RANDOM_VERSION ||
    value.datasetVersion !== datasetVersion ||
    !isCampaignSeed(value.seed) ||
    (value.turn !== 0 && value.turn !== 1) ||
    !Array.isArray(value.picks) ||
    value.picks.length !== 2 ||
    !Array.isArray(value.plans) ||
    value.plans.length !== 2 ||
    rounds.length !== 5
  )
    return false;
  const [first, second] = value.picks;
  if (
    ![first, second].every(
      (picks) =>
        Array.isArray(picks) &&
        picks.length <= 5 &&
        picks.every(
          (id, index) =>
            typeof id === 'string' && rounds[index].options.some((option) => option.id === id),
        ),
    )
  )
    return false;
  const [firstPlan, secondPlan] = value.plans;
  if (
    !(firstPlan === null || isGamePlan(firstPlan)) ||
    !(secondPlan === null || isGamePlan(secondPlan))
  )
    return false;
  switch (value.phase) {
    case 'draft':
      return value.turn === 0
        ? second.length === 0 && first.length < 5 && firstPlan === null && secondPlan === null
        : first.length === 5 && second.length < 5 && firstPlan !== null && secondPlan === null;
    case 'plan':
      return value.turn === 0
        ? first.length === 5 && second.length === 0 && firstPlan === null && secondPlan === null
        : first.length === 5 && second.length === 5 && firstPlan !== null && secondPlan === null;
    case 'handoff':
      return (
        value.turn === 1 &&
        first.length === 5 &&
        second.length === 0 &&
        firstPlan !== null &&
        secondPlan === null
      );
    case 'result':
      return (
        value.turn === 1 &&
        first.length === 5 &&
        second.length === 5 &&
        firstPlan !== null &&
        secondPlan !== null
      );
    default:
      return false;
  }
}

export function pickDuelPlayer(
  state: DuelState,
  rounds: DraftRound[],
  playerId: string,
): DuelState {
  if (state.phase !== 'draft') throw new Error('O draft não está ativo.');
  const step = state.picks[state.turn].length;
  if (!rounds[step]?.options.some((option) => option.id === playerId))
    throw new Error('Jogador fora das opções deste turno.');
  const picks: [string[], string[]] = [[...state.picks[0]], [...state.picks[1]]];
  picks[state.turn].push(playerId);
  return { ...state, picks, phase: picks[state.turn].length === 5 ? 'plan' : 'draft' };
}

export function chooseDuelPlan(state: DuelState, plan: GamePlan): DuelState {
  if (state.phase !== 'plan' || !isGamePlan(plan)) throw new Error('Plano inválido.');
  const plans: [GamePlan | null, GamePlan | null] = [...state.plans];
  plans[state.turn] = plan;
  return { ...state, plans, phase: state.turn === 0 ? 'handoff' : 'result', turn: 1 };
}

export function continueDuel(state: DuelState): DuelState {
  if (state.phase !== 'handoff') throw new Error('Não há aparelho para passar.');
  return { ...state, phase: 'draft' };
}

export function simulateDuel(state: DuelState, data: GameData, rounds: DraftRound[]): DuelResult {
  if (
    !validDuel(state, rounds, data.draftRegionManifest.datasetVersion) ||
    state.phase !== 'result'
  )
    throw new Error('Duelo incompleto ou incompatível.');
  const teams: [Team, Team] = state.picks.map((picks) =>
    picks.map((id, index) => rounds[index].options.find((option) => option.id === id)!),
  ) as [Team, Team];
  const series = {
    stage: 'final' as const,
    opponentName: 'Jogador 2',
    opponent: teams[1],
    bestOf: 5 as const,
    games: [] as GameResult[],
  };
  while (!seriesDone(series)) {
    const game = series.games.length + 1;
    series.games.push(
      simulateGame(
        series,
        teams[0],
        data.champions,
        campaignRandom(state.seed, `duel/game/${game}`),
        state.plans[0],
        state.plans[1],
      ),
    );
  }
  const first = series.games.filter((game) => game.won).length;
  const second = series.games.length - first;
  return { teams, games: series.games, score: [first, second], winner: first > second ? 0 : 1 };
}
