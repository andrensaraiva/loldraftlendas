import { champions } from './champions';
import draftRegionManifestData from './draft-region-groups.json';
import featuredPlayerData from './featured-player.json';
import type { Champion, DraftRegionManifest, PlayerVersion } from '../game/types';

export interface GameData {
  players: PlayerVersion[];
  champions: Record<string, Champion>;
  draftRegionManifest: DraftRegionManifest;
}

export interface GameCatalog {
  champions: Record<string, Champion>;
  draftRegionManifest: DraftRegionManifest;
  featuredPlayer: PlayerVersion;
}

export interface DataRepository {
  readonly catalog: GameCatalog;
  load(): Promise<GameData>;
  loadYears(years: number[]): Promise<GameData>;
}

const yearModules = import.meta.glob<PlayerVersion[]>('./years/*.json', { import: 'default' });

// Each annual dataset is a lazy chunk cached for the browser session. A remote
// adapter can preserve this interface without changing gameplay.
export class LocalDataRepository implements DataRepository {
  readonly catalog: GameCatalog = {
    champions,
    draftRegionManifest: draftRegionManifestData as DraftRegionManifest,
    featuredPlayer: featuredPlayerData as PlayerVersion,
  };

  private readonly cache = new Map<number, Promise<PlayerVersion[]>>();

  private loadYear(year: number): Promise<PlayerVersion[]> {
    const existing = this.cache.get(year);
    if (existing) return existing;
    const loader = yearModules[`./years/${year}.json`];
    if (!loader) return Promise.reject(new Error(`Dataset indisponível para ${year}`));
    const request = loader();
    this.cache.set(year, request);
    return request;
  }

  async loadYears(years: number[]): Promise<GameData> {
    const uniqueYears = [...new Set(years)].sort((a, b) => a - b);
    const annualPlayers = await Promise.all(uniqueYears.map((year) => this.loadYear(year)));
    return {
      players: annualPlayers.flat(),
      champions: this.catalog.champions,
      draftRegionManifest: this.catalog.draftRegionManifest,
    };
  }

  load(): Promise<GameData> {
    return this.loadYears(this.catalog.draftRegionManifest.groups.map((entry) => entry.year));
  }
}
