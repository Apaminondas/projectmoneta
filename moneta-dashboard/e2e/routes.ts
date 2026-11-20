import { expect, type Locator, type Page } from '@playwright/test';

export interface AppRouteSpec {
  id:
    | 'overview'
    | 'pipeline'
    | 'deals'
    | 'customers'
    | 'team'
    | 'forecasting'
    | 'reports'
    | 'settings';
  sidebarLabel: string;
  headerTitle: string;
  contentAnchorText: string;
  readyText: string;
  hasCharts: boolean;
  hasPreExistingDesktopOverflow: boolean;
}

export const APP_ROUTES: AppRouteSpec[] = [
  {
    id: 'overview',
    sidebarLabel: 'Visão Geral',
    headerTitle: 'Visão Geral',
    contentAnchorText: 'Últimos Lançamentos',
    readyText: 'Receita Mensal',
    hasCharts: true,
    hasPreExistingDesktopOverflow: false,
  },
  {
    id: 'pipeline',
    sidebarLabel: 'Categorias',
    headerTitle: 'Categorias',
    contentAnchorText: 'Acompanhamento por Categorias',
    readyText: 'Adicionar item',
    hasCharts: false,
    hasPreExistingDesktopOverflow: false,
  },
  {
    id: 'deals',
    sidebarLabel: 'Lançamentos',
    headerTitle: 'Lançamentos',
    contentAnchorText: 'Favorecido / Categoria',
    readyText: 'Mostrando',
    hasCharts: false,
    hasPreExistingDesktopOverflow: true,
  },
  {
    id: 'customers',
    sidebarLabel: 'Contas',
    headerTitle: 'Contas',
    contentAnchorText: 'Total de Contas',
    readyText: 'Última Operação',
    hasCharts: false,
    hasPreExistingDesktopOverflow: false,
  },
  {
    id: 'team',
    sidebarLabel: 'Orçamentos',
    headerTitle: 'Orçamentos',
    contentAnchorText: 'Gasto Real vs Teto Orçamentário',
    readyText: 'Uso do Teto',
    hasCharts: true,
    hasPreExistingDesktopOverflow: false,
  },
  {
    id: 'forecasting',
    sidebarLabel: 'Previsões',
    headerTitle: 'Previsões',
    contentAnchorText: 'Previsão de Fluxo & Saldo',
    readyText: 'Fatores de Risco Orçamentário',
    hasCharts: true,
    hasPreExistingDesktopOverflow: false,
  },
  {
    id: 'reports',
    sidebarLabel: 'Relatórios',
    headerTitle: 'Relatórios',
    contentAnchorText: 'Relatórios Recentes',
    readyText: 'Origem das Receitas',
    hasCharts: true,
    hasPreExistingDesktopOverflow: false,
  },
  {
    id: 'settings',
    sidebarLabel: 'Ajustes',
    headerTitle: 'Ajustes',
    contentAnchorText: 'Configurações',
    readyText: 'Informações do Usuário',
    hasCharts: false,
    hasPreExistingDesktopOverflow: false,
  },
];

export async function openRouteAndWaitReady(
  page: Page,
  route: AppRouteSpec
): Promise<void> {
  let inflightApiRequests = 0;
  const isTrackedApi = (url: string) => url.includes('/api/');
  const onReq = (req: { url(): string }) => {
    if (isTrackedApi(req.url())) inflightApiRequests++;
  };
  const onDone = (req: { url(): string }) => {
    if (isTrackedApi(req.url())) {
      inflightApiRequests = Math.max(0, inflightApiRequests - 1);
    }
  };

  page.on('request', onReq);
  page.on('requestfinished', onDone);
  page.on('requestfailed', onDone);

  try {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('header h1')).toBeVisible();

    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    if (!(await mobileMenuBtn.isVisible())) {
      await expect(page.locator('aside.bg-sidebar')).toBeVisible();
    }

    if (route.id !== 'overview') {
      const navButton = page
        .locator('aside.bg-sidebar nav button')
        .filter({ hasText: route.sidebarLabel })
        .first();

      // Garante clique pós-hidratação do React no App Router (abrindo drawer no mobile 375px)
      await expect(async () => {
        if (await mobileMenuBtn.isVisible()) {
          if (!(await page.locator('aside.bg-sidebar').isVisible())) {
            await mobileMenuBtn.click();
          }
          await expect(page.locator('aside.bg-sidebar')).toBeVisible({ timeout: 1500 });
        }
        await expect(navButton).toBeVisible({ timeout: 1500 });
        await navButton.click();
        await expect(page.locator('header h1')).toHaveText(route.headerTitle, {
          timeout: 1500,
        });
      }).toPass({ timeout: 10000 });
    } else {
      await expect(page.locator('header h1')).toHaveText(route.headerTitle);
    }

    await expect(page.locator('main')).toContainText(route.contentAnchorText);
    await expect(page.locator('main')).toContainText(route.readyText, {
      timeout: 15000,
    });

    if (route.id === 'deals') {
      await expect(
        page.locator('main', { hasText: 'Carregando lançamentos...' })
      ).toHaveCount(0);
    }

    // Aguarda todas as requisições /api/ da tela terminarem sem depender de networkidle (HMR/polling)
    await expect
      .poll(() => inflightApiRequests, { timeout: 15000, intervals: [150, 250] })
      .toBe(0);

    await page.evaluate(async () => {
      await document.fonts.ready;
      (document.activeElement as HTMLElement | null)?.blur?.();
      window.scrollTo(0, 0);
    });
    await page.mouse.move(0, 0);
  } finally {
    page.off('request', onReq);
    page.off('requestfinished', onDone);
    page.off('requestfailed', onDone);
  }
}

export function buildVolatileMasks(page: Page, route: AppRouteSpec): Locator[] {
  const masks: Locator[] = [
    page.locator('#notifications-badge'),
    page.locator('nextjs-portal'),
    page.locator('main span, main p').filter({
      hasText:
        /^(Hoje|Ontem|Agora|Há \d+\s+\S+.*|\d+\s+(minuto|minutos|hora|horas|dia|dias|semana|semanas)\s+atrás)$/i,
    }),
    page.locator('main span, main p').filter({
      hasText:
        /•\s*(Hoje|Ontem|Agora|Há \d+|\d+\s+(hora|horas|dia|dias)\s+atrás)/i,
    }),
  ];

  if (route.id === 'customers') {
    // Campos recalculados diariamente pelo back-end com base em LocalDate.now()
    masks.push(
      page
        .locator('main div.flex.items-center.justify-between')
        .filter({ has: page.locator('span', { hasText: /^Última Operação$/ }) })
        .locator('span')
        .nth(1),
      page
        .locator('main div.flex.items-center.justify-between')
        .filter({ has: page.locator('span', { hasText: /^Regularidade$/ }) }),
      page
        .locator('main [data-slot="card-content"]')
        .filter({
          has: page.locator('p', { hasText: /^Índice de Regularidade$/ }),
        })
        .locator('p.text-2xl')
    );
  }

  return masks;
}
