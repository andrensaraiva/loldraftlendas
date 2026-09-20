const rawBaseUrl = process.argv[2] ?? process.env.SMOKE_BASE_URL;

if (!rawBaseUrl) {
  console.error('Informe a URL: npm run smoke:deploy -- https://seu-dominio.example');
  process.exit(2);
}

const baseUrl = rawBaseUrl.replace(/\/$/, '');
const checks = [
  ['/', /<title>Draft Lendas[^<]+<\/title>/i],
  ['/arquivo', /<div id="root"><\/div>/i],
  ['/manifest.webmanifest', /"name"\s*:\s*"Draft Lendas[^"]*"/i],
  ['/robots.txt', /sitemap:/i],
  ['/sitemap.xml', /<loc>[^<]+\/arquivo<\/loc>/i],
];

let failed = false;
for (const [pathname, expected] of checks) {
  const url = `${baseUrl}${pathname}`;
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const body = await response.text();
    const ok = response.ok && expected.test(body);
    console.log(`${ok ? 'OK' : 'FALHOU'} ${response.status} ${url}`);
    if (!ok) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FALHOU ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) process.exitCode = 1;
else console.log('Smoke pós-deploy concluído.');
