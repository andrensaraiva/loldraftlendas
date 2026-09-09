import { describe, expect, it } from 'vitest';
import { productConfigFromRow, productConfigToUpdate } from './config';

const row = {
  version: 1,
  starting_exchanges: 3,
  active_years: [2023, 2017, 2023],
  active_region_groups: ['KOREA', 'CHINA', 'KOREA'],
  analytics_enabled: true,
  maintenance_banner: '  Atualização programada  ',
  dataset_version: 'multi-era-v1.0.0',
  updated_at: '2026-09-09T12:00:00.000Z',
};

describe('product configuration', () => {
  it('normalizes the database representation before it reaches an admin form', () => {
    expect(productConfigFromRow(row)).toMatchObject({
      activeYears: [2017, 2023],
      activeRegionGroups: ['KOREA', 'CHINA'],
      maintenanceBanner: 'Atualização programada',
    });
  });

  it('rejects unsafe configuration values and serializes validated updates', () => {
    expect(() => productConfigFromRow({ ...row, starting_exchanges: 10 })).toThrow();
    expect(() => productConfigFromRow({ ...row, active_region_groups: ['NOT_A_REGION'] })).toThrow();
    expect(productConfigToUpdate(productConfigFromRow(row))).toEqual({
      version: 1,
      starting_exchanges: 3,
      active_years: [2017, 2023],
      active_region_groups: ['KOREA', 'CHINA'],
      analytics_enabled: true,
      maintenance_banner: 'Atualização programada',
      dataset_version: 'multi-era-v1.0.0',
    });
  });
});