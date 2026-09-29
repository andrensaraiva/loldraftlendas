import { Suspense, lazy, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Swords, Trophy } from 'lucide-react';
import { PlayerChoiceCarousel } from '../components/PlayerChoiceCarousel';
import { LocalDataRepository } from '../data/repository';
import type { GameData } from '../data/repository';
import {
  DUEL_SAVE_KEY,
  DUEL_SAVE_VERSION,
  chooseDuelPlan,
  continueDuel,
  duelDraftPlan,
  duelRounds,
  newDuel,
  pickDuelPlayer,
  simulateDuel,
  validDuel,
} from '../game/duel';
import type { DuelState } from '../game/duel';
import { GAME_PLANS, gamePlanLabel } from '../game/plan';
import { createCampaignSeed, isCampaignSeed } from '../game/random';
import type { DraftRound, PlayerVersion } from '../game/types';
import './duel.css';

const repository = new LocalDataRepository();
const datasetVersion = repository.catalog.draftRegionManifest.datasetVersion;
const ResearchDialog = lazy(() =>
  import('../components/ResearchDialog').then((module) => ({ default: module.ResearchDialog })),
);

function readSavedDuel(): DuelState | null {
  try {
    const raw = window.localStorage.getItem(DUEL_SAVE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<DuelState>;
    return value.version === DUEL_SAVE_VERSION &&
      value.datasetVersion === datasetVersion &&
      isCampaignSeed(value.seed)
      ? (value as DuelState)
      : null;
  } catch {
    return null;
  }
}

function saveDuel(state: DuelState | null) {
  try {
    if (state) window.localStorage.setItem(DUEL_SAVE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(DUEL_SAVE_KEY);
  } catch {
    // The duel still works in memory if browser storage is unavailable.
  }
}

export default function DuelApp() {
  const [duel, setDuel] = useState<DuelState | null>(readSavedDuel);
  const [data, setData] = useState<GameData | null>(null);
  const [rounds, setRounds] = useState<DraftRound[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState<PlayerVersion | null>(null);

  useEffect(() => {
    document.title = 'Duelo local — Draft Lendas';
  }, []);

  useEffect(() => {
    saveDuel(duel);
  }, [duel]);

  useEffect(() => {
    if (!duel) return;
    let active = true;
    const seed = duel.seed;
    setBusy(true);
    setError('');
    const plan = duelDraftPlan(repository.catalog.draftRegionManifest, seed);
    repository
      .loadYears(plan.map((round) => round.year))
      .then((loaded) => {
        if (!active) return;
        const offers = duelRounds(loaded, seed);
        if (!validDuel(duel, offers, datasetVersion)) {
          setDuel(null);
          setError('O duelo salvo era incompatível e foi descartado. Comece outro duelo.');
          return;
        }
        setData(loaded);
        setRounds(offers);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar as edições do duelo. Tente novamente.');
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [duel?.seed]);

  async function startDuel() {
    if (busy) return;
    setBusy(true);
    setError('');
    const seed = createCampaignSeed();
    try {
      const plan = duelDraftPlan(repository.catalog.draftRegionManifest, seed);
      const loaded = await repository.loadYears(plan.map((round) => round.year));
      const offers = duelRounds(loaded, seed);
      const state = newDuel(seed, datasetVersion);
      if (!validDuel(state, offers, datasetVersion)) throw new Error('Ofertas inválidas.');
      setData(loaded);
      setRounds(offers);
      setDuel(state);
    } catch {
      setError('Não foi possível preparar o duelo. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function resetDuel() {
    if (
      duel?.phase !== 'result' &&
      !window.confirm('Encerrar este duelo e apagar o progresso local?')
    )
      return;
    setDuel(null);
    setData(null);
    setRounds(null);
    setDetails(null);
    setError('');
  }

  const ready = Boolean(duel && data && rounds && !busy);
  const step = duel?.picks[duel.turn].length ?? 0;
  const round = duel?.phase === 'draft' ? rounds?.[step] : null;
  const result = ready && duel?.phase === 'result' ? simulateDuel(duel, data!, rounds!) : null;

  return (
    <main className="duel-page">
      <header className="duel-header">
        <a href="/" className="duel-back">
          <ArrowLeft size={18} /> Draft Lendas
        </a>
        <span>DUELO LOCAL · 2 JOGADORES</span>
      </header>
      <div className="duel-content">
        {!duel && (
          <section className="duel-intro">
            <span className="duel-eyebrow">
              <Swords size={18} /> MULTIPLAYER LOCAL
            </span>
            <h1>
              Dois drafts.
              <br />
              <em>Uma final.</em>
            </h1>
            <p>
              Joguem no mesmo aparelho. Cada pessoa monta cinco lendas a partir das mesmas ofertas,
              escolhe um plano e disputa uma série melhor de cinco.
            </p>
            <ol>
              <li>Jogador 1 escala sua equipe.</li>
              <li>Passe o aparelho para o Jogador 2.</li>
              <li>Revelem o confronto e disputem a série.</li>
            </ol>
            <button className="duel-primary" onClick={startDuel} disabled={busy}>
              {busy ? 'Preparando ofertas…' : 'Começar duelo'} <ArrowRight size={20} />
            </button>
          </section>
        )}
        {error && (
          <p className="duel-error" role="alert">
            {error}
          </p>
        )}
        {duel && !ready && !error && (
          <p className="duel-loading" role="status">
            Carregando duelo…
          </p>
        )}
        {ready && duel?.phase === 'handoff' && (
          <section className="duel-handoff">
            <span className="duel-eyebrow">TROCA DE JOGADOR</span>
            <h1>Agora é a vez do Jogador 2.</h1>
            <p>Entregue o aparelho. As escolhas do Jogador 1 ficam ocultas até o resultado.</p>
            <button className="duel-primary" onClick={() => setDuel(continueDuel(duel))}>
              Sou o Jogador 2 <ArrowRight size={19} />
            </button>
          </section>
        )}
        {ready && duel?.phase === 'draft' && round && data && rounds && (
          <section className="duel-draft draft-screen" aria-labelledby="duel-draft-title">
            <div className="duel-heading">
              <span className="duel-eyebrow">
                JOGADOR {duel.turn + 1} · ESCOLHA {step + 1} DE 5
              </span>
              <h1 id="duel-draft-title">Escolha seu {round.role}.</h1>
              <p>
                Worlds {round.year} · {round.region.label}. As mesmas três ofertas aparecem para os
                dois jogadores.
              </p>
            </div>
            <div className="duel-progress" aria-label={`${step} de 5 posições preenchidas`}>
              {rounds.map((offer, index) => (
                <span key={offer.role} className={index <= step ? 'active' : ''}>
                  {offer.role}
                </span>
              ))}
            </div>
            <PlayerChoiceCarousel
              key={`${duel.turn}-${step}`}
              options={round.options}
              data={data}
              selectedId={null}
              disabled={false}
              rolling={false}
              showRatings
              onPick={(player) =>
                setDuel((current) =>
                  current?.phase === 'draft' &&
                  current.turn === duel.turn &&
                  current.picks[current.turn].length === step
                    ? pickDuelPlayer(current, rounds, player.id)
                    : current,
                )
              }
              onDetails={setDetails}
            />
          </section>
        )}
        {ready && duel?.phase === 'plan' && rounds && (
          <section className="duel-plan">
            <span className="duel-eyebrow">JOGADOR {duel.turn + 1} · EQUIPE COMPLETA</span>
            <h1>Como sua equipe vai jogar?</h1>
            <div className="duel-roster">
              {duel.picks[duel.turn].map((id, index) => {
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
              O plano combina com as tags dos campeões G1–G5 e altera a força de cada jogo dentro do
              limite do motor.
            </p>
            <div className="duel-plan-grid">
              {GAME_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() =>
                    setDuel((current) =>
                      current?.phase === 'plan' ? chooseDuelPlan(current, plan.id) : current,
                    )
                  }
                >
                  <b>{plan.label}</b>
                  <span>{plan.description}</span>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
          </section>
        )}
        {ready && duel?.phase === 'result' && result && (
          <section className="duel-result">
            <span className="duel-eyebrow">
              <Trophy size={18} /> MELHOR DE CINCO · FINAL
            </span>
            <h1>Jogador {result.winner + 1} venceu.</h1>
            <p className="duel-score">
              {result.score[0]} <span>×</span> {result.score[1]}
            </p>
            <p>
              O placar usa as mesmas escolhas, planos e seed em toda retomada. A chance indica
              favoritismo, não vitória garantida.
            </p>
            <div className="duel-result-teams">
              {result.teams.map((team, index) => (
                <div key={index}>
                  <h2>Jogador {index + 1}</h2>
                  <small>Plano: {gamePlanLabel(duel.plans[index])}</small>
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
                    G{game.game} · Jogador {game.won ? 1 : 2}
                  </b>
                  <span>
                    {game.strength.toFixed(1)} × {game.opponentStrength.toFixed(1)} de força
                  </span>
                  <small>Chance do Jogador 1: {Math.round(game.probability * 100)}%</small>
                </li>
              ))}
            </ol>
            <button className="duel-primary" onClick={resetDuel}>
              Novo duelo <ArrowRight size={18} />
            </button>
          </section>
        )}
        {duel && (
          <button className="duel-exit" onClick={resetDuel}>
            Encerrar duelo
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
