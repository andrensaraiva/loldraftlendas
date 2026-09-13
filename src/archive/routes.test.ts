import { describe, expect, it } from 'vitest';
import { archiveSlug, parseArchiveRoute } from './routes';

describe('public archive routes', () => {
  it('normalizes player names into stable public slugs', () => {
    expect(archiveSlug('Huhi')).toBe('huhi');
    expect(archiveSlug('Yutapon')).toBe('yutapon');
    expect(archiveSlug('José Déodo')).toBe('jose-deodo');
  });

  it('parses allowlisted archive route shapes', () => {
    expect(parseArchiveRoute('/arquivo/')).toEqual({ kind: 'index' });
    expect(parseArchiveRoute('/arquivo/edicao/2025')).toEqual({ kind: 'edition', year: 2025 });
    expect(parseArchiveRoute('/arquivo/jogador/faker')).toEqual({
      kind: 'player',
      slug: 'faker',
    });
    expect(parseArchiveRoute('/arquivo/campeao/JarvanIV')).toEqual({
      kind: 'champion',
      id: 'JarvanIV',
    });
    expect(parseArchiveRoute('/arquivo/edicao/not-a-year')).toEqual({ kind: 'not-found' });
  });
});
