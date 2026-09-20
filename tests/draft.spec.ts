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
  await expect(page.getByRole('button', { name: 'Discorda deste rating?' })).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'Ver todas as versões no arquivo ↗' })).toHaveAttribute(
    'href',
    /\/arquivo\/jogador\//,
  );
  await page.getByRole('button', { name: 'Discorda deste rating?' }).first().click();
  await page.screenshot({
    path: `test-results/rating-feedback-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('radio', { name: 'Rating baixo demais' }).check();
  await page.getByLabel('Observação opcional').fill('Revisar impacto no jogo decisivo.');
  await page.getByRole('button', { name: 'Enviar revisão' }).click();
  await expect(page.getByRole('status')).toContainText('Revisão registrada para o G1');
  await page.getByRole('button', { name: 'Fechar detalhes' }).click();
  await expect(page.locator('.team-slot.filled')).toHaveCount(0);
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.team-slot.filled')).toHaveCount(i);
    await page.locator('.player-pick-button').first().click();
    await expect(page.locator('.team-slot.filled')).toHaveCount(i + 1);
  }
  await expect(page.getByRole('button', { name: 'Escolha um plano' })).toBeDisabled();
  await page.getByRole('radio', { name: /Teamfight/ }).check();
  await expect(page.getByRole('button', { name: 'Entrar no Worlds' })).toBeEnabled();
  await expect(page.locator('.game-plan-grid > label.selected')).toContainText('Teamfight');
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

test('home filters persist an eligible edition and region in every draft round', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByText('Personalizar draft e desafio').click();
  for (const year of [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024])
    await page.getByRole('checkbox', { name: String(year), exact: true }).uncheck();
  for (const group of ['KOREA', 'CHINA', 'EUROPA', 'AMÉRICA DO NORTE', 'EUROPA + AMÉRICA DO NORTE'])
    await page.getByRole('checkbox', { name: group, exact: true }).uncheck();

  await expect(page.getByRole('status')).toContainText('exatamente este recorte');
  await page.screenshot({
    path: `test-results/challenge-filters-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Começar draft' }).click();
  for (let round = 0; round < 5; round++) {
    await expect(page.getByRole('button', { name: 'Trocar ano' })).toContainText('2025');
    await expect(page.getByRole('button', { name: 'Trocar região' })).toContainText(
      'OUTRAS REGIÕES',
    );
    await page.locator('.player-pick-button').first().click();
  }
  await expect(page.locator('.team-slot.filled')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('approved portrait pilot uses portraits and falls back safely when assets fail', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByText('Personalizar draft e desafio').click();
  for (const year of [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024])
    await page.getByRole('checkbox', { name: String(year), exact: true }).uncheck();
  for (const group of [
    'CHINA',
    'EUROPA',
    'AMÉRICA DO NORTE',
    'OUTRAS REGIÕES',
    'EUROPA + AMÉRICA DO NORTE',
  ])
    await page.getByRole('checkbox', { name: group, exact: true }).uncheck();
  await page.getByRole('button', { name: 'Começar draft' }).click();

  const zeus = page.locator('.player-card').filter({ hasText: 'Zeus' });
  await expect(zeus).toHaveCount(1);
  const portrait = zeus.locator('.player-portrait');
  await expect(portrait).toHaveAttribute('data-portrait-state', 'approved');
  await expect(portrait.locator('img')).toHaveAttribute('src', /portraits\/pilot-v1\/zeus\.webp$/);

  await portrait.locator('img').evaluate((image) => {
    (image as HTMLImageElement).src = '/assets/players/portraits/missing.webp';
  });
  await expect(portrait.locator('img')).toHaveAttribute('src', /silhouettes\/pilot-v1\/zeus\.webp$/);
  await portrait.locator('img').evaluate((image) => {
    (image as HTMLImageElement).src = '/assets/players/silhouettes/missing.webp';
  });
  await expect(zeus.locator('.player-avatar')).toBeVisible();
  await expect(page.locator('.player-card .player-avatar')).toHaveCount(3);
});

test('a browser-local campaign can be resumed or replaced from the home screen', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar draft' }).click();
  await page.locator('.player-pick-button').first().click();
  await expect(page.locator('.team-slot.filled')).toHaveCount(1);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Continuar campanha' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar campanha' }).click();
  await expect(page.locator('.team-slot.filled')).toHaveCount(1);
  await expect(page.locator('.player-card')).toHaveCount(3);

  await page.reload();
  await page.getByRole('button', { name: 'Novo draft' }).click();
  await expect(page.getByRole('dialog', { name: 'Começar um novo draft?' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar novo draft' }).click();
  await expect(page.locator('.team-slot.filled')).toHaveCount(0);
  await expect(page.locator('.player-card')).toHaveCount(3);
});

test('campaign navigation preserves progress and requires confirmation before abandoning', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar draft' }).click();
  await page.locator('.player-pick-button').first().click();
  await expect(page.locator('.team-slot.filled')).toHaveCount(1);

  await page.goBack();
  await expect(page.getByRole('button', { name: 'Continuar campanha' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar campanha' }).click();
  await expect(page.locator('.team-slot.filled')).toHaveCount(1);
  await page.getByRole('button', { name: 'Continuar depois', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continuar campanha' })).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('draft-lendas.campaign') ?? '{}').campaign?.settings?.paused,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Continuar campanha' }).click();

  await page.getByRole('button', { name: 'Abandonar campanha', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Abandonar esta campanha?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Manter campanha' }).click();
  await expect(page.locator('.team-slot.filled')).toHaveCount(1);
  await page.getByRole('button', { name: 'Abandonar campanha', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Abandonar esta campanha?' })
    .getByRole('button', { name: 'Abandonar campanha' })
    .click();
  await expect(page.getByRole('button', { name: 'Começar draft' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('draft-lendas.campaign'))).toBeNull();
});

test('mobile carousel changes candidate without selecting on horizontal navigation', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Carousel behavior is mobile-specific.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar draft' }).click();
  await expect(page.locator('.carousel-toolbar')).toContainText('1 de 3');
  await page.getByRole('button', { name: 'Ver próxima lenda' }).click();
  await expect(page.locator('.carousel-toolbar')).toContainText('2 de 3');
  await expect(page.locator('.team-slot.filled')).toHaveCount(0);
  await page.locator('.player-grid').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.carousel-toolbar')).toContainText('3 de 3');
  await expect(page.locator('.team-slot.filled')).toHaveCount(0);
});

test('draft remains contained and useful in every required viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The desktop project drives the full viewport matrix.');
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ];
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      'draft-lendas.onboarding',
      JSON.stringify({ version: 1, status: 'completed' }),
    );
  });

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'Começar draft' }).click();
    await expect(page.locator('.player-card')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const first = await page.locator('.player-card').first().boundingBox();
    expect(first?.width).toBeGreaterThan(viewport.width <= 700 ? 250 : 200);
    if (viewport.width <= 700) {
      const second = await page.locator('.player-card').nth(1).boundingBox();
      expect(second?.x).toBeLessThan(viewport.width);
      await expect(page.locator('.player-pick-button').first()).toBeVisible();
    }
  }
});
