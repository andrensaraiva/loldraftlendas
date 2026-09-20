import { describe, expect, it } from 'vitest';
import {
  playerCardArt,
  playerPortraitAsset,
  playerPortraitManifest,
  playerPortraitSources,
} from './player-art';

describe('player portrait pilot manifest', () => {
  it('contains ten unique approved identities with versioned optimized assets', () => {
    expect(playerPortraitManifest.version).toBe('pilot-v1');
    expect(playerPortraitManifest.entries).toHaveLength(10);
    expect(new Set(playerPortraitManifest.entries.map((entry) => entry.playerKey)).size).toBe(10);
    for (const entry of playerPortraitManifest.entries) {
      expect(entry.approval).toBe('approved');
      expect(entry.portrait).toMatch(/^\/assets\/players\/portraits\/pilot-v1\/.+\.webp$/);
      expect(entry.silhouette).toMatch(/^\/assets\/players\/silhouettes\/pilot-v1\/.+\.webp$/);
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
    expect(playerPortraitSources('Unknown')).toEqual([]);
  });
});
