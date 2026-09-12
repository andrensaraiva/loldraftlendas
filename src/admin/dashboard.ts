export interface MetricCount {
  key: string;
  label: string;
  count: number;
}

export interface FeedbackMetrics {
  total: number;
  good: number;
  ok: number;
  bad: number;
  notes: Array<{ rating: 'good' | 'ok' | 'bad'; note: string; createdAt: string }>;
}

export interface DashboardMetrics {
  generatedAt: string;
  overview: {
    draftsStarted: number;
    draftsCompleted: number;
    draftCompletionRate: number;
    worldsStarted: number;
    worldsStartRate: number;
    playAgainRate: number;
    averageDraftSeconds: number | null;
    averageCampaignSeconds: number | null;
    exchangesUsed: number;
    shareIntentRate: number;
    sharesCompleted: number;
    cardsDownloaded: number;
  };
  outcomes: MetricCount[];
  exchanges: MetricCount[];
  playerPicks: MetricCount[];
  playerRejections: MetricCount[];
  years: MetricCount[];
  regionGroups: MetricCount[];
  devices: MetricCount[];
  feedback: FeedbackMetrics;
}

interface DashboardResponse {
  generated_at: string;
  overview: {
    drafts_started: number;
    drafts_completed: number;
    draft_completion_rate: number;
    worlds_started: number;
    worlds_start_rate: number;
    play_again_rate: number;
    average_draft_seconds: number | null;
    average_campaign_seconds: number | null;
    exchanges_used: number;
    share_intent_rate: number;
    shares_completed: number;
    cards_downloaded: number;
  };
  outcomes: Array<{ key: string; label: string; count: number }>;
  exchanges: Array<{ key: string; label: string; count: number }>;
  player_picks: Array<{ key: string; label: string; count: number }>;
  player_rejections: Array<{ key: string; label: string; count: number }>;
  years: Array<{ key: string; label: string; count: number }>;
  region_groups: Array<{ key: string; label: string; count: number }>;
  devices: Array<{ key: string; label: string; count: number }>;
  feedback: {
    total: number;
    good: number;
    ok: number;
    bad: number;
    notes: Array<{ rating: 'good' | 'ok' | 'bad'; note: string; created_at: string }>;
  };
}

