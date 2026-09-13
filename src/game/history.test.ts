import { describe, expect, it } from 'vitest';
import type { CampaignStorage } from './campaign';
import {
  CAMPAIGN_HISTORY_KEY,
  MAX_CAMPAIGN_HISTORY,
  achievementsForCampaign,
  campaignAchievements,
  clearCampaignHistory,
  exportCampaignHistory,
  loadCampaignHistory,
  recordCampaignSummary,
} from './history';
import type { CampaignSummary } from './history';

function storage(): CampaignStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const summary: CampaignSummary = {
  id: 'campaign-1',
  completedAt: '2026-09-13T12:00:00.000Z',
  outcome: 'Campeão mundial',
  wins: 10,
  losses: 0,
  confrontations: 6,
  source: 'daily',
  gameMode: 'almanac',
  gamePlan: 'teamfight',
  dailyAttemptKind: 'official',
  team: [
    { playerName: 'Top', team: 'A', worldsYear: 2015, role: 'TOP' },
    { playerName: 'Jungle', team: 'B', worldsYear: 2017, role: 'JUNGLE' },
    { playerName: 'Mid', team: 'C', worldsYear: 2019, role: 'MID' },
    { playerName: 'ADC', team: 'D', worldsYear: 2023, role: 'ADC' },
    { playerName: 'Support', team: 'E', worldsYear: 2023, role: 'SUPPORT' },
  ],
};

describe('local campaign history', () => {
  it('records once, keeps newest first and can be cleared', () => {
    const local = storage();
    expect(recordCampaignSummary(summary, local)).toBe(true);
    expect(recordCampaignSummary(summary, local)).toBe(false);
    expect(loadCampaignHistory(local)).toEqual([summary]);
    clearCampaignHistory(local);
    expect(loadCampaignHistory(local)).toEqual([]);
  });

  it('keeps only the latest 30 summaries', () => {
    const local = storage();
    for (let index = 0; index < MAX_CAMPAIGN_HISTORY + 5; index += 1)
      recordCampaignSummary({ ...summary, id: `campaign-${index}` }, local);
    const history = loadCampaignHistory(local);
    expect(history).toHaveLength(MAX_CAMPAIGN_HISTORY);
    expect(history[0].id).toBe(`campaign-${MAX_CAMPAIGN_HISTORY + 4}`);
  });

  it('derives achievements from summaries instead of storing mutable flags', () => {
    expect(campaignAchievements([summary]).map((achievement) => achievement.id)).toEqual([
      'first_campaign',
      'world_champion',
      'almanac_champion',
      'era_mixer',
      'undefeated',
      'daily_official',
    ]);
    expect(
      achievementsForCampaign({ ...summary, outcome: 'Semifinalista', losses: 3 })
        .map((achievement) => achievement.id)
        .sort(),
    ).toEqual(['daily_official', 'era_mixer', 'first_campaign']);
  });

  it('exports a portable versioned document without seeds or personal identifiers', () => {
    const exported = exportCampaignHistory([summary], new Date('2026-09-13T13:00:00.000Z'));
    expect(JSON.parse(exported)).toMatchObject({
      version: 1,
      exportedAt: '2026-09-13T13:00:00.000Z',
      campaigns: [{ id: 'campaign-1' }],
    });
    expect(exported).not.toContain('seed');
    expect(exported).not.toContain('email');
  });

  it('ignores malformed or obsolete storage safely', () => {
    const local = storage();
    local.setItem(CAMPAIGN_HISTORY_KEY, '{broken');
    expect(loadCampaignHistory(local)).toEqual([]);
    local.setItem(CAMPAIGN_HISTORY_KEY, JSON.stringify({ version: 0, campaigns: [summary] }));
    expect(loadCampaignHistory(local)).toEqual([]);
  });
});
