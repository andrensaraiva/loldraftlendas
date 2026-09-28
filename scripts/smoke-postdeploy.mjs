const rawBaseUrl = process.argv[2] ?? process.env.SMOKE_BASE_URL;

if (!rawBaseUrl) {
  console.error('Informe a URL: npm run smoke:deploy -- https://seu-dominio.example');
  process.exit(2);
}

let parsedBaseUrl;
try {
  parsedBaseUrl = new URL(rawBaseUrl);
} catch {
  console.error(`URL inválida: ${rawBaseUrl}`);
  process.exit(2);
}

const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsedBaseUrl.hostname);
if (parsedBaseUrl.protocol !== 'https:' && !(localHost && parsedBaseUrl.protocol === 'http:')) {
  console.error('O smoke remoto exige HTTPS; HTTP é aceito somente em localhost.');
  process.exit(2);
}
if (parsedBaseUrl.pathname !== '/' || parsedBaseUrl.search || parsedBaseUrl.hash) {
  console.error('Informe apenas a origem do site, sem caminho, query ou hash.');
  process.exit(2);
}

const baseUrl = parsedBaseUrl.origin;
let failed = false;
function check(label, passed, detail) {
  console.log(`${passed ? 'OK' : 'FALHOU'} ${label}: ${detail}`);
  if (!passed) failed = true;
}

async function load(pathname) {
  try {
    const response = await fetch(`${baseUrl}${pathname}`, { redirect: 'follow' });
    return { response, body: await response.text() };
  } catch (error) {
    check(pathname, false, error instanceof Error ? error.message : String(error));
    return null;
  }
}

const home = await load('/');
const archive = await load('/arquivo');
const admin = await load('/admin');
const manifest = await load('/manifest.webmanifest');
const robots = await load('/robots.txt');
const sitemap = await load('/sitemap.xml');
const worker = await load('/sw.js');

check(
  'home',
  Boolean(home?.response.ok && /<title>Draft Lendas[^<]+<\/title>/i.test(home.body)),
  `HTTP ${home?.response.status ?? 0}`,
);
check(
  'rota SPA do arquivo',
  Boolean(archive?.response.ok && /<div id="root"><\/div>/i.test(archive.body)),
  `HTTP ${archive?.response.status ?? 0}`,
);
check(
  'rota SPA administrativa',
  Boolean(admin?.response.ok && /<div id="root"><\/div>/i.test(admin.body)),
  `HTTP ${admin?.response.status ?? 0}`,
);
check(
  'manifesto PWA',
  Boolean(manifest?.response.ok && /"name"\s*:\s*"Draft Lendas[^"]*"/i.test(manifest.body)),
  `HTTP ${manifest?.response.status ?? 0}`,
);
check(
  'robots',
  Boolean(
    robots?.response.ok &&
    (localHost
      ? /Sitemap:\s*https?:\/\//i.test(robots.body)
      : robots.body.includes(`Sitemap: ${baseUrl}/sitemap.xml`)),
  ),
  `HTTP ${robots?.response.status ?? 0}`,
);
check(
  'sitemap',
  Boolean(
    sitemap?.response.ok &&
    (localHost
      ? /<loc>https?:\/\/[^<]+\/arquivo<\/loc>/i.test(sitemap.body)
      : sitemap.body.includes(`<loc>${baseUrl}/arquivo</loc>`)),
  ),
  `HTTP ${sitemap?.response.status ?? 0}`,
);
check(
  'service worker',
  Boolean(worker?.response.ok && worker.body.includes("CACHE_PREFIX = 'draft-lendas-'")),
  `HTTP ${worker?.response.status ?? 0}`,
);
check(
  'canonical de produção',
  Boolean(
    localHost
      ? /<link rel="canonical" href="https?:\/\/[^"/]+(?::\d+)?\/"/i.test(home?.body ?? '')
      : home?.body.includes(`<link rel="canonical" href="${baseUrl}/"`),
  ),
  localHost ? 'URL absoluta no build local' : baseUrl,
);

if (!localHost && home && admin && worker) {
  check(
    'header nosniff',
    home.response.headers.get('x-content-type-options') === 'nosniff',
    home.response.headers.get('x-content-type-options') ?? 'ausente',
  );
  check(
    'proteção contra frame',
    home.response.headers.get('x-frame-options') === 'DENY',
    home.response.headers.get('x-frame-options') ?? 'ausente',
  );
  check(
    'política de referrer',
    home.response.headers.get('referrer-policy') === 'strict-origin-when-cross-origin',
    home.response.headers.get('referrer-policy') ?? 'ausente',
  );
  check(
    'admin não indexável',
    /noindex/i.test(admin.response.headers.get('x-robots-tag') ?? ''),
    admin.response.headers.get('x-robots-tag') ?? 'ausente',
  );
  check(
    'service worker revalidável',
    /no-cache|no-store|must-revalidate/i.test(worker.response.headers.get('cache-control') ?? ''),
    worker.response.headers.get('cache-control') ?? 'ausente',
  );

  const hashedAssetPath = home.body.match(
    /(?:src|href)="(\/assets\/[^"]+\.(?:js|css|woff2?))"/,
  )?.[1];
  const hashedAsset = hashedAssetPath ? await load(hashedAssetPath) : null;
  check(
    'asset versionado encontrado',
    Boolean(hashedAsset?.response.ok),
    hashedAssetPath ?? 'ausente',
  );
  if (hashedAsset)
    check(
      'cache imutável restrito ao build',
      /immutable/i.test(hashedAsset.response.headers.get('cache-control') ?? ''),
      hashedAsset.response.headers.get('cache-control') ?? 'ausente',
    );
}

if (failed) process.exitCode = 1;
else console.log('Smoke pós-deploy concluído.');
