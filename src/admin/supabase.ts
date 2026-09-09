import { productConfigFromRow, productConfigToUpdate } from './config';
import type { ProductConfig, ProductConfigRow } from './config';
import { dashboardMetricsFromResponse } from './dashboard';
import type { DashboardMetrics } from './dashboard';

const SESSION_KEY = 'draft-lendas.admin-session';

export interface AdminSession {
  accessToken: string;
  expiresAt: number;
}

interface AuthResponse {
  access_token: string;
  expires_in: number;
}

interface SupabaseError {
  message?: string;
  error_description?: string;
  msg?: string;
}

export class SupabaseAdminClient {
  constructor(
    private readonly url: string,
    private readonly anonKey: string,
  ) {}

  restoreSession(): AdminSession | null {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Partial<AdminSession>;
      if (
        typeof session.accessToken !== 'string' ||
        typeof session.expiresAt !== 'number' ||
        session.expiresAt <= Date.now()
      ) {
        this.clearSession();
        return null;
      }
      return { accessToken: session.accessToken, expiresAt: session.expiresAt };
    } catch {
      this.clearSession();
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AdminSession> {
    const response = await this.request<AuthResponse>('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const session = {
      accessToken: response.access_token,
      expiresAt: Date.now() + response.expires_in * 1000,
    };
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // A restricted browser can still use the current session in memory.
    }
    return session;
  }

  async signOut(session: AdminSession): Promise<void> {
    try {
      await this.request<null>('/auth/v1/logout', { method: 'POST' }, session);
    } finally {
      this.clearSession();
    }
  }

  async isAdmin(session: AdminSession): Promise<boolean> {
    return this.request<boolean>('/rest/v1/rpc/is_admin', { method: 'POST', body: '{}' }, session);
  }

  async loadProductConfig(session: AdminSession): Promise<ProductConfig> {
    const rows = await this.request<ProductConfigRow[]>(
      '/rest/v1/product_config?select=version,starting_exchanges,active_years,active_region_groups,analytics_enabled,maintenance_banner,dataset_version,updated_at&id=eq.true',
      { method: 'GET' },
      session,
    );
    if (rows.length !== 1) throw new Error('A configuração administrativa não foi encontrada.');
    return productConfigFromRow(rows[0]);
  }

  async updateProductConfig(
    session: AdminSession,
    config: ProductConfig,
  ): Promise<ProductConfig> {
    const update = productConfigToUpdate(config);
    const row = await this.request<ProductConfigRow>(
      '/rest/v1/rpc/update_product_config',
      {
        method: 'POST',
        body: JSON.stringify({
          p_expected_version: update.version,
          p_starting_exchanges: update.starting_exchanges,
          p_active_years: update.active_years,
          p_active_region_groups: update.active_region_groups,
          p_analytics_enabled: update.analytics_enabled,
          p_maintenance_banner: update.maintenance_banner ?? '',
          p_dataset_version: update.dataset_version,
        }),
      },
      session,
    );
    return productConfigFromRow(row);
  }

  async loadDashboardMetrics(session: AdminSession): Promise<DashboardMetrics> {
    const response = await this.request<unknown>(
      '/rest/v1/rpc/get_admin_dashboard_metrics',
      { method: 'POST', body: '{}' },
      session,
    );
    return dashboardMetricsFromResponse(response);
  }

  clearSession(): void {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // No persisted session is required to protect the server-side policies.
    }
  }

  private async request<T>(path: string, init: RequestInit, session?: AdminSession): Promise<T> {
    const response = await fetch(`${this.url}${path}`, {
      ...init,
      headers: {
        apikey: this.anonKey,
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        ...init.headers,
      },
    });
    const responseBody = await response.text();
    const payload = responseBody ? (JSON.parse(responseBody) as T | SupabaseError) : null;
    if (!response.ok) {
      const error = payload as SupabaseError | null;
      throw new Error(error?.message ?? error?.error_description ?? error?.msg ?? 'Erro no Supabase.');
    }
    return payload as T;
  }
}

export function createSupabaseAdminClient(): SupabaseAdminClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  try {
    new URL(url);
    return new SupabaseAdminClient(url, anonKey);
  } catch {
    return null;
  }
}