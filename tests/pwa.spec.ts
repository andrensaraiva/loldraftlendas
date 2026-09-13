import { expect, test } from '@playwright/test';

test('web app manifest exposes installable Chromium icons and standalone metadata', async ({
  page,
}) => {
  await page.goto('/');
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBe('/manifest.webmanifest');
  const manifest = await page.evaluate(async (href) => {
    const response = await fetch(href!);
    return response.json();
  }, manifestHref);
  expect(manifest).toMatchObject({
    id: '/',
    name: 'Draft Lendas — Monte sua história',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
      expect.objectContaining({ sizes: '512x512', type: 'image/png', purpose: 'any maskable' }),
    ]),
  );
  for (const icon of manifest.icons) {
    const response = await page.request.get(icon.src);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
  }
});

test('an active draft resumes offline while admin and credentials stay outside caches', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(async () => Boolean(await navigator.serviceWorker.ready)))
    .toBe(true);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  await page.getByRole('button', { name: 'Começar draft' }).click();
  await expect(page.locator('.player-card')).toHaveCount(3);
  await expect
    .poll(() => page.evaluate(() => Boolean(localStorage.getItem('draft-lendas.campaign'))))
    .toBe(true);

  await context.setOffline(true);
  await page.goto('/');
  await expect(page.getByText(/Offline · sua campanha salva continua disponível/)).toBeVisible();
  await page.getByRole('button', { name: 'Continuar campanha' }).click();
  await expect(page.locator('.player-card')).toHaveCount(3);
  await context.setOffline(false);

  await page.goto('/admin');
  await expect(page.getByRole('link', { name: 'Voltar ao jogo' })).toBeVisible();

  const cachedUrls = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      urls.push(...(await cache.keys()).map((request) => request.url));
    }
    return urls;
  });
  expect(cachedUrls.some((url) => new URL(url).pathname.startsWith('/admin'))).toBe(false);
  expect(cachedUrls.some((url) => url.includes('/rest/v1/') || url.includes('/auth/v1/'))).toBe(
    false,
  );
});
