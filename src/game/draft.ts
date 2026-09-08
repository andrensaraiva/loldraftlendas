import { ROLES } from './types';
import type { DraftRound, PlayerVersion, Role } from './types';

export const DRAFT_CONFIG = { exchanges: 3, choices: 3, selectionMs: 320, rollMs: 320 } as const;
export type Exchange = 'year' | 'region' | 'players';
type Random = () => number;
export type DraftPool = Omit<DraftRound, 'options'> & { players: PlayerVersion[] };
const choose = <T>(xs: T[], rng: Random): T =>
  xs[Math.min(xs.length - 1, Math.floor(rng() * xs.length))];
export function eligiblePools(players: PlayerVersion[]): DraftPool[] {
  const groups = new Map<string, DraftPool>();
  for (const p of players) {
    const key = `${p.worldsYear}/${p.region}/${p.role}`;
    const pool = groups.get(key) ?? {
      year: p.worldsYear,
      region: p.region,
      role: p.role,
      players: [],
    };
    if (!pool.players.some((x) => x.id === p.id)) pool.players.push(p);
    groups.set(key, pool);
  }
  return [...groups.values()].filter((p) => p.players.length >= DRAFT_CONFIG.choices);
}
export const offerKey = (r: DraftRound) =>
  `${r.role}/${r.year}/${r.region}/${r.options
    .map((p) => p.id)
    .sort()
    .join(',')}`;
function combinations(players: PlayerVersion[]): PlayerVersion[][] {
  const result: PlayerVersion[][] = [];
  for (let i = 0; i < players.length - 2; i++)
    for (let j = i + 1; j < players.length - 1; j++)
      for (let k = j + 1; k < players.length; k++)
        result.push([players[i], players[j], players[k]]);
  return result;
}
export function rollRound(pools: DraftPool[], role: Role, rng: Random = Math.random): DraftRound {
  const valid = pools.filter((p) => p.role === role);
  if (!valid.length) throw new Error(`Sem pools válidos para ${role}`);
  const year = choose([...new Set(valid.map((p) => p.year))], rng);
  const pool = choose(
    valid.filter((p) => p.year === year),
    rng,
  );
  return { role, year, region: pool.region, options: choose(combinations(pool.players), rng) };
}
export function createDraft(players: PlayerVersion[], rng: Random = Math.random): DraftRound[] {
  const pools = eligiblePools(players);
  return ROLES.map((role) => rollRound(pools, role, rng));
}
export function exchangeAlternatives(
  round: DraftRound,
  pools: DraftPool[],
  kind: Exchange,
): DraftRound[] {
  return pools
    .filter(
      (p) =>
        p.role === round.role &&
        (kind === 'year'
          ? p.region === round.region && p.year !== round.year
          : kind === 'region'
            ? p.year === round.year && p.region !== round.region
            : p.year === round.year && p.region === round.region),
    )
    .flatMap((p) =>
      combinations(p.players).map((options) => ({
        role: p.role,
        year: p.year,
        region: p.region,
        options,
      })),
    )
    .filter((r) => offerKey(r) !== offerKey(round));
}
export function exchangeRound(
  round: DraftRound,
  pools: DraftPool[],
  kind: Exchange,
  remaining: number,
  rejected: string[],
  rng: Random = Math.random,
) {
  const unchanged = { round, remaining, rejected, changed: false };
  if (remaining <= 0) return unchanged;
  let alternatives = exchangeAlternatives(round, pools, kind);
  if (!alternatives.length) return unchanged;
  const history = [...rejected, offerKey(round)];
  const fresh = alternatives.filter((r) => !history.includes(offerKey(r)));
  if (fresh.length) alternatives = fresh;
  // For player-only exchanges maximize new faces before random tie breaking.
  if (kind === 'players') {
    const overlap = (r: DraftRound) =>
      r.options.filter((p) => round.options.some((x) => x.id === p.id)).length;
    const min = Math.min(...alternatives.map(overlap));
    alternatives = alternatives.filter((r) => overlap(r) === min);
  }
  // Equal chance per destination year/region, independent of its number of combinations.
  const destinations = [...new Set(alternatives.map((r) => `${r.year}/${r.region}`))];
  const destination = choose(destinations, rng);
  return {
    round: choose(
      alternatives.filter((r) => `${r.year}/${r.region}` === destination),
      rng,
    ),
    remaining: remaining - 1,
    rejected: history,
    changed: true,
  };
}
