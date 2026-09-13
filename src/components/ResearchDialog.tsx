import { useEffect, useRef, useState } from 'react';
import { Check, Flag, Send, X } from 'lucide-react';
import type { GameData } from '../data/repository';
import type { AnalyticsTracker, RatingFeedbackReason } from '../game/analytics';
import type { PlayerVersion } from '../game/types';

const feedbackReasons: Array<{ id: RatingFeedbackReason; label: string }> = [
  { id: 'too_high', label: 'Rating alto demais' },
  { id: 'too_low', label: 'Rating baixo demais' },
  { id: 'wrong_champion', label: 'Campeão não representa o jogador' },
  { id: 'wrong_evidence', label: 'Evidência ou estatística incorreta' },
  { id: 'other', label: 'Outro motivo' },
];

export function ResearchDialog({
  player,
  data,
  tracker,
  feedbackEnabled = false,
  close,
}: {
  player: PlayerVersion | null;
  data: GameData;
  tracker?: AnalyticsTracker;
  feedbackEnabled?: boolean;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [feedbackGame, setFeedbackGame] = useState<number | null>(null);
  const [reason, setReason] = useState<RatingFeedbackReason | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function openFeedback(game: number) {
    setFeedbackGame(game);
    setReason(null);
    setNote('');
    setStatus('idle');
  }

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!player || !tracker || !reason || feedbackGame === null || status === 'sending') return;
    const slot = player.championPool.find((candidate) => candidate.game === feedbackGame);
    if (!slot) return;
    setStatus('sending');
    const sent = await tracker.submitRatingFeedback({
      player_id: player.id,
      worlds_year: player.worldsYear,
      role: player.role,
      game: slot.game,
      champion_id: slot.championId,
      displayed_rating: slot.rating,
      reason,
      note,
    });
    setStatus(sent ? 'sent' : 'error');
  }
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
        menos peso. Uma mesma transformação aproxima as escalas entre as nove edições.
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
              {feedbackEnabled && tracker && feedbackGame !== slot.game && (
                <button
                  className="rating-feedback-trigger"
                  type="button"
                  onClick={() => openFeedback(slot.game)}
                >
                  <Flag size={13} /> Discorda deste rating?
                </button>
              )}
              {feedbackEnabled && tracker && feedbackGame === slot.game && status === 'sent' && (
                <p className="rating-feedback-sent" role="status">
                  <Check size={14} /> Revisão registrada para o G{slot.game}. Obrigado.
                </p>
              )}
              {feedbackEnabled && tracker && feedbackGame === slot.game && status !== 'sent' && (
                <form className="rating-feedback-form" onSubmit={submitFeedback}>
                  <fieldset>
                    <legend>Por que este rating deveria ser revisado?</legend>
                    {feedbackReasons.map((option) => (
                      <label key={option.id}>
                        <input
                          type="radio"
                          name={`rating-feedback-${slot.game}`}
                          value={option.id}
                          checked={reason === option.id}
                          onChange={() => setReason(option.id)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </fieldset>
                  <label className="rating-feedback-note">
                    <span>Observação opcional</span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      maxLength={300}
                      rows={2}
                      placeholder="Não inclua nome, e-mail ou outro dado pessoal."
                    />
                  </label>
                  {status === 'error' && (
                    <p className="rating-feedback-error" role="alert">
                      Não foi possível enviar agora. Tente novamente mais tarde.
                    </p>
                  )}
                  <div>
                    <button
                      className="rating-feedback-cancel"
                      type="button"
                      onClick={() => setFeedbackGame(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="rating-feedback-submit"
                      type="submit"
                      disabled={!reason || status === 'sending'}
                    >
                      <Send size={13} /> {status === 'sending' ? 'Enviando' : 'Enviar revisão'}
                    </button>
                  </div>
                </form>
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
