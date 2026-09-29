import { describe, expect, it } from 'vitest';
import { champions } from '../data/champions';
import { players } from '../data/fixtures/mock-players';
import { createDraft } from './draft';
import { teamStrength } from './engine';
import {
  chooseDuelPlan,
  continueDuel,
  newDuel,
  pickDuelPlayer,
  simulateDuel,
  validDuel,
} from './duel';
import type { GameData } from '../data/repository';

const rounds = createDraft(players, () => 0);
const data: GameData = {
  players,
  champions,
  draftRegionManifest: { version: 'fixture', datasetVersion: 'fixture', groups: [] },
};

describe('local duel', () => {
  it('gives both players the same offers, resumes a valid handoff and resolves a reproducible BO5', () => {
    let state = newDuel('0123456789abcdef', 'fixture');
    for (const round of rounds) state = pickDuelPlayer(state, rounds, round.options[0].id);
    expect(state.phase).toBe('plan');
    state = chooseDuelPlan(state, 'aggression');
    expect(state.phase).toBe('handoff');
    expect(validDuel(JSON.parse(JSON.stringify(state)), rounds, 'fixture')).toBe(true);
    state = continueDuel(state);
    for (const round of rounds) state = pickDuelPlayer(state, rounds, round.options[2].id);
    state = chooseDuelPlan(state, 'teamfight');

    const result = simulateDuel(state, data, rounds);
    expect(result.games).toHaveLength(result.score[0] + result.score[1]);
    expect(Math.max(...result.score)).toBe(3);
    expect(result.games[0].opponentStrength).toBe(
      teamStrength(result.teams[1], 1, champions, 'teamfight').total,
    );
    expect(simulateDuel(JSON.parse(JSON.stringify(state)), data, rounds)).toEqual(result);
  });

  it('rejects an invented pick and an incompatible or altered save', () => {
    const state = newDuel('0123456789abcdef', 'fixture');
    expect(() => pickDuelPlayer(state, rounds, 'invented')).toThrow();
    expect(validDuel({ ...state, picks: [['invented'], []] }, rounds, 'fixture')).toBe(false);
    expect(validDuel(state, rounds, 'other-dataset')).toBe(false);
    expect(() => simulateDuel(state, data, rounds)).toThrow();
  });
});
