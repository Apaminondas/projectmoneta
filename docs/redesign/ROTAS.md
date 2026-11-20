# Mapeamento de Rotas e Telas — SalesOps / Moneta Dashboard

Este documento cataloga todas as rotas do Next.js App Router e todas as telas do menu lateral descobertas no código-fonte de `moneta-dashboard/` antes do redesign visual.

---

## 1. Arquitetura de Roteamento e Autenticação

- **Rota HTTP única (SPA):** `moneta-dashboard/app/` possui apenas `page.tsx` servida na rota raiz `/`. Não existem sub-rotas em `app/` nem página `/login`.
- **Navegação entre telas:** controlada por estado client-side (`activeSection: Section` em `app/page.tsx`) acionado pelos botões de `<aside> <nav>` em `components/dashboard/sidebar.tsx` (e atalhos internos como Busca Global e Notificações em `components/dashboard/header.tsx`).
- **Autenticação:**
  - Não há tela de login na interface atual.
  - O cliente HTTP (`lib/api-client.ts`) lê a URL base em `process.env.NEXT_PUBLIC_API_URL` (padrão `http://localhost:8081`; no ambiente local `.env.local` aponta para `http://localhost:8400`).
  - O token JWT (`accessToken` retornado por `POST /api/auth/login`) é armazenado em `localStorage` sob a chave **`moneta_jwt_token`**.

---

## 2. Telas do Menu Lateral (`Sidebar` — 8 Telas Principais)

| # | ID (`Section`) | Rótulo no Menu Lateral | Rota URL | Título no Header (`header h1`) | Cabeçalho / Âncora da Seção (`main`) | Componente Principal | Endpoints Consumidos |
|---|---|---|---|---|---|---|---|
| 1 | `overview` | **Visão Geral** | `/` | `Visão Geral` | Cards de KPI (`Receita Mensal`, `Taxa de Poupança`, `Despesas do Mês`, `Saldo em Conta`), `Fluxo de Caixa`, `Despesas por Categoria`, `Últimos Lançamentos` | `components/dashboard/sections/overview.tsx` | `GET /api/summary/monthly`, `GET /api/transactions`, `GET /api/reports/categories` |
| 2 | `pipeline` | **Categorias** | `/` | `Categorias` | `h2`: `Acompanhamento por Categorias` (Kanban paginado 4 colunas/página) | `components/dashboard/sections/pipeline.tsx` | `GET /api/categories`, `GET /api/transactions` |
| 3 | `deals` | **Lançamentos** | `/` | `Lançamentos` | `h2`: `Lançamentos` + tabela paginada (8 itens/página) | `components/dashboard/sections/deals.tsx` | `GET /api/transactions`, `GET /api/categories` |
| 4 | `customers` | **Contas** | `/` | `Contas` | Cards `Total de Contas`, `Saldo Acumulado`, `Índice de Regularidade`, `Lançamentos Ativos` + grid de contas | `components/dashboard/sections/customers.tsx` | `GET /api/accounts`, `GET /api/accounts/summary`, `GET /api/accounts/{id}/appointments` |
| 5 | `team` | **Orçamentos** | `/` | `Orçamentos` | Cards `Gasto Consolidado`, `Total Lançamentos`, `Aderência Média ao Teto` + gráfico `Gasto Real vs Teto Orçamentário` | `components/dashboard/sections/team.tsx` | `GET /api/budget` |
| 6 | `forecasting` | **Previsões** | `/` | `Previsões` | `h2`: `Previsão de Fluxo & Saldo` + `Projeção de Fluxo: Realizado vs Previsto` + `Fatores de Risco Orçamentário` | `components/dashboard/sections/forecasting.tsx` | `GET /api/forecast?timeframe=T2`, `GET /api/forecast/mitigation/{key}` |
| 7 | `reports` | **Relatórios** | `/` | `Relatórios` | Cards `Resumo Mensal`, `Taxa de Poupança`, `Fontes de Renda`, `Previsão & Teto` + `Relatórios Recentes` | `components/dashboard/sections/reports.tsx` | `GET /api/reports/dashboard`, `GET /api/reports/history`, `GET /api/reports/profile` |
| 8 | `settings` | **Ajustes** | `/` | `Ajustes` | `h2`: `Configurações` + abas internas (`Perfil`, `Notificações`, `Conexões & API`, `Segurança`) | `components/dashboard/sections/settings.tsx` | `GET /api/actuator/health` (`/actuator/health`), `GET /api/notifications/preferences` |

