import { expect, test } from '@playwright/test';

test('two players complete a local duel and resume the same result', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Math.random = () => 0;
  });

  await page.goto('/');
  await page.getByRole('link', { name: /Jogar duelo local/ }).click();
  await expect(page).toHaveURL(/\/duelo$/);
  await expect(page).toHaveTitle('Duelo local — Draft Lendas');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/duelo$/);
  await page.getByRole('button', { name: 'Começar duelo' }).click();
  await expect(page.getByRole('heading', { name: 'Escolha seu TOP.' })).toBeVisible();

  for (let index = 0; index < 5; index++) {
    const pick = page.locator('.player-pick-button').first();
    if (index === 0) {
      await pick.focus();
      await page.keyboard.press('Enter');
    } else await pick.click();
    if (index < 4) await expect(page.locator('.duel-progress .active')).toHaveCount(index + 2);
  }
  await page.getByRole('button', { name: /Agressão/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Agora é a vez do Jogador 2.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Agora é a vez do Jogador 2.' })).toBeVisible();

  await page.getByRole('button', { name: 'Sou o Jogador 2' }).click();
  for (let index = 0; index < 5; index++) await page.locator('.player-pick-button').first().click();
  await page.getByRole('button', { name: /Teamfight/ }).click();
  await expect(page.getByRole('heading', { name: /Jogador [12] venceu/ })).toBeVisible();
  const score = await page.locator('.duel-score').textContent();
  expect(await page.locator('.duel-games li').count()).toBeGreaterThanOrEqual(3);
  expect(await page.locator('.duel-games li').count()).toBeLessThanOrEqual(5);
  await page.reload();
  await expect(page.locator('.duel-score')).toHaveText(score!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
