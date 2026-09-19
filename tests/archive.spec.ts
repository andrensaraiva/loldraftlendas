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

  await expect(page.locator('.archive-team-index a')).toHaveCount(63);
  await page.getByPlaceholder('Buscar jogador, campeão ou equipe').fill('Faker');
  await expect(page.getByRole('link', { name: /Faker/ })).toHaveAttribute(
    'href',
    '/arquivo/jogador/faker',
  );
  await expect(page).toHaveURL(/\?q=Faker$/);
  await page.getByPlaceholder('Buscar jogador, campeão ou equipe').fill('Jarvan');
  await expect(page.getByRole('link', { name: /Jarvan IV/ })).toHaveAttribute(
    'href',
    '/arquivo/campeao/JarvanIV',
  );
  await page.getByPlaceholder('Buscar jogador, campeão ou equipe').fill('SK Telecom');
  await expect(page.locator('.archive-search-results').getByRole('link', { name: /SK Telecom T1/ })).toHaveAttribute(
    'href',
    '/arquivo/equipe/sk-telecom-t1',
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

test('edition filters and ordering stay represented in the URL', async ({ page }) => {
  await page.goto('/arquivo/edicao/2025?posicao=MID&regiao=LCK&ordem=rating-desc');
  await expect(page.getByLabel('Posição')).toHaveValue('MID');
  await expect(page.getByLabel('Região')).toHaveValue('LCK');
  await expect(page.getByLabel('Ordem')).toHaveValue('rating-desc');
  const cards = page.locator('.archive-player-card');
  expect(await cards.count()).toBeGreaterThan(0);
  await expect(cards.locator('.archive-player-heading > div > span')).toHaveText(
    Array(await cards.count()).fill('MID · 2025'),
  );
  await page.getByLabel('Equipe').selectOption('t1');
  await expect(page).toHaveURL(/equipe=t1/);
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Faker');
  await page.getByRole('button', { name: 'Limpar' }).click();
  await expect(page).toHaveURL(/\/arquivo\/edicao\/2025$/);
  await expect(cards).toHaveCount(80);
});

test('team pages, version comparison and draft handoff load only their indexed recut', async ({
  page,
}) => {
  const requestedYears = new Set<string>();
  page.on('request', (request) => {
    const match = request.url().match(/\/src\/data\/years\/(\d{4})\.json/);
    if (match) requestedYears.add(match[1]);
  });
  await page.goto('/arquivo/equipe/t1');
  await expect(page.getByRole('heading', { level: 1, name: 'T1' })).toBeVisible();
  await expect(page.locator('.archive-player-card')).toHaveCount(25);
  expect([...requestedYears].sort()).toEqual(['2021', '2022', '2023', '2024', '2025']);
  await expect(page.getByRole('link', { name: 'Levar este recorte ao draft' })).toHaveAttribute(
    'href',
    '/?archiveYear=2025&archiveRegion=LCK',
  );

  requestedYears.clear();
  await page.goto('/arquivo/jogador/faker?de=2017&para=2025');
  await expect(page.locator('.archive-comparison-cards article')).toHaveCount(2);
  await expect(page.locator('.archive-comparison-cards article').first()).toContainText('2017');
  await expect(page.locator('.archive-comparison-cards article').last()).toContainText('2025');
  await page.getByLabel('Versão inicial').selectOption('2019');
  await expect(page).toHaveURL(/de=2019/);

  await page.goto('/?archiveYear=2025&archiveRegion=LCK');
  await page.getByText('Personalizar draft e desafio').click();
  await expect(page.getByRole('checkbox', { name: '2025', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: '2024', exact: true })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'KOREA', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'CHINA', exact: true })).not.toBeChecked();
});
