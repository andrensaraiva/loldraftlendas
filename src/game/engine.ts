import { createRecap } from './recap';
import { gamePlanDefinition, GAME_PLAN_TAG_LABELS } from './plan';
import type { GamePlan } from './plan';
import type { Champion, GameResult, PlayerVersion, Series, Tag, Team, Tournament } from './types';
export type Random = () => number;
export const BALANCE = {
  playerWeight: 0.8,
  compositionWeight: 0.2,
  probabilityScale: 6,
  minProbability: 0.08,
  maxProbability: 0.92,
  compositionBase: 62,
  mixedDamage: 8,
  frontline: 6,
  engage: 5,
  peel: 4,
  synergy: 6,
  synergyThreshold: 3,
  gamePlanHigh: 1.5,
  gamePlanMedium: 0.5,
  gamePlanLow: -1,
};

export interface CompositionBonus {
  id:
    | 'mixed_damage'
    | 'frontline'
    | 'engage'
    | 'peel'
    | 'teamfight'
    | 'scaling'
    | 'pick'
    | 'poke'
    | 'early_game';
  label: string;
  value: number;
}

export interface CompositionBreakdown {
  base: number;
  bonuses: CompositionBonus[];
  total: number;
}

export type GamePlanCompatibility = 'low' | 'medium' | 'high';
export interface GamePlanBreakdown {
  plan: GamePlan;
  label: string;
  compatibility: GamePlanCompatibility;
  modifier: number;
  matchedTags: Array<{ tag: Tag; label: string }>;
  missingTags: Array<{ tag: Tag; label: string }>;
}

const synergyLabels = {
  TEAMFIGHT: 'Teamfight',
  SCALING: 'Escala',
  PICK: 'Pick',
  POKE: 'Poke',
  EARLY_GAME: 'Início de jogo',
} as const;
const pick = <T>(items: T[], rng: Random): T =>
  items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
export { createDraft } from './draft';
export function validateData(players: PlayerVersion[], champions: Record<string, Champion>) {
  const ids = new Set<string>();
  for (const p of players) {
    if (ids.has(p.id)) throw new Error('Versão de jogador duplicada');
    ids.add(p.id);
    if (p.championPool.length !== 5 || new Set(p.championPool.map((c) => c.championId)).size !== 5)
      throw new Error('Cada jogador precisa de cinco campeões diferentes');
    p.championPool.forEach((c, i) => {
      if (c.game !== i + 1 || !champions[c.championId] || c.rating < 0 || c.rating > 100)
        throw new Error('Pool inválido');
    });
  }
}
export function compositionScore(
  team: Team,
  game: number,
  champions: Record<string, Champion>,
): number {
  return compositionBreakdown(team, game, champions).total;
}

export function compositionBreakdown(
  team: Team,
  game: number,
  champions: Record<string, Champion>,
): CompositionBreakdown {
  const tags = team.flatMap((p) => champions[p.championPool[game - 1].championId].tags);
  const count = (tag: string) => tags.filter((t) => t === tag).length;
  const bonuses: CompositionBonus[] = [];
  if (count('AP_DAMAGE') && count('AD_DAMAGE'))
    bonuses.push({ id: 'mixed_damage', label: 'Dano misto', value: BALANCE.mixedDamage });
  if (count('FRONTLINE'))
    bonuses.push({ id: 'frontline', label: 'Linha de frente', value: BALANCE.frontline });
  if (count('ENGAGE')) bonuses.push({ id: 'engage', label: 'Engage', value: BALANCE.engage });
  if (count('PEEL')) bonuses.push({ id: 'peel', label: 'Proteção', value: BALANCE.peel });
  for (const tag of Object.keys(synergyLabels) as Array<keyof typeof synergyLabels>)
    if (count(tag) >= BALANCE.synergyThreshold)
      bonuses.push({
        id: tag.toLowerCase() as CompositionBonus['id'],
        label: synergyLabels[tag],
        value: BALANCE.synergy,
      });
  return {
    base: BALANCE.compositionBase,
    bonuses,
    total: Math.min(
      100,
      BALANCE.compositionBase + bonuses.reduce((sum, bonus) => sum + bonus.value, 0),
    ),
  };
}

export function gamePlanBreakdown(
  team: Team,
  game: number,
  champions: Record<string, Champion>,
  gamePlan: GamePlan,
): GamePlanBreakdown {
  const definition = gamePlanDefinition(gamePlan);
  const activeTags = new Set(
    team.flatMap((player) => champions[player.championPool[game - 1].championId].tags),
  );
  const describe = (tag: Tag) => ({ tag, label: GAME_PLAN_TAG_LABELS[tag] ?? tag });
  const matchedTags = definition.tags.filter((tag) => activeTags.has(tag)).map(describe);
  const missingTags = definition.tags.filter((tag) => !activeTags.has(tag)).map(describe);
  const compatibility: GamePlanCompatibility =
    matchedTags.length === definition.tags.length ? 'high' : matchedTags.length ? 'medium' : 'low';
  const modifier =
    compatibility === 'high'
      ? BALANCE.gamePlanHigh
      : compatibility === 'medium'
        ? BALANCE.gamePlanMedium
        : BALANCE.gamePlanLow;
  return {
    plan: gamePlan,
    label: definition.label,
    compatibility,
    modifier,
    matchedTags,
    missingTags,
  };
}

