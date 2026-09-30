import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { InvitationServer } from './fixtures/online-duel';

async function createRoom(page: Page) {
  await page.goto('/duelo/sala');
  await page.getByRole('button', { name: 'Criar sala', exact: true }).click();
  await expect(page).toHaveURL(/#([A-F0-9]{12})$/);
  return new URL(page.url()).hash.slice(1);
}

async function draft(page: Page, start = 0, plan = 'Agressão') {
  const roles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
  for (let index = start; index < roles.length; index++) {
    await expect(page.getByRole('heading', { name: `Escolha seu ${roles[index]}.` })).toBeVisible();
    await page.locator('.player-pick-button').first().click();
  }
  await page.getByRole('button', { name: new RegExp(plan) }).click();
  await expect(page.getByRole('heading', { name: 'Pronto para enviar?' })).toBeVisible();
}

async function nextPoll(page: Page, server: InvitationServer) {
  const reads = server.reads;
  const response = await page.waitForResponse(
    (response) => response.url().endsWith('/rpc/get_duel_room'),
    { timeout: 8000 },
  );
  await response.finished();
  await expect.poll(() => server.reads, { timeout: 8000 }).toBeGreaterThan(reads);
}

test('two independent sessions resume drafts and receive the same final series', async ({
  page,
  context,
  browser,
}, testInfo) => {
  const server = new InvitationServer();
  await server.attach(context);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const code = await createRoom(page);
  await page.locator('.player-pick-button').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Escolha seu JUNGLE.' })).toBeFocused();
  await page.locator('.player-pick-button').first().click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Escolha seu MID.' })).toBeVisible();
  expect(server.signups).toBe(1);
  await draft(page, 2);
  await page.getByRole('button', { name: 'Enviar equipe' }).click();
  await expect(page.getByRole('heading', { name: 'Aguardando adversário.' })).toBeVisible();

  const guestContext = await browser.newContext({
    ...testInfo.project.use,
    storageState: { cookies: [], origins: [] },
  });
  try {
    await server.attach(guestContext);
    const guest = await guestContext.newPage();
    guest.on('pageerror', (error) => errors.push(error.message));
    await guest.goto(page.url());
    await expect(guest.getByRole('heading', { name: 'Entrar na sala.' })).toBeVisible();
    expect(server.signups).toBe(1);
    await guest.getByRole('button', { name: 'Entrar no duelo' }).click();
    await expect(guest.getByRole('heading', { name: 'Escolha seu TOP.' })).toBeVisible();
    expect(server.signups).toBe(2);
    await expect(guest.locator('.duel-result-teams')).toHaveCount(0);
    await draft(guest, 0, 'Teamfight');
    await guest.getByRole('button', { name: 'Enviar equipe' }).click();
    await expect(guest.locator('.duel-score')).toBeVisible();
    const score = await guest.locator('.duel-score').textContent();
    await expect(page.locator('.duel-score')).toHaveText(score!, { timeout: 8000 });
    expect(await page.locator('.duel-games li').allTextContents()).toEqual(
      await guest.locator('.duel-games li').allTextContents(),
    );
    await page.reload();
    await guest.reload();
    await expect(page.locator('.duel-score')).toHaveText(score!);
    await expect(guest.locator('.duel-score')).toHaveText(score!);
    expect(server.signups).toBe(2);
    for (const participant of [page, guest]) {
      expect(
        await participant.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
    }
    expect(new URL(guest.url()).hash).toBe(`#${code}`);
    expect(errors).toEqual([]);
  } finally {
    await guestContext.close();
  }
});

test('catalog mismatch stays actionable after automatic updates', async ({ page, context }) => {
  const server = new InvitationServer();
  const currentVersion = server.datasetVersion;
  server.datasetVersion = 'old-catalog';
  await server.attach(context);
  await createRoom(page);
  const heading = page.getByRole('heading', { name: 'Versão da sala indisponível.' });
  await expect(heading).toBeVisible();
  await nextPoll(page, server);
  await expect(heading).toBeVisible();
  server.datasetVersion = currentVersion;
  await page.getByRole('button', { name: 'Criar nova sala' }).click();
  await expect(page.getByRole('heading', { name: 'Escolha seu TOP.' })).toBeVisible();
});

test('failed data download remains recoverable after polling', async ({ page, context }) => {
  const server = new InvitationServer();
  await server.attach(context);
  const yearChunk = '**/src/data/years/2017.json*';
  await page.route(yearChunk, (route) => route.abort());
  await createRoom(page);
  const heading = page.getByRole('heading', { name: 'Não foi possível abrir a sala.' });
  await expect(heading).toBeVisible();
  await nextPoll(page, server);
  await expect(heading).toBeVisible();
  await page.unroute(yearChunk);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Escolha seu TOP.' })).toBeVisible();
});

for (const hash of ['', 'INVALIDO']) {
  test(`changing the invitation to ${hash || 'an empty code'} clears the previous room`, async ({
    page,
    context,
  }) => {
    const server = new InvitationServer();
    await server.attach(context);
    const code = await createRoom(page);
    await page.locator('.player-pick-button').first().click();
    await page.evaluate((value) => {
      window.location.hash = value;
    }, hash);
    await expect(
      page.getByRole('heading', {
        name: hash ? 'Código inválido.' : /Sua sala/,
      }),
    ).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Convite da sala' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cancelar sala' })).toHaveCount(0);
    await page.evaluate((value) => {
      window.location.hash = value;
    }, code);
    await expect(page.getByRole('heading', { name: 'Escolha seu JUNGLE.' })).toBeVisible();
  });
}

test('connection and submission failures preserve the team for retry', async ({
  page,
  context,
}) => {
  const server = new InvitationServer();
  await server.attach(context);
  await createRoom(page);
  await draft(page);
  server.failReads = true;
  await nextPoll(page, server);
  await expect(page.getByRole('alert')).toContainText('Não foi possível consultar');
  await expect(page.getByRole('heading', { name: 'Pronto para enviar?' })).toBeVisible();
  server.failReads = false;
  await page.getByRole('button', { name: 'Atualizar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  server.failSubmissions = true;
  await page.getByRole('button', { name: 'Enviar equipe' }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível enviar');
  await expect(page.locator('.duel-roster > span')).toHaveCount(5);
  server.failSubmissions = false;
  await page.getByRole('button', { name: 'Enviar equipe' }).click();
  await expect(page.getByRole('heading', { name: 'Aguardando adversário.' })).toBeVisible();
});

test('cancelled and expired invitations stop drafting and allow a new room', async ({
  page,
  context,
}) => {
  const server = new InvitationServer();
  await server.attach(context);
  await createRoom(page);
  await expect(page.getByRole('heading', { name: 'Escolha seu TOP.' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Cancelar sala' }).click();
  await expect(page.getByRole('heading', { name: 'Sala cancelada.' })).toBeVisible();
  await page.getByRole('button', { name: 'Criar nova sala' }).click();
  await expect(page.getByRole('heading', { name: 'Escolha seu TOP.' })).toBeVisible();
  server.close(new URL(page.url()).hash.slice(1), 'expired');
  await expect(page.getByRole('heading', { name: 'Convite vencido.' })).toBeVisible({
    timeout: 8000,
  });
  await expect(page.locator('.player-pick-button')).toHaveCount(0);
  await page.getByRole('button', { name: 'Criar nova sala' }).click();
  await expect(page.getByRole('heading', { name: 'Escolha seu TOP.' })).toBeVisible();
});
