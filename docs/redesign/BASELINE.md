# Linha de Base Pré-Redesign — Impeccable & Qualidade Visual

Este documento consolida o diagnóstico da interface atual (`moneta-dashboard/`) **antes de qualquer alteração visual**, servindo como referência objetiva para medir a evolução do redesign na branch `feat/redesign-visual`.

---

## 1. Resumo Executivo — Impeccable CLI (`docs/redesign/baseline-impeccable.json`)

Comando executado:
```bash
npx impeccable detect --json \
  moneta-dashboard/app \
  moneta-dashboard/components \
  moneta-dashboard/hooks \
  moneta-dashboard/lib \
  moneta-dashboard/providers \
  moneta-dashboard/styles \
  moneta-dashboard/types \
  http://localhost:3000
```

- **Arquivos-fonte escaneados (modo estático `.css`, `.ts`, `.tsx`):** `99` arquivos (`0` flags por regex estático — esperado em projetos Tailwind/JSX, conforme aviso da própria CLI).
- **DOM renderizado escaneado (`http://localhost:3000`):** `3` flags detectados.
- **Total consolidado de flags na baseline:** **`3`** (`1` `error` / categoria `slop` e `2` `warning` / categoria `quality`).

> **Nota de higienização do alvo:** A pasta `moneta-dashboard/playwright-report/` (artefato gerado pelo visualizador de trace do Playwright) foi excluída dos alvos de código-fonte para não contaminar a linha de base com 2 ocorrências de `side-tab` pertencentes ao CSS interno do relatório do Playwright.

---

## 2. Regras Mais Frequentes

| Posição | Regra (`antipattern`) | Severidade | Categoria | Ocorrências | Evidência / Seletor |
|---:|---|---|---|---:|---|
| 1 | `pulsing-dot` | `error` | `slop` | **1** | `animate-pulse` em elemento circular pequeno no header (`#notifications-badge`) |
| 2 | `tiny-text` | `warning` | `quality` | **1** | Texto de `11px` abaixo do mínimo recomendado de `12px`/`14px` (`span.text-[11px].px-2`) |
| 3 | `skipped-heading` | `warning` | `quality` | **1** | Salto hierárquico de `<h1> "Visão Geral"` direto para `<h3> "Fluxo de Caixa"` sem `<h2>` |

---

## 3. Os 5 Arquivos do Front com Mais Flags / Ocorrências Associadas

Na varredura puramente estática por regex sobre arquivos `.tsx/.ts/.css`, todos os 99 arquivos retornaram **`0` flags diretos** (`file` nos 3 achados aponta para o DOM renderizado `http://localhost:3000`). Rastreando os seletores e padrões reportados pela CLI diretamente aos componentes-fonte que os geram no DOM, os **5 arquivos com maior incidência** são:

| # | Arquivo | Flags estáticos diretos | Regras / Ocorrências no DOM originadas pelo arquivo |
|---:|---|---:|---|
| 1 | `moneta-dashboard/components/dashboard/header.tsx` | `0` | **`pulsing-dot`** (`#notifications-badge` com `rounded-full animate-pulse`, linha 248), **`tiny-text`** (4 ocorrências de `text-[10px]` / `text-[11px]` em badges e timestamps de notificações) e origem do `<h1>` global sem `<h2>` em seções sem subtítulo. |
| 2 | `moneta-dashboard/components/dashboard/charts/revenue-chart.tsx` | `0` | **`tiny-text`** (elemento exato capturado pela CLI: `span.text-[11px].px-2`, linha 79) e **`skipped-heading`** (elemento exato capturado pela CLI: `<h3>Fluxo de Caixa</h3>`, linha 78). |
| 3 | `moneta-dashboard/components/dashboard/sections/overview.tsx` | `0` | **`skipped-heading`** (container da tela inicial `Visão Geral` que compõe `MetricCard`, `RevenueChart`, `PipelineOverview`, `RecentDeals` e `TopPerformers` diretamente com `<h3>` sem `<h2>` de seção). |
| 4 | `moneta-dashboard/components/dashboard/sections/pipeline.tsx` | `0` | **`tiny-text`** (5 ocorrências de `text-[11px]` e `text-[10px]` em contadores de coluna, barras de teto mensal, badges de status e rodapés de cards Kanban). |
| 5 | `moneta-dashboard/components/dashboard/sections/customers.tsx` | `0` | **`skipped-heading`** (renderiza cards de contas diretamente com `<h3>` abaixo do `<h1> "Contas"` do header, sem `<h2>` intermediário na seção). |

---

## 4. Resumo Complementar da Rede de Segurança Playwright

- **Viewports monitorados:** `desktop` (`1440x900`) e `mobile` (`375x812`) no Chromium.
- **Telas cobertas (`8`):** `Visão Geral`, `Categorias`, `Lançamentos`, `Contas`, `Orçamentos`, `Previsões`, `Relatórios` e `Ajustes`.
- **Erros de console e de página:** `0` nas 8 telas e nos 2 viewports.
- **Overflows horizontais pré-existentes (`scrollWidth > innerWidth`, monitorados via `test.fail()` em `e2e/smoke.spec.ts`):**
  - Desktop (`1440x900`): `1/8` telas (`Lançamentos`, `scrollWidth = 16787px` devido à paginação sem truncamento).
  - Mobile (`375x812`): `8/8` telas (`scrollWidth` entre `673px` e `16704px` devido à `Sidebar` fixa de `260px` com `ml-[260px]`).

