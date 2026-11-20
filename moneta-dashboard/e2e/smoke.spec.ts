import { test, expect } from '@playwright/test';
import { APP_ROUTES, openRouteAndWaitReady } from './routes';

test.describe('Smoke E2E — Rotas e Telas do Menu Lateral', () => {
  for (const route of APP_ROUTES) {
    test(`[${route.id}] ${route.sidebarLabel} — abre com cabeçalho visível e zero erros de console/página`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        pageErrors.push(err.message);
      });

      await openRouteAndWaitReady(page, route);

      await expect(page.locator('header h1')).toBeVisible();
      await expect(page.locator('header h1')).toHaveText(route.headerTitle);
      await expect(page.locator('main')).toContainText(route.contentAnchorText);

      expect(consoleErrors, 'Erros de console detectados').toEqual([]);
      expect(pageErrors, 'Erros não tratados de página detectados').toEqual([]);

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));

      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });
  }
});

