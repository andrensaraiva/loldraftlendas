import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
async function draft(page: Page, roll = 0) {
  await page.addInitScript((roll) => {
    Math.random = () => roll;
  }, roll);
  await page.goto('/');
  await expect(page.locator('footer')).toContainText('RATINGS ESTIMADOS');
  await page.getByRole('button', { name: 'Começar draft' }).click();
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.pick-counter')).toContainText(`0${i + 1}`);
    await expect(page.locator('.player-card')).toHaveCount(3);
    await expect(
      page.locator('.player-card').first().locator('.pool-slot img').first(),
    ).toHaveAttribute('src', /^\/assets\/20\d{2}\//);
    await page.locator('.player-card').first().click();
  }
}
test('quick mode automatically wins Swiss and all playoffs, keeps reports and replays', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await draft(page);
  for (let i = 1; i <= 5; i++) {
    await page.getByRole('tab', { name: `Jogo ${i}` }).click();
    await expect(page.locator('.comp-champion')).toHaveCount(5);
  }
  await page.getByRole('button', { name: 'Resultado rápido' }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar no Worlds' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('CAMPEÃO', {
    timeout: 25000,
  });
  await expect(page.getByRole('button', { name: 'Compartilhar campanha' })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar card' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('draft-lendas-campeao-mundial.png');
  await expect(page.locator('.share-status')).toContainText('Card baixado');
  await expect(page.locator('.campaign-series')).toHaveCount(6);
  await expect(page.locator('.history-games button')).toHaveCount(13);
  await expect(page.locator('.campaign-series small')).toHaveText([
    'BO1',
    'BO1',
    'BO3',
    'BO5',
    'BO5',
    'BO5',
  ]);
  await page.locator('.history-games button').last().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.kda-table tbody tr')).toHaveCount(10);
  await page.getByText('Linha do tempo').click();
  await expect(page.locator('.moment-history li')).toHaveCount(7);
  await page.getByRole('button', { name: 'Fechar relatório' }).click();
  await page.getByRole('button', { name: 'Jogar novamente' }).click();
  await expect(page.locator('.team-slot.filled')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('quick mode eliminates after three Swiss losses and preserves every game', async ({
  page,
}) => {
  await draft(page, 0.999);
  await page.getByRole('button', { name: 'Resultado rápido' }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar no Worlds' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Eliminado no Suíço', {
    timeout: 15000,
  });
  await expect(page.locator('.campaign-series')).toHaveCount(3);
  await expect(page.locator('.history-games button.loss')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('detailed playback updates KDA, pauses, changes speed/mode and retains the same result', async ({
  page,
}) => {
  await draft(page);
  await page.getByRole('button', { name: 'Entrar no Worlds' }).click();
  await expect(page.locator('.match-forecast')).toBeVisible({ timeout: 7000 });
  await expect(page.locator('.match-forecast')).toContainText('chance para suas lendas');
  await expect(
    page.getByRole('progressbar', { name: 'Chance estimada de vitória' }),
  ).toHaveAttribute('aria-valuenow', /^\d+$/);
  await expect(page.locator('.match-report')).toHaveAttribute('data-moment', '0', {
    timeout: 7000,
  });
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  const snapshot = await page.locator('.kda-tables').innerText();
  await page.clock.install();
  await page.clock.runFor(15000);
  await expect(page.locator('.match-report')).toHaveAttribute('data-moment', '0');
  expect(await page.locator('.kda-tables').innerText()).toBe(snapshot);
  await page.getByRole('button', { name: '2×', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.clock.runFor(1200);
  await expect(page.locator('.match-report')).toHaveAttribute('data-moment', '1');
  expect(await page.locator('.kda-tables').innerText()).not.toBe(snapshot);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.clock.runFor(600);
  await expect(page.locator('.match-report')).toHaveAttribute('data-moment', '2');
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.screenshot({
    path: `test-results/autoplay-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Resultado rápido' }).click();
  await page.clock.runFor(10000);
  await expect(page.locator('.match-report')).toHaveAttribute('data-moment', '2');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.clock.runFor(120);
  await expect(page.locator('.game-result.win')).toHaveCount(1);
  await page.getByRole('button', { name: 'Ver relatório G1', exact: true }).click();
  await page.clock.runFor(10000);
  await expect(page.locator('.series-score')).toHaveText('1:0');
  await expect(page.getByRole('dialog').locator('.match-report')).toHaveAttribute(
    'data-moment',
    '6',
  );
  await page.getByRole('button', { name: 'Fechar relatório' }).click();
  await page.clock.runFor(500);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Etapa Suíça');
});
