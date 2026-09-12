export const ANALYTICS_EVENTS = [
  'session_started',
  'draft_started',
  'roll_generated',
  'exchange_used',
  'player_selected',
  'draft_completed',
  'worlds_started',
  'series_started',
  'game_completed',
  'playoffs_reached',
  'worlds_won',
  'campaign_finished',
  'play_again',
  'save_resumed',
  'how_to_play_opened',
  'rating_details_opened',
  'share_started',
  'share_completed',
  'card_downloaded',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];
export type FeedbackRating = 'good' | 'ok' | 'bad';
export type DeviceType = 'mobile' | 'desktop';
type AnalyticsValue = string | number | boolean | string[];
export type AnalyticsProperties = Record<string, AnalyticsValue>;

export interface AnalyticsEvent {
  client_event_id: string;
  campaign_id: string;
  session_id: string;
  event_name: AnalyticsEventName;
  device_type: DeviceType;
  properties: AnalyticsProperties;
}

export interface AnalyticsFeedback {
  campaign_id: string;
  rating: FeedbackRating;
  note: string | null;
}

export interface AnalyticsTransport {
  send(event: AnalyticsEvent): Promise<void>;
  submitFeedback(feedback: AnalyticsFeedback): Promise<void>;
  loadEnabled(): Promise<boolean>;
}

export interface AnalyticsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface AnalyticsOptions {
  transport: AnalyticsTransport | null;
  storage?: AnalyticsStorage | null;
  randomId?: () => string;
  deviceType?: () => DeviceType;
  now?: () => number;
}

const CAMPAIGN_KEY = 'draft-lendas.analytics-campaign';
const SESSION_KEY = 'draft-lendas.analytics-session';
const CAMPAIGN_STARTED_AT_KEY = 'draft-lendas.analytics-campaign-started-at';
const DRAFT_STARTED_AT_KEY = 'draft-lendas.analytics-draft-started-at';
const QUEUE_KEY = 'draft-lendas.analytics-queue';
const ONCE_KEY = 'draft-lendas.analytics-once';
const MAX_QUEUE_SIZE = 50;
const MAX_PROPERTY_STRING_LENGTH = 120;
const MAX_PROPERTIES_BYTES = 1200;
const BLOCKED_PROPERTY_KEYS = new Set(['email', 'name', 'note', 'password', 'token']);

export function analyticsPlayerId(playerId: string): string {
  return playerId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function browserStorage(kind: 'local' | 'session'): AnalyticsStorage | null {
  try {
    if (typeof window === 'undefined') return null;
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return '00000000-0000-4000-8000-000000000000';
}

function detectDeviceType(): DeviceType {
  return typeof window !== 'undefined' && window.innerWidth <= 700 ? 'mobile' : 'desktop';
}

function safeProperties(properties: AnalyticsProperties): AnalyticsProperties {
  const output: AnalyticsProperties = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!/^[a-z][a-z0-9_]{0,40}$/.test(key) || BLOCKED_PROPERTY_KEYS.has(key)) continue;
    if (typeof value === 'string') output[key] = value.slice(0, MAX_PROPERTY_STRING_LENGTH);
    else if (typeof value === 'number' && Number.isFinite(value)) output[key] = Math.round(value);
    else if (typeof value === 'boolean') output[key] = value;
    else if (
      Array.isArray(value) &&
      value.length <= 5 &&
      value.every((item) => typeof item === 'string' && item.length <= MAX_PROPERTY_STRING_LENGTH)
    )
      output[key] = value;
  }
  return JSON.stringify(output).length <= MAX_PROPERTIES_BYTES ? output : {};
}

function parseQueue(value: string | null): AnalyticsEvent[] {
  if (!value) return [];
  try {
    const queue = JSON.parse(value) as unknown;
    return Array.isArray(queue) ? (queue as AnalyticsEvent[]).slice(-MAX_QUEUE_SIZE) : [];
  } catch {
    return [];
  }
}

function parseStrings(value: string | null): string[] {
  if (!value) return [];
  try {
    const items = JSON.parse(value) as unknown;
    return Array.isArray(items) && items.every((item) => typeof item === 'string') ? items : [];
  } catch {
    return [];
  }
}

function persist(storage: AnalyticsStorage | null, key: string, value: unknown): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Optional browser storage cannot interrupt gameplay or feedback.
  }
}

export class AnalyticsTracker {
  private readonly localStorage: AnalyticsStorage | null;
  private readonly sessionStorage: AnalyticsStorage | null;
  private readonly randomId: () => string;
  private readonly deviceType: () => DeviceType;
  private readonly now: () => number;
  private enabled = false;
  private flushPromise: Promise<void> | null = null;
  private campaignId: string;
  private sessionId: string;

  constructor(private readonly options: AnalyticsOptions) {
    this.localStorage = options.storage ?? browserStorage('local');
    this.sessionStorage = options.storage ?? browserStorage('session');
    this.randomId = options.randomId ?? createId;
    this.deviceType = options.deviceType ?? detectDeviceType;
    this.now = options.now ?? Date.now;
    this.campaignId = this.readOrCreate(this.localStorage, CAMPAIGN_KEY);
    this.sessionId = this.readOrCreate(this.sessionStorage, SESSION_KEY);
  }

