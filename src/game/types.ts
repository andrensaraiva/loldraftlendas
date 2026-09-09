export const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const;
export type Role = (typeof ROLES)[number];
export const DRAFT_REGION_GROUP_IDS = [
  'KOREA',
  'CHINA',
  'EUROPE',
  'NORTH_AMERICA',
  'OTHER_REGIONS',
  'EUROPE_NORTH_AMERICA',
] as const;
export type DraftRegionGroupId = (typeof DRAFT_REGION_GROUP_IDS)[number];
export interface DraftRegionGroup {
  id: DraftRegionGroupId;
  label: string;
  canonicalRegions: string[];
}
export interface DraftRegionManifest {
  version: string;
  datasetVersion: string;
  groups: Array<{ year: number; groups: DraftRegionGroup[] }>;
}
export type Tag =
  | 'ENGAGE'
  | 'TEAMFIGHT'
  | 'SCALING'
  | 'EARLY_GAME'
  | 'POKE'
  | 'PICK'
  | 'FRONTLINE'
  | 'SPLIT_PUSH'
  | 'AP_DAMAGE'
  | 'AD_DAMAGE'
  | 'MOBILITY'
  | 'CONTROL'
  | 'PEEL'
  | 'CARRY';
export interface Champion {
  id: string;
  name: string;
  image: string;
  splash: string;
  tags: Tag[];
  historicalAssets?: Record<string, { square: string; splash: string; patch: string }>;
}
export interface ChampionSlot {
  game: number;
  championId: string;
  rating: number;
  source: 'WORLDS_DATA' | 'SEASON_DATA' | 'MOCK';
  evidenceId?: string;
  historicalScore?: number;
  gameRating?: number;
  stats?: {
    games: number;
    winRate: number;
    kda: number | null;
    confidence: number;
    event: string;
    sourceUrl: string;
  };
}
export interface PlayerVersion {
  id: string;
  playerName: string;
  team: string;
  region: string;
  canonicalRegion?: string;
  worldsYear: number;
  role: Role;
  image?: string;
  championPool: ChampionSlot[];
  profile: string;
  teamName?: string;
  historicalLeague?: string;
  worldsStats?: { games: number; winRate: number; kda: number };
}
export type Team = PlayerVersion[];
export interface DraftRound {
  role: Role;
  year: number;
  region: DraftRegionGroup;
  options: PlayerVersion[];
}
export type Stage = 'swiss' | 'quarters' | 'semis' | 'final';
export interface PlayerKda {
  playerId: string;
  kills: number;
  deaths: number;
  assists: number;
}
export interface MatchMoment {
  minute: number;
  title: string;
  description: string;
  side: 'user' | 'opponent';
  user: PlayerKda[];
  opponent: PlayerKda[];
}
export interface MatchRecap {
  duration: number;
  moments: MatchMoment[];
}
export interface GameResult {
  game: number;
  won: boolean;
  strength: number;
  opponentStrength: number;
  probability: number;
  recap: MatchRecap;
}
export interface Series {
  stage: Stage;
  opponentName: string;
  opponent: Team;
  bestOf: 1 | 3 | 5;
  games: GameResult[];
}
export interface Tournament {
  stage: Stage;
  wins: number;
  losses: number;
  history: Series[];
  outcome: string | null;
}
