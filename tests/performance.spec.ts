import { expect, test } from '@playwright/test';

test('the home defers annual datasets and the first draft loads only its planned years', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  const annualRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/\/src\/data\/years\/\d{4}\.json/.test(url)) annualRequests.push(url);
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Começar draft' })).toBeVisible();
  expect(annualRequests).toEqual([]);

  await page.getByRole('button', { name: 'Começar draft' }).click();
  await expect(page.locator('.player-card')).toHaveCount(3);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem('draft-lendas.campaign');
        return raw ? JSON.parse(raw).campaign.rounds.length : 0;
      }),
    )
    .toBe(5);
  const plannedYears = await page.evaluate(() => {
    const raw = localStorage.getItem('draft-lendas.campaign')!;
    const save = JSON.parse(raw) as { campaign: { rounds: Array<{ year: number }> } };
    return [...new Set(save.campaign.rounds.map((round) => round.year))].sort();
  });
  const requestedYears = [
    ...new Set(annualRequests.map((url) => Number(url.match(/\/years\/(\d{4})\.json/)?.[1]))),
  ].sort();
  expect(requestedYears).toEqual(plannedYears);
  expect(requestedYears.length).toBeLessThanOrEqual(5);
  expect(requestedYears.length).toBeLessThan(8);
});
