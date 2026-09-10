import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { players } from './players';
import { champions } from './champions';
import { validateData } from '../game/engine';
import { eligiblePools } from '../game/draft';
import type { DraftRegionManifest } from '../game/types';
import calibration from '../../data/research/multi-era/calibration.json';
import frozen from './worlds-2017.json';
import frozenEvidence from '../../data/research/worlds-2017/evidence.json';
import draftRegionManifest from './draft-region-groups.json';

describe('production evidence and global calibration', () => {
  it('has 535 real player versions and five documented period-valid champions each', () => {
    validateData(players, champions);
    expect(players).toHaveLength(535);
    const years = [...new Set(players.map((p) => p.worldsYear))];
    expect(years).toEqual([2015, 2017, 2019, 2020, 2022, 2023, 2024, 2025]);
    for (const year of years) {
      const evidence = JSON.parse(
        readFileSync(`data/research/multi-era/evidence-${year}.json`, 'utf8'),
      );
      for (const p of players.filter((p) => p.worldsYear === year))
        for (const slot of p.championPool) {
          expect(slot.source).not.toBe('MOCK');
          const e = evidence[slot.evidenceId!];
          expect(e).toMatchObject({
            playerId: p.id,
            championId: slot.championId,
            historicalScore: slot.historicalScore,
          });
          expect(e.stats.games).toBeGreaterThan(0);
          expect(e.sourceLines?.length > 0 || !!e.observation?.sourceUrl).toBe(true);
          expect(slot.rating).toBe(slot.gameRating);
          expect(slot.rating).toBeGreaterThanOrEqual(70);
          expect(slot.rating).toBeLessThanOrEqual(99);
          const art = champions[slot.championId].historicalAssets?.[year];
          expect(art).toBeDefined();
          expect(existsSync(`public${art!.square}`)).toBe(true);
        }
    }
  });
  it('keeps the original release bytes and all 75 historical scores intact', () => {
    expect(
      createHash('sha256').update(readFileSync('src/data/worlds-2017.json')).digest('hex'),
    ).toBe(calibration.frozen2017Sha256);
    for (const p of frozen) {
      const current = players.find((x) => x.id === p.id)!;
      for (const slot of current.championPool) {
        expect(slot.historicalScore).toBe(
          frozenEvidence[slot.evidenceId as keyof typeof frozenEvidence].score,
        );
        expect(slot.championId).toBe(p.championPool[slot.game - 1].championId);
      }
    }
  });
  it('uses a generated, complete, role-valid draft region manifest', () => {
    expect(draftRegionManifest.datasetVersion).toBe(calibration.version);
    expect(draftRegionManifest.groups.map((entry) => entry.year)).toEqual([
      ...new Set(players.map((player) => player.worldsYear)),
    ]);
    for (const entry of draftRegionManifest.groups) {
      const canonical = (player: (typeof players)[number]) =>
        player.canonicalRegion ?? player.historicalLeague ?? player.region;
      const assigned = new Set(entry.groups.flatMap((group) => group.canonicalRegions));
      expect(
        new Set(players.filter((player) => player.worldsYear === entry.year).map(canonical)),
      ).toEqual(assigned);
      for (const group of entry.groups)
        for (const role of ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const)
          expect(
            players.filter(
              (player) =>
                player.worldsYear === entry.year &&
                player.role === role &&
                group.canonicalRegions.includes(canonical(player)),
            ).length,
          ).toBeGreaterThanOrEqual(3);
    }
    expect(eligiblePools(players, draftRegionManifest as DraftRegionManifest)).toHaveLength(155);
    const groups2024 = draftRegionManifest.groups.find((entry) => entry.year === 2024)!.groups;
    expect(groups2024.map((group) => group.id)).toEqual(['KOREA', 'CHINA', 'EUROPE_NORTH_AMERICA']);
    expect(groups2024[2].canonicalRegions).toEqual(['LCS', 'LEC']);
    const groups2025 = draftRegionManifest.groups.find((entry) => entry.year === 2025)!.groups;
    expect(groups2025.map((group) => group.id)).toEqual([
      'KOREA',
      'CHINA',
      'EUROPE_NORTH_AMERICA',
      'OTHER_REGIONS',
    ]);
    expect(groups2025[2].canonicalRegions).toEqual(['LEC', 'LTA N']);
    expect(groups2025[3].canonicalRegions).toEqual(['LCP', 'LTA S']);
  });
});
