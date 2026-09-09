import { describe, expect, it } from 'vitest';
import { players } from '../data/fixtures/mock-players';
import { champions } from '../data/champions';
import {
  advanceTournament,
  BALANCE,
  compositionScore,
  createDraft,
  createSeries,
  formatFor,
  newTournament,
  seriesDone,
  seriesScore,
  simulateGame,
  teamStrength,
  validateData,
  winProbability,
} from './engine';
import type { Series } from './types';
const team = players.filter((p) => p.team === 'T1');
function complete(s: Series, won: boolean) {
  while (!seriesDone(s))
    s = { ...s, games: [...s.games, simulateGame(s, team, champions, () => (won ? 0 : 0.999))] };
  return s;
}
describe('dataset and draft', () => {
  it('has unique historical versions with five ordered distinct champions', () => {
    expect(() => validateData(players, champions)).not.toThrow();
    expect(players).toHaveLength(45);
    expect(players.filter((p) => p.playerName === 'Faker')).toHaveLength(2);
  });
  it('draws eligible year/region groups for every role with meaningful alternatives', () => {
    for (const rng of [() => 0, () => 0.5, () => 0.999]) {
      const draft = createDraft(players, rng);
      expect(draft).toHaveLength(5);
      draft.forEach((r) => {
        expect(r.options.length).toBeGreaterThanOrEqual(3);
        expect(
          r.options.every(
            (p) =>
              p.role === r.role &&
              p.worldsYear === r.year &&
              r.region.canonicalRegions.includes(p.canonicalRegion ?? p.historicalLeague ?? p.region),
          ),
        ).toBe(true);
      });
    }
  });
  it('rejects malformed pools at the repository boundary', () => {
    expect(() =>
      validateData([{ ...players[0], championPool: players[0].championPool.slice(1) }], champions),
    ).toThrow();
  });
});
describe('ratings and probability', () => {
  it('uses the selected game slot and the centralized 80/20 formula', () => {
    for (let g = 1; g <= 5; g++) {
      const score = teamStrength(team, g, champions);
      expect(score.average).toBe(
        team.reduce((sum, p) => sum + p.championPool[g - 1].rating, 0) / 5,
      );
      expect(score.total).toBeCloseTo(
        Math.round((score.average * 0.8 + score.composition * 0.2) * 10) / 10,
      );
      expect(score.composition).toBeLessThanOrEqual(100);
    }
  });
  it('rewards mixed damage and useful composition tags', () => {
    const onlyAd = Object.fromEntries(
      Object.entries(champions).map(([id, c]) => [id, { ...c, tags: ['AD_DAMAGE' as const] }]),
    );
    expect(compositionScore(team, 1, champions)).toBeGreaterThan(compositionScore(team, 1, onlyAd));
  });
  it('gives stronger teams an advantage while allowing upsets', () => {
    expect(winProbability(90, 90)).toBe(0.5);
    expect(winProbability(96, 93)).toBeGreaterThan(0.5);
    expect(winProbability(100, 50)).toBe(BALANCE.maxProbability);
    expect(winProbability(50, 100)).toBe(BALANCE.minProbability);
    const s = createSeries(newTournament(), players, () => 0);
    expect(simulateGame(s, team, champions, () => 0).won).toBe(true);
    expect(simulateGame(s, team, champions, () => 0.999).won).toBe(false);
  });
});
describe('series and tournament', () => {
  it.each([
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [2, 0, 3],
    [2, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
    [2, 2, 3],
  ])('uses BO%s/%s → %s', (wins, losses, expected) => {
    expect(formatFor({ ...newTournament(), wins, losses })).toBe(expected);
  });
  it('stops BO5 at 3–0 and refuses extra games', () => {
    const s = complete(
      createSeries({ ...newTournament(), stage: 'quarters' }, players, () => 0),
      true,
    );
    expect(s.games).toHaveLength(3);
    expect(() => simulateGame(s, team, champions)).toThrow();
  });
  it('reaches G5 at 2–2 and resets to G1 in the next series', () => {
    let s = createSeries({ ...newTournament(), stage: 'quarters' }, players, () => 0);
    for (const roll of [0, 0.999, 0, 0.999])
      s = { ...s, games: [...s.games, simulateGame(s, team, champions, () => roll)] };
    expect(seriesDone(s)).toBe(false);
    expect(simulateGame(s, team, champions, () => 0).game).toBe(5);
    const next = createSeries({ ...newTournament(), stage: 'semis' }, players, () => 0);
    expect(simulateGame(next, team, champions).game).toBe(1);
  });
  it('allows a complete championship and avoids repeat opponents', () => {
    let t = newTournament();
    while (!t.outcome) {
      const s = complete(
        createSeries(t, players, () => 0),
        true,
      );
      t = advanceTournament(t, s);
    }
    expect(t.outcome).toBe('Campeão mundial');
    expect(t.history.map((s) => s.bestOf)).toEqual([1, 1, 3, 5, 5, 5]);
    expect(new Set(t.history.map((s) => s.opponentName)).size).toBe(6);
    expect(t.wins).toBe(3);
  });
  it('eliminates at three Swiss losses', () => {
    let t = newTournament();
    while (!t.outcome)
      t = advanceTournament(
        t,
        complete(
          createSeries(t, players, () => 0),
          false,
        ),
      );
    expect(t.outcome).toBe('Eliminado no Suíço');
    expect(t.losses).toBe(3);
    expect(t.history).toHaveLength(3);
  });
  it.each([
    ['quarters', 'Quartas de final'],
    ['semis', 'Semifinalista'],
    ['final', 'Vice-campeão'],
  ] as const)('reports %s elimination', (stage, outcome) => {
    const t = { ...newTournament(), stage };
    expect(
      advanceTournament(
        t,
        complete(
          createSeries(t, players, () => 0),
          false,
        ),
      ).outcome,
    ).toBe(outcome);
  });
  it('rejects advancing an unfinished series', () => {
    const t = newTournament();
    expect(() => advanceTournament(t, createSeries(t, players))).toThrow();
  });
  it('handles a 2–2 Swiss record and a decisive BO3', () => {
    let t = newTournament();
    for (const win of [true, false, true, false])
      t = advanceTournament(
        t,
        complete(
          createSeries(t, players, () => 0),
          win,
        ),
      );
    expect(t.wins).toBe(2);
    expect(t.losses).toBe(2);
    const series = complete(
      createSeries(t, players, () => 0),
      true,
    );
    expect(seriesScore(series).wins).toBe(2);
    expect(advanceTournament(t, series).stage).toBe('quarters');
  });
});
