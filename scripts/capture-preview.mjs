import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
for (const [name, width, height] of [
  ['desktop', 1440, 1000],
  ['mobile', 390, 844],
]) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto('http://127.0.0.1:5173');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `test-results/home-${name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Começar draft' }).click();
  for (let i = 0; i < 5; i++) await page.locator('.player-card').first().click();
  await page.screenshot({ path: `test-results/team-${name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Entrar no Worlds' }).click();
  await page.locator('.match-report').waitFor();
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.screenshot({ path: `test-results/match-${name}.png`, fullPage: true });
  console.log(
    `${name}: screenshots captured; overflow=${await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)}`,
  );
  await page.close();
}
await browser.close();
