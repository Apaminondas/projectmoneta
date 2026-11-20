import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Verifica que o título da página contém Moneta
  await expect(page).toHaveTitle(/Moneta/i);
});

test('get started link', async ({ page }) => {
  await page.goto('/');

  // Verifica presença do logotipo e marca Moneta
  const brand = page.locator('text=Moneta').first();
  await expect(brand).toBeVisible();
});
