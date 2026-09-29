import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const requireEnvironment = process.argv.includes('--require-env');
const checks = [];

function check(label, passed, detail) {
  checks.push({ label, passed });
  console.log(`${passed ? 'OK' : 'FALHOU'} ${label}: ${detail}`);
}

function configuredUrl(rawValue) {
  const value = rawValue?.trim();
  if (!value) return null;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withProtocol);
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

const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const envExample = await readFile(resolve(root, '.env.example'), 'utf8');
const adminSetup = await readFile(resolve(root, 'docs', 'admin-setup.md'), 'utf8');
const supabaseConfig = await readFile(resolve(root, 'supabase', 'config.toml'), 'utf8');
const vercel = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8'));
const firebase = JSON.parse(await readFile(resolve(root, 'firebase.json'), 'utf8'));

check(
  'scripts operacionais versionados',
  packageJson.scripts?.['ops:preflight'] === 'node scripts/validate-operations-config.mjs' &&
    packageJson.scripts?.['deploy:build'] ===
      'node scripts/validate-operations-config.mjs --require-env && npm run build' &&
    packageJson.scripts?.['smoke:supabase'] === 'node scripts/smoke-supabase.mjs' &&
    packageJson.scripts?.['ops:db:lint'] ===
      'supabase db lint --local --level warning --fail-on warning' &&
    packageJson.devDependencies?.supabase === '2.118.0',
  'preflight, build protegido e smoke Supabase',
);
check(
  'configuração local do Supabase',
  /project_id\s*=\s*"loldraftlendas"/.test(supabaseConfig) &&
    /\[auth\]/.test(supabaseConfig) &&
    !/sb_secret_|service_role|password\s*=/i.test(supabaseConfig),
  'config.toml versionado sem secrets',
);
check(
  'exemplo de ambiente completo',
  ['VITE_SITE_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].every((name) =>
    envExample.includes(`${name}=`),
  ),
  'URL pública e credenciais públicas do Supabase documentadas',
);
check(
  'build de deploy protegido',
  vercel.buildCommand === 'npm run deploy:build' && vercel.outputDirectory === 'dist',
  `Vercel: ${vercel.buildCommand ?? 'ausente'}`,
);

const vercelHeaders = JSON.stringify(vercel.headers ?? []);
const firebaseHeaders = JSON.stringify(firebase.hosting?.headers ?? []);
for (const [provider, headers] of [
  ['Vercel', vercelHeaders],
  ['Firebase', firebaseHeaders],
]) {
  check(
    `headers de segurança no ${provider}`,
    ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy'].every(
      (header) => headers.includes(header),
    ),
    'nosniff, frame deny, referrer e permissões',
  );
  check(
    `cache atualizável de imagens no ${provider}`,
    headers.includes('immutable') &&
      !headers.includes('"source":"/assets/(.*)"') &&
      !headers.includes('"source":"/assets/**"') &&
      !headers.includes('"source":"**/*.@(js|css|woff|woff2)"'),
    'imutabilidade restrita a arquivos de build com hash',
  );
}

const migrationDirectory = resolve(root, 'supabase', 'migrations');
const migrationFiles = (await readdir(migrationDirectory))
  .filter((name) => name.endsWith('.sql'))
  .sort();
const requiredMigrations = [
  '20260909153000_admin_config.sql',
  '20260909160000_analytics_feedback.sql',
  '20260909170000_admin_dashboard.sql',
  '20260909172000_public_config_and_analytics_validation.sql',
  '20260912110000_campaign_sharing_analytics.sql',
  '20260912120000_deterministic_challenges.sql',
  '20260912130000_contextual_rating_feedback.sql',
  '20260913120000_almanac_mode.sql',
  '20260913130000_game_plans.sql',
  '20260913140000_daily_challenges.sql',
  '20260918100000_campaign_navigation_analytics.sql',
  '20260918110000_campaign_report_analytics.sql',
  '20260918120000_campaign_journey_analytics.sql',
  '20260918130000_onboarding_analytics.sql',
  '20260919100000_daily_modifiers_analytics.sql',
];
check(
  'inventário de migrations',
  requiredMigrations.every((name) => migrationFiles.includes(name)) &&
    migrationFiles.every((name) => /^\d{14}_[a-z0-9_]+\.sql$/.test(name)),
  `${migrationFiles.length} arquivos em ordem lexical`,
);
check(
  'ordem documentada das migrations',
  migrationFiles.every((name) => adminSetup.includes(name)),
  'todo SQL aparece no runbook administrativo',
);

