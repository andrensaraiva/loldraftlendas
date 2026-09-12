import { describe, expect, it } from 'vitest';
import { campaignRandom, campaignSeedFromText, createCampaignSeed, isCampaignSeed } from './random';

describe('campaign randomness', () => {
  it('creates a compact seed and can derive one for legacy saves', () => {
    expect(createCampaignSeed(() => 0)).toBe('0000000000000000');
    expect(createCampaignSeed(() => 0.999)).toBe('zzzzzzzzzzzzzzzz');
    expect(isCampaignSeed(campaignSeedFromText('legacy/save/2026'))).toBe(true);
    expect(campaignSeedFromText('legacy/save/2026')).toBe(campaignSeedFromText('legacy/save/2026'));
  });

  it('reproduces a scope without coupling independent operations', () => {
    const seed = 'draftlendas2026a';
    const first = campaignRandom(seed, 'draft/initial');
    const replay = campaignRandom(seed, 'draft/initial');
    expect([first(), first(), first()]).toEqual([replay(), replay(), replay()]);

    const seriesValue = campaignRandom(seed, 'series/0/swiss')();
    expect(seriesValue).not.toBe(campaignRandom(seed, 'series/1/swiss')());
    expect(campaignRandom(seed, 'series/0/swiss')()).toBe(seriesValue);
  });
});
