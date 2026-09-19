import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { championArt } from '../data/art';
import type { GameData } from '../data/repository';
import type { PlayerVersion, Role } from '../game/types';
import { PlayerPortrait } from './PlayerPortrait';

const roleLabel: Record<Role, string> = {
  TOP: 'TOP',
  JUNGLE: 'JG',
  MID: 'MID',
  ADC: 'ADC',
  SUPPORT: 'SUP',
};

export function PlayerCard({
  player,
  data,
  onPick,
  onDetails,
  index,
  selected,
  disabled,
  showRatings = true,
}: {
  player: PlayerVersion;
  data: GameData;
  onPick: () => void;
  onDetails: () => void;
  index: number;
  selected: boolean;
  disabled: boolean;
  showRatings?: boolean;
}) {
  return (
    <article
      className={`player-card ${selected ? 'is-picked' : ''}`}
      aria-label={`${player.playerName}, ${player.team}, ${player.worldsYear}`}
      style={{ animationDelay: `${index * 65}ms` }}
    >
      <div className="player-info">
        <div className="player-title">
          <div>
            <h2 title={player.playerName}>{player.playerName}</h2>
            <p>
              {player.team} <span>·</span> Worlds {player.worldsYear}
            </p>
          </div>
          <span className="pick-arrow" aria-hidden="true">
            <ArrowUpRight size={23} />
          </span>
        </div>
        <div className="player-art">
          <PlayerPortrait player={player} loading={index === 0 ? 'eager' : 'lazy'} />
          <span className="card-team">
            {player.team}
            <span>{player.worldsYear}</span>
          </span>
          <span className="card-role">{roleLabel[player.role]}</span>
          <span className="art-caption">ILUSTRAÇÃO ARTÍSTICA · PERFIL DE JOGADOR</span>
        </div>
        <div className="profile-label">
          <span /> {player.profile}
        </div>
        <div className="pool-label">
          <span>POOL DA SÉRIE</span>
          <span>FIXO · G1 → G5</span>
        </div>
        <div className="champion-pool">
          {player.championPool.map((slot) => {
            const champion = data.champions[slot.championId];
            return (
              <div key={slot.game} className="pool-slot">
                <span>G{slot.game}</span>
                <img
                  src={championArt(champion, player.worldsYear).image}
                  alt=""
                  width="64"
                  height="64"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <b aria-label={showRatings ? `Rating ${slot.rating}` : 'Rating oculto no Almanaque'}>
                  {showRatings ? slot.rating : '?'}
                </b>
                <small title={champion.name}>{champion.name}</small>
              </div>
            );
          })}
        </div>
        <div className="player-card-actions">
          <button
            type="button"
            className="primary player-pick-button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={onPick}
          >
            {selected ? 'Lenda escalada' : 'Escalar esta lenda'}
            <ArrowRight size={17} />
          </button>
          <button
            type="button"
            className="player-details text-button"
            onClick={onDetails}
            disabled={disabled}
            aria-label={`Detalhes de ${player.playerName}`}
          >
            Histórico e estatísticas <ArrowUpRight size={12} />
          </button>
        </div>
      </div>
    </article>
  );
}
