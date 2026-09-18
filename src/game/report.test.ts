import { describe, expect, it } from 'vitest';
import { champions } from '../data/champions';
import { players } from '../data/fixtures/mock-players';
import { advanceTournament, createSeries, newTournament, seriesDone, simulateGame } from './engine';
import { buildCampaignReport, classifyResult, resultExpectationLabel } from './report';
import type { Series } from './types';

const team = players.filter((player) => player.team === 'T1');

function completeSeries(series: Series, rolls: number[]): Series {
  let next = series;
  let index = 0;
  while (!seriesDone(next)) {
    const result = simulateGame(next, team, champions, () => rolls[index++] ?? 0, 'teamfight');
    next = { ...next, games: [...next.games, result] };
  }
  return next;
}

describe('campaign report', () => {
  it('classifies expected results and upsets without using new randomness', () => {
    expect(classifyResult({ won: true, probability: 0.7 })).toBe('expected_win');
    expect(classifyResult({ won: true, probability: 0.3 })).toBe('underdog_win');
    expect(classifyResult({ won: false, probability: 0.7 })).toBe('favorite_loss');
    expect(classifyResult({ won: false, probability: 0.3 })).toBe('expected_loss');
    expect(resultExpectationLabel('favorite_loss')).toBe('Derrota apesar do favoritismo');
  });

  it('derives totals, plan impact, compositions and narrative stats from completed games', () => {
    let tournament = newTournament();
    const first = completeSeries(createSeries(tournament, players, () => 0), [0]);
    tournament = advanceTournament(tournament, first);
    const second = completeSeries(createSeries(tournament, players, () => 0.2), [0.999]);
    tournament = advanceTournament(tournament, second);

    const report = buildCampaignReport({ tournament, team, champions, gamePlan: 'teamfight' });

    expect(report.version).toBe(1);
    expect(report.totals).toMatchObject({ games: 2, wins: 1, losses: 1, series: 2 });
    expect(report.games).toHaveLength(2);
    expect(report.compositions).toHaveLength(5);
    expect(report.strongestComposition.game).toBeGreaterThanOrEqual(1);
    expect(report.weakestComposition.game).toBeLessThanOrEqual(5);
    expect(report.plan.id).toBe('teamfight');
    expect(report.plan.totalEffect).toBe(
      report.games.reduce((sum, game) => sum + game.planModifier, 0),
    );
    expect(report.decisiveGame?.opponentName).toBe(second.opponentName);
    expect(report.standoutPlayer?.playerName).toBeTruthy();
    expect(report.mostUsedChampion?.games).toBeGreaterThan(0);
    expect(report.representedYears.length).toBeGreaterThan(0);
    expect(report.highlights.strongestCompositionGame).toBe(report.strongestComposition.game);
  });

  it('keeps plan effects and tag explanations empty when no plan was selected', () => {
    let tournament = newTournament();
    const series = completeSeries(createSeries(tournament, players, () => 0), [0]);
    tournament = advanceTournament(tournament, series);
    const report = buildCampaignReport({ tournament, team, champions, gamePlan: null });

    expect(report.plan.totalEffect).toBe(0);
    expect(report.games.every((game) => game.matchedTags.length === 0)).toBe(true);
    expect(report.games.every((game) => game.missingTags.length === 0)).toBe(true);
  });
});
