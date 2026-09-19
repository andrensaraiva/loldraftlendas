import { describe, expect, it } from 'vitest';
import type { CampaignStorage } from './campaign';
import type { DraftAvailability } from './draft';
import {
  beginDailyAttempt,
  completeDailyAttempt,
  createDailyChallenge,
  dailyDateKey,
  evaluateDailyObjective,
  isDailyModifierEligible,
  loadDailyAttempts,
  officialDailyAttempt,
  previousDailyDate,
  recentDailyChallenges,
} from './daily';

function storage(): CampaignStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const availability: DraftAvailability = {
  startingExchanges: 2,
  activeYears: [2025, 2017, 2025],
  activeRegionGroups: ['OTHER_REGIONS', 'KOREA'],
};

describe('daily challenge', () => {
  it('uses the São Paulo calendar boundary for everyone', () => {
    expect(dailyDateKey(new Date('2026-09-14T02:59:59.000Z'))).toBe('2026-09-13');
    expect(dailyDateKey(new Date('2026-09-14T03:00:00.000Z'))).toBe('2026-09-14');
    expect(previousDailyDate('2026-03-01')).toBe('2026-02-28');
  });

  it('creates the same canonical seed regardless of filter order', () => {
    const first = createDailyChallenge('2026-09-13', 'dataset-v1', availability);
    const second = createDailyChallenge('2026-09-13', 'dataset-v1', {
      startingExchanges: 2,
      activeYears: [2017, 2025],
      activeRegionGroups: ['KOREA', 'OTHER_REGIONS'],
    });
    expect(second).toEqual(first);
    expect(first.seed).toMatch(/^[a-z0-9]{16}$/);
    expect(first.id).toContain(`-${first.modifier.id}`);
    expect(first.modifier.catalogVersion).toBe(1);
    expect(createDailyChallenge('2026-09-14', 'dataset-v1', availability).seed).not.toBe(
      first.seed,
    );
  });

  it('builds a newest-first bounded archive', () => {
    const archive = recentDailyChallenges(
      new Date('2026-09-14T15:00:00.000Z'),
      7,
      'dataset-v1',
      availability,
    );
    expect(archive).toHaveLength(7);
    expect(archive[0].date).toBe('2026-09-14');
    expect(archive[6].date).toBe('2026-09-08');
  });

  it('allows one official local attempt and records later starts as friendly', () => {
    const local = storage();
    const clock = () => new Date('2026-09-13T12:00:00.000Z');
    const official = beginDailyAttempt(
      'daily-1',
      'era-bridge',
      local,
      clock,
      () => 'attempt-1',
    );
    const friendly = beginDailyAttempt(
      'daily-1',
      'era-bridge',
      local,
      clock,
      () => 'attempt-2',
    );
    expect(official.kind).toBe('official');
    expect(friendly.kind).toBe('friendly');
    expect(officialDailyAttempt('daily-1', local)?.id).toBe('attempt-1');
    expect(completeDailyAttempt('attempt-1', 'Campeão mundial', true, local, clock)).toBe(true);
    expect(loadDailyAttempts(local)[0]).toMatchObject({
      completedAt: '2026-09-13T12:00:00.000Z',
      outcome: 'Campeão mundial',
      modifierId: 'era-bridge',
      objectiveMet: true,
    });
  });

  it('keeps modifiers eligible and evaluates their objective from the final campaign', () => {
    const eraModifier = createDailyChallenge('2026-09-13', 'dataset-v1', availability).modifier;
    expect(isDailyModifierEligible(eraModifier, availability)).toBe(true);
    expect(
      evaluateDailyObjective('era-bridge', {
        team: [2014, 2017, 2021, 2025, 2025].map((worldsYear) => ({ worldsYear })) as never,
        tournament: { stage: 'final', wins: 3, losses: 0, history: [], outcome: 'Campeão mundial' },
      }),
    ).toBe(true);
    expect(
      evaluateDailyObjective('all-or-nothing', {
        team: [] as never,
        tournament: { stage: 'final', wins: 3, losses: 0, history: [], outcome: 'Vice-campeão' },
      }),
    ).toBe(false);
  });
});
