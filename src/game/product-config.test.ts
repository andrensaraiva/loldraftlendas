import { describe, expect, it } from 'vitest';
import { players } from '../data/players';
import manifest from '../data/draft-region-groups.json';
import {
  defaultDraftAvailability,
  publicProductConfigFromRow,
  safeDraftAvailability,
} from './product-config';
import type { DraftRegionManifest } from './types';

const data = { players, draftRegionManifest: manifest as DraftRegionManifest };
const row = {
  starting_exchanges: 2,
  active_years: [2017, 2023],
  active_region_groups: ['KOREA', 'CHINA'],
  analytics_enabled: true,
  maintenance_banner: ' Atualização em andamento ',
  dataset_version: manifest.datasetVersion,
};

describe('public product configuration', () => {
  it('applies only a dataset-compatible, role-valid configuration to new drafts', () => {
    expect(safeDraftAvailability(data, publicProductConfigFromRow(row))).toMatchObject({
      startingExchanges: 2,
      activeYears: [2017, 2023],
      activeRegionGroups: ['KOREA', 'CHINA'],
    });
    expect(
      safeDraftAvailability(data, publicProductConfigFromRow({ ...row, dataset_version: 'wrong' })),
    ).toEqual(defaultDraftAvailability(data));
    expect(
      safeDraftAvailability(
        data,
        publicProductConfigFromRow({
          ...row,
          active_years: [2017],
          active_region_groups: ['OTHER_REGIONS'],
        }),
      ),
    ).toEqual(defaultDraftAvailability(data));
  });

  it('rejects malformed public values before they reach gameplay', () => {
    expect(() => publicProductConfigFromRow({ ...row, starting_exchanges: -1 })).toThrow();
    expect(() =>
      publicProductConfigFromRow({ ...row, active_region_groups: ['UNKNOWN'] }),
    ).toThrow();
  });
});