const sql = (
  await Promise.all(
    migrationFiles.map(async (name) => ({
      name,
      body: await readFile(resolve(migrationDirectory, name), 'utf8'),
    })),
  )
).map(({ name, body }) => `-- ${name}\n${body}`);
const allSql = sql.join('\n');
const initialAdminSql = await readFile(resolve(migrationDirectory, requiredMigrations[0]), 'utf8');
check(
  'defaults operacionais seguros',
  /id\s+boolean\s+primary\s+key\s+default\s+true\s+check\s*\(id\)/i.test(initialAdminSql) &&
    /analytics_enabled\s+boolean\s+not\s+null\s+default\s+false/i.test(initialAdminSql) &&
    /values\s*\(\s*true,\s*3,[\s\S]*?\n\s*false,\s*\n\s*'multi-era/i.test(initialAdminSql),
  'singleton válido e analytics inicialmente desativado',
);
const securityDefiners = [...allSql.matchAll(/security\s+definer/gi)].length;
const fixedSearchPaths = [...allSql.matchAll(/set\s+search_path\s*=\s*public/gi)].length;
check(
  'search_path das funções privilegiadas',
  securityDefiners === fixedSearchPaths && securityDefiners > 0,
  `${fixedSearchPaths}/${securityDefiners} SECURITY DEFINER protegidas`,
);

const tables = [...allSql.matchAll(/create\s+table\s+if\s+not\s+exists\s+public\.([a-z_]+)/gi)].map(
  (match) => match[1],
);
const rlsTables = new Set(
  [...allSql.matchAll(/alter\s+table\s+public\.([a-z_]+)\s+enable\s+row\s+level\s+security/gi)].map(
    (match) => match[1],
  ),
);
check(
  'RLS das tabelas públicas',
  tables.length > 0 && tables.every((table) => rlsTables.has(table)),
  `${tables.filter((table) => rlsTables.has(table)).length}/${tables.length} tabelas`,
);
check(
  'privilégios sem grant amplo',
  !/grant\s+all\b/i.test(allSql) &&
    /revoke\s+all\s+on\s+function/gi.test(allSql) &&
    !/revoke\s+all\s+on\s+function[^;]+from\s+public\s*;/gi.test(allSql),
  'RPCs revogam public/anon/authenticated antes dos grants explícitos',
);

const siteUrl = configuredUrl(
  process.env.VITE_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL,
);
const supabaseUrl = configuredUrl(process.env.VITE_SUPABASE_URL);
const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
const hasAnyEnvironment = Boolean(
  process.env.VITE_SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_ADMIN_DEMO_MODE,
);

if (requireEnvironment || hasAnyEnvironment) {
  check(
    'URL pública de produção',
    siteUrl?.protocol === 'https:' &&
      siteUrl.username === '' &&
      siteUrl.password === '' &&
      siteUrl.pathname === '/' &&
      siteUrl.search === '' &&
      siteUrl.hash === '' &&
      !/(^|\.)example\.(com|org|net)$/i.test(siteUrl.hostname) &&
      !/(^|\.)example$/i.test(siteUrl.hostname),
    siteUrl ? siteUrl.origin : 'ausente ou inválida',
  );
  check(
    'URL pública do Supabase',
    supabaseUrl?.protocol === 'https:' &&
      supabaseUrl.username === '' &&
      supabaseUrl.password === '' &&
      supabaseUrl.pathname === '/' &&
      supabaseUrl.search === '' &&
      supabaseUrl.hash === '' &&
      !/your-project/i.test(supabaseUrl.hostname),
    supabaseUrl ? supabaseUrl.origin : 'ausente ou inválida',
  );
  const role = anonKey ? jwtRole(anonKey) : null;
  const safePublicKey = Boolean(
    anonKey &&
    anonKey.length >= 20 &&
    !/your-(?:anon|public|publishable)-key|service[_-]?role/i.test(anonKey) &&
    !anonKey.startsWith('sb_secret_') &&
    (role === null || role === 'anon'),
  );
  check(
    'chave pública do Supabase',
    safePublicKey,
    safePublicKey
      ? 'anon/publishable sem conteúdo administrativo'
      : 'ausente, placeholder ou secreta',
  );
  check(
    'modo demo desativado',
    process.env.VITE_ADMIN_DEMO_MODE !== 'true',
    `VITE_ADMIN_DEMO_MODE=${process.env.VITE_ADMIN_DEMO_MODE ?? 'não definido'}`,
  );
} else {
  console.log('INFO ambiente real não fornecido; apenas a preparação versionada foi validada.');
}

if (checks.some((entry) => !entry.passed)) process.exitCode = 1;
else console.log('Preflight operacional concluído.');
