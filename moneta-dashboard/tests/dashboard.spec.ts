import { test, expect } from '@playwright/test';

test.describe('Moneta — Dashboard Corporativo E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar a Visão Geral com título e indicadores', async ({ page }) => {
    await expect(page).toHaveTitle(/Moneta/i);

    // Verifica presença da marca/logo
    const brand = page.locator('text=/Moneta/i').first();
    await expect(brand).toBeVisible();

    // Verifica que os cards de KPI ou saldo são renderizados
    const dashboardContent = page.locator('main, section, div').filter({ hasText: /Receita|Despesa|Saldo/i }).first();
    await expect(dashboardContent).toBeVisible();
  });

  test('deve navegar até Categorias e validar o Kanban com faturamento real', async ({ page }) => {
    // Clica no menu Categorias na barra lateral
    const categoriasBtn = page.getByRole('button', { name: /Categorias/i }).or(page.locator('text=Categorias')).first();
    await categoriasBtn.click();
    await page.waitForTimeout(1000);

    // Valida que a coluna Faturamento de Contratos SaaS está visível
    const faturamentoHeader = page.locator('h3').filter({ hasText: /Faturamento de/i }).first();
    await expect(faturamentoHeader).toBeVisible();

    // Valida que o total da coluna NÃO é R$ 0
    const faturamentoColumn = page.locator('div').filter({ has: faturamentoHeader }).first();
    await expect(faturamentoColumn).not.toHaveText(/R\$\s*0,00/);

    // Valida que exibe o selo de Receita Operacional
    await expect(page.locator('text=Receita Operacional').first()).toBeVisible();

    // Valida coluna de Folha de Pagamento
    const folhaHeader = page.locator('h3').filter({ hasText: /Folha de Pagamento/i }).first();
    await expect(folhaHeader).toBeVisible();
  });

  test('deve navegar entre as seções do menu lateral', async ({ page }) => {
    // Menu Lançamentos
    const lancamentosBtn = page.getByRole('button', { name: /Lançamentos/i }).or(page.locator('text=Lançamentos')).first();
    if (await lancamentosBtn.isVisible()) {
      await lancamentosBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toContainText(/Lançamentos/i);
    }

    // Menu Contas
    const contasBtn = page.getByRole('button', { name: /Contas/i }).or(page.locator('text=Contas')).first();
    if (await contasBtn.isVisible()) {
      await contasBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toContainText(/Contas/i);
    }
  });
});
