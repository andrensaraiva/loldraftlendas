import { expect, test } from '@playwright/test';

test('the admin route is locked or explicitly marked as local demo', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('link', { name: 'Voltar ao jogo' })).toHaveAttribute('href', '/');
  const demo = page.getByText('MODO DE DEMONSTRAÇÃO LOCAL');
  if (await demo.isVisible()) {
    await expect(page.getByRole('heading', { name: 'Campanhas em movimento.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar configuração' })).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { name: 'Configure o acesso administrativo.' })).toBeVisible();
    await expect(page.getByText('SUPABASE NÃO CONFIGURADO')).toBeVisible();
  }
});