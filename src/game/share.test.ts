import { describe, expect, it } from 'vitest';
import { campaignCardFileName, campaignShareText } from './share';
import type { CampaignShareSummary } from './share';

const summary: CampaignShareSummary = {
  outcome: 'Campeão mundial',
  wins: 13,
  losses: 2,
  confrontations: 6,
  team: [
    { role: 'TOP', playerName: 'Khan', team: 'LZ', worldsYear: 2017 },
    { role: 'JUNGLE', playerName: 'Canyon', team: 'DWG', worldsYear: 2020 },
    { role: 'MID', playerName: 'Faker', team: 'SKT', worldsYear: 2017 },
    { role: 'ADC', playerName: 'Ruler', team: 'GEN', worldsYear: 2022 },
    { role: 'SUPPORT', playerName: 'Keria', team: 'T1', worldsYear: 2023 },
  ],
};

describe('campaign sharing', () => {
  it('builds a compact result story with every selected role', () => {
    const text = campaignShareText(summary);
    expect(text).toContain('Campeão mundial: 13V–2D');
    expect(text).toContain('TOP Khan (LZ 2017)');
    expect(text).toContain('SUP Keria (T1 2023)');
    expect(text).toContain('Você faria um draft melhor?');
  });

  it('creates a stable and filesystem-safe card name', () => {
    expect(campaignCardFileName(summary)).toBe('draft-lendas-campeao-mundial.png');
    expect(campaignCardFileName({ ...summary, outcome: '  ???  ' })).toBe(
      'draft-lendas-campanha.png',
    );
  });
});
