export type ArchiveRoute =
  | { kind: 'index' }
  | { kind: 'edition'; year: number }
  | { kind: 'player'; slug: string }
  | { kind: 'team'; slug: string }
  | { kind: 'champion'; id: string }
  | { kind: 'not-found' };

export function archiveSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseArchiveRoute(pathname: string): ArchiveRoute {
  const parts = pathname
    .replace(/\/+$/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  if (parts.length === 1 && parts[0] === 'arquivo') return { kind: 'index' };
  if (parts.length !== 3 || parts[0] !== 'arquivo') return { kind: 'not-found' };
  if (parts[1] === 'edicao' && /^20\d{2}$/.test(parts[2]))
    return { kind: 'edition', year: Number(parts[2]) };
  if (parts[1] === 'jogador' && /^[a-z0-9-]{1,80}$/.test(parts[2]))
    return { kind: 'player', slug: parts[2] };
  if (parts[1] === 'equipe' && /^[a-z0-9-]{1,100}$/.test(parts[2]))
    return { kind: 'team', slug: parts[2] };
  if (parts[1] === 'campeao' && /^[a-zA-Z0-9-]{1,80}$/.test(parts[2]))
    return { kind: 'champion', id: parts[2] };
  return { kind: 'not-found' };
}
