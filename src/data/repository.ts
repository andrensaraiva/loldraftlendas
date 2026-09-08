import { champions } from './champions';
import { players } from './players';
import type { Champion, PlayerVersion } from '../game/types';
export interface GameData {
  players: PlayerVersion[];
  champions: Record<string, Champion>;
}
export interface DataRepository {
  load(): Promise<GameData>;
}
// Replace this adapter with Firestore or Supabase; gameplay consumes the same snapshot.
export class LocalDataRepository implements DataRepository {
  async load(): Promise<GameData> {
    return { players, champions };
  }
}