---

## 3. Sub-telas e Superfícies Globais Identificadas

### 3.1 Abas Internas de `Ajustes` (`settings.tsx`)
1. **Perfil** (`value="profile"` — padrão ao abrir `Ajustes`): formulário `Informações do Usuário` e `Preferências de Exibição`.
2. **Notificações** (`value="notifications"`): matriz de switches `Preferências de Notificação` (Email / Push).
3. **Conexões & API** (`value="integrations"`): cards `Serviços & Conexões` (Spring Boot 3 API, PostgreSQL 16, Autenticação JWT, Swagger, Open Finance, Webhooks).
4. **Segurança** (`value="security"`): `Senha & Credenciais`, `Autenticação em Duas Etapas (2FA)` e `Sessões Ativas`.

### 3.2 Superfícies Globais do `Header` (`header.tsx`)
- **Busca Global** (`#global-search-input` / `#search-results-dropdown`): consulta `GET /api/search?q=...` com debounce de 300ms.
- **Popover de Notificações** (`#notifications-bell-btn` / `#notifications-badge`): consulta `GET /api/notifications` e `GET /api/notifications/unread-count`.
- **Menu do Usuário** (`#user-avatar-btn`): consulta `GET /api/users/me`, atalho para `Ajustes` e ação `Sair da Sessão` (`POST /api/auth/logout`).

---

## 4. Campos Voláteis / Dependentes da Data Atual (Mascarados no Visual Regression)

- **Header:** badge `#notifications-badge` (pulsante e dependente de leitura/geração de alertas) e timestamps `relativeTime` nas notificações.
- **Visão Geral (`overview`):** datas de lançamentos recentes caso caiam em fallback relativo (`Hoje`, `Há X horas`, `Há X dias`).
- **Contas (`customers`):**
  - Campo **`Última Operação`** em cada card de conta (`Hoje`, `Ontem`, `Há X dias`, `Há X semanas`), calculado dinamicamente no back-end a partir de `LocalDate.now()`.
  - Campo **`Regularidade`** (barra + percentual por conta) e card **`Índice de Regularidade`**, ambos derivados dos dias corridos desde a última transação até `LocalDate.now()`.
- **Relatórios (`reports`):** datas de geração formatadas ou fallback `"Hoje"`.
- **Ajustes (`settings` — aba Segurança):** tempos relativos de sessões (`Agora`, `2 horas atrás`, `1 dia atrás`).

---

## 5. Overflows Horizontais Pré-existentes na Linha de Base (`scrollWidth > innerWidth`)

Registrados antes de qualquer alteração visual (marcados com `test.fail()` no teste dedicado de overflow em `e2e/smoke.spec.ts` para alertar assim que o redesign corrigi-los):
- **Desktop (`1440x900`):** apenas **`Lançamentos` (`deals`)** estoura (`scrollWidth = 16787 > 1440`) devido à renderização linear sem truncamento/quebra de ~440 botões de página na paginação da tabela. As demais **7 telas desktop** passam com `scrollWidth === 1440`.
- **Mobile (`375x812`):** todas as **8 telas** estouram (`scrollWidth` entre `673` e `16704` vs `375`) devido à `Sidebar` fixa de `260px` (`ml-[260px]` em `app/page.tsx`) e barra de busca fixa no `Header`.

