import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_SAVE_KEY,
  clearCampaign,
  loadCampaign,
  saveCampaign,
} from './campaign';
import type { CampaignState, CampaignStorage } from './campaign';

function storage(): CampaignStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const campaign: CampaignState = {
  screen: 'draft',
  draftStep: 0,
  draftAvailability: {
    startingExchanges: 2,
    activeYears: [2017, 2023],
    activeRegionGroups: ['KOREA', 'CHINA'],
  },
  remaining: 2,
  rejected: ['TOP/2023/KOREA/example'],
  rounds: [],
  team: [],
  preview: 1,
  tournament: { stage: 'swiss', wins: 0, losses: 0, history: [], outcome: null },
  series: null,
  settings: { mode: 'detailed', speed: 1, paused: false },
  playResult: null,
  momentIndex: 0,
};

describe('campaign persistence', () => {
  it('round-trips a versioned campaign for the active dataset', () => {
    const local = storage();
    expect(saveCampaign(campaign, 'dataset-v1', local)).toBe(true);
    expect(loadCampaign('dataset-v1', local)).toEqual(campaign);
  });

  it('invalidates obsolete or malformed saves without throwing', () => {
    const local = storage();
    local.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify({ version: 0, datasetVersion: 'dataset-v1' }));
    expect(loadCampaign('dataset-v1', local)).toBeNull();
    expect(local.getItem(CAMPAIGN_SAVE_KEY)).toBeNull();
    local.setItem(CAMPAIGN_SAVE_KEY, '{not json');
    expect(loadCampaign('dataset-v1', local)).toBeNull();
    expect(local.getItem(CAMPAIGN_SAVE_KEY)).toBeNull();
  });

  it('invalidates a save when the data pipeline changes datasets and can clear manually', () => {
    const local = storage();
    saveCampaign(campaign, 'dataset-v1', local);
    expect(loadCampaign('dataset-v2', local)).toBeNull();
    saveCampaign(campaign, 'dataset-v1', local);
    clearCampaign(local);
    expect(local.getItem(CAMPAIGN_SAVE_KEY)).toBeNull();
  });
});