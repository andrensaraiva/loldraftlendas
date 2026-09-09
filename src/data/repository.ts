import { champions } from './champions';
import { players } from './players';
import draftRegionManifestData from './draft-region-groups.json';
import type { Champion, DraftRegionManifest, PlayerVersion } from '../game/types';
export interface GameData {
  players: PlayerVersion[];
  champions: Record<string, Champion>;
  draftRegionManifest: DraftRegionManifest;
}
export interface DataRepository {
  load(): Promise<GameData>;
}
// Replace this adapter with Firestore or Supabase; gameplay consumes the same snapshot.
export class LocalDataRepository implements DataRepository {
  async load(): Promise<GameData> {
    return {
      players,
      champions,
      draftRegionManifest: draftRegionManifestData as DraftRegionManifest,
    };
  }
}
