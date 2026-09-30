import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, Swords, Trophy } from 'lucide-react';
import { PlayerChoiceCarousel } from '../components/PlayerChoiceCarousel';
import { LocalDataRepository } from '../data/repository';
import type { GameData } from '../data/repository';
import { GAME_PLANS, gamePlanLabel, isGamePlan } from '../game/plan';
import type { GamePlan } from '../game/plan';
import type { DraftRound, PlayerVersion } from '../game/types';
import {
  cancelOnlineDuelRoom,
  createOnlineDuelRoom,
  getOnlineDuelRoom,
  joinOnlineDuelRoom,
  onlineDuelAvailable,
  submitOnlineDuelTeam,
} from './api';
import { completedOnlineDuel, onlineDuelRounds } from './room';
import type { OnlineDuelRoom } from './room';
import '../duel/duel.css';
import './online.css';

const repository = new LocalDataRepository();
const ResearchDialog = lazy(() =>
  import('../components/ResearchDialog').then((module) => ({ default: module.ResearchDialog })),
);

type DraftProgress = { picks: string[]; plan: GamePlan | null };
const emptyProgress = (): DraftProgress => ({ picks: [], plan: null });
const codePattern = /^[0-9A-F]{12}$/;

function hashCode(): string {
  try {
    return decodeURIComponent(window.location.hash.slice(1)).trim().toUpperCase();
  } catch {
    return window.location.hash.slice(1).trim().toUpperCase();
  }
}

function progressKey(code: string): string {
  return `draft-lendas.online-duel.${code}`;
}

function savedProgress(code: string, rounds: DraftRound[]): DraftProgress {
  try {
    const raw = window.localStorage.getItem(progressKey(code));
    if (!raw) return emptyProgress();
    const value = JSON.parse(raw) as DraftProgress;
    if (
      !Array.isArray(value.picks) ||
      value.picks.length > 5 ||
      !value.picks.every(
        (id, index) =>
          typeof id === 'string' && rounds[index].options.some((player) => player.id === id),
      ) ||
      !(value.plan === null || isGamePlan(value.plan)) ||
      (value.plan !== null && value.picks.length !== 5)
    )
      return emptyProgress();
    return value;
  } catch {
    return emptyProgress();
  }
}

function inviteUrl(code: string): string {
  const url = new URL('/duelo/sala', window.location.origin);
  url.hash = code;
  return url.toString();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Não foi possível atualizar a sala.';
}

