import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const checks = [];

function check(label, passed, detail) {
  checks.push({ label, passed, detail });
  console.log(`${passed ? 'OK' : 'FALHOU'} ${label}: ${detail}`);
}

const html = await readFile(resolve(dist, 'index.html'), 'utf8');
const scriptPath = html.match(/<script[^>]+src="([^"]+index-[^"]+\.js)"/)?.[1];
const stylePath = html.match(/<link[^>]+href="([^"]+index-[^"]+\.css)"/)?.[1];

check('idioma do documento', /<html[^>]+lang="pt-BR"/i.test(html), 'lang=pt-BR');
check('viewport responsivo', /name="viewport"/i.test(html), 'meta viewport presente');

if (scriptPath) {
  const bytes = (await stat(resolve(dist, scriptPath.replace(/^\//, '')))).size;
  check('orçamento do JavaScript inicial', bytes <= 500_000, `${(bytes / 1000).toFixed(2)} kB / 500 kB`);
} else check('orçamento do JavaScript inicial', false, 'entrada não encontrada');

if (stylePath) {
  const bytes = (await stat(resolve(dist, stylePath.replace(/^\//, '')))).size;
  check('orçamento do CSS inicial', bytes <= 100_000, `${(bytes / 1000).toFixed(2)} kB / 100 kB`);
} else check('orçamento do CSS inicial', false, 'entrada não encontrada');

const manifest = JSON.parse(await readFile(resolve(dist, 'manifest.webmanifest'), 'utf8'));
check('PWA standalone', manifest.display === 'standalone', `display=${manifest.display}`);
for (const size of ['192x192', '512x512']) {
  const icon = manifest.icons?.find((entry) => entry.sizes === size);
  const exists = icon ? await stat(resolve(dist, icon.src.replace(/^\//, ''))).then(() => true, () => false) : false;
  check(`ícone PWA ${size}`, exists, icon?.src ?? 'ausente');
}

const worker = await readFile(resolve(dist, 'sw.js'), 'utf8');
check(
  'service worker exclui admin',
  worker.includes("url.pathname === '/admin'") && worker.includes("url.pathname.startsWith('/admin/')"),
  'rota privada tratada como network-only',
);
const robots = await readFile(resolve(dist, 'robots.txt'), 'utf8');
check('robots com sitemap', /Sitemap:\s*https?:\/\//i.test(robots), 'sitemap absoluto');
const sitemap = await readFile(resolve(dist, 'sitemap.xml'), 'utf8');
const urlCount = [...sitemap.matchAll(/<url>/g)].length;
check('cobertura do sitemap', urlCount === 583, `${urlCount} URLs públicas`);

if (checks.some((entry) => !entry.passed)) process.exitCode = 1;
else console.log('Auditoria estática da beta concluída.');
