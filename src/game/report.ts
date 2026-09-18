import { gamePlanBreakdown, teamStrength } from './engine';
import type { GamePlanCompatibility } from './engine';
import type { GamePlan } from './plan';
import { gamePlanLabel } from './plan';
import type { Champion, GameResult, Stage, Team, Tournament } from './types';

export const CAMPAIGN_REPORT_VERSION = 1;

export type ResultExpectation =
  | 'expected_win'
  | 'underdog_win'
  | 'expected_loss'
  | 'favorite_loss';

export interface CampaignGameReport {
  id: string;
  seriesIndex: number;
  stage: Stage;
  opponentName: string;
  game: number;
  won: boolean;
  probability: number;
  baseStrength: number;
  planModifier: number;
  finalStrength: number;
  opponentStrength: number;
  expectation: ResultExpectation;
  compatibility: GamePlanCompatibility | null;
  matchedTags: string[];
  missingTags: string[];
}

export interface CampaignCompositionReport {
  game: number;
  baseStrength: number;
  finalStrength: number;
  planModifier: number;
  compatibility: GamePlanCompatibility | null;
}

export interface CampaignStageReport {
  stage: Stage;
  series: number;
  seriesWins: number;
  seriesLosses: number;
  gameWins: number;
  gameLosses: number;
}

export interface CampaignPlayerReport {
  playerId: string;
  playerName: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
}

export interface CampaignChampionReport {
  championId: string;
  championName: string;
  games: number;
  wins: number;
  winRate: number;
}

export interface CampaignReportHighlights {
  strongestCompositionGame: number;
  weakestCompositionGame: number;
  totalPlanEffect: number;
  biggestUpset: string | null;
  decisiveGame: string | null;
  standoutPlayer: string | null;
}

export interface CampaignReport {
  version: typeof CAMPAIGN_REPORT_VERSION;
  outcome: string;
  totals: {
    games: number;
    wins: number;
    losses: number;
    series: number;
    seriesWins: number;
    seriesLosses: number;
  };
  stages: CampaignStageReport[];
  games: CampaignGameReport[];
  compositions: CampaignCompositionReport[];
  strongestComposition: CampaignCompositionReport;
  weakestComposition: CampaignCompositionReport;
  plan: {
    id: GamePlan | null;
    label: string;
    totalEffect: number;
    averageEffect: number;
    compatibility: Record<GamePlanCompatibility, number>;
  };
  biggestUpsetFor: CampaignGameReport | null;
  biggestUpsetAgainst: CampaignGameReport | null;
  toughestGame: CampaignGameReport | null;
  decisiveGame: CampaignGameReport | null;
  standoutPlayer: CampaignPlayerReport | null;
  mostUsedChampion: CampaignChampionReport | null;
  mostSuccessfulChampion: CampaignChampionReport | null;
  favoriteRecord: { games: number; wins: number; winRate: number };
  underdogRecord: { games: number; wins: number; winRate: number };
  representedYears: number[];
  representedRegions: string[];
  highlights: CampaignReportHighlights;
}

export interface CampaignReportInput {
  tournament: Tournament;
  team: Team;
  champions: Record<string, Champion>;
  gamePlan: GamePlan | null;
}

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const rate = (wins: number, games: number) => (games ? round(wins / games, 3) : 0);

export function classifyResult(result: Pick<GameResult, 'won' | 'probability'>): ResultExpectation {
  const favorite = result.probability >= 0.5;
  if (result.won) return favorite ? 'expected_win' : 'underdog_win';
  return favorite ? 'favorite_loss' : 'expected_loss';
}

export function resultExpectationLabel(expectation: ResultExpectation): string {
  return {
    expected_win: 'Vitória esperada',
    underdog_win: 'Vitória como azarão',
    expected_loss: 'Derrota esperada',
    favorite_loss: 'Derrota apesar do favoritismo',
  }[expectation];
}

function finalStats(result: GameResult) {
  return result.recap.moments[result.recap.moments.length - 1]?.user ?? [];
}

