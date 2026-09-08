// Local QA only: renders Markdown into test-results, never publishes it.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const md = await readFile('docs/worlds-2017-lck-research.md', 'utf8');
const escape = (s) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const inline = (s) =>
  escape(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
const lines = md.split(/\r?\n/),
  blocks = [];
for (let i = 0; i < lines.length;) {
  const s = lines[i];
  if (!s.trim()) {
    i++;
    continue;
  }
  if (s.startsWith('```')) {
    const code = [];
    i++;
    while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
    i++;
    blocks.push(`<pre>${escape(code.join('\n'))}</pre>`);
    continue;
  }
  const heading = s.match(/^(#{1,3}) (.*)$/);
  if (heading) {
    blocks.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
    i++;
    continue;
  }
  if (s.startsWith('|')) {
    const rows = [];
    while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
    const cells = (r) => r.slice(1, -1).split('|');
    if (rows.some((r) => cells(r).length !== cells(rows[0]).length))
      throw new Error('Broken Markdown table');
    blocks.push(
      '<table>' +
        rows
          .filter((_, i) => i !== 1)
          .map(
            (r, i) =>
              `<tr>${cells(r)
                .map((c) => `<${i ? 'td' : 'th'}>${inline(c)}</${i ? 'td' : 'th'}>`)
                .join('')}</tr>`,
          )
          .join('') +
        '</table>',
    );
    continue;
  }
  const paragraph = [];
  while (i < lines.length && lines[i].trim() && !/^(#|\||```)/.test(lines[i]))
    paragraph.push(lines[i++]);
  blocks.push(`<p>${inline(paragraph.join(' '))}</p>`);
}
const html = `<!doctype html><html lang="pt-BR"><meta charset="UTF-8"><title>Pesquisa 2017</title><style>
body{font:16px/1.65 system-ui,sans-serif;color:#20281c;max-width:1120px;margin:40px auto;padding:0 24px}h1,h2,h3{line-height:1.2;color:#246b22}h2{margin-top:44px;border-top:1px solid #cddcc6;padding-top:20px}table{width:100%;border-collapse:collapse;font-size:13px;margin:20px 0}td,th{padding:8px;border-bottom:1px solid #dce3d8;text-align:left;overflow-wrap:anywhere}th{background:#edf5e6}a{color:#237425}pre{padding:18px;background:#edf5e6;white-space:pre-wrap}code{overflow-wrap:anywhere}</style>${blocks.join('\n')}</html>`;
await mkdir('test-results', { recursive: true });
await writeFile('test-results/research-preview.html', html);
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.setContent(html);
  await page.screenshot({ path: 'test-results/research-opening.png' });
  await page
    .getByRole('heading', { name: 'Faker — SKT — MID — Worlds 2017', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/research-pool.png' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error('Report has horizontal overflow');
  console.log(
    JSON.stringify({
      tables: await page.locator('table').count(),
      headings: await page.locator('h2,h3').count(),
      links: await page.locator('a').count(),
      overflow,
    }),
  );
} finally {
  await browser.close();
}
