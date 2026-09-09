import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CircleAlert,
  LoaderCircle,
  LogOut,
  Save,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import groups from '../data/draft-region-groups.json';
import { DRAFT_REGION_GROUP_IDS } from '../game/types';
import type { DraftRegionGroupId } from '../game/types';
import { localAdminDemoEnabled } from './demo';
import { createSupabaseAdminClient } from './supabase';
import type { AdminSession } from './supabase';
import type { ProductConfig } from './config';
import { AdminDashboard } from './AdminDashboard';
import { localDemoDashboard } from './dashboard';
import type { DashboardMetrics } from './dashboard';
import './admin.css';

const client = createSupabaseAdminClient();
const localDemo = localAdminDemoEnabled(import.meta.env);
const availableYears = groups.groups.map((entry) => entry.year).sort((a, b) => a - b);
const regionLabels: Record<DraftRegionGroupId, string> = {
  KOREA: 'Coreia',
  CHINA: 'China',
  EUROPE: 'Europa',
  NORTH_AMERICA: 'América do Norte',
  OTHER_REGIONS: 'Outras Regiões',
  EUROPE_NORTH_AMERICA: 'Europa + América do Norte',
};

type AccessState = 'setup' | 'sign-in' | 'checking' | 'forbidden' | 'ready' | 'error';

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}

function toggle<T>(items: T[], item: T): T[] {
  if (items.includes(item)) return items.length > 1 ? items.filter((current) => current !== item) : items;
  return [...items, item];
}

function localDemoConfig(): ProductConfig {
  return {
    version: 1,
    startingExchanges: 3,
    activeYears: availableYears,
    activeRegionGroups: [...DRAFT_REGION_GROUP_IDS],
    analyticsEnabled: true,
    maintenanceBanner: null,
    datasetVersion: groups.datasetVersion,
    updatedAt: new Date().toISOString(),
  };
}

