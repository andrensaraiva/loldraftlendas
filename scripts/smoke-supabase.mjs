import { randomUUID } from 'node:crypto';

const rawUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const adminEmail = process.env.OPS_ADMIN_EMAIL;
const adminPassword = process.env.OPS_ADMIN_PASSWORD;
const requireAdmin = process.argv.includes('--require-admin');
let failed = false;

function report(label, passed, detail) {
  console.log(`${passed ? 'OK' : 'FALHOU'} ${label}: ${detail}`);
  if (!passed) failed = true;
}

function endpoint(value) {
  try {
    const parsed = new URL(value);
    const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    return (parsed.protocol === 'https:' || (localHost && parsed.protocol === 'http:')) &&
      parsed.pathname === '/' &&
      parsed.search === '' &&
      parsed.hash === ''
      ? parsed.origin
      : null;
  } catch {
    return null;
  }
}

function jwtRole(value) {
  try {
    const payload = value.split('.')[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role ?? null;
  } catch {
    return null;
  }
}

const baseUrl = rawUrl ? endpoint(rawUrl) : null;
if (
  !baseUrl ||
  !anonKey ||
  anonKey.length < 20 ||
  /your-(?:anon|public|publishable)-key/i.test(anonKey) ||
  anonKey.startsWith('sb_secret_') ||
  jwtRole(anonKey) === 'service_role'
) {
  console.error('Defina SUPABASE_URL e SUPABASE_ANON_KEY públicos para executar o smoke.');
  process.exit(2);
}

async function request(path, init = {}, bearer) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

const publicConfig = await request('/rest/v1/rpc/get_public_product_config', {
  method: 'POST',
  body: '{}',
});
const config = publicConfig.body;
report(
  'configuração pública',
  publicConfig.response.ok &&
    config &&
    Number.isInteger(config.starting_exchanges) &&
    Array.isArray(config.active_years) &&
    Array.isArray(config.active_region_groups) &&
    typeof config.analytics_enabled === 'boolean' &&
    typeof config.dataset_version === 'string',
  `${publicConfig.response.status} ${baseUrl}`,
);

for (const table of [
  'admin_users',
  'product_config',
  'analytics_events',
  'campaign_feedback',
  'rating_feedback',
]) {
  const result = await request(`/rest/v1/${table}?select=*&limit=1`, { method: 'GET' });
  const hidden =
    [401, 403].includes(result.response.status) ||
    (result.response.ok && Array.isArray(result.body) && result.body.length === 0);
  report(`RLS anônima: ${table}`, hidden, `HTTP ${result.response.status}, sem linhas expostas`);
}

const anonymousAdmin = await request('/rest/v1/rpc/is_admin', { method: 'POST', body: '{}' });
report(
  'RPC administrativa bloqueada para anon',
  !anonymousAdmin.response.ok,
  `HTTP ${anonymousAdmin.response.status}`,
);

const invalidAnalytics = await request('/rest/v1/rpc/record_analytics_event', {
  method: 'POST',
  body: JSON.stringify({
    p_client_event_id: randomUUID(),
    p_campaign_id: randomUUID(),
    p_session_id: randomUUID(),
    p_event_name: '__smoke_invalid__',
    p_device_type: 'desktop',
    p_properties: {},
  }),
});
report(
  'validação negativa de analytics',
  invalidAnalytics.response.status >= 400 &&
    invalidAnalytics.response.status < 500 &&
    invalidAnalytics.response.status !== 404,
  `HTTP ${invalidAnalytics.response.status}, nenhuma linha criada`,
);

const invalidFeedback = await request('/rest/v1/rpc/submit_campaign_feedback', {
  method: 'POST',
  body: JSON.stringify({ p_campaign_id: randomUUID(), p_rating: '__invalid__', p_note: null }),
});
report(
  'validação negativa de feedback',
  invalidFeedback.response.status >= 400 &&
    invalidFeedback.response.status < 500 &&
    invalidFeedback.response.status !== 404,
  `HTTP ${invalidFeedback.response.status}, nenhuma linha criada`,
);

const invalidRatingFeedback = await request('/rest/v1/rpc/submit_rating_feedback', {
  method: 'POST',
  body: JSON.stringify({
    p_campaign_id: randomUUID(),
    p_player_id: 'smoke-2025-test',
    p_worlds_year: 2025,
    p_role: 'MID',
    p_game: 1,
    p_champion_id: 'smoke',
    p_displayed_rating: 50,
    p_reason: '__invalid__',
    p_note: null,
  }),
});
report(
  'validação negativa de feedback contextual',
  invalidRatingFeedback.response.status >= 400 &&
    invalidRatingFeedback.response.status < 500 &&
    invalidRatingFeedback.response.status !== 404,
  `HTTP ${invalidRatingFeedback.response.status}, nenhuma linha criada`,
);

if ((adminEmail && !adminPassword) || (!adminEmail && adminPassword)) {
  report('credenciais administrativas', false, 'e-mail e senha devem ser fornecidos juntos');
} else if (adminEmail && adminPassword) {
  const login = await request(
    '/auth/v1/token?grant_type=password',
    { method: 'POST', body: JSON.stringify({ email: adminEmail, password: adminPassword }) },
  );
  const accessToken = login.body?.access_token;
  report(
    'autenticação administrativa',
    login.response.ok && Boolean(accessToken),
    `HTTP ${login.response.status}`,
  );
  if (accessToken) {
    const isAdmin = await request(
      '/rest/v1/rpc/is_admin',
      { method: 'POST', body: '{}' },
      accessToken,
    );
    report(
      'allowlist administrativa',
      isAdmin.response.ok && isAdmin.body === true,
      `HTTP ${isAdmin.response.status}`,
    );
    const productConfig = await request(
      '/rest/v1/product_config?select=version,dataset_version&id=eq.true',
      { method: 'GET' },
      accessToken,
    );
    report(
      'leitura administrativa com RLS',
      productConfig.response.ok &&
        Array.isArray(productConfig.body) &&
        productConfig.body.length === 1,
      `HTTP ${productConfig.response.status}`,
    );
    const dashboard = await request(
      '/rest/v1/rpc/get_admin_dashboard_metrics',
      { method: 'POST', body: '{}' },
      accessToken,
    );
    report(
      'dashboard agregado',
      dashboard.response.ok && dashboard.body && typeof dashboard.body.overview === 'object',
      `HTTP ${dashboard.response.status}`,
    );
    await request('/auth/v1/logout', { method: 'POST', body: '{}' }, accessToken);
  }
} else {
  report(
    'smoke administrativo opcional',
    !requireAdmin,
    'OPS_ADMIN_EMAIL/OPS_ADMIN_PASSWORD não fornecidos',
  );
}

if (failed) process.exitCode = 1;
else console.log('Smoke Supabase concluído sem gravar dados válidos.');
