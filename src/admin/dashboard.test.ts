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
  },
  outcomes: [],
  exchanges: [],
  player_picks: [],
  player_rejections: [],
  years: [],
  region_groups: [],
  devices: [],
  feedback: { total: 1, good: 1, ok: 0, bad: 0, notes: [] },
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
      },
      feedback: { total: 1 },
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
