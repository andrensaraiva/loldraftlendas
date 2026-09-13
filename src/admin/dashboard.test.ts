import { describe, expect, it } from 'vitest';
import { dashboardMetricsFromResponse, localDemoDashboard } from './dashboard';

const response = {
  generated_at: '2026-09-09T15:45:00.000Z',
  overview: {
    drafts_started: 10,
    drafts_completed: 7,
    draft_completion_rate: 70,
    worlds_started: 6,
    worlds_start_rate: 85.7,
    play_again_rate: 10,
    average_draft_seconds: 120,
    average_campaign_seconds: null,
    exchanges_used: 8,
    share_intent_rate: 20,
    shares_completed: 1,
    cards_downloaded: 2,
    challenges_opened: 5,
    challenges_started: 4,
    challenge_completion_rate: 75,
    challenge_links_copied: 3,
  },
  outcomes: [],
  exchanges: [],
  player_picks: [],
  player_rejections: [],
  years: [],
  region_groups: [],
  devices: [],
  game_modes: [
    {
      key: 'classic',
      label: 'Clássico',
      drafts_started: 7,
      completion_rate: 71.4,
      play_again_rate: 14.3,
    },
    {
      key: 'almanac',
      label: 'Almanaque',
      drafts_started: 3,
      completion_rate: 66.7,
      play_again_rate: 0,
    },
  ],
  game_plans: [
    {
      key: 'aggression',
      label: 'Agressão',
      campaigns_started: 2,
      completion_rate: 50,
      title_rate: 100,
    },
    {
      key: 'teamfight',
      label: 'Teamfight',
      campaigns_started: 2,
      completion_rate: 100,
      title_rate: 50,
    },
    {
      key: 'control_pick',
      label: 'Controle/Pick',
      campaigns_started: 1,
      completion_rate: 100,
      title_rate: 0,
    },
    {
      key: 'scaling',
      label: 'Escala',
      campaigns_started: 1,
      completion_rate: 100,
      title_rate: 0,
    },
  ],
  feedback: { total: 1, good: 1, ok: 0, bad: 0, notes: [] },
  rating_feedback: {
    total: 2,
    reasons: [{ key: 'too_low', label: 'Rating baixo demais', count: 2 }],
    notes: [
      {
        player_id: 'faker-2017-skt',
        worlds_year: 2017,
        game: 1,
        reason: 'Rating baixo demais',
        note: 'Revisar o impacto deste campeão.',
        created_at: '2026-09-09T15:00:00.000Z',
      },
    ],
  },
};

describe('admin dashboard metrics', () => {
  it('maps the aggregate database response to the view model', () => {
    expect(dashboardMetricsFromResponse(response)).toMatchObject({
      overview: {
        draftsStarted: 10,
        averageCampaignSeconds: null,
        shareIntentRate: 20,
        sharesCompleted: 1,
        cardsDownloaded: 2,
        challengesOpened: 5,
        challengesStarted: 4,
        challengeCompletionRate: 75,
        challengeLinksCopied: 3,
      },
      feedback: { total: 1 },
      ratingFeedback: { total: 2 },
    });
    expect(dashboardMetricsFromResponse(response).gameModes[0]).toMatchObject({
      key: 'classic',
      completionRate: 71.4,
    });
    expect(dashboardMetricsFromResponse(response).gamePlans[1]).toMatchObject({
      key: 'teamfight',
      titleRate: 50,
    });
    expect(localDemoDashboard().playerPicks).toHaveLength(5);
  });

  it('rejects malformed metrics instead of rendering an untrusted response', () => {
    expect(() =>
      dashboardMetricsFromResponse({
        ...response,
        overview: { ...response.overview, drafts_started: -1 },
      }),
    ).toThrow();
    expect(() =>
      dashboardMetricsFromResponse({
        ...response,
        feedback: { ...response.feedback, notes: [{}] },
      }),
    ).toThrow();
  });
});