export default function AdminApp() {
  const [session, setSession] = useState<AdminSession | null>(() => client?.restoreSession() ?? null);
  const [access, setAccess] = useState<AccessState>(() =>
    localDemo ? 'ready' : client ? 'sign-in' : 'setup',
  );
  const [config, setConfig] = useState<ProductConfig | null>(() => (localDemo ? localDemoConfig() : null));
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(() =>
    localDemo ? localDemoDashboard() : null,
  );
  const [dashboardState, setDashboardState] = useState<'idle' | 'loading' | 'error'>(
    localDemo ? 'idle' : 'loading',
  );
  const [dashboardError, setDashboardError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!client || !session) return;
    let active = true;
    setAccess('checking');
    setNotice('');
    void (async () => {
      try {
        const authorized = await client.isAdmin(session);
        if (!authorized) {
          client.clearSession();
          if (active) {
            setSession(null);
            setAccess('forbidden');
          }
          return;
        }
        const loaded = await client.loadProductConfig(session);
        if (active) {
          setConfig(loaded);
          setAccess('ready');
          void refreshDashboard(session);
        }
      } catch (error) {
        if (active) {
          setAccess('error');
          setNotice(message(error));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [session]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    setNotice('');
    try {
      setSession(await client.signIn(email, password));
      setPassword('');
    } catch (error) {
      setNotice(message(error));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!client || !session) return;
    setBusy(true);
    try {
      await client.signOut(session);
    } catch (error) {
      setNotice(message(error));
    } finally {
      setConfig(null);
      setDashboard(null);
      setDashboardState('idle');
      setDashboardError('');
      setSession(null);
      setAccess('sign-in');
      setBusy(false);
    }
  }

  async function refreshDashboard(activeSession = session) {
    if (localDemo) {
      setDashboard(localDemoDashboard());
      setDashboardState('idle');
      setDashboardError('');
      return;
    }
    if (!client || !activeSession) return;
    setDashboardState('loading');
    setDashboardError('');
    try {
      setDashboard(await client.loadDashboardMetrics(activeSession));
      setDashboardState('idle');
    } catch (error) {
      setDashboardState('error');
      setDashboardError(message(error));
    }
  }

  async function saveConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    if (localDemo) {
      setConfig({ ...config, version: config.version + 1, updatedAt: new Date().toISOString() });
      setNotice('Configuração simulada. Nenhum dado foi enviado.');
      return;
    }
    if (!client || !session) return;
    setBusy(true);
    setNotice('');
    try {
      const saved = await client.updateProductConfig(session, config);
      setConfig(saved);
      setNotice('Configuração salva.');
    } catch (error) {
      setNotice(message(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a href="/" className="admin-back">
          <ArrowLeft size={17} /> Voltar ao jogo
        </a>
        <span className="admin-brand">
          DRAFT <em>LENDAS</em> <small>ADMIN</small>
        </span>
        {session && access === 'ready' ? (
          <button className="admin-sign-out" onClick={signOut} disabled={busy}>
            <LogOut size={16} /> Sair
          </button>
        ) : (
          <span className="admin-header-status">ACESSO RESTRITO</span>
        )}
      </header>

      {access === 'setup' && (
        <section className="admin-state">
          <ShieldCheck size={38} />
          <span className="admin-kicker">SUPABASE NÃO CONFIGURADO</span>
          <h1>Configure o acesso administrativo.</h1>
          <p>Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em um arquivo `.env.local`.</p>
        </section>
      )}

      {(access === 'sign-in' || access === 'error') && (
        <section className="admin-login-layout">
          <div className="admin-intro">
            <span className="admin-kicker">ÁREA PRIVADA</span>
            <h1>Controle operacional.</h1>
            <p>Entre com uma conta autorizada para acessar as configurações do produto.</p>
          </div>
          <form className="admin-login-form" onSubmit={signIn}>
            <label>
              E-mail
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {notice && <p className="admin-notice error" role="alert">{notice}</p>}
            <button className="admin-primary" type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />}
              Entrar
            </button>
          </form>
        </section>
      )}

      {access === 'checking' && (
        <section className="admin-state" aria-live="polite">
          <LoaderCircle className="spin" size={38} />
          <p>Verificando autorização.</p>
        </section>
      )}

      {access === 'forbidden' && (
        <section className="admin-state admin-denied">
          <CircleAlert size={38} />
          <span className="admin-kicker">ACESSO NEGADO</span>
          <h1>Esta conta não é administradora.</h1>
          <p>Peça a inclusão explícita na tabela de autorização do projeto.</p>
          <button className="admin-secondary" onClick={() => setAccess('sign-in')}>
            Tentar outra conta
          </button>
        </section>
      )}

      {access === 'ready' && config && (
        <section className="admin-workspace">
          {localDemo && (
            <div className="admin-demo-banner" role="status">
              <CircleAlert size={17} />
              <span>MODO DE DEMONSTRAÇÃO LOCAL. Métricas ilustrativas e alterações desaparecem ao recarregar.</span>
            </div>
          )}
          <AdminDashboard
            metrics={dashboard}
            loading={dashboardState === 'loading'}
            error={dashboardError}
            onRefresh={refreshDashboard}
          />
          <div className="admin-title-row">
            <div>
              <span className="admin-kicker">CONFIGURAÇÃO DO PRODUTO</span>
              <h1>Parâmetros ativos.</h1>
            </div>
            <span className="admin-version">REV. {config.version}</span>
          </div>

          <form className="admin-config-form" onSubmit={saveConfig}>
            <div className="admin-field-grid">
              <label>
                Trocas iniciais
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={config.startingExchanges}
                  onChange={(event) =>
                    setConfig({ ...config, startingExchanges: Number(event.target.value) })
                  }
                  required
                />
              </label>
              <label>
                Versão do dataset
                <input value={config.datasetVersion} readOnly />
              </label>
            </div>

            <fieldset>
              <legend>Anos ativos</legend>
              <div className="admin-option-grid">
                {availableYears.map((year) => (
                  <label className="admin-check" key={year}>
                    <input
                      type="checkbox"
                      checked={config.activeYears.includes(year)}
                      onChange={() => setConfig({ ...config, activeYears: toggle(config.activeYears, year) })}
                    />
                    <span>{year}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Grupos regionais ativos</legend>
              <div className="admin-option-grid">
                {DRAFT_REGION_GROUP_IDS.map((group) => (
                  <label className="admin-check" key={group}>
                    <input
                      type="checkbox"
                      checked={config.activeRegionGroups.includes(group)}
                      onChange={() =>
                        setConfig({
                          ...config,
                          activeRegionGroups: toggle(config.activeRegionGroups, group),
                        })
                      }
                    />
                    <span>{regionLabels[group]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={config.analyticsEnabled}
                onChange={(event) => setConfig({ ...config, analyticsEnabled: event.target.checked })}
              />
              <span>Analytics anônimo ativo</span>
            </label>

            <label>
              Aviso de manutenção
              <textarea
                value={config.maintenanceBanner ?? ''}
                onChange={(event) =>
                  setConfig({ ...config, maintenanceBanner: event.target.value || null })
                }
                maxLength={280}
                rows={3}
              />
            </label>

            <div className="admin-save-row">
              <span>Atualizado em {new Date(config.updatedAt).toLocaleString('pt-BR')}</span>
              <button className="admin-primary" type="submit" disabled={busy}>
                {busy ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
                Salvar configuração
              </button>
            </div>
            {notice && (
              <p
                className={`admin-notice ${notice.includes('simulada') || notice === 'Configuração salva.' ? 'success' : 'error'}`}
                role="status"
              >
                {(notice.includes('simulada') || notice === 'Configuração salva.') && <Check size={15} />}
                {notice}
              </p>
            )}
          </form>

          <div className="admin-scope-note">
            <Settings2 size={18} />
            <p>Alterações ficam disponíveis para novos lançamentos de campanha; saves existentes não são reescritos.</p>
          </div>
        </section>
      )}
    </main>
  );
}