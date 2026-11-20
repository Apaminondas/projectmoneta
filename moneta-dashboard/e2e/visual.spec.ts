import { test, expect } from '@playwright/test';
import {
  APP_ROUTES,
  buildVolatileMasks,
  openRouteAndWaitReady,
} from './routes';

test.describe('Baseline Visual — Screenshots por Rota e Viewport', () => {
  for (const route of APP_ROUTES) {
    test(`[${route.id}] ${route.sidebarLabel} — snapshot visual estável`, async ({
      page,
    }) => {
      await openRouteAndWaitReady(page, route);

      // Aguarda conclusão de timers internos (400ms setChartsLoaded) e tween SVG do Recharts (~1500ms)
      await page.waitForTimeout(route.hasCharts ? 2200 : 400);

      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur?.();
        window.scrollTo(0, 0);
      });
      await page.mouse.move(0, 0);

      const mask = buildVolatileMasks(page, route);

      await expect(page).toHaveScreenshot(`${route.id}.png`, {
        animations: 'disabled',
        caret: 'hide',
        mask,
      });
    });
  }
});

