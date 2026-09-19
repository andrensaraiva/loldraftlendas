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

const portraitsByName = new Map(
  playerPortraitManifest.entries.map((entry) => [entry.playerName.toLocaleLowerCase(), entry]),
);

export function playerPortraitAsset(playerName: string): PlayerPortraitAsset | null {
  return portraitsByName.get(playerName.toLocaleLowerCase()) ?? null;
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
