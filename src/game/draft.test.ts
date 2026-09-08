import { describe, expect, it } from 'vitest';
import { players } from '../data/players';
import { createDraft, eligiblePools, exchangeRound, offerKey, rollRound } from './draft';
import type { DraftRound } from './types';

const seeded = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const pools = eligiblePools(players);
describe('multi-era draft and exchanges', () => {
  it('has all 120 year/region/role pools and offers exactly three unique candidates', () => {
    expect(pools).toHaveLength(120);
    for (let seed = 1; seed <= 200; seed++) {
      const rounds = createDraft(players, seeded(seed));
      expect(rounds).toHaveLength(5);
      expect(new Set(rounds.map((r) => r.role)).size).toBe(5);
      for (const r of rounds) {
        expect(r.options).toHaveLength(3);
        expect(new Set(r.options.map((p) => p.id)).size).toBe(3);
        expect(
          r.options.every(
            (p) => p.role === r.role && p.region === r.region && p.worldsYear === r.year,
          ),
        ).toBe(true);
      }
    }
  });
  it('rejects undersized groups and duplicate copies of the same player', () => {
    expect(eligiblePools([players[0], players[0], players[0]])).toEqual([]);
    expect(eligiblePools(players.slice(0, 2))).toEqual([]);
  });
  it('does not spend tokens on impossible exchanges or reorder the same three players', () => {
    const pool = pools.find((p) => p.players.length === 3)!;
    const r = rollRound([pool], pool.role, seeded(1));
    for (const kind of ['year', 'region', 'players'] as const) {
      const result = exchangeRound(r, [pool], kind, 3, [], seeded(1));
      expect(result).toMatchObject({ round: r, remaining: 3, changed: false, rejected: [] });
    }
  });
  it('preserves the requested dimensions and avoids rejected offers until exhaustion', () => {
    const pool = pools.find((p) => p.players.length === 4)!;
    const initial = rollRound([pool], pool.role, seeded(42));
    const playerRoll = exchangeRound(initial, pools, 'players', 3, [], seeded(5));
    expect(playerRoll.round).toMatchObject({
      role: initial.role,
      year: initial.year,
      region: initial.region,
    });
    expect(offerKey(playerRoll.round)).not.toBe(offerKey(initial));
    const seen = [offerKey(initial)];
    let r = initial,
      remaining = 5,
      history: string[] = [];
    for (let i = 0; i < 3; i++) {
      const next = exchangeRound(r, pools, 'players', remaining, history, seeded(i));
      expect(seen).not.toContain(offerKey(next.round));
      seen.push(offerKey(next.round));
      r = next.round;
      remaining = next.remaining;
      history = next.rejected;
    }
    const yr = exchangeRound(initial, pools, 'year', 3, [], seeded(5));
    expect(yr.round.region).toBe(initial.region);
    expect(yr.round.year).not.toBe(initial.year);
    const region = exchangeRound(initial, pools, 'region', 3, [], seeded(5));
    expect(region.round.year).toBe(initial.year);
    expect(region.round.region).not.toBe(initial.region);
  });
  it('is deterministic and cannot spend below zero', () => {
    const run = () => {
      const rng = seeded(73);
      let round: DraftRound = createDraft(players, rng)[0];
      let remaining = 3;
      let rejected: string[] = [];
      for (let i = 0; i < 20; i++)
        ({ round, remaining, rejected } = exchangeRound(
          round,
          pools,
          'year',
          remaining,
          rejected,
          rng,
        ));
      return { round, remaining, rejected };
    };
    expect(run()).toEqual(run());
    expect(run().remaining).toBe(0);
    expect(run().rejected).toHaveLength(3);
  });
});
