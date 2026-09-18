import {
  DRAFT_CONFIG,
  availableDraftContexts,
  createDraftFromPlan,
  eligiblePools,
  exchangeAlternatives,
  exchangeRound,
  isDraftAvailabilityEligible,
  offerKey,
  planDraft,
} from './game/draft';
import type { Exchange } from './game/draft';
import { clearCampaign, loadCampaign, saveCampaign } from './game/campaign';
import type { CampaignScreen, CampaignState } from './game/campaign';
import {
  CHALLENGE_QUERY_PARAM,
  CHALLENGE_VERSION,
  challengeCode,
  createChallengeUrl,
  decodeChallenge,
} from './game/challenge';
import type { CampaignChallenge } from './game/challenge';
import { analyticsPlayerId, createAnalyticsTracker } from './game/analytics';
import type { AnalyticsProperties } from './game/analytics';
import {
  beginDailyAttempt,
  completeDailyAttempt,
  officialDailyAttempt,
  recentDailyChallenges,
} from './game/daily';
import type { DailyAttemptKind, DailyChallenge } from './game/daily';
import {
  achievementsForCampaign,
  campaignAchievements,
  clearCampaignHistory,
  exportCampaignHistory,
  loadCampaignHistory,
  recordCampaignSummary,
} from './game/history';
import type { CampaignSummary } from './game/history';
import { buildCampaignReport } from './game/report';
import {
  defaultDraftAvailability,
  loadPublicProductConfig,
  safeDraftAvailability,
} from './game/product-config';
import type { DraftAvailability } from './game/draft';
import { canonicalRegionFor } from './game/regions';
import {
  CAMPAIGN_RANDOM_VERSION,
  campaignRandom,
  campaignSeedFromText,
  createCampaignSeed,
} from './game/random';
import { gameModeLabel } from './game/mode';
import type { GameMode } from './game/mode';
import { GAME_PLANS, GAME_PLAN_TAG_LABELS, gamePlanLabel } from './game/plan';
import type { GamePlan } from './game/plan';
import { championArt } from './data/art';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleHelp,
  Flag,
  History,
  House,
  LogOut,
  Menu,
  RotateCcw,
  Trash2,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { LocalDataRepository } from './data/repository';
import type { GameData } from './data/repository';
import { PlayerAvatar } from './components/PlayerAvatar';
import { PlayerChoiceCarousel } from './components/PlayerChoiceCarousel';
import { CampaignExitDialog } from './components/CampaignExitDialog';
import type { CampaignExitAction } from './components/CampaignExitDialog';
import { DRAFT_REGION_GROUP_IDS, ROLES } from './game/types';
import type {
  DraftRegionGroupId,
  DraftRegionManifest,
  DraftRound,
  GameResult,
  PlayerVersion,
  Role,
  Series,
  Team,
  Tournament,
} from './game/types';
import { AutoplayControls } from './components/AutoplayControls';
import type { PlaybackSettings } from './components/AutoplayControls';
import { CampaignShare } from './components/CampaignShare';
import { PwaStatus } from './components/PwaStatus';
import {
  advanceTournament,
  compositionBreakdown,
  createSeries,
  formatFor,
  gamePlanBreakdown,
  newTournament,
  seriesDone,
  seriesScore,
  simulateGame,
  teamStrength,
  validateData,
  winProbability,
} from './game/engine';

const roleLabel: Record<Role, string> = {
  TOP: 'TOP',
  JUNGLE: 'JG',
  MID: 'MID',
  ADC: 'ADC',
  SUPPORT: 'SUP',
};
const draftRegionLabel = (manifest: DraftRegionManifest, group: DraftRegionGroupId) =>
  manifest.groups.flatMap((entry) => entry.groups).find((candidate) => candidate.id === group)
    ?.label ?? group;
const stageLabel = {
  swiss: 'Etapa Suíça',
  quarters: 'Quartas de final',
  semis: 'Semifinal',
  final: 'Grande final',
};
type Screen = 'home' | CampaignScreen;
const repository = new LocalDataRepository();
const catalog = repository.catalog;
const homeData: GameData = {
  players: [catalog.featuredPlayer],
  champions: catalog.champions,
  draftRegionManifest: catalog.draftRegionManifest,
};
const analytics = createAnalyticsTracker();
const buildDailyCatalog = () =>
  recentDailyChallenges(
    new Date(),
    7,
    catalog.draftRegionManifest.datasetVersion,
    defaultDraftAvailability(catalog),
  );
const ResearchDialog = lazy(() =>
  import('./components/ResearchDialog').then((module) => ({ default: module.ResearchDialog })),
);
const CampaignFeedback = lazy(() =>
  import('./components/CampaignFeedback').then((module) => ({ default: module.CampaignFeedback })),
);
const MatchReport = lazy(() =>
  import('./components/MatchReport').then((module) => ({ default: module.MatchReport })),
);
type ReportSelection = { result: GameResult; series: Series };
function draftEventProperties(round: DraftRound): AnalyticsProperties {
  return {
    role: round.role,
    worlds_year: round.year,
    draft_region_group: round.region.id,
    candidate_ids: round.options.map((player) => analyticsPlayerId(player.id)),
  };
}

function challengeFromBrowser(): { challenge: CampaignChallenge | null; invalid: boolean } {
  if (typeof window === 'undefined') return { challenge: null, invalid: false };
  const value = new URL(window.location.href).searchParams.get(CHALLENGE_QUERY_PARAM);
  if (!value) return { challenge: null, invalid: false };
  const challenge = decodeChallenge(value, catalog.draftRegionManifest);
  return { challenge, invalid: !challenge };
}

function dailyDateLabel(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
    .format(new Date(`${date}T12:00:00.000Z`))
    .replace('.', '');
}

