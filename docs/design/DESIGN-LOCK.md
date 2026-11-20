# DESIGN-LOCK.md — Travamento Oficial de Design

> **REGRA SUPREMA:** O design do template original (`moneta-dashboard`) é **intocável e tem prioridade máxima**.  
> O trabalho de integração consiste em trocar **SOMENTE o conteúdo** (textos, números, rótulos, dados semânticos). Cores, fontes, tamanhos, espaçamentos, bordas, sombras, radius, estrutura de componentes, quantidade de itens e layout ficam exatamente como estão.

---

## 1. Tokens Intocáveis do Template

### A. Paleta de Cores (`app/globals.css` / Tailwind CSS v4)
*Espaço de cores OKLCH com tema escuro nativo:*
- `--background`: `oklch(0.09 0.005 260)`
- `--foreground`: `oklch(0.95 0 0)`
- `--card`: `oklch(0.12 0.005 260)`
- `--card-foreground`: `oklch(0.95 0 0)`
- `--popover`: `oklch(0.12 0.005 260)`
- `--primary`: `oklch(0.95 0 0)`
- `--primary-foreground`: `oklch(0.09 0.005 260)`
- `--secondary`: `oklch(0.18 0.005 260)`
- `--muted`: `oklch(0.18 0.005 260)`
- `--muted-foreground`: `oklch(0.65 0 0)`
- `--accent`: `oklch(0.7 0.18 145)` (Verde esmeralda de destaque e hover)
- `--destructive`: `oklch(0.65 0.2 25)` (Vermelho coral para erros e cancelamentos)
- `--border`: `oklch(0.22 0.005 260)`
- `--ring`: `oklch(0.7 0.18 145)`
- Séries de Gráficos:
  - `--chart-1`: `oklch(0.7 0.18 220)` (Ciano)
  - `--chart-2`: `oklch(0.7 0.18 145)` (Verde)
  - `--chart-3`: `oklch(0.75 0.18 55)` (Âmbar/Laranja)
  - `--chart-4`: `oklch(0.65 0.2 25)` (Vermelho)
  - `--chart-5`: `oklch(0.7 0.15 300)` (Roxo)
- Estados Semânticos:
  - `--success`: `oklch(0.7 0.18 145)` (Verde)
  - `--warning`: `oklch(0.75 0.18 55)` (Laranja/Âmbar)

### B. Tipografia
- Fonte Principal: `'DM Sans', 'DM Sans Fallback', system-ui, sans-serif`
- Fonte Monospaçada: `'JetBrains Mono', 'JetBrains Mono Fallback', monospace`

### C. Raio de Bordas (Radius)
- Base: `--radius: 0.5rem` (8px)
- `rounded-md`: 6px
- `rounded-lg`: 8px
- `rounded-xl`: 12px
- `rounded-full`: badges circulares e indicadores

### D. Grids e Dimensões Fixas
- Shell Sidebar: fixa em `w-[260px]` (expandida) e `w-[72px]` (colapsada)
- Margem de Conteúdo: `ml-[260px]` (expandida) e `ml-[72px]` (colapsada)
- Altura do Header / Topbar: `h-16`
- Altura dos Gráficos: `h-[380px]` (container externo) e `h-[280px]` (área SVG do gráfico)
- KPIs Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- Linha Intermediária: `grid-cols-1 lg:grid-cols-3 gap-6` (2 colunas para Recharts e 1 coluna para Barras)
- Linha Inferior: `grid-cols-1 lg:grid-cols-2 gap-6`

---

## 2. Regras de Tamanho de Fonte e Pisos por Papel

Nenhum texto novo pode ficar menor do que o template já utiliza **para aquele mesmo papel específico**:

| Papel no Layout | Classe de Fonte Original | Piso Mínimo Autorizado | Regra de Uso |
|---|---|---|---|
| **Badge de Ranking (Top 3)** | `text-[10px] font-bold` | `10px` | **EXCLUSIVO** para o numeral (`1`, `2`, `3`) dentro do círculo `w-5 h-5` em `TopPerformers`. Proibido em qualquer outro elemento. |
| **Metadados, Prazos, Tooltips** | `text-xs` | `12px` | Usado para subtextos de lista ("X lançamentos", tempo relativo, percentual de variação). |
| **Itens de Menu, Rótulos, Cards** | `text-sm` | `14px` | Corpo de texto padrão, labels de inputs, títulos de KPIs, estágios. Piso absoluto para texto legível. |
| **Subtítulos de Blocos** | `text-base font-semibold` | `16px` | Cabeçalhos de cards internos ("Últimos Lançamentos", "Maiores Categorias"). |
| **Título da Página / Totais** | `text-xl font-semibold` | `20px` | Título no header e valor total consolidado. |
| **Métricas Principais (KPIs)** | `text-2xl lg:text-3xl font-bold` | `24px` / `30px` | Valores numéricos em destaque nos 4 MetricCards. |

