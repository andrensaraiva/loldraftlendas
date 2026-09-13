import { expect, test } from '@playwright/test';

test('daily challenge keeps one official local attempt and exposes the recent archive', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('draft-lendas.daily-attempts');
    localStorage.removeItem('draft-lendas.campaign');
  });
  await page.reload();

  await expect(
    page.getByRole('heading', { name: 'Um draft igual para todo mundo.' }),
  ).toBeVisible();
  await expect(page.getByText('Oficial disponível')).toBeVisible();
  await page.screenshot({
    path: `test-results/daily-challenge-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Jogar tentativa oficial' }).click();
  await expect(page.locator('.player-card')).toHaveCount(3);

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const raw = localStorage.getItem('draft-lendas.campaign');
        if (!raw) return null;
        const campaign = JSON.parse(raw).campaign;
        return {
          source: campaign.campaignSource,
          kind: campaign.dailyAttemptKind,
          mode: campaign.gameMode,
        };
      }),
    )
    .toEqual({ source: 'daily', kind: 'official', mode: 'almanac' });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Jogar amistosamente' })).toBeVisible();
  await page.getByText('Arquivo dos últimos 7 dias').click();
  await expect(page.getByRole('button', { name: /Jogar amistoso/ })).toHaveCount(6);
  await page
    .getByRole('button', { name: /Jogar amistoso/ })
    .first()
    .click();
  await expect(page.locator('.player-card')).toHaveCount(3);
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const raw = localStorage.getItem('draft-lendas.campaign');
        if (!raw) return null;
        const campaign = JSON.parse(raw).campaign;
        return { source: campaign.campaignSource, kind: campaign.dailyAttemptKind };
      }),
    )
    .toEqual({ source: 'daily', kind: 'friendly' });
});
