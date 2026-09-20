import { expect, test } from '@playwright/test';

test('beta smoke opens the public routes and starts a draft without browser errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Lendas de todas as eras/i })).toBeVisible();
  await expect(page.locator('.daily-objective')).toContainText('Objetivo:');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);

  await page.getByRole('button', { name: 'Começar draft' }).click();
  await expect(page.locator('.player-card')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: /Escolha sua lenda/i })).toBeVisible();

  await page.goto('/arquivo');
  await expect(page.getByRole('heading', { name: 'O Worlds, lenda por lenda.' })).toBeVisible();
  expect(errors).toEqual([]);
});
