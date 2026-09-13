import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

interface ArchiveIndex {
  years: Array<{ year: number }>;
  players: Array<{ slug: string }>;
  champions: Array<{ id: string }>;
}

const archiveIndex = JSON.parse(
  readFileSync(new URL('./src/data/archive-index.json', import.meta.url), 'utf8'),
) as ArchiveIndex;

function sitemapPaths(): string[] {
  return [
    '/',
    '/arquivo',
    ...archiveIndex.years.map((entry) => `/arquivo/edicao/${entry.year}`),
    ...archiveIndex.players.map((entry) => `/arquivo/jogador/${entry.slug}`),
    ...archiveIndex.champions.map((entry) => `/arquivo/campeao/${entry.id}`),
  ];
}

function absoluteSiteUrl(configuredUrl: string | undefined): string {
  const value = configuredUrl?.trim() || 'http://localhost:5173';
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return new URL(withProtocol).toString().replace(/\/$/, '');
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = absoluteSiteUrl(env.VITE_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL);
  return {
    plugins: [
      react(),
      {
        name: 'draft-lendas-site-metadata',
        transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'robots.txt',
            source: `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`,
          });
          this.emitFile({
            type: 'asset',
            fileName: 'sitemap.xml',
            source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths()
              .map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`)
              .join('\n')}\n</urlset>\n`,
          });
        },
      },
    ],
  };
});
