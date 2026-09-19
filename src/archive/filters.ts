import { canonicalRegionFor } from '../game/regions';
import { ROLES } from '../game/types';
import type { PlayerVersion, Role } from '../game/types';
import { archiveSlug } from './routes';

export type ArchiveSort = 'name' | 'rating-desc' | 'rating-asc';

export interface ArchiveFilters {
  role: Role | 'ALL';
  team: string;
  region: string;
  sort: ArchiveSort;
}

export const DEFAULT_ARCHIVE_FILTERS: ArchiveFilters = {
  role: 'ALL',
  team: '',
  region: '',
  sort: 'name',
};

export function averagePlayerRating(player: PlayerVersion): number {
  return (
    player.championPool.reduce((sum, slot) => sum + (slot.gameRating ?? slot.rating), 0) /
    player.championPool.length
  );
}

export function parseArchiveFilters(params: URLSearchParams): ArchiveFilters {
  const role = params.get('posicao') ?? '';
  const sort = params.get('ordem') ?? '';
  return {
    role: (ROLES as readonly string[]).includes(role) ? (role as Role) : 'ALL',
    team: archiveSlug(params.get('equipe') ?? ''),
    region: params.get('regiao')?.slice(0, 40) ?? '',
    sort: ['rating-desc', 'rating-asc'].includes(sort) ? (sort as ArchiveSort) : 'name',
  };
}

export function archiveFilterSearch(filters: ArchiveFilters): string {
  const params = new URLSearchParams();
  if (filters.role !== 'ALL') params.set('posicao', filters.role);
  if (filters.team) params.set('equipe', filters.team);
  if (filters.region) params.set('regiao', filters.region);
  if (filters.sort !== 'name') params.set('ordem', filters.sort);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function filterArchivePlayers(
  players: PlayerVersion[],
  filters: ArchiveFilters,
): PlayerVersion[] {
  return players
    .filter((player) => filters.role === 'ALL' || player.role === filters.role)
    .filter(
      (player) =>
        !filters.team || archiveSlug(player.teamName ?? player.team) === filters.team,
    )
    .filter((player) => !filters.region || canonicalRegionFor(player) === filters.region)
    .sort((left, right) => {
      if (filters.sort === 'rating-desc')
        return averagePlayerRating(right) - averagePlayerRating(left);
      if (filters.sort === 'rating-asc')
        return averagePlayerRating(left) - averagePlayerRating(right);
      return (
        left.playerName.localeCompare(right.playerName, 'pt-BR') ||
        right.worldsYear - left.worldsYear
      );
    });
}
