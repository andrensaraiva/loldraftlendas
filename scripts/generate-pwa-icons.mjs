import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = pathToFileURL(path.join(root, 'public', 'favicon.svg')).toString();
const output = path.join(root, 'public', 'icons');
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.goto(source);
    await page.screenshot({
      path: path.join(output, `draft-lendas-${size}.png`),
      omitBackground: false,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
