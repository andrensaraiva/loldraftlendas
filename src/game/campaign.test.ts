import { describe, expect, it } from 'vitest';
import { CAMPAIGN_SAVE_KEY, clearCampaign, loadCampaign, saveCampaign } from './campaign';
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
  seed: 'draftlendas2026a',
  randomVersion: 1,
  campaignSource: 'organic',
  gameMode: 'almanac',
  gamePlan: 'control_pick',
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

  it('migrates a compatible v1 save to a deterministic organic campaign', () => {
    const local = storage();
    const {
      seed: _seed,
      randomVersion: _randomVersion,
      campaignSource: _source,
      gameMode: _gameMode,
      gamePlan: _gamePlan,
      ...legacy
    } = campaign;
    local.setItem(
      CAMPAIGN_SAVE_KEY,
      JSON.stringify({
        version: 1,
        datasetVersion: 'dataset-v1',
        savedAt: '2026-09-12T12:00:00.000Z',
        campaign: legacy,
      }),
    );
    const migrated = loadCampaign('dataset-v1', local);
    expect(migrated).toMatchObject({
      randomVersion: 1,
      campaignSource: 'organic',
      gameMode: 'classic',
      gamePlan: null,
      screen: 'draft',
    });
    expect(migrated?.seed).toMatch(/^[a-z0-9]{16}$/);
  });

  it('migrates a compatible v2 save to classic mode', () => {
    const local = storage();
    const { gameMode: _gameMode, ...versionTwo } = campaign;
    local.setItem(
      CAMPAIGN_SAVE_KEY,
      JSON.stringify({ version: 2, datasetVersion: 'dataset-v1', campaign: versionTwo }),
    );
    expect(loadCampaign('dataset-v1', local)).toMatchObject({
      gameMode: 'classic',
      gamePlan: null,
    });
  });

  it('migrates a compatible v3 save without changing its previous rules', () => {
    const local = storage();
    const { gamePlan: _gamePlan, ...versionThree } = campaign;
    local.setItem(
      CAMPAIGN_SAVE_KEY,
      JSON.stringify({ version: 3, datasetVersion: 'dataset-v1', campaign: versionThree }),
    );
    expect(loadCampaign('dataset-v1', local)).toMatchObject({
      gameMode: 'almanac',
      gamePlan: null,
    });
  });
});