function DailyChallengePanel({
  challenges,
  busy,
  revision,
  start,
}: {
  challenges: DailyChallenge[];
  busy: boolean;
  revision: number;
  start: (challenge: DailyChallenge, officialAllowed: boolean) => void;
}) {
  const today = challenges[0];
  const official = officialDailyAttempt(today.id);
  void revision;
  return (
    <section className="daily-challenge" aria-labelledby="daily-challenge-title">
      <div className="daily-heading">
        <span className="daily-icon" aria-hidden="true">
          <CalendarDays size={21} />
        </span>
        <div>
          <span>DESAFIO DIÁRIO · {dailyDateLabel(today.date)}</span>
          <h2 id="daily-challenge-title">Um draft igual para todo mundo.</h2>
        </div>
      </div>
      <p>
        Seed, edições e sorteios fixos no modo Almanaque. Sua primeira entrada de hoje é a tentativa
        oficial deste dispositivo.
      </p>
      <div className="daily-actions">
        <button className="daily-start" onClick={() => start(today, true)} disabled={busy}>
          {busy ? 'Preparando…' : official ? 'Jogar amistosamente' : 'Jogar tentativa oficial'}
          <ArrowRight size={17} />
        </button>
        <span className={`daily-status ${official ? 'used' : ''}`}>
          {official?.completedAt
            ? `Oficial concluída · ${official.outcome}`
            : official
              ? 'Tentativa oficial iniciada'
              : 'Oficial disponível'}
        </span>
      </div>
      <details className="daily-archive">
        <summary>Arquivo dos últimos 7 dias</summary>
        <div>
          {challenges.slice(1).map((challenge) => (
            <button key={challenge.id} onClick={() => start(challenge, false)} disabled={busy}>
              <span>{dailyDateLabel(challenge.date)}</span>
              Jogar amistoso
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}

function LocalHistoryPanel({ revision, changed }: { revision: number; changed: () => void }) {
  const history = loadCampaignHistory();
  const achievements = campaignAchievements(history);
  void revision;

  function downloadHistory() {
    const blob = new Blob([exportCampaignHistory(history)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `draft-lendas-historico-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <details className="local-history">
      <summary>
        <span>
          <History size={18} />
          <b>Seu histórico local</b>
        </span>
        <small>
          {history.length} {history.length === 1 ? 'campanha' : 'campanhas'} · {achievements.length}{' '}
          {achievements.length === 1 ? 'conquista' : 'conquistas'}
        </small>
      </summary>
      <div className="local-history-body">
        {!history.length ? (
          <p>Conclua uma campanha para começar. Nada é enviado ou sincronizado.</p>
        ) : (
          <>
            <div className="history-campaigns">
              {history.slice(0, 5).map((campaign) => (
                <div key={campaign.id}>
                  <span>{new Date(campaign.completedAt).toLocaleDateString('pt-BR')}</span>
                  <b>{campaign.outcome}</b>
                  <small>
                    {campaign.wins}V · {campaign.losses}D ·{' '}
                    {campaign.team.map((p) => p.worldsYear).join(' / ')}
                  </small>
                </div>
              ))}
            </div>
            <div className="history-achievements" aria-label="Conquistas desbloqueadas">
              {achievements.map((achievement) => (
                <span key={achievement.id} title={achievement.description}>
                  {achievement.title}
                </span>
              ))}
            </div>
            <div className="history-actions">
              <button onClick={downloadHistory}>Exportar JSON</button>
              <button
                onClick={() => {
                  if (!window.confirm('Apagar todo o histórico local deste navegador?')) return;
                  clearCampaignHistory();
                  changed();
                }}
              >
                <Trash2 size={13} /> Limpar histórico
              </button>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
function ReportDialog({
  report,
  team,
  data,
  close,
  hideStrength = false,
}: {
  report: ReportSelection;
  team: Team;
  data: GameData;
  close: () => void;
  hideStrength?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="report-dialog"
      aria-labelledby="match-report-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <button className="icon-button close-help" aria-label="Fechar relatório" onClick={close}>
        <X />
      </button>
      <h2 id="match-report-title">Relatório da partida</h2>
      <p>
        {stageLabel[report.series.stage]} · vs. {report.series.opponentName}
      </p>
      <Suspense fallback={<p>Carregando relatório…</p>}>
        <MatchReport
          result={report.result}
          team={team}
          opponent={report.series.opponent}
          opponentName={report.series.opponentName}
          data={data}
          momentIndex={report.result.recap.moments.length - 1}
          hideStrength={hideStrength}
        />
      </Suspense>
    </dialog>
  );
}
function CampaignHistory({
  tournament,
  open,
}: {
  tournament: Tournament;
  open: (report: ReportSelection) => void;
}) {
  if (!tournament.history.length) return null;
  return (
    <div className="history campaign-history" id="campaign-history">
      <h2>Sua campanha</h2>
      <p>Abra qualquer jogo para ver os acontecimentos e o KDA.</p>
      {tournament.history.map((s, i) => {
        const score = seriesScore(s);
        return (
          <div className="campaign-series" key={i}>
            <div className="history-row">
              <span className={`result-dot ${score.wins > score.losses ? 'win' : 'loss'}`}>
                {score.wins > score.losses ? 'V' : 'D'}
              </span>
              <span>
                {stageLabel[s.stage]} <small>BO{s.bestOf}</small>
              </span>
              <b>vs. {s.opponentName}</b>
              <strong>
                {score.wins} – {score.losses}
              </strong>
            </div>
            <div className="history-games">
              {s.games.map((result) => (
                <button
                  key={result.game}
                  className={result.won ? 'win' : 'loss'}
                  onClick={() => open({ result, series: s })}
                >
                  G{result.game} · {result.won ? 'Vitória' : 'Derrota'} <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function Art({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  const [broken, setBroken] = useState(false);
  return broken ? (
    alt ? (
      <span className={`image-fallback ${className}`} role="img" aria-label={alt}>
        <Shield size={28} />
      </span>
    ) : (
      <span className={`image-fallback ${className}`} aria-hidden="true">
        <Shield size={28} />
      </span>
    )
  ) : (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
    />
  );
}
function HowTo({
  close,
  years,
  regionGroups,
}: {
  close: () => void;
  years: number;
  regionGroups: number;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="help-dialog"
      aria-labelledby="how-to-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <button className="icon-button close-help" onClick={close} aria-label="Fechar instruções">
        <X />
      </button>
      <span className="eyebrow">O CAMINHO ATÉ O TÍTULO</span>
      <h2 id="how-to-title">
        Cinco escolhas.
        <br />
        Uma nova história.
      </h2>
      <ol className="instructions">
        <li>
          <b>Escolha suas lendas.</b>
          <p>
            Sorteie um ano e uma região. Use até três trocas ao longo do draft. Clique em um jogador
            para escalá-lo e avançar.
          </p>
          <p>
            No Clássico, ratings e força ficam visíveis. No Almanaque, essa orientação numérica só
            aparece depois do resultado final; o cálculo da campanha não muda.
          </p>
        </li>
        <li>
          <b>Pense além do primeiro jogo.</b>
          <p>
            Os campeões são fixos: G1 no jogo 1, G2 no jogo 2 e assim por diante. Cada série
            reinicia no G1.
          </p>
          <p>
            Depois das cinco escolhas, defina Agressão, Teamfight, Controle/Pick ou Escala. O plano
            permanece por toda a campanha e combina com as tags mostradas na equipe.
          </p>
        </li>
        <li>
          <b>Sobreviva ao Suíço.</b>
          <p>
            Três vitórias classificam; três derrotas eliminam. Jogos decisivos são melhor de 3. Os
            demais, melhor de 1.
          </p>
        </li>
        <li>
          <b>Conquiste o Worlds.</b>
          <p>
            Quartas, semifinal e final são melhor de 5. A força combina 80% dos ratings e 20% da
            composição. Favoritos também podem perder.
          </p>
          <p>
            Escolha Acompanhar partida para ver os acontecimentos e o KDA, ou Resultado rápido para
            avançar pelos resultados. Os dois modos percorrem o torneio sozinhos, com velocidades
            1×, 2× e 4×. Você pode pausar ou abrir os relatórios a qualquer momento.
          </p>
        </li>
      </ol>
      <div className="data-note">
        {years} {years === 1 ? 'edição' : 'edições'} do Worlds · {regionGroups}{' '}
        {regionGroups === 1 ? 'grupo' : 'grupos'} de draft. Pools comprovados; ratings estimados a
        partir das estatísticas globais por posição. A simulação e o KDA das partidas do jogo são
        fictícios. As cartas usam avatares originais e neutros para os jogadores.
      </div>
      <details className="image-credits">
        <summary>Créditos das imagens</summary>
        <p>
          Campeões: Riot Games / Data Dragon. Avatares dos jogadores: ilustrações originais e
          neutras criadas para esta interface; não representam retratos oficiais ou fotorrealistas.
        </p>
      </details>
      <button className="primary full" onClick={close}>
        Entendi, vamos jogar <ArrowRight size={20} />
      </button>
    </dialog>
  );
}
function TeamStrip({ team, active = 5 }: { team: Team; active?: number }) {
  return (
    <div className="team-strip">
      <span className="strip-title">
        Sua equipe<span>{team.length}/5 lendas</span>
      </span>
      <div className="team-slots">
        {ROLES.map((role, i) => {
          const p = team[i];
          return (
            <div
              key={role}
              className={`team-slot ${i === active ? 'current' : ''} ${p ? 'filled' : ''}`}
            >
              {p && <PlayerAvatar player={p} className="team-avatar" />}
              <div>
                <span className="slot-role">{roleLabel[role]}</span>
                <b>{p ? p.playerName : '—'}</b>
                {p && <small>{p.worldsYear}</small>}
              </div>
              {p && <Check className="slot-check" size={12} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChallengeFilters({
  value,
  limits,
  manifest,
  onChange,
}: {
  value: DraftAvailability;
  limits: DraftAvailability;
  manifest: DraftRegionManifest;
  onChange: (availability: DraftAvailability) => void;
}) {
  const [message, setMessage] = useState('');
  const groups = DRAFT_REGION_GROUP_IDS.filter((group) =>
    limits.activeRegionGroups.includes(group),
  );
  const update = (candidate: DraftAvailability) => {
    if (!isDraftAvailabilityEligible(manifest, candidate)) {
      setMessage('Mantenha ao menos uma combinação de edição e grupo elegível.');
      return;
    }
    setMessage('Filtros atualizados. O desafio usará exatamente este recorte.');
    onChange(candidate);
  };
  const toggleYear = (year: number) =>
    update({
      ...value,
      activeYears: value.activeYears.includes(year)
        ? value.activeYears.filter((candidate) => candidate !== year)
        : [...value.activeYears, year].sort((left, right) => left - right),
    });
  const toggleGroup = (group: DraftRegionGroupId) =>
    update({
      ...value,
      activeRegionGroups: value.activeRegionGroups.includes(group)
        ? value.activeRegionGroups.filter((candidate) => candidate !== group)
        : DRAFT_REGION_GROUP_IDS.filter((candidate) =>
            [...value.activeRegionGroups, group].includes(candidate),
          ),
    });
  const contexts = availableDraftContexts(manifest, value);
  return (
    <details className="challenge-filters">
      <summary>
        <span>
          <b>Personalizar draft e desafio</b>
          <small>
            {value.activeYears.length} {value.activeYears.length === 1 ? 'edição' : 'edições'} ·{' '}
            {value.activeRegionGroups.length}{' '}
            {value.activeRegionGroups.length === 1 ? 'grupo' : 'grupos'}
          </small>
        </span>
        <strong>FILTRAR</strong>
      </summary>
      <div className="challenge-filter-body">
        <fieldset>
          <legend>Edições permitidas</legend>
          <div className="challenge-filter-options years">
            {limits.activeYears.map((year) => (
              <label key={year}>
                <input
                  type="checkbox"
                  checked={value.activeYears.includes(year)}
                  onChange={() => toggleYear(year)}
                />
                <span>{year}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Grupos permitidos</legend>
          <div className="challenge-filter-options">
            {groups.map((group) => (
              <label key={group}>
                <input
                  type="checkbox"
                  checked={value.activeRegionGroups.includes(group)}
                  onChange={() => toggleGroup(group)}
                />
                <span>{draftRegionLabel(manifest, group)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="challenge-filter-status">
          <span role="status">
            {message ||
              `${contexts.length} combinações elegíveis. Cada posição mantém três candidatos.`}
          </span>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setMessage('Todos os filtros disponíveis foram restaurados.');
              onChange(limits);
            }}
          >
            Restaurar tudo
          </button>
        </div>
      </div>
    </details>
  );
}

const compatibilityLabel = { high: 'Alta', medium: 'Média', low: 'Baixa' } as const;
const signedModifier = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`;

function GamePlanPicker({
  team,
  data,
  value,
  showNumbers,
  onChange,
}: {
  team: Team;
  data: GameData;
  value: GamePlan | null;
  showNumbers: boolean;
  onChange: (plan: GamePlan) => void;
}) {
  return (
    <fieldset className="game-plan-picker">
      <legend>
        <span className="eyebrow green">PLANO DE JOGO</span>
        <strong>Como suas lendas querem vencer?</strong>
        <small>
          Uma escolha para toda a campanha: alta +1,5, média +0,5 e baixa −1,0 na força.
        </small>
      </legend>
      <div className="game-plan-grid">
        {GAME_PLANS.map((plan) => {
          const breakdowns = [1, 2, 3, 4, 5].map((game) =>
            gamePlanBreakdown(team, game, data.champions, plan.id),
          );
          const average =
            breakdowns.reduce((sum, breakdown) => sum + breakdown.modifier, 0) / breakdowns.length;
          const highGames = breakdowns.filter(
            (breakdown) => breakdown.compatibility === 'high',
          ).length;
          return (
            <label key={plan.id} className={value === plan.id ? 'selected' : ''}>
              <input
                type="radio"
                name="game-plan"
                value={plan.id}
                checked={value === plan.id}
                onChange={() => onChange(plan.id)}
              />
              <span className="game-plan-copy">
                <b>{plan.label}</b>
                <small>{plan.description}</small>
              </span>
              <span className="game-plan-tags" aria-label={`Tags do plano ${plan.label}`}>
                {plan.tags.map((tag) => (
                  <i key={tag}>{GAME_PLAN_TAG_LABELS[tag]}</i>
                ))}
              </span>
              <span className="game-plan-fit">
                {showNumbers
                  ? `${highGames}/5 comps em alta · efeito médio ${signedModifier(average)}`
                  : 'Compatibilidade e efeito revelados no resultado final'}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Composition({
  team,
  game,
  data,
  gamePlan = null,
  showRatings = true,
}: {
  team: Team;
  game: number;
  data: GameData;
  gamePlan?: GamePlan | null;
  showRatings?: boolean;
}) {
  const strength = teamStrength(team, game, data.champions, gamePlan);
  return (
    <div className="composition-panel">
      <div className="composition-five">
        {team.map((p) => {
          const slot = p.championPool[game - 1];
          const c = data.champions[slot.championId];
          return (
            <div key={p.id} className="comp-champion">
              <span className="eyebrow">{roleLabel[p.role]}</span>
              <div className="comp-art">
                <Art src={championArt(c, p.worldsYear).splash} alt={c.name} />
                <b
                  aria-label={showRatings ? `Rating ${slot.rating}` : 'Rating oculto no Almanaque'}
                >
                  {showRatings ? slot.rating : '?'}
                </b>
              </div>
              <strong>{c.name}</strong>
              <small>
                {p.playerName} · {p.worldsYear}
              </small>
            </div>
          );
        })}
      </div>
      {showRatings ? (
        <div className="composition-scores">
          <span>
            Rating médio <b>{strength.average.toFixed(1)}</b>
          </span>
          <span>
            Sinergia da comp <b>{strength.composition}</b>
          </span>
          {strength.plan && (
            <span>
              Plano {strength.plan.label}{' '}
              <b>
                {compatibilityLabel[strength.plan.compatibility]} ·{' '}
                {signedModifier(strength.plan.modifier)}
              </b>
            </span>
          )}
          <span className="strength-total">
            Força da equipe <b>{strength.total.toFixed(1)}</b>
          </span>
        </div>
      ) : (
        <div className="almanac-lock" role="note">
          <Shield size={18} /> Ratings, sinergia, plano e força serão revelados ao fim da campanha.
        </div>
      )}
    </div>
  );
}

function MatchForecast({
  team,
  opponent,
  opponentName,
  game,
  data,
  gamePlan,
  showRatings = true,
}: {
  team: Team;
  opponent: Team;
  opponentName: string;
  game: number;
  data: GameData;
  gamePlan: GamePlan | null;
  showRatings?: boolean;
}) {
  const userStrength = teamStrength(team, game, data.champions, gamePlan);
  const opponentStrength = teamStrength(opponent, game, data.champions);
  const breakdown = compositionBreakdown(team, game, data.champions);
  const probability = Math.round(winProbability(userStrength.total, opponentStrength.total) * 100);
  const message =
    probability >= 65
      ? 'Sua equipe é favorita, mas a zebra continua possível.'
      : probability <= 35
        ? 'O adversário é favorito. Uma vitória seria uma zebra.'
        : 'Confronto equilibrado: cada ponto de composição pode pesar.';
  if (!showRatings)
    return (
      <section
        className="match-forecast almanac-forecast"
        aria-label={`Previsão para o jogo ${game}`}
      >
        <span className="eyebrow green">MODO ALMANAQUE · LEITURA OCULTA</span>
        <h2>Confie no seu conhecimento.</h2>
        <p>
          Chance, força e efeito do plano contra {opponentName} serão revelados ao fim da campanha.
          O cálculo do resultado continua exatamente o mesmo do modo Clássico.
        </p>
      </section>
    );
  return (
    <section className="match-forecast" aria-label={`Previsão para o jogo ${game}`}>
      <div className="forecast-heading">
        <div>
          <span className="eyebrow green">PREVISÃO · ANTES DO RESULTADO</span>
          <h2>{probability}% de chance para suas lendas</h2>
        </div>
        <span className="forecast-score">
          <b>{userStrength.total.toFixed(1)}</b>
          <i>×</i>
          <b>{opponentStrength.total.toFixed(1)}</b>
        </span>
      </div>
      <div
        className="forecast-meter"
        role="progressbar"
        aria-label="Chance estimada de vitória"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={probability}
      >
        <span style={{ width: `${probability}%` }} />
      </div>
      <div className="forecast-details">
        <span>
          Rating médio <b>{userStrength.average.toFixed(1)}</b>
        </span>
        <span>
          Composição <b>{userStrength.composition}</b>
        </span>
        <span>
          Adversário <b>{opponentName}</b>
        </span>
      </div>
      <div className="forecast-bonuses">
        {breakdown.bonuses.length ? (
          breakdown.bonuses.map((bonus) => <span key={bonus.id}>{bonus.label}</span>)
        ) : (
          <span>Sem bônus de composição ativos</span>
        )}
      </div>
      {userStrength.plan && (
        <div className={`plan-impact ${userStrength.plan.compatibility}`}>
          <b>
            Plano {userStrength.plan.label} · {compatibilityLabel[userStrength.plan.compatibility]}
          </b>
          <span>{signedModifier(userStrength.plan.modifier)} na força deste jogo</span>
          <small>
            Ativas:{' '}
            {userStrength.plan.matchedTags.map((tag) => tag.label).join(', ') || 'nenhuma tag'}
          </small>
        </div>
      )}
      <p>{message} A chance é uma estimativa, não uma promessa de resultado.</p>
    </section>
  );
}
export default function App() {
  const [data, setData] = useState<GameData | null>(null);
  const [loadingGame, setLoadingGame] = useState(false);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState<Screen>('home');
  const initialChallenge = useRef(challengeFromBrowser()).current;
  const [pendingChallenge, setPendingChallenge] = useState<CampaignChallenge | null>(
    initialChallenge.challenge,
  );
  const [challengeInvalid, setChallengeInvalid] = useState(initialChallenge.invalid);
  const [hasSavedCampaign, setHasSavedCampaign] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [nextDraftAvailability, setNextDraftAvailability] = useState<DraftAvailability | null>(
    null,
  );
  const [draftAvailabilityLimits, setDraftAvailabilityLimits] = useState<DraftAvailability | null>(
    null,
  );
  const [campaignAvailability, setCampaignAvailability] = useState<DraftAvailability | null>(null);
  const [campaignSeed, setCampaignSeed] = useState<string | null>(null);
  const [campaignSource, setCampaignSource] = useState<'organic' | 'challenge' | 'daily'>(
    'organic',
  );
  const [dailyChallengeId, setDailyChallengeId] = useState<string | null>(null);
  const [dailyAttemptId, setDailyAttemptId] = useState<string | null>(null);
  const [dailyAttemptKind, setDailyAttemptKind] = useState<DailyAttemptKind | null>(null);
  const [dailyRevision, setDailyRevision] = useState(0);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [dailyCatalog, setDailyCatalog] = useState(buildDailyCatalog);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [gamePlan, setGamePlan] = useState<GamePlan | null>(null);
  const [maintenanceBanner, setMaintenanceBanner] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [exitAction, setExitAction] = useState<CampaignExitAction | null>(null);
  const replacementStart = useRef<{
    challenge: CampaignChallenge | null;
    daily: DailyChallenge | null;
    dailyOfficialAllowed: boolean;
  } | null>(null);
  const activeCampaign = useRef(false);
  const routeReady = useRef(false);
  const [remaining, setRemaining] = useState<number>(DRAFT_CONFIG.exchanges);
  const [rejected, setRejected] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [research, setResearch] = useState<PlayerVersion | 'method' | null>(null);
  const draftLock = useRef(false);
  const seriesLock = useRef(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    },
    [],
  );
  const [rounds, setRounds] = useState<DraftRound[]>([]);
  const [team, setTeam] = useState<Team>([]);
  const [preview, setPreview] = useState(1);
  const [tournament, setTournament] = useState<Tournament>(newTournament);
  const [series, setSeries] = useState<Series | null>(null);
  const [settings, setSettings] = useState<PlaybackSettings>({
    mode: 'detailed',
    speed: 1,
    paused: false,
  });
  const [playResult, setPlayResult] = useState<GameResult | null>(null);
  const [momentIndex, setMomentIndex] = useState(0);
  const [report, setReport] = useState<ReportSelection | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    activeCampaign.current = !!campaignSeed;
  }, [campaignSeed]);
  useEffect(() => {
    window.history.replaceState(
      { ...window.history.state, draftLendasScreen: 'home' },
      '',
      window.location.href,
    );
    routeReady.current = true;
    const onPopState = (event: PopStateEvent) => {
      const target = event.state?.draftLendasScreen as Screen | undefined;
      if (target === 'home' || !activeCampaign.current) {
        setScreen('home');
        return;
      }
      if (target && ['draft', 'team', 'tournament', 'match', 'result'].includes(target))
        setScreen(target);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  useEffect(() => {
    if (!routeReady.current) return;
    const current = window.history.state?.draftLendasScreen as Screen | undefined;
    const state = { ...window.history.state, draftLendasScreen: screen };
    if (current === 'home' && screen !== 'home')
      window.history.pushState(state, '', window.location.href);
    else if (current !== screen) window.history.replaceState(state, '', window.location.href);
  }, [screen]);
  useEffect(() => {
    let active = true;
    const saved = loadCampaign(catalog.draftRegionManifest.datasetVersion);
    const defaultAvailability = defaultDraftAvailability(catalog);
    setDraftAvailabilityLimits(defaultAvailability);
    setNextDraftAvailability(defaultAvailability);
    setHasSavedCampaign(!!saved);
    void loadPublicProductConfig().then((configuration) => {
      if (!active) return;
      const configuredAvailability = safeDraftAvailability(catalog, configuration);
      setDraftAvailabilityLimits(configuredAvailability);
      setNextDraftAvailability(configuredAvailability);
      setMaintenanceBanner(configuration?.maintenanceBanner ?? null);
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = buildDailyCatalog();
      setDailyCatalog((previous) => (previous[0].id === current[0].id ? previous : current));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!analyticsEnabled || !pendingChallenge) return;
    analytics.trackOnce(`challenge_opened:${pendingChallenge.seed}`, 'challenge_opened', {
      campaign_source: 'challenge',
      challenge_version: pendingChallenge.version,
      game_mode: pendingChallenge.gameMode,
      ...(pendingChallenge.gamePlan ? { game_plan: pendingChallenge.gamePlan } : {}),
    });
  }, [analyticsEnabled, pendingChallenge]);
  useEffect(() => {
    if (!analyticsEnabled) return;
    analytics.trackOnce(`daily_opened:${dailyCatalog[0].id}`, 'daily_opened', {
      campaign_source: 'daily',
      daily_id: dailyCatalog[0].id,
    });
  }, [analyticsEnabled, dailyCatalog]);
  useEffect(() => {
    let active = true;
    void analytics.initialize().then((enabled) => {
      if (active) setAnalyticsEnabled(enabled);
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (screen !== 'home') title.current?.focus({ preventScroll: true });
  }, [screen, team.length]);
  useEffect(() => {
    if (!data || !campaignSeed || screen === 'home') return;
    const campaign = currentCampaignState();
    if (!campaign) return;
    setHasSavedCampaign(saveCampaign(campaign, data.draftRegionManifest.datasetVersion));
  }, [
    data,
    screen,
    remaining,
    rejected,
    rounds,
    team,
    preview,
    tournament,
    series,
    settings,
    playResult,
    momentIndex,
    campaignAvailability,
    campaignSeed,
    campaignSource,
    dailyChallengeId,
    dailyAttemptId,
    dailyAttemptKind,
    gameMode,
    gamePlan,
  ]);
  useEffect(() => {
    if (tournament.stage === 'quarters')
      analytics.trackOnce('playoffs_reached', 'playoffs_reached');
  }, [analyticsEnabled, tournament.stage]);
  useEffect(() => {
    if (screen !== 'result' || !tournament.outcome) return;
    const properties = {
      outcome: tournament.outcome,
      campaign_duration_ms: analytics.campaignElapsedMs(),
      game_mode: gameMode,
      ...(gamePlan ? { game_plan: gamePlan } : {}),
    };
    analytics.trackOnce('campaign_finished', 'campaign_finished', properties);
    if (campaignSource === 'challenge')
      analytics.trackOnce('challenge_completed', 'challenge_completed', {
        ...properties,
        campaign_source: 'challenge',
        challenge_version: CHALLENGE_VERSION,
      });
    if (campaignSource === 'daily' && dailyChallengeId && dailyAttemptId && dailyAttemptKind) {
      if (completeDailyAttempt(dailyAttemptId, tournament.outcome))
        setDailyRevision((value) => value + 1);
      analytics.trackOnce('daily_completed', 'daily_completed', {
        campaign_source: 'daily',
        daily_id: dailyChallengeId,
        attempt_kind: dailyAttemptKind,
        ...properties,
      });
    }
    if (tournament.outcome === 'Campeão mundial')
      analytics.trackOnce('worlds_won', 'worlds_won', properties);
  }, [
    analyticsEnabled,
    campaignSource,
    dailyAttemptId,
    dailyAttemptKind,
    dailyChallengeId,
    gameMode,
    gamePlan,
    screen,
    tournament.outcome,
  ]);
  useEffect(() => {
    if (
      screen !== 'result' ||
      !tournament.outcome ||
      !campaignSeed ||
      team.length !== 5 ||
      !data
    )
      return;
    const games = tournament.history.flatMap((entry) => entry.games);
    const campaignReport = buildCampaignReport({
      tournament,
      team,
      champions: data.champions,
      gamePlan,
    });
    const summary: CampaignSummary = {
      id: campaignSeedFromText(`history:${campaignSeed}`),
      completedAt: new Date().toISOString(),
      outcome: tournament.outcome,
      wins: games.filter((game) => game.won).length,
      losses: games.filter((game) => !game.won).length,
      confrontations: tournament.history.length,
      source: campaignSource,
      gameMode,
      gamePlan,
      dailyAttemptKind,
      report: campaignReport.highlights,
      team: team.map((player) => ({
        playerName: player.playerName,
        team: player.team,
        worldsYear: player.worldsYear,
        role: player.role,
      })),
    };
    if (recordCampaignSummary(summary)) setHistoryRevision((value) => value + 1);
  }, [
    campaignSeed,
    campaignSource,
    dailyAttemptKind,
    data,
    gameMode,
    gamePlan,
    screen,
    team,
    tournament.history,
    tournament.outcome,
  ]);
  useEffect(() => {
    if (screen === 'tournament' || screen === 'match' || screen === 'result')
      analytics.trackOnce('worlds_started', 'worlds_started', {
        ...(gamePlan ? { game_plan: gamePlan } : {}),
      });
  }, [analyticsEnabled, gamePlan, screen]);
  useEffect(() => {
    if (screen !== 'team') return;
    const startPrefetch = () => {
      void repository
        .load()
        .then((snapshot) => {
          validateData(snapshot.players, snapshot.champions);
          setData(snapshot);
        })
        .catch(() => undefined);
    };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(startPrefetch, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const timeout = setTimeout(startPrefetch, 250);
    return () => clearTimeout(timeout);
  }, [screen]);
  // A single cancellable timer owns progression. Pausing, help, report inspection,
  // speed/mode changes and unmount all cancel the previous scheduled step.
  useEffect(() => {
    if (!data || !campaignSeed || settings.paused || help || report || tournament.outcome) return;
    const quick = settings.mode === 'quick';
    let delay: number;
    let step: () => void;
    if (screen === 'tournament') {
      delay = quick ? 850 : 2400;
      step = beginSeries;
    } else if (screen === 'match' && series) {
      if (!playResult) {
        delay = quick ? 550 : 1400;
        step = () => {
          const result = simulateGame(
            series,
            team,
            data.champions,
            campaignRandom(
              campaignSeed,
              `series/${tournament.history.length}/${series.stage}/${series.opponentName}/game/${series.games.length + 1}`,
            ),
            gamePlan,
          );
          setPlayResult(result);
          setMomentIndex(quick ? result.recap.moments.length - 1 : 0);
        };
      } else if (momentIndex < playResult.recap.moments.length - 1) {
        delay = quick ? 250 : 2400;
        step = () => setMomentIndex(quick ? playResult.recap.moments.length - 1 : momentIndex + 1);
      } else if (series.games.length < playResult.game) {
        delay = quick ? 200 : 650;
        step = () => {
          analytics.track('game_completed', {
            stage: series.stage,
            game: playResult.game,
            best_of: series.bestOf,
            won: playResult.won,
          });
          setSeries({ ...series, games: [...series.games, playResult] });
        };
      } else if (seriesDone(series)) {
        delay = quick ? 1700 : 5000;
        step = () => {
          const next = advanceTournament(tournament, series);
          setTournament(next);
          setSeries(null);
          setPlayResult(null);
          setMomentIndex(0);
          setScreen(next.outcome ? 'result' : 'tournament');
        };
      } else {
        delay = quick ? 1500 : 4200;
        step = () => {
          setPlayResult(null);
          setMomentIndex(0);
        };
      }
    } else return;
    const timeout = setTimeout(step, delay / settings.speed);
    return () => clearTimeout(timeout);
  }, [
    data,
    settings,
    help,
    report,
    tournament,
    screen,
    series,
    playResult,
    momentIndex,
    team,
    campaignSeed,
    gamePlan,
  ]);
  async function loadYears(years: number[], visible = true): Promise<GameData | null> {
    if (visible) setLoadingGame(true);
    try {
      const snapshot = await repository.loadYears(years);
      validateData(snapshot.players, snapshot.champions);
      setData((current) => {
        if (!current) return snapshot;
        const players = new Map(current.players.map((player) => [player.id, player]));
        snapshot.players.forEach((player) => players.set(player.id, player));
        return { ...snapshot, players: [...players.values()] };
      });
      return snapshot;
    } catch {
      setError('Não foi possível carregar o jogo. Atualize a página para tentar novamente.');
      return null;
    } finally {
      if (visible) setLoadingGame(false);
    }
  }
  async function start(
    challenge: CampaignChallenge | null = null,
    daily: DailyChallenge | null = null,
    dailyOfficialAllowed = true,
  ) {
    if (loadingGame) return;
    const availability =
      daily?.availability ??
      challenge?.availability ??
      nextDraftAvailability ??
      defaultDraftAvailability(catalog);
    if (!isDraftAvailabilityEligible(catalog.draftRegionManifest, availability)) {
      setError('Escolha ao menos uma combinação válida de edição e grupo regional.');
      return;
    }
    setError('');
    const seed = daily?.seed ?? challenge?.seed ?? createCampaignSeed();
    const source = daily ? 'daily' : challenge ? 'challenge' : 'organic';
    const selectedGameMode = daily?.gameMode ?? challenge?.gameMode ?? gameMode;
    const selectedGamePlan = challenge?.gamePlan ?? null;
    const draftPlan = planDraft(
      catalog.draftRegionManifest,
      availability,
      campaignRandom(seed, 'draft/initial'),
    );
    const snapshot = await loadYears(draftPlan.map((round) => round.year));
    if (!snapshot) return;
    const dailyAttempt = daily
      ? beginDailyAttempt(daily.id, undefined, undefined, undefined, dailyOfficialAllowed)
      : null;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    const replay = screen === 'result';
    if (replay)
      analytics.track('play_again', {
        game_mode: gameMode,
        ...(gamePlan ? { game_plan: gamePlan } : {}),
      });
    clearCampaign();
    setHasSavedCampaign(false);
    analytics.startCampaign({
      game_mode: selectedGameMode,
      ...(selectedGamePlan ? { game_plan: selectedGamePlan } : {}),
    });
    if (challenge)
      analytics.track('challenge_started', {
        campaign_source: 'challenge',
        challenge_version: challenge.version,
        game_mode: selectedGameMode,
        ...(selectedGamePlan ? { game_plan: selectedGamePlan } : {}),
      });
    if (daily && dailyAttempt)
      analytics.track('daily_started', {
        campaign_source: 'daily',
        daily_id: daily.id,
        attempt_kind: dailyAttempt.kind,
        game_mode: selectedGameMode,
      });
    setCampaignAvailability(availability);
    setCampaignSeed(seed);
    setCampaignSource(source);
    setDailyChallengeId(daily?.id ?? null);
    setDailyAttemptId(dailyAttempt?.id ?? null);
    setDailyAttemptKind(dailyAttempt?.kind ?? null);
    if (dailyAttempt) setDailyRevision((value) => value + 1);
    setGameMode(selectedGameMode);
    setGamePlan(selectedGamePlan);
    draftLock.current = false;
    setPending(null);
    setRolling(false);
    setRejected([]);
    setRemaining(availability.startingExchanges);
    const nextRounds = createDraftFromPlan(
      snapshot.players,
      draftPlan,
      snapshot.draftRegionManifest,
    );
    nextRounds.forEach((round) =>
      analytics.track('roll_generated', { roll_source: 'initial', ...draftEventProperties(round) }),
    );
    setRounds(nextRounds);
    setTeam([]);
    setTournament(newTournament());
    setSeries(null);
    setPlayResult(null);
    setMomentIndex(0);
    setReport(null);
    setSettings({ ...settings, paused: false });
    setPreview(1);
    setScreen('draft');
    if (challenge || pendingChallenge || challengeInvalid) {
      setPendingChallenge(null);
      setChallengeInvalid(false);
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete(CHALLENGE_QUERY_PARAM);
      window.history.replaceState(null, '', cleanUrl);
    }
  }
  function currentCampaignState(
    campaignScreen: CampaignScreen = screen === 'home' ? 'draft' : screen,
    campaignSettings: PlaybackSettings = settings,
  ): CampaignState | null {
    if (!campaignSeed) return null;
    return {
      seed: campaignSeed,
      randomVersion: CAMPAIGN_RANDOM_VERSION,
      campaignSource,
      dailyChallengeId,
      dailyAttemptId,
      dailyAttemptKind,
      gameMode,
      gamePlan,
      screen: campaignScreen,
      draftStep: team.length,
      ...(campaignAvailability ? { draftAvailability: campaignAvailability } : {}),
      remaining,
      rejected,
      rounds,
      team,
      preview,
      tournament,
      series,
      settings: campaignSettings,
      playResult,
      momentIndex,
    };
  }
  function requestStart(
    challenge: CampaignChallenge | null = null,
    daily: DailyChallenge | null = null,
    dailyOfficialAllowed = true,
  ) {
    if (hasSavedCampaign) {
      replacementStart.current = { challenge, daily, dailyOfficialAllowed };
      setExitAction('replace');
      return;
    }
    void start(challenge, daily, dailyOfficialAllowed);
  }
  function continueLater() {
    if (screen === 'home') return;
    analytics.track('campaign_paused', { screen });
    const pausedSettings = { ...settings, paused: true };
    const campaign = currentCampaignState(screen, pausedSettings);
    if (campaign && data)
      setHasSavedCampaign(saveCampaign(campaign, data.draftRegionManifest.datasetVersion));
    setSettings(pausedSettings);
    setScreen('home');
  }
  function abandonCampaign() {
    analytics.track('campaign_abandoned', { screen });
    if (draftTimer.current) clearTimeout(draftTimer.current);
    clearCampaign();
    setHasSavedCampaign(false);
    setCampaignSeed(null);
    setPending(null);
    setRolling(false);
    setReport(null);
    setExitAction(null);
    replacementStart.current = null;
    setScreen('home');
  }
  function confirmCampaignExit() {
    if (exitAction === 'abandon') {
      abandonCampaign();
      return;
    }
    const request = replacementStart.current;
    setExitAction(null);
    replacementStart.current = null;
    if (request) void start(request.challenge, request.daily, request.dailyOfficialAllowed);
  }
  async function resume() {
    if (loadingGame) return;
    const campaign = loadCampaign(catalog.draftRegionManifest.datasetVersion);
    if (
      !campaign ||
      campaign.draftStep !== campaign.team.length ||
      (campaign.screen === 'draft' && !campaign.rounds[campaign.draftStep])
    ) {
      clearCampaign();
      setHasSavedCampaign(false);
      return;
    }
    const campaignYears = [
      ...campaign.rounds.map((round) => round.year),
      ...campaign.team.map((player) => player.worldsYear),
    ];
    const needsAllYears = ['tournament', 'match', 'result'].includes(campaign.screen);
    const snapshot = await loadYears(
      needsAllYears ? catalog.draftRegionManifest.groups.map((entry) => entry.year) : campaignYears,
    );
    if (!snapshot) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    analytics.track('save_resumed', { draft_step: campaign.draftStep });
    setCampaignAvailability(campaign.draftAvailability ?? defaultDraftAvailability(catalog));
    setCampaignSeed(campaign.seed);
    setCampaignSource(campaign.campaignSource);
    setDailyChallengeId(campaign.dailyChallengeId);
    setDailyAttemptId(campaign.dailyAttemptId);
    setDailyAttemptKind(campaign.dailyAttemptKind);
    setGameMode(campaign.gameMode);
    setGamePlan(campaign.gamePlan);
    draftLock.current = false;
    setPending(null);
    setRolling(false);
    setRemaining(campaign.remaining);
    setRejected(campaign.rejected);
    setRounds(campaign.rounds);
    setTeam(campaign.team);
    setPreview(campaign.preview);
    setTournament(campaign.tournament);
    setSeries(campaign.series);
    setSettings(campaign.settings);
    setPlayResult(campaign.playResult);
    setMomentIndex(campaign.momentIndex);
    setReport(null);
    setScreen(campaign.screen);
  }
  function choose(p: PlayerVersion) {
    if (
      draftLock.current ||
      team.length >= 5 ||
      !rounds[team.length].options.some((option) => option.id === p.id)
    )
      return;
    const round = rounds[team.length];
    analytics.track('player_selected', {
      player_id: analyticsPlayerId(p.id),
      ...draftEventProperties(round),
    });
    draftLock.current = true;
    setPending(p.id);
    draftTimer.current = setTimeout(() => {
      const selectedTeam = [...team, p];
      setTeam(selectedTeam);
      setPending(null);
      setRejected([]);
      draftLock.current = false;
      if (team.length === 4) {
        analytics.trackOnce('draft_completed', 'draft_completed', {
          draft_duration_ms: analytics.draftElapsedMs(),
          selected_player_ids: selectedTeam.map((player) => analyticsPlayerId(player.id)),
        });
        setScreen('team');
      }
    }, DRAFT_CONFIG.selectionMs);
  }
  async function exchange(kind: Exchange) {
    if (!data || !campaignSeed || draftLock.current || !rounds[team.length]) return;
    let exchangeData = data;
    if (kind === 'year') {
      const availability = campaignAvailability ?? defaultDraftAvailability(catalog);
      const loaded = await loadYears(availability.activeYears);
      if (!loaded) return;
      exchangeData = loaded;
    }
    const result = exchangeRound(
      rounds[team.length],
      eligiblePools(
        exchangeData.players,
        exchangeData.draftRegionManifest,
        campaignAvailability ?? undefined,
      ),
      kind,
      remaining,
      rejected,
      campaignRandom(
        campaignSeed,
        `draft/exchange/${team.length}/${remaining}/${kind}/${offerKey(rounds[team.length])}`,
      ),
    );
    if (!result.changed) return;
    analytics.track('exchange_used', {
      exchange_type: kind,
      rejected_candidate_ids: rounds[team.length].options.map((player) =>
        analyticsPlayerId(player.id),
      ),
      ...draftEventProperties(rounds[team.length]),
    });
    analytics.track('roll_generated', {
      roll_source: 'exchange',
      exchange_type: kind,
      ...draftEventProperties(result.round),
    });
    draftLock.current = true;
    setRolling(true);
    setRemaining(result.remaining);
    setRejected(result.rejected);
    draftTimer.current = setTimeout(() => {
      setRounds(rounds.map((r, i) => (i === team.length ? result.round : r)));
      setRolling(false);
      draftLock.current = false;
    }, DRAFT_CONFIG.rollMs);
  }
  async function beginSeries() {
    if (seriesLock.current || !campaignSeed) return;
    seriesLock.current = true;
    const snapshot = await loadYears(
      catalog.draftRegionManifest.groups.map((entry) => entry.year),
      screen !== 'tournament',
    );
    if (!snapshot) {
      seriesLock.current = false;
      return;
    }
    const nextSeries = createSeries(
      tournament,
      snapshot.players,
      campaignRandom(campaignSeed, `series/${tournament.history.length}/${tournament.stage}`),
    );
    analytics.track('series_started', {
      stage: nextSeries.stage,
      best_of: nextSeries.bestOf,
    });
    setSeries(nextSeries);
    setPlayResult(null);
    setMomentIndex(0);
    setScreen('match');
    seriesLock.current = false;
  }
  function enterMatch() {
    analytics.trackOnce('worlds_started', 'worlds_started', {
      ...(gamePlan ? { game_plan: gamePlan } : {}),
    });
    void beginSeries();
  }
  function selectGamePlan(nextPlan: GamePlan) {
    setGamePlan(nextPlan);
    analytics.track('game_plan_selected', { game_plan: nextPlan });
  }
  function finishSeries() {
    if (!series) return;
    const next = advanceTournament(tournament, series);
    setTournament(next);
    setSeries(null);
    setPlayResult(null);
    setMomentIndex(0);
    setScreen(next.outcome ? 'result' : 'tournament');
  }
  function openHelp() {
    analytics.track('how_to_play_opened');
    setHelp(true);
  }
  function openResearch(selection: PlayerVersion | 'method') {
    analytics.track(
      'rating_details_opened',
      selection === 'method'
        ? { detail_type: 'method' }
        : { detail_type: 'player', player_id: selection.id },
    );
    setResearch(selection);
  }
  const draft = rounds[team.length];
  const currentGame =
    playResult?.game ?? (series ? Math.min(series.games.length + 1, series.bestOf) : 1);
  const totalWins = tournament.history.flatMap((s) => s.games).filter((g) => g.won).length;
  const totalLosses = tournament.history.flatMap((s) => s.games).filter((g) => !g.won).length;
  const currentAchievements =
    screen === 'result' && tournament.outcome && campaignSeed && team.length === 5
      ? achievementsForCampaign({
          id: campaignSeedFromText(`history:${campaignSeed}`),
          completedAt: new Date().toISOString(),
          outcome: tournament.outcome,
          wins: totalWins,
          losses: totalLosses,
          confrontations: tournament.history.length,
          source: campaignSource,
          gameMode,
          gamePlan,
          dailyAttemptKind,
          report: null,
          team: team.map((player) => ({
            playerName: player.playerName,
            team: player.team,
            worldsYear: player.worldsYear,
            role: player.role,
          })),
        })
      : [];
  if (error)
    return (
      <main className="loading" role="alert" aria-live="assertive">
        <h1>Ops, algo deu errado.</h1>
        <p>{error}</p>
        <button className="primary" onClick={() => location.reload()}>
          Tentar novamente
        </button>
      </main>
    );
  if (!data && screen !== 'home')
    return (
      <main className="loading" role="status" aria-live="polite">
        <span className="brand">
          DRAFT <em>LENDAS</em>
        </span>
        <p>Preparando suas lendas…</p>
      </main>
    );
  const viewData = data ?? homeData;
  const availability = nextDraftAvailability ?? defaultDraftAvailability(catalog);
  const availableYears = availability.activeYears.length;
  const availableRegionGroups = new Set(
    catalog.draftRegionManifest.groups
      .filter((entry) => availability.activeYears.includes(entry.year))
      .flatMap((entry) =>
        entry.groups
          .filter((group) => availability.activeRegionGroups.includes(group.id))
          .map((group) => group.id),
      ),
  ).size;
  const featuredPlayer = catalog.featuredPlayer;
  const featuredChampion = catalog.champions[featuredPlayer.championPool[0].championId];
  const activeDraftAvailability = campaignAvailability ?? availability;
  const activeChallenge: CampaignChallenge | null =
    campaignSeed && campaignAvailability
      ? {
          version: CHALLENGE_VERSION,
          seed: campaignSeed,
          datasetVersion: catalog.draftRegionManifest.datasetVersion,
          gameMode,
          gamePlan,
          availability: campaignAvailability,
        }
      : null;
  const activeChallengeUrl =
    activeChallenge && typeof window !== 'undefined'
      ? createChallengeUrl(activeChallenge, window.location.href)
      : undefined;
  const yearExchangeAvailable =
    !!draft &&
    catalog.draftRegionManifest.groups.some(
      (entry) =>
        entry.year !== draft.year &&
        activeDraftAvailability.activeYears.includes(entry.year) &&
        entry.groups.some(
          (group) =>
            group.id === draft.region.id &&
            activeDraftAvailability.activeRegionGroups.includes(group.id),
        ),
    );
  const showRatings = gameMode === 'classic' || screen === 'result';
  return (
    <div
      className={`app-shell ${screen === 'draft' ? 'draft-active' : ''} ${gameMode === 'almanac' ? 'almanac-mode' : ''}`}
    >
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <button
          type="button"
          className="brand-lockup brand-home"
          onClick={continueLater}
          aria-label={screen === 'home' ? 'Página inicial do Draft Lendas' : 'Continuar depois e voltar ao início'}
        >
          <span className="brand">
            DRAFT <em>LENDAS</em>
            <span className="brand-dot">.</span>
          </span>
          <span className="brand-caption">MONTE SUA COMP HISTÓRICA</span>
        </button>
        <nav>
          <span className="edition-badge">
            <span /> WORLDS EDITION
          </span>
          {screen !== 'home' && (
            <div className="campaign-nav">
              <button type="button" onClick={continueLater} aria-label="Continuar depois">
                <House size={16} /> <span>Continuar depois</span>
              </button>
              <button
                type="button"
                onClick={() => setExitAction('abandon')}
                aria-label="Abandonar campanha"
              >
                <LogOut size={16} /> <span>Abandonar</span>
              </button>
            </div>
          )}
          <button className="help-button" onClick={openHelp}>
            <CircleHelp size={17} />
            <span>Como jogar</span>
          </button>
          <button
            className="icon-button mobile-menu"
            onClick={openHelp}
            aria-label="Abrir instruções"
          >
            <Menu />
          </button>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        {maintenanceBanner && (
          <p className="maintenance-banner" role="status">
            {maintenanceBanner}
          </p>
        )}
        {(screen === 'tournament' || screen === 'match') && (
          <div className="active-playback">
            <AutoplayControls settings={settings} onChange={setSettings} active />
          </div>
        )}
        {screen === 'home' && (
          <section className="home-screen">
            <div className="home-copy">
              <span className="eyebrow">
                <span className="live-dot" /> O SEU DRAFT. A SUA HISTÓRIA.
              </span>
              <h1 ref={title} tabIndex={-1}>
                Lendas de
                <br />
                todas as eras.
                <br />
                <span>
                  Seu próximo
                  <br className="mobile-break" /> título.
                </span>
              </h1>
              <p>
                Monte um time com lendas de diferentes eras do Worlds.
                <br />
                Combine seus pools. Encare o mundo.
              </p>
              {pendingChallenge && (
                <aside className="challenge-invite" aria-labelledby="challenge-invite-title">
                  <span>DESAFIO ENTRE AMIGOS · {challengeCode(pendingChallenge)}</span>
                  <h2 id="challenge-invite-title">Mesmas condições. Sua própria campanha.</h2>
                  <p>
                    Modo {gameModeLabel(pendingChallenge.gameMode)}
                    {pendingChallenge.gamePlan
                      ? `, plano ${gamePlanLabel(pendingChallenge.gamePlan)}`
                      : ''}
                    , anos, regiões, trocas e sorteios serão os mesmos. Suas escolhas continuam
                    livres e o resultado não vale como ranking verificado.
                  </p>
                  <p className="challenge-rules">
                    <b>Edições:</b> {pendingChallenge.availability.activeYears.join(', ')}
                    <br />
                    <b>Grupos:</b>{' '}
                    {pendingChallenge.availability.activeRegionGroups
                      .map((group) => draftRegionLabel(catalog.draftRegionManifest, group))
                      .join(', ')}
                  </p>
                  <button
                    className="primary"
                    onClick={() => requestStart(pendingChallenge)}
                    disabled={loadingGame}
                  >
                    {loadingGame ? 'Preparando desafio…' : 'Aceitar desafio'}
                    <Swords size={19} />
                  </button>
                </aside>
              )}
              {challengeInvalid && (
                <p className="challenge-invalid" role="alert">
                  Este desafio é inválido ou pertence a outra versão dos dados. Você ainda pode
                  começar um draft normal.
                </p>
              )}
              {!pendingChallenge && (
                <>
                  <DailyChallengePanel
                    challenges={dailyCatalog}
                    busy={loadingGame}
                    revision={dailyRevision}
                    start={(daily, officialAllowed) => requestStart(null, daily, officialAllowed)}
                  />
                  <LocalHistoryPanel
                    revision={historyRevision}
                    changed={() => setHistoryRevision((value) => value + 1)}
                  />
                  <fieldset className="game-mode-picker">
                    <legend>Como você quer escolher?</legend>
                    <label className={gameMode === 'classic' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="game-mode"
                        value="classic"
                        checked={gameMode === 'classic'}
                        onChange={() => setGameMode('classic')}
                      />
                      <span>
                        <b>Clássico</b>
                        <small>Ratings e força visíveis</small>
                      </span>
                    </label>
                    <label className={gameMode === 'almanac' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="game-mode"
                        value="almanac"
                        checked={gameMode === 'almanac'}
                        onChange={() => setGameMode('almanac')}
                      />
                      <span>
                        <b>Almanaque</b>
                        <small>Escolha sem ver os números</small>
                      </span>
                    </label>
                  </fieldset>
                  {nextDraftAvailability && draftAvailabilityLimits && (
                    <ChallengeFilters
                      value={nextDraftAvailability}
                      limits={draftAvailabilityLimits}
                      manifest={catalog.draftRegionManifest}
                      onChange={setNextDraftAvailability}
                    />
                  )}
                </>
              )}
              {hasSavedCampaign ? (
                <div className="home-actions">
                  <button className="primary start-button" onClick={resume} disabled={loadingGame}>
                    {loadingGame ? 'Carregando campanha…' : 'Continuar campanha'}{' '}
                    <ArrowRight size={23} />
                  </button>
                  <button
                    className="text-button new-draft-button"
                    onClick={() => requestStart()}
                    disabled={loadingGame}
                  >
                    Novo draft <RotateCcw size={15} />
                  </button>
                </div>
              ) : (
                <button
                  className="primary start-button"
                  onClick={() => requestStart()}
                  disabled={loadingGame}
                >
                  {loadingGame ? 'Preparando draft…' : 'Começar draft'} <ArrowRight size={23} />
                </button>
              )}
              <span className="start-note">
                Modo {gameModeLabel(pendingChallenge?.gameMode ?? gameMode)} · 5 escolhas · Sem
                cadastro
              </span>
            </div>
            <div className="home-visual">
              <div className="hero-art">
                <Art
                  src={championArt(featuredChampion, featuredPlayer.worldsYear).splash}
                  alt={`${featuredChampion.name}, campeão de ${featuredPlayer.playerName} no Worlds ${featuredPlayer.worldsYear}`}
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="hero-shade" />
                <div className="hero-tag">
                  <Sparkles size={14} /> REESCREVA O WORLDS
                </div>
                <span className="hero-year">{featuredPlayer.worldsYear}</span>
                <div className="hero-player">
                  <span>
                    {roleLabel[featuredPlayer.role]} ·{' '}
                    {featuredPlayer.teamName ?? featuredPlayer.team}
                  </span>
                  <h2>
                    {featuredPlayer.playerName}
                    <span>{featuredPlayer.profile.toUpperCase()}</span>
                  </h2>
                </div>
                <div className="hero-pool">
                  {featuredPlayer.championPool.map((slot) => (
                    <div key={slot.game}>
                      <span>G{slot.game}</span>
                      <Art
                        src={
                          championArt(
                            viewData.champions[slot.championId],
                            featuredPlayer.worldsYear,
                          ).image
                        }
                        alt={viewData.champions[slot.championId].name}
                      />
                      <b>{slot.rating}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hero-sticker">
                <Swords size={22} />
                <span>
                  {availableYears} {availableYears === 1 ? 'EDIÇÃO' : 'EDIÇÕES'} DO WORLDS.
                  <br />
                  <b>UMA SÓ EQUIPE.</b>
                </span>
              </div>
            </div>
            <div className="home-steps">
              <div>
                <span>01</span>
                <div>
                  <b>SORTEIE</b>
                  <p>Um ano e uma região por posição.</p>
                </div>
              </div>
              <div>
                <span>02</span>
                <div>
                  <b>MONTE</b>
                  <p>Escolha uma das três lendas.</p>
                </div>
              </div>
              <div>
                <span>03</span>
                <div>
                  <b>DISPUTE</b>
                  <p>Do Suíço à grande final.</p>
                </div>
              </div>
            </div>
          </section>
        )}
        {screen === 'draft' && draft && (
          <section className="draft-screen">
            <div className="draft-progress" aria-label={`Escolha ${team.length + 1} de 5`}>
              {ROLES.map((role, i) => (
                <div
                  key={role}
                  className={`progress-step ${i < team.length ? 'complete' : ''} ${i === team.length ? 'active' : ''}`}
                >
                  <div className="progress-node">
                    {i < team.length ? <Check size={17} /> : <span>{i + 1}</span>}
                  </div>
                  <span>{roleLabel[role]}</span>
                </div>
              ))}
            </div>
            <TeamStrip team={team} active={team.length} />
            <div className="section-heading">
              <div>
                <span className="eyebrow green">
                  {roleLabel[draft.role]} · ESCOLHA {team.length + 1} DE 5 ·{' '}
                  {gameModeLabel(gameMode).toUpperCase()}
                </span>
                <h1 ref={title} tabIndex={-1}>
                  Escolha sua lenda<span>.</span>
                </h1>
                <p>Toque na carta para escalar. G1–G5 definem seu pool na série.</p>
              </div>
              <span className="pick-counter">
                <b>0{team.length + 1}</b> / 05
              </span>
            </div>
            <div className="roll-panel" aria-busy={rolling}>
              <div className="roll-context">
                <button
                  onClick={() => exchange('year')}
                  disabled={
                    !!pending || rolling || loadingGame || remaining === 0 || !yearExchangeAvailable
                  }
                  aria-label="Trocar ano"
                >
                  <small>WORLDS</small>
                  <strong>{draft.year}</strong>
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={() => exchange('region')}
                  disabled={
                    !!pending ||
                    rolling ||
                    loadingGame ||
                    remaining === 0 ||
                    !exchangeAlternatives(
                      draft,
                      eligiblePools(viewData.players, viewData.draftRegionManifest),
                      'region',
                    ).length
                  }
                  aria-label="Trocar região"
                >
                  <small>REGIÃO</small>
                  <strong>{draft.region.label}</strong>
                  <RotateCcw size={15} />
                </button>
              </div>
              <div className="exchange-tools">
                <span className="exchange-count" aria-live="polite">
                  {remaining} {remaining === 1 ? 'troca restante' : 'trocas restantes'}
                </span>
                <button
                  className="text-button"
                  onClick={() => exchange('players')}
                  disabled={
                    !!pending ||
                    rolling ||
                    loadingGame ||
                    remaining === 0 ||
                    !exchangeAlternatives(
                      draft,
                      eligiblePools(viewData.players, viewData.draftRegionManifest),
                      'players',
                    ).length
                  }
                  title="Precisa de mais de três jogadores neste pool"
                >
                  <RotateCcw size={14} /> Trocar jogadores
                </button>
              </div>
            </div>
            <PlayerChoiceCarousel
              key={offerKey(draft)}
              options={draft.options}
              data={viewData}
              selectedId={pending}
              disabled={!!pending || rolling}
              rolling={rolling}
              showRatings={showRatings}
              onPick={choose}
              onDetails={openResearch}
            />
            <div className="draft-footnote">
              <span aria-live="polite">
                {pending
                  ? 'Lenda escalada. Próxima posição…'
                  : rolling
                    ? 'Sorteando novas opções…'
                    : 'Cinco campeões reais. Uma ordem fixa por série.'}
              </span>
              <button className="text-button" onClick={() => openResearch('method')}>
                Como calculamos? <CircleHelp size={14} />
              </button>
            </div>
          </section>
        )}
        {screen === 'team' && (
          <section>
            <div className="section-heading">
              <div>
                <span className="eyebrow green">DRAFT COMPLETO · 5/5</span>
                <h1 ref={title} tabIndex={-1}>
                  O mundo que se prepare<span>.</span>
                </h1>
                <p>Cinco lendas. Cinco composições. Uma chance de fazer história.</p>
              </div>
              <span className="heading-icon">
                <Check />
              </span>
            </div>
            <TeamStrip team={team} />
            <GamePlanPicker
              team={team}
              data={viewData}
              value={gamePlan}
              showNumbers={showRatings}
              onChange={selectGamePlan}
            />
            <div className="subheading">
              <h2>Suas composições</h2>
              <span>CAMPEÕES EM ORDEM FIXA</span>
            </div>
            <div className="game-tabs" role="tablist" aria-label="Composições">
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  role="tab"
                  aria-selected={preview === g}
                  className={preview === g ? 'selected' : ''}
                  onClick={() => setPreview(g)}
                >
                  Jogo {g}
                  <small>{g === 1 ? 'BO1 / BO3 / BO5' : g < 4 ? 'BO3 / BO5' : 'BO5'}</small>
                </button>
              ))}
            </div>
            <Composition
              team={team}
              game={preview}
              data={viewData}
              gamePlan={gamePlan}
              showRatings={showRatings}
            />
            <AutoplayControls settings={settings} onChange={setSettings} />
            <div className="action-bar">
              <p>
                <Shield size={20} /> A força ajuda. A vitória se conquista.
              </p>
              <button
                className="primary"
                onClick={() => gamePlan && setScreen('tournament')}
                disabled={!gamePlan}
              >
                {gamePlan ? 'Entrar no Worlds' : 'Escolha um plano'} <ArrowRight size={20} />
              </button>
            </div>
          </section>
        )}
        {screen === 'tournament' && (
          <section>
            <div className="section-heading">
              <div>
                <span className="eyebrow green">A CAMINHADA ATÉ O TÍTULO</span>
                <h1 ref={title} tabIndex={-1}>
                  {stageLabel[tournament.stage]}
                  <span>.</span>
                </h1>
                <p>
                  {tournament.stage === 'swiss'
                    ? 'Três vitórias para avançar. Três derrotas e o sonho termina.'
                    : 'Uma melhor de cinco separa você do próximo capítulo.'}
                </p>
              </div>
              <span className="heading-icon">
                <Flag />
              </span>
            </div>
            <div className="tournament-layout">
              <div className="next-match">
                <span className="eyebrow">
                  {tournament.stage === 'swiss'
                    ? `RODADA ${tournament.history.length + 1}`
                    : 'MATA-MATA'}{' '}
                  · PRÓXIMO CONFRONTO
                </span>
                <div className="tournament-record">
                  {tournament.stage === 'swiss' ? (
                    <>
                      <b>{tournament.wins}</b>
                      <span>—</span>
                      <b className="muted">{tournament.losses}</b>
                    </>
                  ) : (
                    <Swords size={74} />
                  )}
                </div>
                <span className="record-caption">
                  {tournament.stage === 'swiss'
                    ? 'VITÓRIAS / DERROTAS'
                    : stageLabel[tournament.stage].toUpperCase()}
                </span>
                <div className="format-pill">
                  BO{formatFor(tournament)}{' '}
                  <span>
                    ·{' '}
                    {formatFor(tournament) === 1
                      ? 'Um jogo. Tudo em jogo.'
                      : `Vence quem ganhar ${Math.ceil(formatFor(tournament) / 2)} jogos`}
                  </span>
                </div>
                <p>
                  {tournament.stage === 'swiss' &&
                  (tournament.wins === 2 || tournament.losses === 2)
                    ? 'Série decisiva. Agora, a profundidade do seu pool faz a diferença.'
                    : 'Sua equipe está pronta. É hora de conhecer o adversário.'}
                </p>
                <button className="primary full" onClick={enterMatch}>
                  {settings.paused ? 'Iniciar confronto' : 'Antecipar confronto'}{' '}
                  <Swords size={19} />
                </button>
                <p className="auto-status" role="status">
                  {settings.paused
                    ? 'Pausado. Retome quando quiser.'
                    : 'O próximo confronto começa automaticamente.'}
                </p>
              </div>
              <div className="tournament-path">
                <div className="subheading">
                  <h2>Rota do título</h2>
                  <Trophy size={19} />
                </div>
                {(['swiss', 'quarters', 'semis', 'final'] as const).map((stage, i) => {
                  const current = ['swiss', 'quarters', 'semis', 'final'].indexOf(tournament.stage);
                  return (
                    <div
                      key={stage}
                      className={`path-step ${i === current ? 'active' : ''} ${i < current ? 'complete' : ''}`}
                    >
                      <span className="path-node">{i < current ? <Check size={16} /> : i + 1}</span>
                      <div>
                        <b>{stageLabel[stage]}</b>
                        <small>
                          {stage === 'swiss' ? '3 vitórias para classificar' : 'Melhor de 5'}
                        </small>
                      </div>
                      <span>
                        {i < current ? 'CONCLUÍDO' : i === current ? 'AGORA' : <Shield size={15} />}
                      </span>
                    </div>
                  );
                })}
                <div className="path-note">
                  Adversários históricos sorteados a cada série. Formato simplificado para o
                  protótipo.
                </div>
              </div>
            </div>
            <CampaignHistory tournament={tournament} open={setReport} />
          </section>
        )}
        {screen === 'match' && series && (
          <section className="match-screen">
            <div className="section-heading">
              <div>
                <span className="eyebrow green">
                  {stageLabel[series.stage].toUpperCase()} · MELHOR DE {series.bestOf}
                </span>
                <h1 ref={title} tabIndex={-1}>
                  {seriesDone(series) ? 'Série encerrada' : 'A história está em jogo'}
                  <span>.</span>
                </h1>
                <p>
                  {series.bestOf === 1
                    ? 'BO1: todos os jogadores usam seu campeão G1.'
                    : `Vence quem chegar a ${Math.ceil(series.bestOf / 2)} vitórias. Os campeões mudam a cada jogo.`}
                </p>
              </div>
            </div>
            <div className="scoreboard">
              <div className="score-team">
                <span className="team-emblem">
                  <Zap />
                </span>
                <b>SUAS LENDAS</b>
                <small>CINCO LENDAS. UMA EQUIPE.</small>
              </div>
              <div className="series-score" aria-live="polite">
                <b>{seriesScore(series).wins}</b>
                <span>:</span>
                <b>{seriesScore(series).losses}</b>
              </div>
              <div className="score-team">
                <span className="team-emblem opponent">
                  <Shield />
                </span>
                <b>{series.opponentName}</b>
                <small>ELENCO HISTÓRICO · {canonicalRegionFor(series.opponent[0])}</small>
              </div>
            </div>
            <div className="game-results">
              {Array.from({ length: series.bestOf }, (_, i) => {
                const g = series.games[i];
                return (
                  <button
                    disabled={!g}
                    onClick={() => g && setReport({ result: g, series })}
                    aria-label={g ? `Ver relatório G${i + 1}` : `G${i + 1} ainda não jogado`}
                    key={i}
                    className={`game-result ${g ? (g.won ? 'win' : 'loss') : ''}`}
                  >
                    <span>G{i + 1}</span>
                    <b>
                      {g
                        ? g.won
                          ? 'VITÓRIA'
                          : 'DERROTA'
                        : seriesDone(series)
                          ? 'NÃO JOGADO'
                          : '—'}
                    </b>
                    {g && showRatings && (
                      <small>
                        {g.strength.toFixed(1)} vs {g.opponentStrength.toFixed(1)}
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
            {!seriesDone(series) && (
              <MatchForecast
                team={team}
                opponent={series.opponent}
                opponentName={series.opponentName}
                game={currentGame}
                data={viewData}
                gamePlan={gamePlan}
                showRatings={showRatings}
              />
            )}
            {playResult && (
              <Suspense fallback={<p>Carregando relatório…</p>}>
                <MatchReport
                  result={playResult}
                  team={team}
                  opponent={series.opponent}
                  opponentName={series.opponentName}
                  data={viewData}
                  momentIndex={momentIndex}
                  compact={settings.mode === 'quick'}
                  hideStrength={!showRatings}
                />
              </Suspense>
            )}
            {seriesDone(series) ? (
              <div
                className={`series-verdict ${seriesScore(series).wins > seriesScore(series).losses ? 'win' : 'loss'}`}
              >
                <span className="eyebrow">RESULTADO DA SÉRIE</span>
                <h2>
                  {seriesScore(series).wins > seriesScore(series).losses
                    ? 'É NOSSA!'
                    : 'ESSA ESCAPOU.'}
                </h2>
                <p>
                  {seriesScore(series).wins > seriesScore(series).losses
                    ? 'Sua equipe escreveu mais um capítulo.'
                    : 'Até as lendas encontram adversários à altura.'}
                </p>
                <button className="primary" onClick={finishSeries}>
                  Antecipar próximo confronto <ArrowRight size={20} />
                </button>
                <p className="auto-status">
                  {settings.paused ? 'Avanço pausado.' : 'O torneio continua automaticamente.'}
                </p>
              </div>
            ) : (
              <>
                {!playResult && (
                  <>
                    <div className="subheading">
                      <h2>
                        Jogo {currentGame} <span className="small-tag">POOL G{currentGame}</span>
                      </h2>
                      {seriesScore(series).wins === seriesScore(series).losses &&
                        currentGame > 1 && (
                          <span className="green">
                            {currentGame === series.bestOf
                              ? 'TUDO IGUAL. JOGO DECISIVO.'
                              : 'SÉRIE EMPATADA. CADA JOGO CONTA.'}
                          </span>
                        )}
                    </div>
                    <Composition
                      team={team}
                      game={currentGame}
                      data={viewData}
                      gamePlan={gamePlan}
                      showRatings={showRatings}
                    />
                    <div className="opponent-line">
                      <span>
                        Comp adversária
                        {showRatings && (
                          <>
                            {' '}
                            · Força{' '}
                            {teamStrength(
                              series.opponent,
                              currentGame,
                              viewData.champions,
                            ).total.toFixed(1)}
                          </>
                        )}
                      </span>
                      <div>
                        {series.opponent.map((p) => {
                          const c = viewData.champions[p.championPool[currentGame - 1].championId];
                          return (
                            <div className="opponent-pick" key={p.id}>
                              <Art src={championArt(c, p.worldsYear).image} alt={c.name} />
                              <span>
                                <b>{p.playerName}</b>
                                <small>
                                  {c.name}
                                  {showRatings && ` · ${p.championPool[currentGame - 1].rating}`}
                                </small>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
                <p className="auto-status" role="status">
                  {settings.paused
                    ? 'Reprodução pausada.'
                    : !playResult
                      ? `Preparando G${currentGame} automaticamente…`
                      : momentIndex === playResult.recap.moments.length - 1
                        ? 'Resultado registrado. O próximo jogo começa automaticamente.'
                        : 'Acompanhe a partida. Os acontecimentos avançam automaticamente.'}
                </p>
              </>
            )}
          </section>
        )}
        {screen === 'result' && (
          <section
            className={`final-screen ${tournament.outcome === 'Campeão mundial' ? 'champion' : ''}`}
          >
            <div className="final-symbol">
              {tournament.outcome === 'Campeão mundial' ? <Trophy size={54} /> : <Flag size={48} />}
            </div>
            <span className="eyebrow">
              {tournament.outcome === 'Campeão mundial'
                ? 'VOCÊ REESCREVEU A HISTÓRIA'
                : 'FIM DE UMA JORNADA. COMEÇO DE OUTRA.'}
            </span>
            <h1 ref={title} tabIndex={-1}>
              {tournament.outcome === 'Campeão mundial' ? (
                <>
                  CAMPEÃO
                  <br />
                  <span>MUNDIAL.</span>
                </>
              ) : (
                tournament.outcome
              )}
              <span>{tournament.outcome === 'Campeão mundial' ? '' : '.'}</span>
            </h1>
            <p>
              {tournament.outcome === 'Campeão mundial'
                ? 'Cinco escolhas. Diferentes eras. O mundo é seu.'
                : 'O próximo draft pode ser lendário. Novas composições, novas possibilidades.'}
            </p>
            {campaignSource === 'daily' && dailyAttemptKind && (
              <div className={`daily-result-badge ${dailyAttemptKind}`}>
                <CalendarDays size={18} />
                <span>
                  <b>
                    Desafio diário ·{' '}
                    {dailyAttemptKind === 'official' ? 'tentativa oficial' : 'amistosa'}
                  </b>
                  {dailyAttemptKind === 'official'
                    ? 'Resultado salvo neste dispositivo.'
                    : 'Esta partida não substitui sua tentativa oficial.'}
                </span>
              </div>
            )}
            {!!currentAchievements.length && (
              <section className="result-achievements" aria-labelledby="result-achievements-title">
                <span id="result-achievements-title">CONQUISTAS DESTA CAMPANHA</span>
                <div>
                  {currentAchievements.map((achievement) => (
                    <article key={achievement.id}>
                      <b>{achievement.title}</b>
                      <small>{achievement.description}</small>
                    </article>
                  ))}
                </div>
              </section>
            )}
            <div className="final-record">
              <div>
                <b>{totalWins}</b>
                <span>JOGOS VENCIDOS</span>
              </div>
              <div>
                <b>{totalLosses}</b>
                <span>JOGOS PERDIDOS</span>
              </div>
              <div>
                <b>{tournament.history.length}</b>
                <span>CONFRONTOS</span>
              </div>
            </div>
            <TeamStrip team={team} />
            {gameMode === 'almanac' && (
              <section className="almanac-reveal" aria-labelledby="almanac-reveal-title">
                <span className="eyebrow green">REVELAÇÃO DO ALMANAQUE</span>
                <h2 id="almanac-reveal-title">Agora os números entram em campo.</h2>
                <p>Veja os ratings, a sinergia e a força que acompanharam cada jogo da campanha.</p>
                <div className="game-tabs" role="tablist" aria-label="Ratings revelados">
                  {[1, 2, 3, 4, 5].map((game) => (
                    <button
                      key={game}
                      role="tab"
                      aria-selected={preview === game}
                      className={preview === game ? 'selected' : ''}
                      onClick={() => setPreview(game)}
                    >
                      Jogo {game}
                    </button>
                  ))}
                </div>
                <Composition team={team} game={preview} data={viewData} gamePlan={gamePlan} />
              </section>
            )}
            <CampaignShare
              challengeUrl={activeChallengeUrl}
              summary={{
                outcome: tournament.outcome ?? 'Campanha concluída',
                wins: totalWins,
                losses: totalLosses,
                confrontations: tournament.history.length,
                challengeCode: activeChallenge ? challengeCode(activeChallenge) : undefined,
                gameMode,
                gamePlan,
                team: team.map((player) => ({
                  role: player.role,
                  playerName: player.playerName,
                  team: player.team,
                  worldsYear: player.worldsYear,
                })),
              }}
              onTrack={(event, method) =>
                analytics.track(event, {
                  outcome: tournament.outcome ?? 'Campanha concluída',
                  share_method: method,
                })
              }
            />
            <div className="final-actions">
              <button className="primary" onClick={() => requestStart()}>
                Jogar novamente <RotateCcw size={19} />
              </button>
              <a className="secondary" href="#campaign-history">
                Ver histórico <History size={18} />
              </a>
              <button className="secondary" onClick={continueLater}>
                Voltar ao início <House size={18} />
              </button>
            </div>
            <CampaignHistory tournament={tournament} open={setReport} />
            {analyticsEnabled && (
              <Suspense fallback={null}>
                <CampaignFeedback tracker={analytics} />
              </Suspense>
            )}
          </section>
        )}
      </main>
      <footer className="site-footer">
        <span>
          DRAFT LENDAS<span className="footer-dot"> / </span> UM NOVO JEITO DE VIVER O WORLDS.
          <a className="archive-footer-link" href="/arquivo">
            Arquivo histórico
          </a>
        </span>
        <span>
          {availableYears} {availableYears === 1 ? 'EDIÇÃO' : 'EDIÇÕES'} · RATINGS ESTIMADOS
          <button onClick={openHelp} aria-label="Sobre os dados">
            <CircleHelp size={14} />
          </button>
        </span>
        <p className="riot-disclaimer">
          Draft Lendas isn't endorsed by Riot Games and doesn't reflect the views or opinions of
          Riot Games or anyone officially involved in producing or managing Riot Games properties.
          Riot Games, and all associated properties are trademarks or registered trademarks of Riot
          Games, Inc.{' '}
          <a href="https://developer.riotgames.com/policies/general">Política oficial</a>.
        </p>
      </footer>
      <PwaStatus />
      {help && (
        <HowTo
          close={() => setHelp(false)}
          years={availableYears}
          regionGroups={availableRegionGroups}
        />
      )}
      {research && (
        <Suspense fallback={null}>
          <ResearchDialog
            player={research === 'method' ? null : research}
            data={viewData}
            tracker={analytics}
            feedbackEnabled={analyticsEnabled}
            hideNumbers={!showRatings}
            close={() => setResearch(null)}
          />
        </Suspense>
      )}
      {report && (
        <ReportDialog
          report={report}
          team={team}
          data={viewData}
          hideStrength={!showRatings}
          close={() => setReport(null)}
        />
      )}
      {exitAction && (
        <CampaignExitDialog
          action={exitAction}
          onCancel={() => {
            replacementStart.current = null;
            setExitAction(null);
          }}
          onConfirm={confirmCampaignExit}
        />
      )}
    </div>
  );
}
