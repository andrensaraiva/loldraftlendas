import { describe, it, expect } from 'vitest';
import { createRecap } from './recap';
import { players } from '../data/fixtures/mock-players';
const team = players.filter((p) => p.team === 'T1');
const opponent = players.filter((p) => p.team === 'DWG');
const sum = (
  stats: { kills: number; deaths: number; assists: number }[],
  key: 'kills' | 'deaths' | 'assists',
) => stats.reduce((s, p) => s + p[key], 0);
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
describe('match narrative and KDA', () => {
  it('preserves kill/death equality and valid assists at every snapshot', () => {
    for (let seed = 0; seed < 40; seed++) {
      const recap = createRecap(team, opponent, 1, seed % 2 === 0, seeded(seed));
      for (const moment of recap.moments) {
        expect(sum(moment.user, 'kills')).toBe(sum(moment.opponent, 'deaths'));
        expect(sum(moment.opponent, 'kills')).toBe(sum(moment.user, 'deaths'));
        for (const stats of [moment.user, moment.opponent])
          for (const player of stats) {
            expect(player.assists).toBeLessThanOrEqual(sum(stats, 'kills') - player.kills);
            for (const n of [player.kills, player.deaths, player.assists]) {
              expect(Number.isInteger(n)).toBe(true);
              expect(n).toBeGreaterThanOrEqual(0);
            }
          }
      }
    }
  });
  it('keeps independent cumulative snapshots and chronological moments', () => {
    const recap = createRecap(team, opponent, 5, true, seeded(72));
    expect(sum(recap.moments[0].user, 'kills') + sum(recap.moments[0].opponent, 'kills')).toBe(1);
    recap.moments.slice(1).forEach((m, i) => {
      const previous = recap.moments[i];
      expect(m.minute).toBeGreaterThan(previous.minute);
      for (const side of ['user', 'opponent'] as const)
        m[side].forEach((p, n) => {
          expect(p.kills).toBeGreaterThanOrEqual(previous[side][n].kills);
          expect(p.deaths).toBeGreaterThanOrEqual(previous[side][n].deaths);
          expect(p.assists).toBeGreaterThanOrEqual(previous[side][n].assists);
        });
    });
    expect(recap.moments.at(-1)?.minute).toBe(recap.duration);
  });
  it.each([true, false])('ends with the actual winner: %s', (won) => {
    const recap = createRecap(team, opponent, 3, won, seeded(8));
    expect(recap.moments.at(-1)?.side).toBe(won ? 'user' : 'opponent');
    expect(recap.moments.at(-1)?.title).toBe('Nexus destruído');
  });
  it('creates the same report with the same seed, independently of playback', () => {
    expect(createRecap(team, opponent, 2, true, seeded(42))).toEqual(
      createRecap(team, opponent, 2, true, seeded(42)),
    );
  });
});
