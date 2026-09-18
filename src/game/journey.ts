import type { CampaignReport } from './report';
import type { Stage } from './types';

export interface CampaignJourneyNode {
  seriesIndex: number;
  stage: Stage;
  opponentName: string;
  wins: number;
  losses: number;
  won: boolean;
  highlight: 'upset' | 'decisive' | 'title' | 'elimination' | null;
}

export type CampaignJourneySource = Pick<
  CampaignReport,
  'games' | 'outcome' | 'decisiveGame' | 'biggestUpsetFor'
>;

export function buildJourneyNodes(report: CampaignJourneySource): CampaignJourneyNode[] {
  const bySeries = new Map<number, CampaignReport['games']>();
  report.games.forEach((game) => {
    const games = bySeries.get(game.seriesIndex) ?? [];
    games.push(game);
    bySeries.set(game.seriesIndex, games);
  });
  const decisiveSeries = report.decisiveGame?.seriesIndex;
  const upsetSeries = report.biggestUpsetFor?.seriesIndex;
  const lastSeries = Math.max(-1, ...bySeries.keys());
  return [...bySeries.entries()].map(([seriesIndex, games]) => {
    const wins = games.filter((game) => game.won).length;
    const losses = games.length - wins;
    const won = wins > losses;
    let highlight: CampaignJourneyNode['highlight'] = null;
    if (seriesIndex === lastSeries && report.outcome === 'Campeão mundial') highlight = 'title';
    else if (seriesIndex === lastSeries && !won) highlight = 'elimination';
    else if (seriesIndex === decisiveSeries) highlight = 'decisive';
    else if (seriesIndex === upsetSeries) highlight = 'upset';
    return {
      seriesIndex,
      stage: games[0].stage,
      opponentName: games[0].opponentName,
      wins,
      losses,
      won,
      highlight,
    };
  });
}
