import { describe, expect, it } from 'vitest';
import { buildJourneyNodes } from './journey';
import type { CampaignJourneySource } from './journey';

const game = (seriesIndex: number, won: boolean, stage: 'swiss' | 'final') => ({
  id: `${seriesIndex}-${won}`,
  seriesIndex,
  stage,
  opponentName: seriesIndex ? 'GEN 2022' : 'SKT 2017',
  game: 1,
  won,
  probability: won ? 0.42 : 0.65,
  baseStrength: 84,
  planModifier: 1.5,
  finalStrength: 85.5,
  opponentStrength: 85,
  expectation: won ? ('underdog_win' as const) : ('favorite_loss' as const),
  compatibility: 'high' as const,
  matchedTags: ['Teamfight'],
  missingTags: [],
});

describe('campaign journey', () => {
  it('groups games by confrontation and marks the title without inventing branches', () => {
    const first = game(0, true, 'swiss');
    const final = game(1, true, 'final');
    const report = {
      outcome: 'Campeão mundial',
      games: [first, final],
      decisiveGame: final,
      biggestUpsetFor: first,
    } satisfies CampaignJourneySource;
    expect(buildJourneyNodes(report)).toEqual([
      expect.objectContaining({ seriesIndex: 0, wins: 1, losses: 0, highlight: 'upset' }),
      expect.objectContaining({ seriesIndex: 1, wins: 1, losses: 0, highlight: 'title' }),
    ]);
  });

  it('marks only the real final node as an elimination', () => {
    const loss = game(0, false, 'swiss');
    const report = {
      outcome: 'Eliminado no Suíço',
      games: [loss],
      decisiveGame: loss,
      biggestUpsetFor: null,
    } satisfies CampaignJourneySource;
    expect(buildJourneyNodes(report)).toEqual([
      expect.objectContaining({ won: false, highlight: 'elimination' }),
    ]);
  });
});
