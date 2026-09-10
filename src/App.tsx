import {
  DRAFT_CONFIG,
  createDraftFromPlan,
  eligiblePools,
  exchangeAlternatives,
  exchangeRound,
  offerKey,
  planDraft,
} from './game/draft';
import type { Exchange } from './game/draft';
import { clearCampaign, loadCampaign, saveCampaign } from './game/campaign';
import type { CampaignScreen, CampaignState } from './game/campaign';
import { analyticsPlayerId, createAnalyticsTracker } from './game/analytics';
import type { AnalyticsProperties } from './game/analytics';
import {
  defaultDraftAvailability,
  loadPublicProductConfig,
  safeDraftAvailability,
} from './game/product-config';
import type { DraftAvailability } from './game/draft';
import { canonicalRegionFor } from './game/regions';
import { championArt } from './data/art';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleHelp,
  Flag,
  Menu,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { LocalDataRepository } from './data/repository';
import type { GameData } from './data/repository';
import { ROLES } from './game/types';
import type {
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
import {
  advanceTournament,
  createSeries,
  formatFor,
  newTournament,
  seriesDone,
  seriesScore,
  simulateGame,
  teamStrength,
  validateData,
} from './game/engine';

const roleLabel: Record<Role, string> = {
  TOP: 'TOP',
  JUNGLE: 'JG',
  MID: 'MID',
  ADC: 'ADC',
  SUPPORT: 'SUP',
};
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
function ReportDialog({
  report,
  team,
  data,
  close,
}: {
  report: ReportSelection;
  team: Team;
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
    <div className="history campaign-history">
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
        </li>
        <li>
          <b>Pense além do primeiro jogo.</b>
          <p>
            Os campeões são fixos: G1 no jogo 1, G2 no jogo 2 e assim por diante. Cada série
            reinicia no G1.
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
        {years} edições do Worlds · {regionGroups} grupos de draft. Pools comprovados; ratings
        estimados a partir das estatísticas globais por posição. A simulação e o KDA das partidas do
        jogo são fictícios. As cartas usam avatares originais e neutros para os jogadores.
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
function PlayerAvatar({ player, className = '' }: { player: PlayerVersion; className?: string }) {
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
function Composition({ team, game, data }: { team: Team; game: number; data: GameData }) {
  const strength = teamStrength(team, game, data.champions);
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
                <b>{slot.rating}</b>
              </div>
              <strong>{c.name}</strong>
              <small>
                {p.playerName} · {p.worldsYear}
              </small>
            </div>
          );
        })}
      </div>
      <div className="composition-scores">
        <span>
          Rating médio <b>{strength.average.toFixed(1)}</b>
        </span>
        <span>
          Sinergia da comp <b>{strength.composition}</b>
        </span>
        <span className="strength-total">
          Força da equipe <b>{strength.total.toFixed(1)}</b>
        </span>
      </div>
    </div>
  );
}
function PlayerCard({
  player,
  data,
  onPick,
  index,
  selected,
  disabled,
}: {
  player: PlayerVersion;
  data: GameData;
  onPick: () => void;
  index: number;
  selected: boolean;
  disabled: boolean;
}) {
  return (
    <button
      className={`player-card ${selected ? 'is-picked' : ''}`}
      disabled={disabled}
      aria-pressed={selected}
      onClick={onPick}
      aria-label={`Escolher ${player.playerName}, ${player.team}, ${player.worldsYear}`}
      style={{ animationDelay: `${index * 65}ms` }}
    >
      <div className="player-info">
        <div className="player-title">
          <div>
            <h2>{player.playerName}</h2>
            <p>
              {player.team} <span>·</span> Worlds {player.worldsYear}
            </p>
          </div>
          <span className="pick-arrow">
            <ArrowUpRight size={23} />
          </span>
        </div>
        <div className="player-art">
          <PlayerAvatar player={player} />
          <span className="card-team">
            {player.team}
            <span>{player.worldsYear}</span>
          </span>
          <span className="card-role">{roleLabel[player.role]}</span>
          <span className="art-caption">AVATAR ORIGINAL · PERFIL DE JOGADOR</span>
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
            const c = data.champions[slot.championId];
            return (
              <div key={slot.game} className="pool-slot">
                <span>G{slot.game}</span>
                <Art src={championArt(c, player.worldsYear).image} alt="" />
                <b>{slot.rating}</b>
                <small>{c.name}</small>
              </div>
            );
          })}
        </div>
        <span className="card-action">
          {selected ? 'Escalado ✓' : `Escalar ${player.playerName}`}
          <ArrowRight size={17} />
        </span>
      </div>
    </button>
  );
}
export default function App() {
  const [data, setData] = useState<GameData | null>(null);
  const [loadingGame, setLoadingGame] = useState(false);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState<Screen>('home');
  const [hasSavedCampaign, setHasSavedCampaign] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [nextDraftAvailability, setNextDraftAvailability] = useState<DraftAvailability | null>(
    null,
  );
  const [campaignAvailability, setCampaignAvailability] = useState<DraftAvailability | null>(null);
  const [maintenanceBanner, setMaintenanceBanner] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
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
    let active = true;
    const saved = loadCampaign(catalog.draftRegionManifest.datasetVersion);
    setNextDraftAvailability(defaultDraftAvailability(catalog));
    setHasSavedCampaign(!!saved);
    void loadPublicProductConfig().then((configuration) => {
      if (!active) return;
      setNextDraftAvailability(safeDraftAvailability(catalog, configuration));
      setMaintenanceBanner(configuration?.maintenanceBanner ?? null);
    });
    return () => {
      active = false;
    };
  }, []);
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
    if (!data || screen === 'home') return;
    const campaign: CampaignState = {
      screen,
      draftStep: team.length,
      ...(campaignAvailability ? { draftAvailability: campaignAvailability } : {}),
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
    };
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
    };
    analytics.trackOnce('campaign_finished', 'campaign_finished', properties);
    if (tournament.outcome === 'Campeão mundial')
      analytics.trackOnce('worlds_won', 'worlds_won', properties);
  }, [analyticsEnabled, screen, tournament.outcome]);
  useEffect(() => {
    if (screen === 'tournament' || screen === 'match' || screen === 'result')
      analytics.trackOnce('worlds_started', 'worlds_started');
  }, [analyticsEnabled, screen]);
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
    if (!data || settings.paused || help || report || tournament.outcome) return;
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
          const result = simulateGame(series, team, data.champions);
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
  }, [data, settings, help, report, tournament, screen, series, playResult, momentIndex, team]);
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
  async function start() {
    if (loadingGame) return;
    const availability = nextDraftAvailability ?? defaultDraftAvailability(catalog);
    const plan = planDraft(catalog.draftRegionManifest, availability, Math.random);
    const snapshot = await loadYears(plan.map((round) => round.year));
    if (!snapshot) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    const replay = screen === 'result';
    if (replay) analytics.track('play_again');
    clearCampaign();
    setHasSavedCampaign(false);
    analytics.startCampaign();
    setCampaignAvailability(availability);
    draftLock.current = false;
    setPending(null);
    setRolling(false);
    setRejected([]);
    setRemaining(availability.startingExchanges);
    const nextRounds = createDraftFromPlan(snapshot.players, plan, snapshot.draftRegionManifest);
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
    if (!data || draftLock.current || !rounds[team.length]) return;
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
    if (seriesLock.current) return;
    seriesLock.current = true;
    const snapshot = await loadYears(
      catalog.draftRegionManifest.groups.map((entry) => entry.year),
      screen !== 'tournament',
    );
    if (!snapshot) {
      seriesLock.current = false;
      return;
    }
    const nextSeries = createSeries(tournament, snapshot.players);
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
    analytics.trackOnce('worlds_started', 'worlds_started');
    void beginSeries();
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
  return (
    <div className={`app-shell ${screen === 'draft' ? 'draft-active' : ''}`}>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="brand-lockup">
          <span className="brand">
            DRAFT <em>LENDAS</em>
            <span className="brand-dot">.</span>
          </span>
          <span className="brand-caption">MONTE SUA COMP HISTÓRICA</span>
        </div>
        <nav>
          <span className="edition-badge">
            <span /> WORLDS EDITION
          </span>
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
              {hasSavedCampaign ? (
                <div className="home-actions">
                  <button className="primary start-button" onClick={resume} disabled={loadingGame}>
                    {loadingGame ? 'Carregando campanha…' : 'Continuar campanha'}{' '}
                    <ArrowRight size={23} />
                  </button>
                  <button
                    className="text-button new-draft-button"
                    onClick={start}
                    disabled={loadingGame}
                  >
                    Novo draft <RotateCcw size={15} />
                  </button>
                </div>
              ) : (
                <button className="primary start-button" onClick={start} disabled={loadingGame}>
                  {loadingGame ? 'Preparando draft…' : 'Começar draft'} <ArrowRight size={23} />
                </button>
              )}
              <span className="start-note">5 escolhas · Sem cadastro · Draft em 2 minutos</span>
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
                  {availableYears} EDIÇÕES DO WORLDS.
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
                  {roleLabel[draft.role]} · ESCOLHA {team.length + 1} DE 5
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
            <div className={`player-grid ${rolling ? 'is-rolling' : ''}`} key={offerKey(draft)}>
              {draft.options.map((p, i) => (
                <article className="player-option" key={p.id}>
                  <PlayerCard
                    player={p}
                    data={viewData}
                    onPick={() => choose(p)}
                    index={i}
                    selected={pending === p.id}
                    disabled={!!pending || rolling}
                  />
                  <button
                    className="player-details text-button"
                    onClick={() => openResearch(p)}
                    disabled={!!pending || rolling}
                    aria-label={`Detalhes de ${p.playerName}`}
                  >
                    Histórico e estatísticas <ArrowUpRight size={12} />
                  </button>
                </article>
              ))}
            </div>
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
            <div className="subheading">
              <h2>Seu plano para cada jogo</h2>
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
            <Composition team={team} game={preview} data={viewData} />
            <AutoplayControls settings={settings} onChange={setSettings} />
            <div className="action-bar">
              <p>
                <Shield size={20} /> A força ajuda. A vitória se conquista.
              </p>
              <button className="primary" onClick={() => setScreen('tournament')}>
                Entrar no Worlds <ArrowRight size={20} />
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
                    {g && (
                      <small>
                        {g.strength.toFixed(1)} vs {g.opponentStrength.toFixed(1)}
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
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
                    <Composition team={team} game={currentGame} data={viewData} />
                    <div className="opponent-line">
                      <span>
                        Comp adversária · Força{' '}
                        {teamStrength(
                          series.opponent,
                          currentGame,
                          viewData.champions,
                        ).total.toFixed(1)}
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
                                  {c.name} · {p.championPool[currentGame - 1].rating}
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
            <button className="primary" onClick={start}>
              Jogar novamente <RotateCcw size={19} />
            </button>
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
        </span>
        <span>
          {availableYears} EDIÇÕES · RATINGS ESTIMADOS
          <button onClick={openHelp} aria-label="Sobre os dados">
            <CircleHelp size={14} />
          </button>
        </span>
      </footer>
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
            close={() => setResearch(null)}
          />
        </Suspense>
      )}
      {report && (
        <ReportDialog report={report} team={team} data={viewData} close={() => setReport(null)} />
      )}
    </div>
  );
}
