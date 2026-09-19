import { expect, test } from '@playwright/test';

const localHistory = {
  version: 1,
  campaigns: [
    {
      id: 'local-example',
      completedAt: '2026-09-13T12:00:00.000Z',
      outcome: 'Campeão mundial',
      wins: 12,
      losses: 1,
      confrontations: 7,
      source: 'daily',
      gameMode: 'almanac',
      gamePlan: 'teamfight',
      dailyAttemptKind: 'official',
      team: [
        { playerName: 'Top', team: 'A', worldsYear: 2015, role: 'TOP' },
        { playerName: 'Jungle', team: 'B', worldsYear: 2017, role: 'JUNGLE' },
        { playerName: 'Mid', team: 'C', worldsYear: 2019, role: 'MID' },
        { playerName: 'ADC', team: 'D', worldsYear: 2023, role: 'ADC' },
        { playerName: 'Support', team: 'E', worldsYear: 2025, role: 'SUPPORT' },
      ],
    },
  ],
};

test('local history can be inspected, exported and explicitly cleared', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((history) => {
    localStorage.setItem('draft-lendas.history', JSON.stringify(history));
  }, localHistory);
  await page.reload();

  await page.getByText('Seu histórico local').click();
  await expect(page.locator('.history-campaigns')).toContainText('Campeão mundial');
  await expect(page.locator('.history-achievements')).toContainText('Mestre do Almanaque');
  await expect(page.locator('.history-achievements')).toContainText('Compromisso diário');
  await page.screenshot({
    path: `test-results/local-history-${test.info().project.name}.png`,
    fullPage: true,
  });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^draft-lendas-historico-\d{4}-\d{2}-\d{2}\.json$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const exported = Buffer.concat(chunks).toString('utf8');
  expect(JSON.parse(exported)).toMatchObject({ version: 3, campaigns: [{ id: 'local-example' }] });
  expect(exported).not.toContain('seed');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Limpar histórico' }).click();
  await expect(page.getByText('0 campanhas')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('draft-lendas.history'))).toBeNull();
});
