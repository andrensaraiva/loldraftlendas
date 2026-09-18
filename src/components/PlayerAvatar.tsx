import type { PlayerVersion } from '../game/types';

export function PlayerAvatar({
  player,
  className = '',
}: {
  player: PlayerVersion;
  className?: string;
}) {
  return (
    <span
      className={`player-avatar avatar-${player.role.toLowerCase()} ${className}`}
      role="img"
      aria-label={`Avatar estilizado de ${player.playerName}`}
    >
      <span className="avatar-sun" />
      <span className="avatar-head" />
      <span className="avatar-body" />
      <span className="avatar-mark" aria-hidden="true">
        {player.playerName.charAt(0).toUpperCase()}
      </span>
    </span>
  );
}
