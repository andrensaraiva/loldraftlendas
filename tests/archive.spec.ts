import { expect, test } from '@playwright/test';

test('archive index stays lightweight and searches public player/champion routes', async ({
  page,
}) => {
  const annualRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/src\/data\/years\/\d{4}\.json/.test(request.url())) annualRequests.push(request.url());
  });
  await page.goto('/arquivo');
  await expect(page.getByRole('heading', { name: 'O Worlds, lenda por lenda.' })).toBeVisible();
  await expect(page.locator('.archive-editions a')).toHaveCount(12);
  await expect(page).toHaveTitle('Arquivo histórico — Draft Lendas');
  expect(annualRequests).toEqual([]);

  await page.getByPlaceholder('Buscar jogador ou campeão').fill('Faker');
  await expect(page.getByRole('link', { name: /Faker/ })).toHaveAttribute(
    'href',
    '/arquivo/jogador/faker',
  );
  await page.getByPlaceholder('Buscar jogador ou campeão').fill('Jarvan');
  await expect(page.getByRole('link', { name: /Jarvan IV/ })).toHaveAttribute(
    'href',
    '/arquivo/campeao/JarvanIV',
  );
});

test('edition route loads only its annual chunk and exposes researched sources', async ({
  page,
}) => {
  const annualRequests: string[] = [];
  page.on('request', (request) => {
    const match = request.url().match(/\/src\/data\/years\/(\d{4})\.json/);
    if (match) annualRequests.push(match[1]);
  });
  await page.goto('/arquivo/edicao/2025');
  await expect(page.getByRole('heading', { name: 'Worlds 2025' })).toBeVisible();
  await expect(page.locator('.archive-player-card')).toHaveCount(80);
  await expect(page.locator('.archive-source').first()).toHaveAttribute('href', /^https:\/\//);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/arquivo\/edicao\/2025$/,
  );
  expect([...new Set(annualRequests)]).toEqual(['2025']);
  await page.screenshot({
    path: `test-results/archive-edition-${test.info().project.name}.png`,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('player and champion routes load only indexed years', async ({ page }) => {
  const requestedYears = new Set<string>();
  page.on('request', (request) => {
    const match = request.url().match(/\/src\/data\/years\/(\d{4})\.json/);
    if (match) requestedYears.add(match[1]);
  });
  await page.goto('/arquivo/jogador/faker');
  await expect(page.getByRole('heading', { level: 1, name: 'Faker' })).toBeVisible();
  await expect(page.locator('.archive-player-card')).toHaveCount(9);
  expect([...requestedYears].sort()).toEqual([
    '2015',
    '2016',
    '2017',
    '2019',
    '2021',
    '2022',
    '2023',
    '2024',
    '2025',
  ]);

  requestedYears.clear();
  await page.goto('/arquivo/campeao/Ambessa');
  await expect(page.getByRole('heading', { level: 1, name: 'Ambessa' })).toBeVisible();
  await expect(page.locator('.archive-player-card').first()).toBeVisible();
  await expect(page.locator('.archive-pool > div')).toHaveCount(
    await page.locator('.archive-player-card').count(),
  );
  expect([...requestedYears].every((year) => year === '2025')).toBe(true);
});
