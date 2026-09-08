import { test, expect } from '@playwright/test';

test('exchanges preserve context, details do not select, and five single clicks complete the team', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar draft' }).click();
  await expect(page.locator('.player-card')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Trocar jogadores' })).toBeDisabled();
  const region = (await page.getByRole('button', { name: 'Trocar região' }).textContent())!;
  const year = (await page.getByRole('button', { name: 'Trocar ano' }).textContent())!;
  await page.getByRole('button', { name: 'Trocar ano' }).click();
  await expect(page.getByRole('button', { name: 'Trocar ano' })).not.toHaveText(year);
  await expect(page.getByRole('button', { name: 'Trocar região' })).toHaveText(region);
  await expect(page.locator('.exchange-count')).toHaveText('2 trocas restantes');
  const nextYear = (await page.getByRole('button', { name: 'Trocar ano' }).textContent())!;
  await page.getByRole('button', { name: 'Trocar região' }).click();
  await expect(page.getByRole('button', { name: 'Trocar região' })).not.toHaveText(region);
  await expect(page.getByRole('button', { name: 'Trocar ano' })).toHaveText(nextYear);
  await expect(page.locator('.exchange-count')).toHaveText('1 troca restante');
  await page.locator('.player-details').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.evidence-slots > div')).toHaveCount(5);
  await page.getByRole('button', { name: 'Fechar detalhes' }).click();
  await expect(page.locator('.team-slot.filled')).toHaveCount(0);
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.team-slot.filled')).toHaveCount(i);
    await page.locator('.player-card').first().click();
    await expect(page.locator('.team-slot.filled')).toHaveCount(i + 1);
  }
  await expect(page.getByRole('button', { name: 'Entrar no Worlds' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('player exchange introduces a new candidate and exhausted exchanges are disabled', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.999;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar draft' }).click();
  // 2023 LCS has three candidates: changing region reaches a four-candidate pool.
  await page.getByRole('button', { name: 'Trocar região' }).click();
  await expect(page.getByRole('button', { name: 'Trocar jogadores' })).toBeEnabled();
  const first = (
    await page
      .locator('.player-card')
      .evaluateAll((xs) => xs.map((x) => x.getAttribute('aria-label')))
  ).sort();
  await page.getByRole('button', { name: 'Trocar jogadores' }).click();
  await expect
    .poll(async () =>
      (
        await page
          .locator('.player-card')
          .evaluateAll((xs) => xs.map((x) => x.getAttribute('aria-label')))
      )
        .sort()
        .join('|'),
    )
    .not.toBe(first.join('|'));
  await page.getByRole('button', { name: 'Trocar ano' }).click();
  await expect(page.locator('.exchange-count')).toHaveText('0 trocas restantes');
  await expect(page.getByRole('button', { name: 'Trocar ano' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Trocar região' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Trocar jogadores' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
