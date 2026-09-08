import { championArt } from '../data/art';
import type { GameData } from '../data/repository';
import type { GameResult, PlayerKda, Team } from '../game/types';
import { Activity, Clock3, Swords } from 'lucide-react';
const kills = (stats: PlayerKda[]) => stats.reduce((sum, p) => sum + p.kills, 0);
function KdaTable({
  team,
  stats,
  title,
  game,
  data,
}: {
  team: Team;
  stats: PlayerKda[];
  title: string;
  game: number;
  data: GameData;
}) {
  return (
    <div className="kda-side">
      <h3>{title}</h3>
      <table className="kda-table">
        <thead>
          <tr>
            <th>Jogador / campeão</th>
            <th>
              <abbr title="Abates">K</abbr>
            </th>
            <th>
              <abbr title="Mortes">D</abbr>
            </th>
            <th>
              <abbr title="Assistências">A</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {team.map((p, i) => {
            const champion = data.champions[p.championPool[game - 1].championId];
            return (
              <tr key={p.id}>
                <td>
                  <img src={championArt(champion, p.worldsYear).image} alt="" />
                  <span>
                    <b>{p.playerName}</b>
                    <small>{champion.name}</small>
                  </span>
                </td>
                <td>{stats[i].kills}</td>
                <td>{stats[i].deaths}</td>
                <td>{stats[i].assists}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
export function MatchReport({
  result,
  team,
  opponent,
  opponentName,
  data,
  momentIndex,
  compact = false,
}: {
  result: GameResult;
  team: Team;
  opponent: Team;
  opponentName: string;
  data: GameData;
  momentIndex: number;
  compact?: boolean;
}) {
  const moment = result.recap.moments[momentIndex];
  const ended = momentIndex === result.recap.moments.length - 1;
  return (
    <div className="match-report" data-moment={momentIndex}>
      <div className="report-heading">
        <span className="eyebrow">
          <Activity size={15} /> G{result.game} ·{' '}
          {ended ? 'PARTIDA ENCERRADA' : 'PARTIDA EM ANDAMENTO'}
        </span>
        <span>
          <Clock3 size={14} />
          {moment.minute}:00
        </span>
      </div>
      <div className="kill-score">
        <span>Suas lendas</span>
        <b>{kills(moment.user)}</b>
        <Swords size={18} />
        <b>{kills(moment.opponent)}</b>
        <span>{opponentName}</span>
      </div>
      <div
        className="match-timebar"
        role="progressbar"
        aria-label="Andamento da partida"
        aria-valuemin={0}
        aria-valuemax={result.recap.duration}
        aria-valuenow={moment.minute}
      >
        <span style={{ width: `${(moment.minute / result.recap.duration) * 100}%` }} />
      </div>
      {ended && (
        <div className={`game-outcome ${result.won ? 'win' : 'loss'}`}>
          <b>{result.won ? 'VITÓRIA' : 'DERROTA'}</b>
          <span>
            Força {result.strength.toFixed(1)} × {result.opponentStrength.toFixed(1)} ·{' '}
            {Math.round(result.probability * 100)}% de chance para suas lendas
          </span>
        </div>
      )}
      {!compact && (
        <>
          <div
            className={`live-moment ${moment.side === 'user' ? 'user-moment' : 'enemy-moment'}`}
            aria-live="polite"
          >
            <span>
              {moment.minute} MIN ·{' '}
              {moment.side === 'user' ? 'SUAS LENDAS' : opponentName.toUpperCase()}
            </span>
            <h3>{moment.title}</h3>
            <p>{moment.description}</p>
          </div>
          <div className="kda-tables">
            <KdaTable
              team={team}
              stats={moment.user}
              title="Suas lendas"
              game={result.game}
              data={data}
            />
            <KdaTable
              team={opponent}
              stats={moment.opponent}
              title={opponentName}
              game={result.game}
              data={data}
            />
          </div>
          <details className="moment-history">
            <summary>Linha do tempo · {momentIndex + 1} acontecimentos</summary>
            <ol>
              {result.recap.moments.slice(0, momentIndex + 1).map((event, i) => (
                <li key={i}>
                  <time>{event.minute}:00</time>
                  <div>
                    <b>{event.title}</b>
                    <p>{event.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
      <p className="simulated-note">
        {compact ? 'O relatório com KDA fica disponível no histórico. ' : ''}Acontecimentos e KDA
        simulados para este protótipo.
      </p>
    </div>
  );
}
