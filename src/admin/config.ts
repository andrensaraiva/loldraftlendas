import { DRAFT_REGION_GROUP_IDS } from '../game/types';
import type { DraftRegionGroupId } from '../game/types';

export interface ProductConfig {
  version: number;
  startingExchanges: number;
  activeYears: number[];
  activeRegionGroups: DraftRegionGroupId[];
  analyticsEnabled: boolean;
  maintenanceBanner: string | null;
  datasetVersion: string;
  updatedAt: string;
}

export interface ProductConfigRow {
  version: number;
  starting_exchanges: number;
  active_years: number[];
  active_region_groups: string[];
  analytics_enabled: boolean;
  maintenance_banner: string | null;
  dataset_version: string;
  updated_at: string;
}

export function productConfigFromRow(row: ProductConfigRow): ProductConfig {
  if (
    !Number.isInteger(row.version) ||
    !Number.isInteger(row.starting_exchanges) ||
    row.starting_exchanges < 0 ||
    row.starting_exchanges > 9 ||
    !Array.isArray(row.active_years) ||
    !row.active_years.length ||
    !row.active_years.every((year) => Number.isInteger(year) && year >= 2011 && year <= 2100) ||
    !Array.isArray(row.active_region_groups) ||
    !row.active_region_groups.length ||
    !row.active_region_groups.every((group) =>
      (DRAFT_REGION_GROUP_IDS as readonly string[]).includes(group),
    ) ||
    typeof row.analytics_enabled !== 'boolean' ||
    (row.maintenance_banner !== null && typeof row.maintenance_banner !== 'string') ||
    typeof row.dataset_version !== 'string' ||
    !row.dataset_version ||
    Number.isNaN(Date.parse(row.updated_at))
  )
    throw new Error('Configuração de produto inválida.');

  return {
    version: row.version,
    startingExchanges: row.starting_exchanges,
    activeYears: [...new Set(row.active_years)].sort((a, b) => a - b),
    activeRegionGroups: [...new Set(row.active_region_groups)] as DraftRegionGroupId[],
    analyticsEnabled: row.analytics_enabled,
    maintenanceBanner: row.maintenance_banner?.trim() || null,
    datasetVersion: row.dataset_version,
    updatedAt: row.updated_at,
  };
}

export function productConfigToUpdate(config: ProductConfig): Omit<ProductConfigRow, 'updated_at'> {
  const checked = productConfigFromRow({
    version: config.version,
    starting_exchanges: config.startingExchanges,
    active_years: config.activeYears,
    active_region_groups: config.activeRegionGroups,
    analytics_enabled: config.analyticsEnabled,
    maintenance_banner: config.maintenanceBanner,
    dataset_version: config.datasetVersion,
    updated_at: config.updatedAt,
  });
  return {
    version: checked.version,
    starting_exchanges: checked.startingExchanges,
    active_years: checked.activeYears,
    active_region_groups: checked.activeRegionGroups,
    analytics_enabled: checked.analyticsEnabled,
    maintenance_banner: checked.maintenanceBanner,
    dataset_version: checked.datasetVersion,
  };
}