import { expect, test } from '@playwright/test';

test('the home defers annual datasets and the first draft loads only selected years', async ({
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
  expect(annualRequests).toHaveLength(1);
  expect(annualRequests[0]).toContain('/src/data/years/2015.json');
});