function numberValue(value: unknown, nullable = false): number | null {
  if (nullable && value === null) return null;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function counts(value: unknown): MetricCount[] | null {
  if (!Array.isArray(value)) return null;
  const parsed = value.map((entry) => {
    if (!entry || typeof entry !== 'object') return null;
    const candidate = entry as Partial<MetricCount>;
    return typeof candidate.key === 'string' &&
      typeof candidate.label === 'string' &&
      numberValue(candidate.count) !== null
      ? { key: candidate.key, label: candidate.label, count: candidate.count! }
      : null;
  });
  return parsed.every((entry) => entry !== null) ? (parsed as MetricCount[]) : null;
}

export function dashboardMetricsFromResponse(value: unknown): DashboardMetrics {
  if (!value || typeof value !== 'object') throw new Error('Métricas administrativas inválidas.');
  const response = value as Partial<DashboardResponse>;
  const overview = response.overview;
  const lists = [
    counts(response.outcomes),
    counts(response.exchanges),
    counts(response.player_picks),
    counts(response.player_rejections),
    counts(response.years),
    counts(response.region_groups),
    counts(response.devices),
  ];
  const feedback = response.feedback;
  if (
    typeof response.generated_at !== 'string' ||
    Number.isNaN(Date.parse(response.generated_at)) ||
    !overview ||
    !lists.every((list) => list !== null) ||
    !feedback ||
    numberValue(overview.drafts_started) === null ||
    numberValue(overview.drafts_completed) === null ||
    numberValue(overview.draft_completion_rate) === null ||
    numberValue(overview.worlds_started) === null ||
    numberValue(overview.worlds_start_rate) === null ||
    numberValue(overview.play_again_rate) === null ||
    (numberValue(overview.average_draft_seconds, true) === null &&
      overview.average_draft_seconds !== null) ||
    (numberValue(overview.average_campaign_seconds, true) === null &&
      overview.average_campaign_seconds !== null) ||
    numberValue(overview.exchanges_used) === null ||
    numberValue(overview.share_intent_rate) === null ||
    numberValue(overview.shares_completed) === null ||
    numberValue(overview.cards_downloaded) === null ||
    numberValue(feedback.total) === null ||
    numberValue(feedback.good) === null ||
    numberValue(feedback.ok) === null ||
    numberValue(feedback.bad) === null ||
    !Array.isArray(feedback.notes) ||
    !feedback.notes.every(
      (note) =>
        note &&
        typeof note.note === 'string' &&
        ['good', 'ok', 'bad'].includes(note.rating) &&
        typeof note.created_at === 'string' &&
        !Number.isNaN(Date.parse(note.created_at)),
    )
  )
    throw new Error('Métricas administrativas inválidas.');

  return {
    generatedAt: response.generated_at,
    overview: {
      draftsStarted: overview.drafts_started,
      draftsCompleted: overview.drafts_completed,
      draftCompletionRate: overview.draft_completion_rate,
      worldsStarted: overview.worlds_started,
      worldsStartRate: overview.worlds_start_rate,
      playAgainRate: overview.play_again_rate,
      averageDraftSeconds: overview.average_draft_seconds,
      averageCampaignSeconds: overview.average_campaign_seconds,
      exchangesUsed: overview.exchanges_used,
      shareIntentRate: overview.share_intent_rate,
      sharesCompleted: overview.shares_completed,
      cardsDownloaded: overview.cards_downloaded,
    },
    outcomes: lists[0]!,
    exchanges: lists[1]!,
    playerPicks: lists[2]!,
    playerRejections: lists[3]!,
    years: lists[4]!,
    regionGroups: lists[5]!,
    devices: lists[6]!,
    feedback: {
      total: feedback.total,
      good: feedback.good,
      ok: feedback.ok,
      bad: feedback.bad,
      notes: feedback.notes.map((note) => ({
        rating: note.rating,
        note: note.note,
        createdAt: note.created_at,
      })),
    },
  };
}

export function localDemoDashboard(): DashboardMetrics {
  return {
    generatedAt: '2026-09-09T15:45:00.000Z',
    overview: {
      draftsStarted: 248,
      draftsCompleted: 182,
      draftCompletionRate: 73.4,
      worldsStarted: 165,
      worldsStartRate: 90.7,
      playAgainRate: 31.9,
      averageDraftSeconds: 111,
      averageCampaignSeconds: 476,
      exchangesUsed: 284,
      shareIntentRate: 18.8,
      sharesCompleted: 24,
      cardsDownloaded: 11,
    },
    outcomes: [
      { key: 'swiss_eliminated', label: 'Eliminado no Suíço', count: 76 },
      { key: 'quarters', label: 'Quartas de final', count: 31 },
      { key: 'semis', label: 'Semifinalista', count: 22 },
      { key: 'runner_up', label: 'Vice-campeão', count: 12 },
      { key: 'champion', label: 'Campeão mundial', count: 24 },
    ],
    exchanges: [
      { key: 'year', label: 'Ano', count: 107 },
      { key: 'region', label: 'Região', count: 92 },
      { key: 'players', label: 'Jogadores', count: 85 },
    ],
    playerPicks: [
      { key: 'faker-2017-skt', label: 'Faker · 2017 SKT', count: 43 },
      { key: 'ruler-2022-gen', label: 'Ruler · 2022 GEN', count: 37 },
      { key: 'canyon-2020-dwg', label: 'Canyon · 2020 DWG', count: 32 },
      { key: 'keria-2023-t1', label: 'Keria · 2023 T1', count: 29 },
      { key: 'marin-2015-skt', label: 'MaRin · 2015 SKT', count: 26 },
    ],
    playerRejections: [
      { key: 'doran-2023-gen', label: 'Doran · 2023 GEN', count: 28 },
      { key: 'pyosik-2020-drx', label: 'Pyosik · 2020 DRX', count: 24 },
      { key: 'crown-2017-ssg', label: 'Crown · 2017 SSG', count: 21 },
      { key: 'huni-2017-skt', label: 'Huni · 2017 SKT', count: 18 },
      { key: 'bang-2015-skt', label: 'Bang · 2015 SKT', count: 16 },
    ],
    years: [
      { key: '2023', label: '2023', count: 194 },
      { key: '2022', label: '2022', count: 161 },
      { key: '2020', label: '2020', count: 148 },
      { key: '2019', label: '2019', count: 122 },
      { key: '2017', label: '2017', count: 117 },
      { key: '2015', label: '2015', count: 96 },
    ],
    regionGroups: [
      { key: 'KOREA', label: 'Coreia', count: 245 },
      { key: 'CHINA', label: 'China', count: 193 },
      { key: 'EUROPE', label: 'Europa', count: 162 },
      { key: 'NORTH_AMERICA', label: 'América do Norte', count: 135 },
      { key: 'OTHER_REGIONS', label: 'Outras Regiões', count: 20 },
    ],
    devices: [
      { key: 'desktop', label: 'Desktop', count: 152 },
      { key: 'mobile', label: 'Mobile', count: 96 },
    ],
    feedback: {
      total: 67,
      good: 48,
      ok: 14,
      bad: 5,
      notes: [
        {
          rating: 'good',
          note: 'Draft rápido e as trocas deixam cada equipe diferente.',
          createdAt: '2026-09-09T14:02:00.000Z',
        },
        {
          rating: 'ok',
          note: 'Gostaria de mais edições históricas.',
          createdAt: '2026-09-09T12:40:00.000Z',
        },
        {
          rating: 'good',
          note: 'Acompanhar a série ficou bem claro no celular.',
          createdAt: '2026-09-08T20:15:00.000Z',
        },
      ],
    },
  };
}
