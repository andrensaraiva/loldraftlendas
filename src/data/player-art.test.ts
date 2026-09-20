import { describe, expect, it } from 'vitest';
import {
  playerCardArt,
  playerPortraitAsset,
  playerPortraitManifest,
  playerPortraitSources,
} from './player-art';

describe('player portrait catalog manifest', () => {
  it('contains unique approved identities in the expanding versioned catalog', () => {
    expect(playerPortraitManifest.version).toBe('catalog-v2');
    expect(playerPortraitManifest.entries.length).toBeGreaterThanOrEqual(30);
    expect(new Set(playerPortraitManifest.entries.map((entry) => entry.playerKey)).size).toBe(playerPortraitManifest.entries.length);
    expect(playerPortraitManifest.entries.filter((entry) => entry.approval === 'approved')).toHaveLength(playerPortraitManifest.entries.length);
    expect(playerPortraitManifest.entries.filter((entry) => entry.approval === 'pending')).toHaveLength(0);
    for (const entry of playerPortraitManifest.entries) {
      expect(entry.portrait).toMatch(/^\/assets\/players\/portraits\/(pilot-v1|catalog-v1|catalog-v2)\/.+\.webp$/);
      expect(entry.silhouette).toMatch(/^\/assets\/players\/silhouettes\/(pilot-v1|catalog-v1|catalog-v2)\/.+\.webp$/);
      expect(entry.focus.x).toBeGreaterThanOrEqual(0);
      expect(entry.focus.x).toBeLessThanOrEqual(100);
      expect(entry.focus.y).toBeGreaterThanOrEqual(0);
      expect(entry.focus.y).toBeLessThanOrEqual(100);
    }
  });

  it('uses portrait then silhouette and has no invented asset for unknown players', () => {
    expect(playerPortraitAsset('FAKER')?.playerName).toBe('Faker');
    expect(playerPortraitSources('Faker')).toEqual([
      '/assets/players/portraits/pilot-v1/faker.webp',
      '/assets/players/silhouettes/pilot-v1/faker.webp',
    ]);
    expect(playerCardArt('Faker')).toContain('/portraits/');
    expect(playerPortraitSources('Deft')).toEqual([
      '/assets/players/portraits/catalog-v1/deft.webp',
      '/assets/players/silhouettes/catalog-v1/deft.webp',
    ]);
    expect(playerCardArt('Deft')).toContain('/portraits/');
    expect(playerPortraitSources('Hans-Sama')[0]).toBe(
      '/assets/players/portraits/catalog-v2/hans-sama.webp',
    );
    expect(playerPortraitSources('Unknown')).toEqual([]);
  });
});
