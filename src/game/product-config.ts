import { DRAFT_CONFIG } from './draft';
import { DRAFT_REGION_GROUP_IDS } from './types';
import type { DraftAvailability } from './draft';
import type { DraftRegionGroupId, DraftRegionManifest } from './types';

export interface PublicProductConfig {
  startingExchanges: number;
  activeYears: number[];
  activeRegionGroups: DraftRegionGroupId[];
  analyticsEnabled: boolean;
  maintenanceBanner: string | null;
  datasetVersion: string;
}

interface PublicProductConfigRow {
  starting_exchanges: number;
  active_years: number[];
  active_region_groups: string[];
  analytics_enabled: boolean;
  maintenance_banner: string | null;
  dataset_version: string;
}

export interface ProductData {
  draftRegionManifest: DraftRegionManifest;
}

export function publicProductConfigFromRow(row: PublicProductConfigRow): PublicProductConfig {
  if (
    !Number.isInteger(row.starting_exchanges) ||
    row.starting_exchanges < 0 ||
    row.starting_exchanges > 9 ||
    !Array.isArray(row.active_years) ||
    !row.active_years.every((year) => Number.isInteger(year) && year >= 2011 && year <= 2100) ||
    !Array.isArray(row.active_region_groups) ||
    !row.active_region_groups.every((group) =>
      (DRAFT_REGION_GROUP_IDS as readonly string[]).includes(group),
    ) ||
    typeof row.analytics_enabled !== 'boolean' ||
    (row.maintenance_banner !== null && typeof row.maintenance_banner !== 'string') ||
    typeof row.dataset_version !== 'string' ||
    !row.dataset_version
  )
    throw new Error('Configuração pública inválida.');

  return {
    startingExchanges: row.starting_exchanges,
    activeYears: [...new Set(row.active_years)].sort((a, b) => a - b),
    activeRegionGroups: [...new Set(row.active_region_groups)] as DraftRegionGroupId[],
    analyticsEnabled: row.analytics_enabled,
    maintenanceBanner: row.maintenance_banner?.trim().slice(0, 280) || null,
    datasetVersion: row.dataset_version,
  };
}

export function defaultDraftAvailability(data: ProductData): DraftAvailability {
  return {
    startingExchanges: DRAFT_CONFIG.exchanges,
    activeYears: data.draftRegionManifest.groups.map((entry) => entry.year).sort((a, b) => a - b),
    activeRegionGroups: [
      ...new Set(
        data.draftRegionManifest.groups.flatMap((entry) => entry.groups.map((group) => group.id)),
      ),
    ],
  };
}

export function safeDraftAvailability(
  data: ProductData,
  configuration: PublicProductConfig | null,
): DraftAvailability {
  const fallback = defaultDraftAvailability(data);
  if (!configuration || configuration.datasetVersion !== data.draftRegionManifest.datasetVersion)
    return fallback;
  const availability: DraftAvailability = {
    startingExchanges: configuration.startingExchanges,
    activeYears: configuration.activeYears,
    activeRegionGroups: configuration.activeRegionGroups,
  };
  const hasEligibleGroup = data.draftRegionManifest.groups.some(
    (entry) =>
      availability.activeYears.includes(entry.year) &&
      entry.groups.some((group) => availability.activeRegionGroups.includes(group.id)),
  );
  return hasEligibleGroup ? availability : fallback;
}

export async function loadPublicProductConfig(): Promise<PublicProductConfig | null> {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  try {
    const response = await fetch(`${url}/rest/v1/rpc/get_public_product_config`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    if (!response.ok) return null;
    return publicProductConfigFromRow((await response.json()) as PublicProductConfigRow);
  } catch {
    return null;
  }
}
