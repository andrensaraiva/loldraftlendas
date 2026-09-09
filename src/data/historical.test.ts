import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { players } from './frozen-2017';
import { champions } from './champions';
import { championArt } from './art';
import { ROLES } from '../game/types';
import { createDraft, validateData } from '../game/engine';
import evidenceData from '../../data/research/worlds-2017/evidence.json';
import sourcesData from '../../data/research/worlds-2017/sources.json';
import matches from '../../data/research/worlds-2017/matches.json';
import rosters from '../../data/research/worlds-2017/rosters.json';
import manifest from '../../data/research/worlds-2017/asset-manifest.json';
import coverage from '../../data/research/worlds-2017/coverage.json';
import checks from '../../data/research/worlds-2017/crosschecks.json';
import aggregates from '../../data/research/worlds-2017/player-stats.json';

const evidence = evidenceData as Record<string, (typeof evidenceData)[keyof typeof evidenceData]>;
const sources = sourcesData as Record<string, { url: string }>;
describe('researched Worlds 2017 production snapshot', () => {
  it('offers exactly the three researched LCK teams for every role', () => {
    validateData(players, champions);
    expect(players).toHaveLength(15);
    for (const round of createDraft(players)) {
      expect(round.year).toBe(2017);
      expect(round.region).toMatchObject({ id: 'KOREA', canonicalRegions: ['LCK'] });
      expect(round.options.map((p) => p.team).sort()).toEqual(['LZ', 'SKT', 'SSG']);
    }
    expect(players.find((p) => p.playerName === 'Faker')?.id).toBe('faker-2017-skt');
    expect(players.find((p) => p.playerName === 'Crown')?.team).toBe('SSG');
    expect(players.find((p) => p.playerName === 'Bdd')?.team).toBe('LZ');
    for (const p of players) {
      expect(ROLES).toContain(p.role);
      const candidates = rosters.filter((r) => r.team === p.team && r.role === p.role);
      const primary = candidates.find((r) => r.player === p.playerName)!;
      expect(primary.playable).toBe(true);
      expect(primary.games).toBe(Math.max(...candidates.map((r) => r.games)));
    }
    expect(rosters.find((p) => p.player === 'Blank')?.games).toBe(9);
    expect(rosters.find((p) => p.player === 'Haru')?.games).toBe(1);
    expect(rosters.find((p) => p.player === 'Rascal')?.games).toBe(1);
  });

  it('has 80 complete Main Event games, separates play-ins and promotion, and preserves raw inputs', () => {
    const worlds = matches.filter((m) => m.event === 'WORLDS_2017');
    expect(worlds).toHaveLength(800);
    expect(new Set(worlds.map((m) => m.gameid)).size).toBe(80);
    expect(new Set(worlds.map((m) => m.patch))).toEqual(new Set(['7.18']));
    expect(new Set(worlds.map((m) => m.playername)).size).toBe(85);
    expect(matches.every((m) => m.date.startsWith('2017'))).toBe(true);
    expect(
      matches.filter((m) => m.event === 'LCK_SUMMER_2017').every((m) => m.date >= '2017-05-30'),
    ).toBe(true);
    expect(
      createHash('sha256')
        .update(readFileSync('data/research/worlds-2017/matches.json'))
        .digest('hex'),
    ).toBe(coverage.matchesSha256);
    for (const id of new Set(worlds.map((m) => m.gameid))) {
      const game = worlds.filter((m) => m.gameid === id);
      expect(game).toHaveLength(10);
      for (const side of ['Blue', 'Red']) {
        const team = game.filter((m) => m.side === side);
        expect(new Set(team.map((m) => m.role)).size).toBe(5);
        expect(team.reduce((sum, p) => sum + p.kills, 0)).toBe(team[0].teamkills);
      }
    }
  });

  it('traces every unique ordered slot to actual player/champion matches and source documents', () => {
    let seasonal = 0;
    for (const p of players) {
      let lastWorldDate = '',
        foundSeason = false;
      expect(p.championPool.map((s) => s.game)).toEqual([1, 2, 3, 4, 5]);
      expect(new Set(p.championPool.map((s) => s.championId)).size).toBe(5);
      for (const slot of p.championPool) {
        const e = evidence[slot.evidenceId!];
        expect(e).toBeDefined();
        expect(e.playerId).toBe(p.id);
        expect(e.championId).toBe(slot.championId);
        expect(e.source).toBe(slot.source);
        expect(e.rating).toBe(slot.rating);
        expect(Number.isInteger(slot.rating) && slot.rating >= 70 && slot.rating <= 99).toBe(true);
        e.sourceIds.forEach((id) => expect(sources[id]?.url).toMatch(/^https:\/\//));
        const actual = matches.filter(
          (m) =>
            m.playername === p.playerName &&
            m.teamname === e.team &&
            m.role === p.role &&
            m.champion === e.champion &&
            m.event === e.event,
        );
        expect(actual.length).toBe(e.stats.games);
        expect(actual.reduce((sum, m) => sum + m.result, 0)).toBe(e.stats.wins);
        expect(actual.map((m) => m.gameid)).toEqual(e.stats.gameIds);
        expect(actual[0].date).toBe(e.firstAppearance);
        if (slot.source === 'WORLDS_DATA') {
          expect(foundSeason).toBe(false);
          expect(e.event).toBe('WORLDS_2017');
          expect(e.firstAppearance >= lastWorldDate).toBe(true);
          lastWorldDate = e.firstAppearance;
        } else {
          expect(slot.source).toBe('SEASON_DATA');
          expect(e.event).toBe('LCK_SUMMER_2017');
          expect(
            matches.some(
              (m) =>
                m.event === 'WORLDS_2017' &&
                m.playername === p.playerName &&
                m.champion === e.champion,
            ),
          ).toBe(false);
          foundSeason = true;
          seasonal++;
        }
        expect(e.confidenceScore).toBeGreaterThan(0);
        expect(e.confidenceScore).toBeLessThan(1);
        expect(e.components.B).toBeCloseTo(
          e.components.A + e.confidenceScore * (e.performanceScore - e.components.A),
          10,
        );
        expect(e.rating).toBe(
          Math.floor(
            70 +
              (29 * (0.35 * e.components.A + 0.5 * e.components.B + 0.15 * e.components.C)) / 100 +
              0.5,
          ),
        );
      }
    }
    expect(seasonal).toBe(6);
  });

  it('agrees with independent rounded tournament statistics including zero-kill games', () => {
    for (const [player, games, wins, kda, dpm, kp] of checks.players) {
      const a = aggregates.find((a) => a.event === 'WORLDS_2017' && a.player === player)!;
      expect(a.games).toBe(games);
      expect(a.wins).toBe(wins);
      expect(Math.abs(a.kda - Number(kda))).toBeLessThanOrEqual(0.06);
      expect(Math.abs(a.dpm - Number(dpm))).toBeLessThanOrEqual(1);
      expect(Math.abs(a.kp - Number(kp))).toBeLessThanOrEqual(0.001);
    }
  });

  it('uses intact archived 7.18 champion art and keeps explicit modern fallbacks', () => {
    for (const asset of manifest.assets) {
      expect(createHash('sha256').update(readFileSync(asset.localFile)).digest('hex')).toBe(
        asset.sha256,
      );
    }
    for (const p of players)
      for (const slot of p.championPool) {
        expect(championArt(champions[slot.championId], 2017).image).toContain('/assets/2017/');
        expect(championArt(champions[slot.championId], 2017).splash).toContain('/assets/2017/');
      }
    expect(championArt(champions.Galio, 2023).splash).toBe('/assets/splash/Galio.jpg');
    expect(champions.Lulu.tags).not.toContain('AP_DAMAGE');
  });
});
