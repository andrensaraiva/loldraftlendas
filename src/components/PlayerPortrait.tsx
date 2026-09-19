import { useEffect, useState } from 'react';
import { playerPortraitAsset, playerPortraitSources } from '../data/player-art';
import type { PlayerVersion } from '../game/types';
import { PlayerAvatar } from './PlayerAvatar';

export function PlayerPortrait({
  player,
  className = '',
  loading = 'lazy',
}: {
  player: PlayerVersion;
  className?: string;
  loading?: 'eager' | 'lazy';
}) {
  const sources = playerPortraitSources(player.playerName);
  const asset = playerPortraitAsset(player.playerName);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => setSourceIndex(0), [player.playerName]);

  const source = sources[sourceIndex];
  if (!source) return <PlayerAvatar player={player} className={className} />;

  return (
    <span
      className={`player-portrait ${className}`}
      role="img"
      aria-label={`Ilustração artística de ${player.playerName}`}
      data-portrait-state={asset?.approval ?? 'missing'}
    >
      <img
        src={source}
        alt=""
        width="768"
        height="768"
        loading={loading}
        decoding="async"
        style={{ objectPosition: `${asset?.focus.x ?? 50}% ${asset?.focus.y ?? 50}%` }}
        onError={() => setSourceIndex((current) => current + 1)}
      />
    </span>
  );
}