export function buildCampaignReport({
  tournament,
  team,
  champions,
  gamePlan,
}: CampaignReportInput): CampaignReport {
  if (team.length !== 5) throw new Error('Relatório requer uma equipe completa');

  const compositions: CampaignCompositionReport[] = [1, 2, 3, 4, 5].map((game) => {
    const strength = teamStrength(team, game, champions, gamePlan);
    return {
      game,
      baseStrength: strength.baseTotal,
      finalStrength: strength.total,
      planModifier: strength.plan?.modifier ?? 0,
      compatibility: strength.plan?.compatibility ?? null,
    };
  });
  const games: CampaignGameReport[] = tournament.history.flatMap((series, seriesIndex) =>
    series.games.map((result) => {
      const strength = teamStrength(team, result.game, champions, gamePlan);
      const plan = gamePlan
        ? gamePlanBreakdown(team, result.game, champions, gamePlan)
        : null;
      return {
        id: `${seriesIndex + 1}-${series.stage}-${result.game}`,
        seriesIndex,
        stage: series.stage,
        opponentName: series.opponentName,
        game: result.game,
        won: result.won,
        probability: result.probability,
        baseStrength: strength.baseTotal,
        planModifier: plan?.modifier ?? 0,
        finalStrength: result.strength,
        opponentStrength: result.opponentStrength,
        expectation: classifyResult(result),
        compatibility: plan?.compatibility ?? null,
        matchedTags: plan?.matchedTags.map((tag) => tag.label) ?? [],
        missingTags: plan?.missingTags.map((tag) => tag.label) ?? [],
      };
    }),
  );

  const stages = (['swiss', 'quarters', 'semis', 'final'] as const)
    .map((stage) => {
      const series = tournament.history.filter((entry) => entry.stage === stage);
      const stageGames = series.flatMap((entry) => entry.games);
      const seriesWins = series.filter((entry) => {
        const wins = entry.games.filter((game) => game.won).length;
        return wins > entry.games.length - wins;
      }).length;
      return {
        stage,
        series: series.length,
        seriesWins,
        seriesLosses: series.length - seriesWins,
        gameWins: stageGames.filter((game) => game.won).length,
        gameLosses: stageGames.filter((game) => !game.won).length,
      };
    })
    .filter((stage) => stage.series > 0);

  const playerTotals = new Map<string, CampaignPlayerReport>();
  const championTotals = new Map<string, CampaignChampionReport>();
  tournament.history.forEach((series) =>
    series.games.forEach((result) => {
      finalStats(result).forEach((stats) => {
        const player = team.find((candidate) => candidate.id === stats.playerId);
        if (!player) return;
        const current = playerTotals.get(player.id) ?? {
          playerId: player.id,
          playerName: player.playerName,
          kills: 0,
          deaths: 0,
          assists: 0,
          kda: 0,
        };
        current.kills += stats.kills;
        current.deaths += stats.deaths;
        current.assists += stats.assists;
        current.kda = round((current.kills + current.assists) / Math.max(1, current.deaths), 2);
        playerTotals.set(player.id, current);
      });
      team.forEach((player) => {
        const championId = player.championPool[result.game - 1].championId;
        const current = championTotals.get(championId) ?? {
          championId,
          championName: champions[championId]?.name ?? championId,
          games: 0,
          wins: 0,
          winRate: 0,
        };
        current.games += 1;
        current.wins += Number(result.won);
        current.winRate = rate(current.wins, current.games);
        championTotals.set(championId, current);
      });
    }),
  );

  const strongestComposition = [...compositions].sort(
    (left, right) => right.finalStrength - left.finalStrength || left.game - right.game,
  )[0];
  const weakestComposition = [...compositions].sort(
    (left, right) => left.finalStrength - right.finalStrength || left.game - right.game,
  )[0];
  const biggestUpsetFor =
    [...games].filter((game) => game.won && game.probability < 0.5).sort(
      (left, right) => left.probability - right.probability,
    )[0] ?? null;
  const biggestUpsetAgainst =
    [...games].filter((game) => !game.won && game.probability >= 0.5).sort(
      (left, right) => right.probability - left.probability,
    )[0] ?? null;
  const toughestGame = [...games].sort(
    (left, right) => left.probability - right.probability,
  )[0] ?? null;
  const decisiveGame = games[games.length - 1] ?? null;
  const standoutPlayer =
    [...playerTotals.values()].sort(
      (left, right) =>
        right.kda - left.kda || right.kills + right.assists - (left.kills + left.assists),
    )[0] ?? null;
  const championReports = [...championTotals.values()];
  const mostUsedChampion =
    [...championReports].sort(
      (left, right) => right.games - left.games || right.wins - left.wins,
    )[0] ?? null;
  const mostSuccessfulChampion =
    [...championReports].sort(
      (left, right) => right.winRate - left.winRate || right.games - left.games,
    )[0] ?? null;
  const favoriteGames = games.filter((game) => game.probability >= 0.5);
  const underdogGames = games.filter((game) => game.probability < 0.5);
  const totalPlanEffect = round(games.reduce((sum, game) => sum + game.planModifier, 0));
  const compatibility = games.reduce<Record<GamePlanCompatibility, number>>(
    (counts, game) => {
      if (game.compatibility) counts[game.compatibility] += 1;
      return counts;
    },
    { low: 0, medium: 0, high: 0 },
  );
  const seriesWins = stages.reduce((sum, stage) => sum + stage.seriesWins, 0);
  const wins = games.filter((game) => game.won).length;

  return {
    version: CAMPAIGN_REPORT_VERSION,
    outcome: tournament.outcome ?? 'Campanha em andamento',
    totals: {
      games: games.length,
      wins,
      losses: games.length - wins,
      series: tournament.history.length,
      seriesWins,
      seriesLosses: tournament.history.length - seriesWins,
    },
    stages,
    games,
    compositions,
    strongestComposition,
    weakestComposition,
    plan: {
      id: gamePlan,
      label: gamePlanLabel(gamePlan),
      totalEffect: totalPlanEffect,
      averageEffect: games.length ? round(totalPlanEffect / games.length, 2) : 0,
      compatibility,
    },
    biggestUpsetFor,
    biggestUpsetAgainst,
    toughestGame,
    decisiveGame,
    standoutPlayer,
    mostUsedChampion,
    mostSuccessfulChampion,
    favoriteRecord: {
      games: favoriteGames.length,
      wins: favoriteGames.filter((game) => game.won).length,
      winRate: rate(favoriteGames.filter((game) => game.won).length, favoriteGames.length),
    },
    underdogRecord: {
      games: underdogGames.length,
      wins: underdogGames.filter((game) => game.won).length,
      winRate: rate(underdogGames.filter((game) => game.won).length, underdogGames.length),
    },
    representedYears: [...new Set(team.map((player) => player.worldsYear))].sort(),
    representedRegions: [
      ...new Set(team.map((player) => player.canonicalRegion ?? player.region)),
    ].sort(),
    highlights: {
      strongestCompositionGame: strongestComposition.game,
      weakestCompositionGame: weakestComposition.game,
      totalPlanEffect,
      biggestUpset: biggestUpsetFor
        ? `${biggestUpsetFor.opponentName} · G${biggestUpsetFor.game}`
        : null,
      decisiveGame: decisiveGame
        ? `${decisiveGame.opponentName} · G${decisiveGame.game}`
        : null,
      standoutPlayer: standoutPlayer?.playerName ?? null,
    },
  };
}
