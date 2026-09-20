import manifest from './player-portraits.json';

export type PortraitApproval = 'pending' | 'approved' | 'rejected';

export interface PlayerPortraitAsset {
  playerKey: string;
  playerName: string;
  portrait: string;
  silhouette: string;
  approval: PortraitApproval;
  focus: { x: number; y: number };
}

export const playerPortraitManifest = manifest as {
  version: string;
  promptVersion: number;
  status: string;
  generatedAt: string;
  entries: PlayerPortraitAsset[];
};

function portraitKey(value: string): string {
  return value
    .toLocaleLowerCase('en-US')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const portraitsByName = new Map<string, PlayerPortraitAsset>();
for (const entry of playerPortraitManifest.entries) {
  portraitsByName.set(portraitKey(entry.playerName), entry);
  portraitsByName.set(portraitKey(entry.playerKey), entry);
}

export function playerPortraitAsset(playerName: string): PlayerPortraitAsset | null {
  return portraitsByName.get(portraitKey(playerName)) ?? null;
}

export function playerPortraitSources(playerName: string): string[] {
  const asset = playerPortraitAsset(playerName);
  if (!asset) return [];
  return asset.approval === 'approved'
    ? [asset.portrait, asset.silhouette]
    : [asset.silhouette];
}

export function playerCardArt(playerName: string): string | null {
  return playerPortraitSources(playerName)[0] ?? null;
}
