import { expect, test } from '@playwright/test';

test('public navigation, landmarks and dialogs work with the keyboard', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  await page.getByRole('button', { name: /Como jogar|Abrir instruções/ }).focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: /Cinco escolhas/ });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('metadata is indexable only on the public route', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:5173/',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'http://localhost:5173/og-draft-lendas.jpg',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index/);

  await page.goto('/admin');
  await expect(page).toHaveTitle('Admin — Draft Lendas');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('the current Riot legal notice is visible from the public route', async ({ page }) => {
  await page.goto('/');

  const footer = page.locator('footer');
  await expect(footer).toContainText("Draft Lendas isn't endorsed by Riot Games");
  await expect(footer.getByRole('link', { name: 'Política oficial' })).toHaveAttribute(
    'href',
    'https://developer.riotgames.com/policies/general',
  );
});

test('reduced-motion users do not receive card animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar draft' }).click();
  const card = page.locator('.player-card').first();
  await expect(card).toBeVisible();
  expect(await card.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
});

test('visible mobile buttons meet the minimum touch target height', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Touch target check only applies to mobile.');
  await page.goto('/');
  const undersized = await page.locator('button:visible').evaluateAll((buttons) =>
    buttons
      .map((button) => ({
        name: button.getAttribute('aria-label') || button.textContent?.trim() || 'unnamed',
        height: button.getBoundingClientRect().height,
      }))
      .filter((button) => button.height < 44),
  );
  expect(undersized).toEqual([]);
});