export default function OnlineDuelApp() {
  const [code, setCode] = useState(hashCode);
  const [entryCode, setEntryCode] = useState('');
  const [room, setRoom] = useState<OnlineDuelRoom | null>(null);
  const [data, setData] = useState<GameData | null>(null);
  const [rounds, setRounds] = useState<DraftRound[] | null>(null);
  const [progress, setProgress] = useState<DraftProgress>(emptyProgress);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(codePattern.test(code)));
  const [lookupFailed, setLookupFailed] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [pollError, setPollError] = useState('');
  const [copied, setCopied] = useState(false);
  const [details, setDetails] = useState<PlayerVersion | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    document.title = 'Sala por convite — Draft Lendas';
    const onHashChange = () => setCode(hashCode());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    setRoom(null);
    setData(null);
    setRounds(null);
    setProgress(emptyProgress());
    setError('');
    setLoadError('');
    setPollError('');
    setLookupFailed(false);
    setCopied(false);
    setDetails(null);
    if (!onlineDuelAvailable() || !codePattern.test(code)) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getOnlineDuelRoom(code)
      .then((current) => {
        if (active) setRoom(current);
      })
      .catch((cause) => {
        if (active) {
          setError(errorMessage(cause));
          setLookupFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [code]);

  useEffect(() => {
    if (!room || rounds || !['waiting_guest', 'drafting', 'complete'].includes(room.state)) return;
    let active = true;
    setLoading(true);
    setLoadError('');
    repository
      .loadYears(room.offers.map((offer) => offer.year))
      .then((loaded) => {
        const loadedRounds = onlineDuelRounds(room, loaded);
        if (!active) return;
        setData(loaded);
        setRounds(loadedRounds);
        setProgress(
          room.myPicks
            ? { picks: room.myPicks, plan: room.myPlan }
            : savedProgress(room.code, loadedRounds),
        );
      })
      .catch((cause) => {
        if (active) setLoadError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [room?.code, room?.datasetVersion, rounds]);

  useEffect(() => {
    if (!room || !rounds || room.myPicks) return;
    try {
      window.localStorage.setItem(progressKey(room.code), JSON.stringify(progress));
    } catch {
      // The draft remains available in memory when browser storage is blocked.
    }
  }, [room?.code, rounds, progress, room?.myPicks]);

  useEffect(() => {
    if (!room || ['complete', 'cancelled', 'expired'].includes(room.state)) return;
    let active = true;
    let requesting = false;
    const interval = window.setInterval(() => {
      if (requesting) return;
      requesting = true;
      getOnlineDuelRoom(room.code)
        .then((current) => {
          if (!active) return;
          if (current) {
            setRoom((previous) => {
              if (previous?.code !== current.code) return previous;
              if (['complete', 'cancelled', 'expired'].includes(previous.state)) return previous;
              if (previous.myPicks && !current.myPicks) return previous;
              return current;
            });
            setPollError('');
          } else setPollError('Sua sessão não consegue mais acessar esta sala.');
        })
        .catch((cause) => {
          if (active) setPollError(errorMessage(cause));
        })
        .finally(() => {
          requesting = false;
        });
    }, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [room?.code, room?.state]);

  const stage = !onlineDuelAvailable()
    ? 'unavailable'
    : code && !codePattern.test(code)
      ? 'invalid'
      : loading && !room
        ? 'loading'
        : !code
          ? 'create'
          : lookupFailed && !room
            ? 'lookup-error'
            : !room
              ? 'join'
              : room.state === 'cancelled' || room.state === 'expired'
                ? room.state
                : room.state === 'complete'
                  ? data
                    ? 'complete'
                    : loadError
                      ? 'load-error'
                      : 'loading'
                  : room.myPicks
                    ? 'submitted'
                    : !rounds
                      ? loadError
                        ? 'load-error'
                        : 'loading'
                      : progress.picks.length < 5
                        ? 'draft'
                        : progress.plan === null
                          ? 'plan'
                          : 'review';

  useEffect(() => {
    titleRef.current?.focus();
  }, [stage, progress.picks.length]);

  function navigateToCode(next: string) {
    window.history.replaceState(null, '', next ? `/duelo/sala#${next}` : '/duelo/sala');
    setCode(next);
    setRoom(null);
    setData(null);
    setRounds(null);
    setProgress(emptyProgress());
    setError('');
    setLoadError('');
    setPollError('');
    setLookupFailed(false);
    setCopied(false);
  }

  async function run(action: () => Promise<void>) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setBusy(true);
    setError('');
    setPollError('');
    try {
      await action();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      pendingRef.current = false;
      setBusy(false);
    }
  }

  function enterCode() {
    const next = entryCode.trim().toUpperCase();
    if (!codePattern.test(next)) {
      setError('O código precisa ter 12 caracteres de 0 a 9 ou A a F.');
      return;
    }
    navigateToCode(next);
  }

  const currentRound = stage === 'draft' ? rounds?.[progress.picks.length] : null;
  const result = room?.state === 'complete' && data ? completedOnlineDuel(room, data) : null;
  const myIndex = room?.seat === 'host' ? 0 : 1;
  const catalogChanged =
    loadError.includes('catálogo incompatível') ||
    loadError.includes('Jogadores da sala incompatíveis') ||
    loadError.includes('Grupo da sala indisponível');
  const visibleError = loadError || error || pollError;

  return (
    <main className="duel-page">
      <header className="duel-header">
        <a href="/duelo" className="duel-back">
          <ArrowLeft size={18} /> Duelo local
        </a>
        <span>SALA ONLINE · 2 JOGADORES</span>
      </header>
      <div className="duel-content online-content">
        {stage === 'unavailable' && (
          <section className="duel-intro">
            <span className="duel-eyebrow">CONVITES ONLINE</span>
            <h1 tabIndex={-1} ref={titleRef}>
              Convites indisponíveis.
            </h1>
            <p>
              Esta opção será liberada depois da configuração e validação da sala compartilhada.
            </p>
            <a className="duel-primary" href="/duelo">
              Jogar duelo local <ArrowRight size={18} />
            </a>
          </section>
        )}
        {stage === 'invalid' && (
          <section className="duel-intro">
            <span className="duel-eyebrow">CONVITE</span>
            <h1 tabIndex={-1} ref={titleRef}>
              Código inválido.
            </h1>
            <p>Confira o convite recebido. O código tem 12 caracteres.</p>
            <button className="duel-primary" onClick={() => navigateToCode('')}>
              Voltar
            </button>
          </section>
        )}
        {stage === 'loading' && (
          <p className="duel-loading" role="status">
            Carregando sala…
          </p>
        )}
        {(stage === 'lookup-error' || stage === 'load-error') && (
          <section className="duel-intro">
            <span className="duel-eyebrow">SALA ONLINE</span>
            <h1 tabIndex={-1} ref={titleRef}>
              {catalogChanged ? 'Versão da sala indisponível.' : 'Não foi possível abrir a sala.'}
            </h1>
            <p>
              {catalogChanged
                ? 'O catálogo do jogo mudou desde a criação deste convite. Crie uma nova sala para jogar com a versão atual.'
                : 'Confira sua conexão e tente novamente.'}
            </p>
            {catalogChanged ? (
              <button
                className="duel-primary"
                disabled={busy}
                onClick={() => run(async () => navigateToCode(await createOnlineDuelRoom()))}
              >
                Criar nova sala <ArrowRight size={18} />
              </button>
            ) : (
              <button className="duel-primary" onClick={() => window.location.reload()}>
                Tentar novamente <ArrowRight size={18} />
              </button>
            )}
          </section>
        )}
        {stage === 'create' && (
          <section className="duel-intro">
            <span className="duel-eyebrow">
              <Swords size={18} /> DUELO ONLINE POR CONVITE
            </span>
            <h1 tabIndex={-1} ref={titleRef}>
              Sua sala.
              <br />
              <em>Sua final.</em>
            </h1>
            <p>
              Crie um convite para outra pessoa. Cada um monta sua equipe no próprio aparelho a
              partir das mesmas ofertas. O resultado aparece quando os dois enviarem.
            </p>
            <p>A sala expira em sete dias. Guarde este navegador para retomar a partida.</p>
            <button
              className="duel-primary"
              disabled={busy}
              onClick={() => run(async () => navigateToCode(await createOnlineDuelRoom()))}
            >
              {busy ? 'Criando sala…' : 'Criar sala'} <ArrowRight size={18} />
            </button>
            <div className="online-enter">
              <label htmlFor="online-code">Já recebeu um código?</label>
              <div>
                <input
                  id="online-code"
                  maxLength={12}
                  autoComplete="off"
                  spellCheck={false}
                  value={entryCode}
                  onChange={(event) => setEntryCode(event.target.value.toUpperCase())}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') enterCode();
                  }}
                  placeholder="12 caracteres"
                />
                <button onClick={enterCode}>Abrir convite</button>
              </div>
            </div>
          </section>
        )}
        {stage === 'join' && (
          <section className="duel-intro">
            <span className="duel-eyebrow">CONVITE · {code}</span>
            <h1 tabIndex={-1} ref={titleRef}>
              Entrar na sala.
            </h1>
            <p>
              Ao entrar, este navegador ocupa a segunda vaga. Sua equipe só será revelada quando os
              dois enviarem suas escolhas.
            </p>
            <button
              className="duel-primary"
              disabled={busy}
              onClick={() => run(async () => setRoom(await joinOnlineDuelRoom(code)))}
            >
              {busy ? 'Entrando…' : 'Entrar no duelo'} <ArrowRight size={18} />
            </button>
            <button className="duel-exit" onClick={() => navigateToCode('')}>
              Voltar
            </button>
          </section>
        )}
        {room && !['cancelled', 'expired'].includes(room.state) && (
          <aside className="online-room" aria-label="Convite da sala">
            <div>
              <small>SALA · {room.seat === 'host' ? 'ANFITRIÃO' : 'CONVIDADO'}</small>
              <strong>{room.code}</strong>
              <small>Expira em {new Date(room.expiresAt).toLocaleDateString('pt-BR')}</small>
            </div>
            <div className="online-room-actions">
              <button
                onClick={() =>
                  run(async () => {
                    await navigator.clipboard.writeText(inviteUrl(room.code));
                    setCopied(true);
                  })
                }
              >
                <Copy size={16} /> {copied ? 'Copiado' : 'Copiar convite'}
              </button>
              <button
                onClick={() =>
                  run(async () => {
                    const current = await getOnlineDuelRoom(room.code);
                    if (current) setRoom(current);
                  })
                }
                disabled={busy}
              >
                Atualizar
              </button>
            </div>
          </aside>
        )}
        {room && stage === 'draft' && currentRound && rounds && data && (
          <section className="duel-draft draft-screen" aria-labelledby="online-draft-title">
            <div className="duel-heading">
              <span className="duel-eyebrow">
                SUA EQUIPE · ESCOLHA {progress.picks.length + 1} DE 5
              </span>
              <h1 id="online-draft-title" tabIndex={-1} ref={titleRef}>
                Escolha seu {currentRound.role}.
              </h1>
              <p>
                Worlds {currentRound.year} · {currentRound.region.label}. Seu adversário recebe as
                mesmas três ofertas.
              </p>
            </div>
            <div
              className="duel-progress"
              aria-label={`${progress.picks.length} de 5 posições preenchidas`}
            >
              {rounds.map((offer, index) => (
                <span key={offer.role} className={index <= progress.picks.length ? 'active' : ''}>
                  {offer.role}
                </span>
              ))}
            </div>
            <PlayerChoiceCarousel
              key={`${room.code}-${progress.picks.length}`}
              options={currentRound.options}
              data={data}
              selectedId={null}
              disabled={busy}
              rolling={false}
              showRatings
              onPick={(player) =>
                setProgress((current) =>
                  current.picks.length === progress.picks.length
                    ? { picks: [...current.picks, player.id], plan: null }
                    : current,
                )
              }
              onDetails={setDetails}
            />
            {progress.picks.length > 0 && (
              <button
                className="duel-exit"
                onClick={() =>
                  setProgress((current) => ({ picks: current.picks.slice(0, -1), plan: null }))
                }
              >
                Desfazer última escolha
              </button>
            )}
          </section>
        )}
        {room && stage === 'plan' && rounds && (
          <section className="duel-plan">
            <span className="duel-eyebrow">SUA EQUIPE COMPLETA</span>
            <h1 tabIndex={-1} ref={titleRef}>
              Como sua equipe vai jogar?
            </h1>
            <div className="duel-roster">
              {progress.picks.map((id, index) => {
                const player = rounds[index].options.find((option) => option.id === id)!;
                return (
                  <span key={id}>
                    <small>{player.role}</small>
                    <b>{player.playerName}</b>
                    <small>{player.worldsYear}</small>
                  </span>
                );
              })}
            </div>
            <div className="duel-plan-grid">
              {GAME_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setProgress((current) => ({ ...current, plan: plan.id }))}
                >
                  <b>{plan.label}</b>
                  <span>{plan.description}</span>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
            <button
              className="duel-exit"
              onClick={() =>
                setProgress((current) => ({ picks: current.picks.slice(0, -1), plan: null }))
              }
            >
              Rever última escolha
            </button>
          </section>
        )}
        {room && stage === 'review' && rounds && (
          <section className="duel-plan">
            <span className="duel-eyebrow">REVISÃO · SUA ENTREGA É DEFINITIVA</span>
            <h1 tabIndex={-1} ref={titleRef}>
              Pronto para enviar?
            </h1>
            <div className="duel-roster">
              {progress.picks.map((id, index) => {
                const player = rounds[index].options.find((option) => option.id === id)!;
                return (
                  <span key={id}>
                    <small>{player.role}</small>
                    <b>{player.playerName}</b>
                    <small>{player.worldsYear}</small>
                  </span>
                );
              })}
            </div>
            <p>
              Plano: <b>{gamePlanLabel(progress.plan)}</b>. Depois do envio, sua equipe não poderá
              ser alterada.
            </p>
            <button
              className="duel-primary"
              disabled={busy}
              onClick={() =>
                run(async () =>
                  setRoom(await submitOnlineDuelTeam(room.code, progress.picks, progress.plan!)),
                )
              }
            >
              {busy ? 'Enviando…' : 'Enviar equipe'} <ArrowRight size={18} />
            </button>
            <button
              className="duel-exit"
              onClick={() => setProgress((current) => ({ ...current, plan: null }))}
            >
              Rever plano
            </button>
          </section>
        )}
        {room && stage === 'submitted' && (
          <section className="duel-handoff">
            <span className="duel-eyebrow">EQUIPE ENVIADA</span>
            <h1 tabIndex={-1} ref={titleRef}>
              Aguardando adversário.
            </h1>
            <p>
              Sua equipe foi recebida. O resultado aparecerá aqui quando a outra pessoa enviar a
              dela. Você pode fechar esta página e voltar pelo mesmo convite neste navegador.
            </p>
            <p className="online-status" role="status">
              Anfitrião: {room.hostReady ? 'enviou' : 'montando'} · Convidado:{' '}
              {room.guestReady ? 'enviou' : 'montando'}
            </p>
          </section>
        )}
        {room && stage === 'complete' && result && (
          <section className="duel-result">
            <span className="duel-eyebrow">
              <Trophy size={18} /> MELHOR DE CINCO · FINAL
            </span>
            <h1 tabIndex={-1} ref={titleRef}>
              {result.winner === myIndex ? 'Você venceu.' : 'Seu adversário venceu.'}
            </h1>
            <p className="duel-score">
              {result.score[0]} <span>×</span> {result.score[1]}
            </p>
            <p>
              Placar: anfitrião × convidado. A série é calculada das escolhas e da seed
              compartilhada.
            </p>
            <div className="duel-result-teams">
              {result.teams.map((team, index) => (
                <div key={index}>
                  <h2>
                    {index === 0 ? 'Anfitrião' : 'Convidado'}
                    {index === myIndex ? ' · você' : ''}
                  </h2>
                  <small>
                    Plano: {gamePlanLabel(index === 0 ? room.hostPlan : room.guestPlan)}
                  </small>
                  <ul>
                    {team.map((player) => (
                      <li key={player.id}>
                        <b>{player.role}</b> {player.playerName}{' '}
                        <small>· {player.worldsYear}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <h2>Jogos da série</h2>
            <ol className="duel-games">
              {result.games.map((game) => (
                <li key={game.game}>
                  <b>
                    G{game.game} · {game.won ? 'Anfitrião' : 'Convidado'}
                  </b>
                  <span>
                    {game.strength.toFixed(1)} × {game.opponentStrength.toFixed(1)} de força
                  </span>
                  <small>Chance do anfitrião: {Math.round(game.probability * 100)}%</small>
                </li>
              ))}
            </ol>
            <button
              className="duel-primary"
              disabled={busy}
              onClick={() => run(async () => navigateToCode(await createOnlineDuelRoom()))}
            >
              Criar nova sala <ArrowRight size={18} />
            </button>
          </section>
        )}
        {(stage === 'cancelled' || stage === 'expired') && (
          <section className="duel-intro">
            <span className="duel-eyebrow">SALA ENCERRADA</span>
            <h1 tabIndex={-1} ref={titleRef}>
              {stage === 'expired' ? 'Convite vencido.' : 'Sala cancelada.'}
            </h1>
            <p>Esta sala não aceita novas entradas ou equipes.</p>
            <button
              className="duel-primary"
              disabled={busy}
              onClick={() => run(async () => navigateToCode(await createOnlineDuelRoom()))}
            >
              Criar nova sala <ArrowRight size={18} />
            </button>
          </section>
        )}
        {visibleError && (
          <p className="duel-error" role="alert">
            {visibleError}
          </p>
        )}
        {room && !['cancelled', 'expired', 'complete'].includes(room.state) && (
          <button
            className="duel-exit"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Cancelar esta sala para os dois jogadores?'))
                run(async () => setRoom(await cancelOnlineDuelRoom(room.code)));
            }}
          >
            Cancelar sala
          </button>
        )}
      </div>
      {details && data && (
        <Suspense fallback={null}>
          <ResearchDialog player={details} data={data} close={() => setDetails(null)} />
        </Suspense>
      )}
    </main>
  );
}
