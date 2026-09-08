import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const stem = 'docs/COMO-O-JOGO-FOI-IMPLEMENTADO';
const markdown = await readFile(`${stem}.md`, 'utf8');
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const inline = (value) => escape(value).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const lines = markdown.split(/\r?\n/);
const blocks = [];
let index = 0;
while (index < lines.length) {
  const line = lines[index];
  if (!line.trim()) { index++; continue; }
  if (line.startsWith('```')) {
    index++; const code = [];
    while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++]);
    index++; blocks.push(`<pre><code>${escape(code.join('\n'))}</code></pre>`); continue;
  }
  if (line.startsWith('# ')) { blocks.push(`<h1>${inline(line.slice(2))}</h1>`); index++; continue; }
  if (line.startsWith('## ')) { blocks.push(`<h2>${inline(line.slice(3))}</h2>`); index++; continue; }
  if (line.startsWith('|')) {
    const rows = [];
    while (index < lines.length && lines[index].startsWith('|')) rows.push(lines[index++]);
    const cells = (row, tag) => row.slice(1,-1).split('|').map(value => `<${tag}>${inline(value.trim())}</${tag}>`).join('');
    blocks.push(`<table><thead><tr>${cells(rows[0], 'th')}</tr></thead><tbody>${rows.slice(2).map(row=>`<tr>${cells(row, 'td')}</tr>`).join('')}</tbody></table>`); continue;
  }
  if (line.startsWith('- ')) {
    const items = [];
    while (index < lines.length && lines[index].startsWith('- ')) items.push(`<li>${inline(lines[index++].slice(2))}</li>`);
    blocks.push(`<ul>${items.join('')}</ul>`); continue;
  }
  const paragraph = [];
  while (index < lines.length && lines[index].trim() && !/^(#|\||- |```)/.test(lines[index])) paragraph.push(lines[index++]);
  blocks.push(`<p>${inline(paragraph.join(' '))}</p>`);
}
const bodyFont = (await readFile('node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2')).toString('base64');
const titleFont = (await readFile('node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2')).toString('base64');
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Draft Lendas — Documento de implementação</title><style>
@font-face{font-family:Body;src:url(data:font/woff2;base64,${bodyFont})} @font-face{font-family:Title;src:url(data:font/woff2;base64,${titleFont});font-weight:700}
*{box-sizing:border-box}body{margin:0;color:#22291d;background:white;font:10pt/1.6 Body,Arial,sans-serif}main{max-width:780px;margin:auto;padding:35px}.doc-brand{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #89cc3c;padding-bottom:14px;margin-bottom:22px;color:#387320}.doc-brand b{font:700 22pt Title,Arial,sans-serif}.doc-brand span{font-size:8pt;letter-spacing:.5px}h1{font:700 36pt/1.05 Title,Arial,sans-serif;margin:0 0 17px;color:#223918;letter-spacing:-.4px}h2{font:700 22pt/1.15 Title,Arial,sans-serif;color:#376d20;margin:29px 0 11px;border-top:1px solid #e0e6d8;padding-top:17px;break-after:avoid-page}p{margin:0 0 11px;orphans:3;widows:3}strong{font-weight:bold}table{width:100%;border-collapse:collapse;margin:15px 0 18px;font-size:8.4pt;table-layout:auto}thead{display:table-header-group}th{text-align:left;background:#edf4e4;color:#345822;font-weight:bold}th,td{padding:8px 9px;border-bottom:1px solid #dfe6d6;vertical-align:top;overflow-wrap:anywhere}tr{break-inside:avoid}code{font:8.4pt/1.5 Consolas,monospace;color:#335524;overflow-wrap:anywhere}pre{background:#f0f4eb;border-left:3px solid #86b843;padding:13px 16px;white-space:pre-wrap;break-inside:avoid;margin:15px 0}pre code{font-size:9pt}ul{padding-left:20px;margin:11px 0 17px}li{padding-left:3px;margin:0 0 8px;break-inside:avoid}.doc-end{font-size:8pt;color:#7e8874;margin-top:30px;border-top:1px solid #dfe6d6;padding-top:13px}@media print{main{max-width:none;padding:0}body{font-size:9.5pt}h1{font-size:33pt}h2{font-size:20pt}a{color:inherit}}
</style></head><body><main><div class="doc-brand"><b>DRAFT LENDAS.</b><span>FUNCIONAMENTO E IMPLEMENTAÇÃO</span></div>${blocks.join('\n')}<p class="doc-end">Documento gerado a partir do Markdown do projeto. Código de referência: versão local revisada em 07/09/2026.</p></main></body></html>`;
await writeFile(`${stem}.html`, html);
await mkdir('test-results',{recursive:true});
const browser = await chromium.launch({channel:'msedge'});
try {
  const page=await browser.newPage({viewport:{width:900,height:1200}});
  await page.setContent(html,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  await page.pdf({path:`${stem}.pdf`,format:'A4',printBackground:true,margin:{top:'16mm',right:'16mm',bottom:'18mm',left:'16mm'},displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-family:Arial;font-size:8px;color:#77806e;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>DRAFT LENDAS · IMPLEMENTAÇÃO · 07/09/2026</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});
  await page.screenshot({path:'test-results/document-preview.png'});
  console.log(JSON.stringify({sections:await page.locator('h2').count(),tables:await page.locator('table').count(),horizontalOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}));
} finally { await browser.close(); }
const pdf=await readFile(`${stem}.pdf`);
console.log(`PDF: ${pdf.length} bytes; ${[...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length} pages; header: ${pdf.subarray(0,8).toString()}`);
