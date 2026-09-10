import { BarChart3, MessageSquareText, RefreshCw, Trophy } from 'lucide-react';
import playerIndex from '../data/player-index.json';
import { analyticsPlayerId } from '../game/analytics';
import type { DashboardMetrics, MetricCount } from './dashboard';

const playerLabels = new Map(
  playerIndex.map((player) => [
    analyticsPlayerId(player.id),
    `${player.playerName} · ${player.worldsYear} ${player.team}`,
  ]),
);
const dashboardRegionLabels: Record<string, string> = {
  KOREA: 'Coreia',
  CHINA: 'China',
  EUROPE: 'Europa',
  NORTH_AMERICA: 'América do Norte',
  OTHER_REGIONS: 'Outras Regiões',
  EUROPE_NORTH_AMERICA: 'Europa + América do Norte',
};

function percent(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function duration(seconds: number | null): string {
  if (seconds === null) return 'Sem dados';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return minutes ? `${minutes} min ${remainingSeconds}s` : `${remainingSeconds}s`;
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <article className="admin-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

function RankedList({
  title,
  items,
  resolveLabel,
}: {
  title: string;
  items: MetricCount[];
  resolveLabel?: (item: MetricCount) => string;
}) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <section className="admin-ranking">
      <h2>{title}</h2>
      {items.length ? (
        <ol>
          {items.map((item) => (
            <li key={item.key}>
              <span className="admin-ranking-label">{resolveLabel?.(item) ?? item.label}</span>
              <span className="admin-ranking-bar" aria-hidden="true">
                <span style={{ width: `${(item.count / max) * 100}%` }} />
              </span>
              <b>{item.count}</b>
            </li>
          ))}
        </ol>
      ) : (
        <p className="admin-empty">Sem dados ainda.</p>
      )}
    </section>
  );
}

function OutcomeList({ items }: { items: MetricCount[] }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <section className="admin-outcomes">
      <div className="admin-section-heading">
        <div>
          <span className="admin-kicker">RESULTADOS DE CAMPANHA</span>
          <h2>Onde as campanhas terminam.</h2>
        </div>
        <Trophy size={21} />
      </div>
      <div className="admin-outcome-bars">
        {items.map((item) => (
          <div key={item.key}>
            <span>{item.label}</span>
            <div>
              <i style={{ width: `${(item.count / max) * 100}%` }} />
              <b>{item.count}</b>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminDashboard({
  metrics,
  loading,
  error,
  onRefresh,
}: {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  if (loading && !metrics)
    return (
      <section className="admin-dashboard-state" aria-live="polite">
        <RefreshCw className="spin" size={22} /> Carregando métricas.
      </section>
    );

  if (error && !metrics)
    return (
      <section className="admin-dashboard-state admin-dashboard-error" role="alert">
        <span>As métricas não estão disponíveis.</span>
        <button className="admin-secondary" onClick={onRefresh}>
          Tentar novamente
        </button>
      </section>
    );

  if (!metrics) return null;
  const { overview, feedback } = metrics;
  return (
    <section className="admin-dashboard">
      <div className="admin-title-row">
        <div>
          <span className="admin-kicker">VISÃO GERAL</span>
          <h1>Campanhas em movimento.</h1>
        </div>
        <button
          className="admin-refresh"
          onClick={onRefresh}
          disabled={loading}
          title="Atualizar métricas"
        >
          <RefreshCw className={loading ? 'spin' : ''} size={17} />
          Atualizar
        </button>
      </div>
      {error && (
        <p className="admin-notice error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-metric-grid">
        <MetricCard label="Drafts iniciados" value={overview.draftsStarted} />
        <MetricCard
          label="Drafts concluídos"
          value={overview.draftsCompleted}
          detail={percent(overview.draftCompletionRate)}
        />
        <MetricCard
          label="Worlds iniciados"
          value={overview.worldsStarted}
          detail={percent(overview.worldsStartRate)}
        />
        <MetricCard label="Jogar novamente" value={percent(overview.playAgainRate)} />
        <MetricCard label="Duração média do draft" value={duration(overview.averageDraftSeconds)} />
        <MetricCard
          label="Duração média campanha"
          value={duration(overview.averageCampaignSeconds)}
        />
        <MetricCard label="Trocas usadas" value={overview.exchangesUsed} />
        <MetricCard label="Feedback recebido" value={feedback.total} />
      </div>

      <OutcomeList items={metrics.outcomes} />

      <div className="admin-dashboard-grid">
        <RankedList title="Trocas por tipo" items={metrics.exchanges} />
        <RankedList title="Anos sorteados" items={metrics.years} />
        <RankedList
          title="Grupos regionais"
          items={metrics.regionGroups}
          resolveLabel={(item) => dashboardRegionLabels[item.key] ?? item.label}
        />
        <RankedList title="Dispositivos" items={metrics.devices} />
      </div>

      <div className="admin-dashboard-grid admin-player-grid">
        <RankedList
          title="Jogadores mais escolhidos"
          items={metrics.playerPicks}
          resolveLabel={(item) => playerLabels.get(item.key) ?? item.label}
        />
        <RankedList
          title="Jogadores mais recusados"
          items={metrics.playerRejections}
          resolveLabel={(item) => playerLabels.get(item.key) ?? item.label}
        />
      </div>

      <section className="admin-feedback-summary">
        <div className="admin-section-heading">
          <div>
            <span className="admin-kicker">FEEDBACK ANÔNIMO</span>
            <h2>O que chegou das campanhas.</h2>
          </div>
          <MessageSquareText size={21} />
        </div>
        <div className="admin-feedback-stats">
          <span className="good">
            <b>{feedback.good}</b> Bom
          </span>
          <span className="ok">
            <b>{feedback.ok}</b> Ok
          </span>
          <span className="bad">
            <b>{feedback.bad}</b> Ruim
          </span>
        </div>
        {feedback.notes.length ? (
          <div className="admin-feedback-notes">
            {feedback.notes.map((note, index) => (
              <article key={`${note.createdAt}-${index}`}>
                <span className={`feedback-rating ${note.rating}`}>{note.rating}</span>
                <p>{note.note}</p>
                <small>{new Date(note.createdAt).toLocaleString('pt-BR')}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty">Sem comentários ainda.</p>
        )}
      </section>
      <p className="admin-dashboard-timestamp">
        <BarChart3 size={15} /> Atualizado em{' '}
        {new Date(metrics.generatedAt).toLocaleString('pt-BR')}
      </p>
    </section>
  );
}