export function teamStrength(
  team: Team,
  game: number,
  champions: Record<string, Champion>,
  gamePlan: GamePlan | null = null,
) {
  if (team.length !== 5 || new Set(team.map((p) => p.role)).size !== 5 || game < 1 || game > 5)
    throw new Error('Composição inválida');
  const average = team.reduce((s, p) => s + p.championPool[game - 1].rating, 0) / 5;
  const composition = compositionScore(team, game, champions);
  const plan = gamePlan ? gamePlanBreakdown(team, game, champions, gamePlan) : null;
  const baseTotal =
    Math.round((average * BALANCE.playerWeight + composition * BALANCE.compositionWeight) * 10) /
    10;
  return {
    average,
    composition,
    baseTotal,
    plan,
    total: Math.max(0, Math.min(100, Math.round((baseTotal + (plan?.modifier ?? 0)) * 10) / 10)),
  };
}
export function winProbability(strength: number, opponent: number) {
  return Math.max(
    BALANCE.minProbability,
    Math.min(
      BALANCE.maxProbability,
      1 / (1 + Math.exp(-(strength - opponent) / BALANCE.probabilityScale)),
    ),
  );
}
export const newTournament = (): Tournament => ({
  stage: 'swiss',
  wins: 0,
  losses: 0,
  history: [],
  outcome: null,
});
export function formatFor(t: Tournament): 1 | 3 | 5 {
  return t.stage !== 'swiss' ? 5 : t.wins === 2 || t.losses === 2 ? 3 : 1;
}
export function seriesScore(s: Series) {
  return {
    wins: s.games.filter((g) => g.won).length,
    losses: s.games.filter((g) => !g.won).length,
  };
}
export function seriesDone(s: Series) {
  const score = seriesScore(s);
  return Math.max(score.wins, score.losses) >= Math.ceil(s.bestOf / 2);
}
export function createSeries(
  t: Tournament,
  players: PlayerVersion[],
  rng: Random = Math.random,
): Series {
  if (t.outcome) throw new Error('Torneio encerrado');
  const templates = [...new Set(players.map((p) => `${p.team} ${p.worldsYear}`))]
    .map((name) => ({ name, team: players.filter((p) => `${p.team} ${p.worldsYear}` === name) }))
    .filter((x) => x.team.length === 5);
  const unplayed = templates.filter((x) => !t.history.some((s) => s.opponentName === x.name));
  const opponent = pick(unplayed.length ? unplayed : templates, rng);
  return {
    stage: t.stage,
    opponentName: opponent.name,
    opponent: opponent.team,
    bestOf: formatFor(t),
    games: [],
  };
}
export function simulateGame(
  series: Series,
  team: Team,
  champions: Record<string, Champion>,
  rng: Random = Math.random,
  gamePlan: GamePlan | null = null,
): GameResult {
  if (seriesDone(series)) throw new Error('Série encerrada');
  const game = series.games.length + 1;
  const strength = teamStrength(team, game, champions, gamePlan).total;
  const opponentStrength = teamStrength(series.opponent, game, champions).total;
  const probability = winProbability(strength, opponentStrength);
  const won = rng() < probability;
  return {
    game,
    won,
    strength,
    opponentStrength,
    probability,
    recap: createRecap(team, series.opponent, game, won, rng),
  };
}
export function advanceTournament(t: Tournament, s: Series): Tournament {
  if (t.outcome || s.stage !== t.stage || s.bestOf !== formatFor(t) || !seriesDone(s))
    throw new Error('Série incompatível ou incompleta');
  const won = seriesScore(s).wins > seriesScore(s).losses;
  const next = { ...t, history: [...t.history, s] };
  if (t.stage === 'swiss') {
    next.wins += Number(won);
    next.losses += Number(!won);
    if (next.wins === 3) next.stage = 'quarters';
    if (next.losses === 3) next.outcome = 'Eliminado no Suíço';
  } else if (!won)
    next.outcome = { quarters: 'Quartas de final', semis: 'Semifinalista', final: 'Vice-campeão' }[
      t.stage
    ];
  else if (t.stage === 'final') next.outcome = 'Campeão mundial';
  else next.stage = t.stage === 'quarters' ? 'semis' : 'final';
  return next;
}
