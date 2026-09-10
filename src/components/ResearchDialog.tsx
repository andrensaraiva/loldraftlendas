import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { GameData } from '../data/repository';
import type { PlayerVersion } from '../game/types';

export function ResearchDialog({
  player,
  data,
  close,
}: {
  player: PlayerVersion | null;
  data: GameData;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="help-dialog research-dialog"
      aria-labelledby="research-dialog-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <button className="icon-button close-help" aria-label="Fechar detalhes" onClick={close}>
        <X />
      </button>
      <span className="eyebrow green">HISTÓRIA E ESTATÍSTICA</span>
      <h2 id="research-dialog-title">
        {player ? `${player.playerName} · ${player.worldsYear}` : 'Como calculamos?'}
      </h2>
      {player && (
        <p>
          {player.teamName ?? player.team} · {player.historicalLeague ?? player.region} ·{' '}
          {player.worldsStats?.games} jogos no Worlds
        </p>
      )}
      {player?.worldsStats && (
        <p>
          Worlds: WR {Math.round(player.worldsStats.winRate * 100)}% · KDA{' '}
          {player.worldsStats.kda.toFixed(1)}
        </p>
      )}
      <p>
        O rating de 70 a 99 compara o desempenho histórico por posição. Amostras pequenas recebem
        menos peso. Uma mesma transformação aproxima as escalas entre as sete edições.
      </p>
      <p>
        Os cinco campeões foram jogados pelo atleta: priorizamos os mais usados no Worlds, em ordem
        de estreia. Quando faltam opções, consultamos a temporada daquele ano.
      </p>
      {player && (
        <div className="evidence-slots">
          {player.championPool.map((slot) => (
            <div key={slot.game}>
              <b>
                G{slot.game} · {data.champions[slot.championId].name} <strong>{slot.rating}</strong>
              </b>
              <p>
                {slot.stats?.games} jogos · WR {Math.round((slot.stats?.winRate ?? 0) * 100)}% · KDA{' '}
                {slot.stats?.kda?.toFixed(1) ?? 'indisponível'} · confiança{' '}
                {Math.round((slot.stats?.confidence ?? 0) * 100)}%
              </p>
              <small>
                {slot.source === 'WORLDS_DATA'
                  ? 'Worlds · evento principal'
                  : 'Temporada · evidência complementar'}{' '}
                · histórico {slot.historicalScore?.toFixed(1)}
              </small>
              {slot.stats?.confidence === 0 && (
                <small>
                  Evidência parcial: comprova a escolha, sem estimar desempenho específico do
                  campeão.
                </small>
              )}
              {slot.stats && (
                <a href={slot.stats.sourceUrl} target="_blank" rel="noreferrer">
                  Consultar fonte ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      <details>
        <summary>Limites do modelo</summary>
        <p>
          Rating é uma estimativa para o jogo, não uma medida objetiva de quem venceria entre eras.
          O histórico é real; resultados e KDA da simulação são fictícios. A força usa 80% de
          ratings e 20% de composição.
        </p>
        <p>
          Fontes: Oracle’s Elixir e Games of Legends. Arte: Riot Games, por patch histórico. Sem
          vínculo ou endosso da Riot.
        </p>
      </details>
      <button className="primary full" onClick={close}>
        Voltar ao draft
      </button>
    </dialog>
  );
}
