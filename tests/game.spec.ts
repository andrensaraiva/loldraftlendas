import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { CHALLENGE_VERSION, encodeChallenge } from '../src/game/challenge';
import type { GameMode } from '../src/game/mode';
import type { GamePlan } from '../src/game/plan';

function challengePath(
  seed: string,
  gameMode: GameMode = 'classic',
  gamePlan: GamePlan = 'teamfight',
): string {
  const challenge = encodeChallenge({
    version: CHALLENGE_VERSION,
    seed,
    datasetVersion: 'multi-era-v1.6.0',
    gameMode,
    gamePlan,
    availability: {
      startingExchanges: 3,
      activeYears: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
      activeRegionGroups: [
        'KOREA',
        'CHINA',
        'EUROPE',
        'NORTH_AMERICA',
        'OTHER_REGIONS',
        'EUROPE_NORTH_AMERICA',
      ],
    },
  });
  return `/?challenge=${challenge}`;
}

async function draft(
  page: Page,
  challengeSeed?: string,
  gameMode: GameMode = 'classic',
  gamePlan: GamePlan = 'teamfight',
) {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto(challengeSeed ? challengePath(challengeSeed, gameMode, gamePlan) : '/');
  if (!challengeSeed && gameMode === 'almanac')
    await page.getByRole('radio', { name: /Almanaque/ }).check();
  await expect(page.locator('footer')).toContainText('RATINGS ESTIMADOS');
  await page
    .getByRole('button', { name: challengeSeed ? 'Aceitar desafio' : 'Começar draft' })
    .click();
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.pick-counter')).toContainText(`0${i + 1}`);
    await expect(page.locator('.player-card')).toHaveCount(3);
    if (gameMode === 'almanac')
      await expect(page.locator('.player-card .pool-slot b')).toHaveText(Array(15).fill('?'));
    if (gameMode === 'almanac' && i === 0) {
      await page
        .getByRole('button', { name: /^Detalhes de/ })
        .first()
        .click();
      await expect(page.locator('.almanac-dialog-note')).toContainText('números serão revelados');
      await expect(page.locator('.evidence-slots strong')).toHaveText(Array(5).fill('?'));
      await expect(page.getByRole('button', { name: 'Discorda deste rating?' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Fechar detalhes' }).click();
    }
    await expect(
      page.locator('.player-card').first().locator('.pool-slot img').first(),
    ).toHaveAttribute('src', /^\/assets\/20\d{2}\//);
    await page.locator('.player-card').first().click();
  }
  await page.getByRole('radio', { name: new RegExp(gamePlan, 'i') }).check();
}

test('Almanac hides numeric guidance and reveals it only after the campaign', async ({ page }) => {
  await draft(page, '0000000000000003', 'almanac');
  await expect(page.locator('.almanac-lock')).toContainText('serão revelados');
  await expect(page.locator('.composition-panel .comp-art b')).toHaveText(Array(5).fill('?'));
  await page.screenshot({
    path: `test-results/almanac-hidden-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Resultado rápido' }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar no Worlds' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('CAMPEÃO', {
    timeout: 25000,
  });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const value = localStorage.getItem('draft-lendas.history');
        return value ? JSON.parse(value).campaigns?.[0]?.outcome : null;
      }),
    )
    .toBe('Campeão mundial');
  await expect(page.locator('.result-achievements')).toContainText('Lendas mundiais');
  await expect(page.locator('.almanac-reveal')).toBeVisible();
  await expect(page.locator('.almanac-reveal .comp-art b')).not.toHaveText(Array(5).fill('?'));
  await expect(page.locator('.almanac-reveal .composition-scores')).toBeVisible();
  await expect(page.locator('.almanac-reveal .composition-scores')).toContainText(
    'Plano Teamfight',
  );
  await page.screenshot({
    path: `test-results/almanac-reveal-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test('challenge link reproduces the same opening offer and rejects incompatible payloads', async ({
  page,
}) => {
  const path = challengePath('draftlendas2026a');
  await page.goto(path);
  await expect(page.locator('.challenge-invite')).toContainText('DRAF-TLEN');
  await expect(page.locator('.challenge-invite')).toContainText('plano Teamfight');
  await page.screenshot({
    path: `test-results/challenge-invite-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Aceitar desafio' }).click();
  await expect(page.locator('.player-card')).toHaveCount(3);
  const firstOffer = await page
    .locator('.player-card')
    .evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label')));

  await page.goto(path);
  await page.getByRole('button', { name: 'Aceitar desafio' }).click();
  await expect(page.locator('.player-card')).toHaveCount(3);
  expect(
    await page
      .locator('.player-card')
      .evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label'))),
  ).toEqual(firstOffer);

  await page.evaluate(() => localStorage.clear());
  await page.goto('/?challenge=invalid-payload');
  await expect(page.getByRole('alert')).toContainText('inválido');
  await expect(page.getByRole('button', { name: 'Começar draft' })).toBeVisible();
});

test('quick mode automatically wins Swiss and all playoffs, keeps reports and replays', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await draft(page, '0000000000000003');
  for (let i = 1; i <= 5; i++) {
    await page.getByRole('tab', { name: `Jogo ${i}` }).click();
    await expect(page.locator('.comp-champion')).toHaveCount(5);
  }
  await page.getByRole('button', { name: 'Resultado rápido' }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar no Worlds' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('CAMPEÃO', {
    timeout: 25000,
  });
  await expect(page.getByRole('button', { name: 'Compartilhar campanha' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Copiar desafio 0000-0000/ })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar card' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('draft-lendas-campeao-mundial.png');
  await expect(page.locator('.share-status')).toContainText('Card baixado');
  await expect(page.locator('.campaign-series')).toHaveCount(8);
  await expect(page.locator('.history-games button')).toHaveCount(20);
  await expect(page.locator('.campaign-series small')).toHaveText([
    'BO1',
    'BO1',
    'BO3',
    'BO3',
    'BO3',
    'BO5',
    'BO5',
    'BO5',
  ]);
  await page.locator('.history-games button').last().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.kda-table tbody tr')).toHaveCount(10);
  await page.getByText('Linha do tempo').click();
  await expect(page.locator('.moment-history li')).toHaveCount(7);
  await page.getByRole('button', { name: 'Fechar relatório' }).click();
  await page.getByRole('button', { name: 'Jogar novamente' }).click();
  await expect(page.locator('.team-slot.filled')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('quick mode eliminates after three Swiss losses and preserves every game', async ({
  page,
}) => {
  await draft(page, '0000000000000009');
  await page.getByRole('button', { name: 'Resultado rápido' }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar no Worlds' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Eliminado no Suíço', {
    timeout: 15000,
  });
  await expect(page.locator('.campaign-series')).toHaveCount(3);
  await expect(page.locator('.history-games button')).toHaveCount(4);
  await expect(page.locator('.history-games button.loss')).toHaveCount(4);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const value = localStorage.getItem('draft-lendas.history');
        return value ? JSON.parse(value).campaigns?.[0]?.outcome : null;
      }),
    )
    .toBe('Eliminado no Suíço');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('detailed playback updates KDA, pauses, changes speed/mode and retains the same result', async ({
  page,
}) => {
  await draft(page, '0000000000000009');
  await page.getByRole('button', { name: 'Entrar no Worlds' }).click();
  await expect(page.locator('.match-forecast')).toBeVisible({ timeout: 7000 });
  await expect(page.locator('.match-forecast')).toContainText('chance para suas lendas');
  await expect(page.locator('.plan-impact')).toContainText('Plano Teamfight');
  await expect(page.locator('.plan-impact')).toContainText(/na força deste jogo/);
  await expect(
    page.getByRole('progressbar', { name: 'Chance estimada de vitória' }),
  ).toHaveAttribute('aria-valuenow', /^\d+$/);
  await expect(page.locator('.match-report')).toHaveAttribute('data-moment', '0', {
    timeout: 7000,
  });
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  const snapshot = await page.locator('.kda-tables').innerText();
  await page.clock.install();
  await page.clock.runFor(15000);
  await expect(page.locator('.match-report')).toHaveAttribute('data-moment', '0');
  expect(await page.locator('.kda-tables').innerText()).toBe(snapshot);
  await page.getByRole('button', { name: '2×', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.clock.runFor(1200);
  await expect(page.locator('.match-report')).toHaveAttribute('data-moment', '1');
  expect(await page.locator('.kda-tables').innerText()).not.toBe(snapshot);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.clock.runFor(600);
  await expect(page.locator('.match-report')).toHaveAttribute('data-moment', '2');
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.screenshot({
    path: `test-results/autoplay-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Resultado rápido' }).click();
  await page.clock.runFor(10000);
  await expect(page.locator('.match-report')).toHaveAttribute('data-moment', '2');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.clock.runFor(120);
  await expect(page.locator('.game-result.loss')).toHaveCount(1);
  await page.getByRole('button', { name: 'Ver relatório G1', exact: true }).click();
  await page.clock.runFor(10000);
  await expect(page.locator('.series-score')).toHaveText('0:1');
  await expect(page.getByRole('dialog').locator('.match-report')).toHaveAttribute(
    'data-moment',
    '6',
  );
  await page.getByRole('button', { name: 'Fechar relatório' }).click();
  await page.clock.runFor(500);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Eliminado no Suíço');
});
