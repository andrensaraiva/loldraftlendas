import { describe, expect, it } from 'vitest';
import type { PlayerVersion } from '../game/types';
import {
  archiveFilterSearch,
  averagePlayerRating,
  filterArchivePlayers,
  parseArchiveFilters,
} from './filters';

const player = (
  playerName: string,
  role: PlayerVersion['role'],
  team: string,
  canonicalRegion: string,
  rating: number,
): PlayerVersion => ({
  id: playerName.toLowerCase(),
  playerName,
  team,
  teamName: team,
  region: canonicalRegion,
  canonicalRegion,
  worldsYear: 2025,
  role,
  profile: 'teste',
  championPool: Array.from({ length: 5 }, (_, index) => ({
    game: index + 1,
    championId: `Champion${index}`,
    rating,
    source: 'MOCK',
  })),
});

describe('archive filters', () => {
  it('parses only supported URL values and serializes compactly', () => {
    const filters = parseArchiveFilters(
      new URLSearchParams('posicao=MID&equipe=Team%20One&regiao=LCK&ordem=rating-desc'),
    );
    expect(filters).toEqual({ role: 'MID', team: 'team-one', region: 'LCK', sort: 'rating-desc' });
    expect(archiveFilterSearch(filters)).toBe(
      '?posicao=MID&equipe=team-one&regiao=LCK&ordem=rating-desc',
    );
    expect(parseArchiveFilters(new URLSearchParams('posicao=INVALID&ordem=random')).role).toBe(
      'ALL',
    );
  });

  it('filters by role, team and region and orders by average rating', () => {
    const players = [
      player('Beta', 'MID', 'Team One', 'LCK', 82),
      player('Alpha', 'MID', 'Team One', 'LCK', 91),
      player('Gamma', 'TOP', 'Team One', 'LCK', 99),
      player('Delta', 'MID', 'Team Two', 'LPL', 95),
    ];
    expect(averagePlayerRating(players[1])).toBe(91);
    expect(
      filterArchivePlayers(players, {
        role: 'MID',
        team: 'team-one',
        region: 'LCK',
        sort: 'rating-desc',
      }).map((entry) => entry.playerName),
    ).toEqual(['Alpha', 'Beta']);
  });
});
