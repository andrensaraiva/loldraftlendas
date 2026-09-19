import { expect, test } from '@playwright/test';

const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x1000', width: 1440, height: 1000 },
] as const;

test('captures the versioned draft baseline in every required viewport', async ({ page }, testInfo) => {
  test.skip(process.env.CAPTURE_LEGACY_BASELINE !== '1', 'Legacy reference images are immutable.');
  test.skip(testInfo.project.name !== 'desktop', 'One canonical Chromium capture set is sufficient.');
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      'draft-lendas.onboarding',
      JSON.stringify({ version: 1, status: 'completed' }),
    );
    Math.random = () => 0;
  });

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await page.getByRole('button', { name: 'Começar draft' }).click();
    await expect(page.locator('.player-card')).toHaveCount(3);
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `docs/screenshots/baseline/draft-${viewport.name}.png`,
      fullPage: true,
    });
  }
});

test('captures the current mobile-first draft in every required viewport', async ({ page }, testInfo) => {
  test.skip(process.env.UPDATE_PRODUCT_SCREENSHOTS !== '1', 'Run only when product screenshots change.');
  test.skip(testInfo.project.name !== 'desktop', 'One canonical Chromium capture set is sufficient.');
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      'draft-lendas.onboarding',
      JSON.stringify({ version: 1, status: 'completed' }),
    );
    Math.random = () => 0;
  });

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await page.getByRole('button', { name: 'Começar draft' }).click();
    await expect(page.locator('.player-card')).toHaveCount(3);
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `docs/screenshots/draft-mobile-v2/draft-${viewport.name}.png`,
      fullPage: true,
    });
  }
});