  async initialize(): Promise<boolean> {
    if (!this.options.transport) return false;
    try {
      this.enabled = await this.options.transport.loadEnabled();
      if (this.enabled) {
        this.trackOnce('session_started', 'session_started');
        void this.flush();
      }
    } catch {
      this.enabled = false;
    }
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  startCampaign(): void {
    this.campaignId = this.randomId();
    persist(this.localStorage, CAMPAIGN_KEY, this.campaignId);
    persist(this.localStorage, CAMPAIGN_STARTED_AT_KEY, this.now());
    persist(this.localStorage, DRAFT_STARTED_AT_KEY, this.now());
    this.trackOnce('draft_started', 'draft_started');
  }

  campaignElapsedMs(): number {
    return this.elapsedMs(CAMPAIGN_STARTED_AT_KEY);
  }

  draftElapsedMs(): number {
    return this.elapsedMs(DRAFT_STARTED_AT_KEY);
  }

  track(eventName: AnalyticsEventName, properties: AnalyticsProperties = {}): void {
    if (!this.enabled) return;
    const queue = parseQueue(this.localStorage?.getItem(QUEUE_KEY) ?? null);
    queue.push({
      client_event_id: this.randomId(),
      campaign_id: this.campaignId,
      session_id: this.sessionId,
      event_name: eventName,
      device_type: this.deviceType(),
      properties: safeProperties(properties),
    });
    persist(this.localStorage, QUEUE_KEY, queue.slice(-MAX_QUEUE_SIZE));
    void this.flush();
  }

  trackOnce(
    key: string,
    eventName: AnalyticsEventName,
    properties: AnalyticsProperties = {},
  ): void {
    if (!this.enabled) return;
    const scope = `${this.campaignId}:${key}`;
    const recorded = new Set(parseStrings(this.sessionStorage?.getItem(ONCE_KEY) ?? null));
    if (recorded.has(scope)) return;
    recorded.add(scope);
    persist(this.sessionStorage, ONCE_KEY, [...recorded].slice(-100));
    this.track(eventName, properties);
  }

  async submitFeedback(rating: FeedbackRating, note: string): Promise<boolean> {
    if (!this.enabled || !this.options.transport) return false;
    try {
      await this.options.transport.submitFeedback({
        campaign_id: this.campaignId,
        rating,
        note: note.trim().slice(0, 500) || null,
      });
      return true;
    } catch {
      return false;
    }
  }

  async flush(): Promise<void> {
    if (!this.enabled || !this.options.transport) return;
    const activeFlush = this.flushPromise;
    if (activeFlush) {
      await activeFlush;
      if (parseQueue(this.localStorage?.getItem(QUEUE_KEY) ?? null).length) await this.flush();
      return;
    }
    const nextFlush = this.flushQueue();
    this.flushPromise = nextFlush;
    try {
      await nextFlush;
    } finally {
      if (this.flushPromise === nextFlush) this.flushPromise = null;
    }
    if (parseQueue(this.localStorage?.getItem(QUEUE_KEY) ?? null).length) await this.flush();
  }

  private async flushQueue(): Promise<void> {
    try {
      while (true) {
        const queue = parseQueue(this.localStorage?.getItem(QUEUE_KEY) ?? null);
        const event = queue[0];
        if (!event) return;
        await this.options.transport!.send(event);
        const currentQueue = parseQueue(this.localStorage?.getItem(QUEUE_KEY) ?? null);
        persist(
          this.localStorage,
          QUEUE_KEY,
          currentQueue.filter((queued) => queued.client_event_id !== event.client_event_id),
        );
      }
    } catch {
      // Keep the remaining queue for a later page interaction; never surface telemetry errors to players.
    }
  }

  private readOrCreate(storage: AnalyticsStorage | null, key: string): string {
    try {
      const existing = storage?.getItem(key);
      if (existing) return existing;
    } catch {
      // Fall back to an in-memory anonymous identifier.
    }
    const id = this.randomId();
    persist(storage, key, id);
    return id;
  }

  private elapsedMs(key: string): number {
    try {
      const startedAt = Number(this.localStorage?.getItem(key));
      return Number.isFinite(startedAt) && startedAt > 0 ? Math.max(0, this.now() - startedAt) : 0;
    } catch {
      return 0;
    }
  }
}

class SupabaseAnalyticsTransport implements AnalyticsTransport {
  constructor(
    private readonly url: string,
    private readonly anonKey: string,
  ) {}

  async loadEnabled(): Promise<boolean> {
    const config = await this.request<{ analytics_enabled: boolean }>(
      '/rest/v1/rpc/get_public_product_config',
      {},
    );
    return config.analytics_enabled === true;
  }

  async send(event: AnalyticsEvent): Promise<void> {
    await this.request('/rest/v1/rpc/record_analytics_event', {
      p_client_event_id: event.client_event_id,
      p_campaign_id: event.campaign_id,
      p_session_id: event.session_id,
      p_event_name: event.event_name,
      p_device_type: event.device_type,
      p_properties: event.properties,
    });
  }

  async submitFeedback(feedback: AnalyticsFeedback): Promise<void> {
    await this.request('/rest/v1/rpc/submit_campaign_feedback', {
      p_campaign_id: feedback.campaign_id,
      p_rating: feedback.rating,
      p_note: feedback.note,
    });
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.url}${path}`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${this.anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Analytics endpoint unavailable.');
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

class LocalDemoAnalyticsTransport implements AnalyticsTransport {
  async loadEnabled(): Promise<boolean> {
    return true;
  }

  async send(): Promise<void> {
    // The local admin demonstration intentionally does not retain analytics events.
  }

  async submitFeedback(): Promise<void> {
    // The local admin demonstration intentionally does not retain feedback.
  }
}

export function createAnalyticsTracker(): AnalyticsTracker {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  let transport: AnalyticsTransport | null = null;
  if (url && anonKey) {
    try {
      new URL(url);
      transport = new SupabaseAnalyticsTransport(url, anonKey);
    } catch {
      transport = null;
    }
  }
  if (!transport && import.meta.env.DEV && import.meta.env.VITE_ADMIN_DEMO_MODE === 'true')
    transport = new LocalDemoAnalyticsTransport();
  return new AnalyticsTracker({ transport });
}
