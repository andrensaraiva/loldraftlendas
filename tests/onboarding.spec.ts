import { expect, test } from '@playwright/test';

const storageKey = 'draft-lendas.onboarding';

test('first visit teaches the five steps, persists completion and can be reopened', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);
  await page.reload();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('1 · MONTE SUA EQUIPE');
  await expect(page.getByRole('button', { name: 'Próxima' })).toBeFocused();

  for (let step = 2; step <= 5; step++) {
    await page.keyboard.press('ArrowRight');
    await expect(dialog).toContainText(`${step} ·`);
  }
  await expect(page.getByRole('button', { name: 'Começar a jogar' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar a jogar' }).click();
  await expect(dialog).toBeHidden();
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').status, storageKey),
  ).toBe('completed');

  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: /Como jogar|Abrir instruções/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Pular', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('mobile onboarding supports swipe and reduced motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Touch behavior is covered in the mobile project.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);
  await page.reload();

  const panel = page.locator('.onboarding-panel');
  await panel.dispatchEvent('pointerdown', { clientX: 320, pointerType: 'touch' });
  await panel.dispatchEvent('pointerup', { clientX: 120, pointerType: 'touch' });
  await expect(page.getByRole('dialog')).toContainText('2 · LEIA AS CARTAS');
  expect(await page.locator('.onboarding-slide').evaluate((node) => getComputedStyle(node).animationName)).toBe(
    'none',
  );
  await page.getByRole('button', { name: 'Fechar e pular apresentação' }).click();
});
