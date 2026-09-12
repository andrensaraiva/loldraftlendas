import { describe, expect, it } from 'vitest';
import { analyticsPlayerId, AnalyticsTracker } from './analytics';
import type {
  AnalyticsEvent,
  AnalyticsFeedback,
  AnalyticsStorage,
  AnalyticsTransport,
} from './analytics';

function storage(): AnalyticsStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function transport(
  enabled = true,
): AnalyticsTransport & { events: AnalyticsEvent[]; feedback: AnalyticsFeedback[] } {
  const events: AnalyticsEvent[] = [];
  const feedback: AnalyticsFeedback[] = [];
  return {
    events,
    feedback,
    loadEnabled: async () => enabled,
    send: async (event) => {
      events.push(event);
    },
    submitFeedback: async (entry) => {
      feedback.push(entry);
    },
  };
}

describe('anonymous analytics', () => {
  it('normalizes historical IDs to a stable analytics-safe identifier', () => {
    expect(analyticsPlayerId('Hans Sama-2017-MSF')).toBe('hans-sama-2017-msf');
  });

  it('queues only privacy-limited properties and sends them without blocking the caller', async () => {
    const local = storage();
    const remote = transport();
    let id = 0;
    const tracker = new AnalyticsTracker({
      transport: remote,
      storage: local,
      randomId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
      deviceType: () => 'mobile',
      now: () => 1500,
    });
    await tracker.initialize();
    tracker.startCampaign();
    tracker.track('player_selected', {
      player_id: 'faker-2017-skt',
      candidate_ids: ['faker-2017-skt', 'crown-2017-ssg'],
      email: 'never-sent@example.test',
      note: 'never-sent',
      invalid: Number.NaN,
    });
    tracker.track('share_started', {
      outcome: 'Campeão mundial',
      share_method: 'file',
      email: 'still-never-sent@example.test',
    });
    await tracker.flush();

    expect(remote.events.map((event) => event.event_name)).toEqual([
      'session_started',
      'draft_started',
      'player_selected',
      'share_started',
    ]);
    expect(remote.events[2]).toMatchObject({
      device_type: 'mobile',
      properties: {
        player_id: 'faker-2017-skt',
        candidate_ids: ['faker-2017-skt', 'crown-2017-ssg'],
      },
    });
    expect(remote.events[2].properties).not.toHaveProperty('email');
    expect(remote.events[2].properties).not.toHaveProperty('note');
    expect(remote.events[3].properties).toEqual({
      outcome: 'Campeão mundial',
      share_method: 'file',
    });
    expect(tracker.campaignElapsedMs()).toBe(0);
    expect(tracker.draftElapsedMs()).toBe(0);
  });

  it('honors remote opt-out, deduplicates one-time events, and submits short anonymous feedback', async () => {
    const local = storage();
    const remote = transport();
    const tracker = new AnalyticsTracker({
      transport: remote,
      storage: local,
      randomId: () => crypto.randomUUID(),
    });
    await tracker.initialize();
    tracker.trackOnce('campaign_finished', 'campaign_finished', { outcome: 'Campeão mundial' });
    tracker.trackOnce('campaign_finished', 'campaign_finished', { outcome: 'Campeão mundial' });
    await tracker.flush();
    expect(remote.events.filter((event) => event.event_name === 'campaign_finished')).toHaveLength(
      1,
    );
    expect(await tracker.submitFeedback('good', ` ${'x'.repeat(600)} `)).toBe(true);
    expect(remote.feedback[0]).toMatchObject({ rating: 'good', note: 'x'.repeat(500) });

    const disabled = new AnalyticsTracker({ transport: transport(false), storage: local });
    expect(await disabled.initialize()).toBe(false);
    disabled.track('draft_started');
    expect(disabled.isEnabled()).toBe(false);
  });
});