---

## 3. Lista de Componentes Intocáveis

A estrutura do JSX, hierarquia de nós, tags HTML, classes CSS, props visuais e quantidade de itens são imutáveis:

1. **`Sidebar` (`components/dashboard/sidebar.tsx`):**
   - Estrutura de logo: 1 container com ícone + 1 span de texto.
   - Navegação: **Exatamente 8 botões** com a mesma estrutura de ícone + label + active indicator.
   - Botão de colapso no rodapé.
2. **`Header` (`components/dashboard/header.tsx`):**
   - 1 título `<h1>`.
   - 1 badge de calendário com período.
   - 1 barra de busca com input.
   - 1 botão de notificação com dot pulsante.
   - 1 avatar com 2 caracteres de iniciais.
3. **`OverviewSection` (`components/dashboard/sections/overview.tsx`):**
   - **Exatamente 4 `MetricCard`** na primeira linha.
   - **Exatamente 2 blocos** na segunda linha: `RevenueChart` (col-span-2) e `PipelineOverview` (col-span-1).
   - **Exatamente 2 blocos** na terceira linha: `RecentDeals` (col-span-1) e `TopPerformers` (col-span-1).
4. **`RevenueChart` (`components/dashboard/charts/revenue-chart.tsx`):**
   - Gráfico `AreaChart` com **exatamente 12 meses** (Jan–Dez).
   - Duas áreas sobrepostas com gradientes (`chart-1` e `chart-2`).
5. **`PipelineOverview` (`components/dashboard/charts/pipeline-overview.tsx`):**
   - **Exatamente 4 barras de progresso** percentuais com cores pré-definidas (`bg-chart-1`, `bg-chart-2`, `bg-chart-3`, `bg-accent`).
   - 1 linha de rodapé com valor total consolidado.
6. **`RecentDeals` (`components/dashboard/recent-deals.tsx`):**
   - **Exatamente 5 linhas de transações**.
   - Cada linha possui: avatar com inicial (1 caractere), título, subtítulo, valor formatado e badge de status com ícone.
7. **`TopPerformers` (`components/dashboard/top-performers.tsx`):**
   - **Exatamente 5 linhas ranqueadas**.
   - As 3 primeiras possuem badge flutuante de ranking (`1`, `2`, `3`).
   - Cada linha possui: círculo com gradiente e iniciais (2 caracteres), nome, subtexto de contagem, valor consolidado e indicador de tendência com ícone `TrendingUp`.

---

## 4. Regras de Encaixe de Conteúdo (Content-Fit)

O conteúdo se molda ao design; o design **nunca** se molda ao conteúdo.

### Procedimento de Medição Prévia
- Todo texto em português deve ser medido antes da inserção.
- Se o novo texto ultrapassar o tamanho do texto original do template em caracteres, aplique nesta ordem:
  1. **Encurtar o texto:** abreviar, reescrever de forma mais concisa ou remover termos redundantes.
  2. **Mover detalhe extra para tooltip existente:** se houver tooltip pré-configurado.
  3. **Perguntar ao usuário.**

### Proibições Absolutas
- ❌ NUNCA reduzir tamanho de fonte para caber mais texto.
- ❌ NUNCA criar mini-cards ou cards dentro de cards (nested cards).
- ❌ NUNCA adicionar badges, pills, chips ou tags que não existiam no template.
- ❌ NUNCA inventar gradientes, glows, sombras ou novas cores.
- ❌ NUNCA adicionar bordas, divisores ou animações novas.
- ❌ NUNCA reduzir paddings ou gaps.
- ❌ NUNCA alterar a quantidade de itens nos arrays (ex.: 5 transações, 5 categorias, 4 KPIs, 4 barras de progresso, 12 meses).

---

## 5. Semântica de Cores, Setas e Badges

- **Verde / Success (`text-success bg-success/10` / `CheckCircle2`):**
  - Mapeado para status **`Concluído`**.
- **Laranja / Warning (`text-warning bg-warning/10` / `Clock`):**
  - Mapeado para status **`Pendente`**.
- **Vermelho / Destructive (`text-destructive bg-destructive/10` / `XCircle`):**
  - Mapeado para status **`Cancelado`**.
- **Polaridade Inversa de Despesas:**
  - Em finanças, despesa caindo é positivo, mas a seta do template é vermelha para valores com sinal negativo.
  - **Regra obrigatória:** Nenhuma cor ou seta pode ser alterada no cartão de despesas sem aprovação explícita prévia do usuário.

---

## 6. Regra de Perguntar Antes

Qualquer divergência, ajuste estrutural ou decisão de polaridade deve ser perguntada formalmente neste formato obrigatório:

> Preciso de uma decisão. [O que o conteúdo pede] não cabe em [componente X] do template.  
> Opções: (A) encurtar o texto para caber, (B) usar o componente existente [Y], (C) você autoriza mudar [o quê]. Recomendo A. Qual escolhe?
