# Direção Visual — Moneta (Piloto de Redesign)

**Base estética:** `design-taste-frontend` (`data-terminal`, `kind: finance`, tema escuro único) · **Dials:** `VARIANCE=3` · `MOTION=2` · `DENSITY=8`
**Posicionamento:** Dashboard financeira B2B de leitura diária para gestores de PME. Alta densidade informacional, hierarquia guiada por tipografia e alinhamento tabular, cantos técnicos (`0–2px`), bordas de `1px` sem sombras em repouso e cor restrita aos dados e estados semânticos.

---

## 1. Tokens de Cor (`app/globals.css` — `:root` e `.dark` em paridade)

Todos os nomes de variáveis existentes do shadcn e do banco (`--chart-1` a `--chart-5`) são preservados integralmente. Não há tema claro no app atual; mantém-se exclusivamente o tema escuro padrão com neutros grafite levemente tingidos (matiz frio `250`, baixíssima saturação) e um único accent esmeralda (`148`).

| Token CSS | Valor OKLCH | Hex sRGB | Papel Visual |
|---|---|---|---|
| `--background` | `oklch(0.145 0.007 250)` | `#080A0D` | Fundo global do canvas |
| `--sidebar` | `oklch(0.160 0.007 250)` | `#0B0E10` | Superfície da barra lateral / drawer mobile |
| `--card` / `--popover` | `oklch(0.178 0.008 250)` | `#0F1115` | Painéis, KPIs, gráficos, tabelas e overlays |
| `--secondary` / `--muted` | `oklch(0.220 0.009 250)` | `#171B1F` | Preenchimento sutil de controles, hover de linha e abas |
| `--border` / `--sidebar-border` | `oklch(0.275 0.010 250)` | `#24282C` | Divisória estrutural sutil de `1px` (painéis, header, linhas) |
| `--input` | `oklch(0.515 0.014 250)` | `#62686F` | Borda de `1px` de controles interativos (`≥ 3:1` WCAG 1.4.11) |
| `--foreground` / `--card-foreground` | `oklch(0.955 0.005 250)` | `#EEF0F3` | Texto primário, títulos e valores principais |
| `--muted-foreground` | `oklch(0.710 0.014 250)` | `#9BA2AA` | Rótulos, metadados, cabeçalhos de tabela e ícones em repouso |
| `--primary` / `--primary-foreground` | `oklch(0.955 0.005 250)` / `oklch(0.145 0.007 250)` | `#EEF0F3` / `#080A0D` | Ação primária de alto contraste neutro |
| `--accent` / `--success` / `--ring` | `oklch(0.720 0.170 148)` | `#48C063` | Accent único esmeralda (série principal, foco, deltas positivos) |
| `--accent-foreground` | `oklch(0.150 0.020 148)` | `#060D07` | Texto escuro sobre fundo `--accent` sólido |
| `--warning` | `oklch(0.770 0.145 75)` | `#E9A535` | Alerta / pendência financeira |
| `--destructive` | `oklch(0.675 0.185 25)` | `#F35E5A` | Erro / variação negativa / cancelamento |
| `--chart-1..5` | `225` / `148` / `75` / `25` / `305` (baixa sat.) | `#2FB4DF` · `#48C063` · `#E9A535` · `#F35E5A` · `#AF96CE` | Paleta de dados compatível com categorias do banco |

> **Nota sobre bordas:** `--border` (`#24282C`, `1.27:1`) mantém as divisórias estruturais de cards e tabelas sutis (evitando efeito de grade pesada), enquanto `--input` (`#62686F`, `≥ 3.07:1`) garante contraste WCAG 1.4.11 em todos os controles interativos (`Input`, `Select`, `Button outline`) e `--muted-foreground` (`#9BA2AA`, `≥ 6.71:1`) em todos os ícones.

---

## 2. Tabela de Contraste WCAG 2.1 (Pares Texto/Fundo e Borda/Ícone)

| Par (Elemento → Superfície) | Hex Frente → Fundo | Razão Calculada | Meta Exigida | Status |
|---|---|---:|---:|---|
| `--foreground` sobre `--background` | `#EEF0F3` → `#080A0D` | **17,36 : 1** | `≥ 4,5 : 1` | Aprovado (AAA) |
| `--foreground` sobre `--card` | `#EEF0F3` → `#0F1115` | **16,55 : 1** | `≥ 4,5 : 1` | Aprovado (AAA) |
| `--foreground` sobre `--secondary` | `#EEF0F3` → `#171B1F` | **15,16 : 1** | `≥ 4,5 : 1` | Aprovado (AAA) |
| `--muted-foreground` (rótulos/ícones) sobre `--background` | `#9BA2AA` → `#080A0D` | **7,68 : 1** | `≥ 4,5 : 1` (`≥ 3:1` ícone) | Aprovado (AAA) |
| `--muted-foreground` (rótulos/ícones) sobre `--card` | `#9BA2AA` → `#0F1115` | **7,33 : 1** | `≥ 4,5 : 1` (`≥ 3:1` ícone) | Aprovado (AAA) |
| `--muted-foreground` (placeholders/chips) sobre `--secondary` | `#9BA2AA` → `#171B1F` | **6,71 : 1** | `≥ 4,5 : 1` (`≥ 3:1` ícone) | Aprovado (AA+) |
| `--accent` / `--success` sobre `--card` | `#48C063` → `#0F1115` | **8,09 : 1** | `≥ 4,5 : 1` | Aprovado (AAA) |
| `--accent-foreground` sobre `--accent` | `#060D07` → `#48C063` | **8,42 : 1** | `≥ 4,5 : 1` | Aprovado (AAA) |
| `--warning` sobre `--card` | `#E9A535` → `#0F1115` | **8,91 : 1** | `≥ 4,5 : 1` | Aprovado (AAA) |
| `--destructive` sobre `--card` | `#F35E5A` → `#0F1115` | **5,90 : 1** | `≥ 4,5 : 1` | Aprovado (AA) |
| `--chart-1..5` sobre `--card` | `#2FB4DF..#AF96CE` → `#0F1115` | **5,90 a 8,91 : 1** | `≥ 3,0 : 1` | Aprovado |
| `--input` (borda de controle interativo) sobre `--card` | `#62686F` → `#0F1115` | **3,36 : 1** | `≥ 3,0 : 1` | Aprovado (WCAG 1.4.11) |
| `--input` (borda de controle interativo) sobre `--secondary` | `#62686F` → `#171B1F` | **3,07 : 1** | `≥ 3,0 : 1` | Aprovado (WCAG 1.4.11) |

---

## 3. Tipografia, Raio, Espaçamento, Ícones e Gráficos

- **Tipografia (`next/font/google`):**
  - **Sans (`--font-sans`):** `Public Sans` (`400, 500, 600, 700`) para títulos, nomes de entidades e texto corrido.
  - **Mono (`--font-mono`):** `IBM Plex Mono` (`400, 500, 600`) para todos os valores monetários, KPIs, percentuais, contagens, rótulos técnicos, badges, cabeçalhos de tabela e eixos de gráfico.
  - **Escala e alinhamento:** `h1` da página `20px/600`; valor de KPI `24–28px/600` mono; `h2` de seção/card `15px/600` (sem pular de `h1` para `h3`); corpo e células `14px`; rótulos e cabeçalhos de tabela `13px` mono em sentence case; piso estrito de `12px` restrito a ticks de eixo e carimbos auxiliares (**zero elementos `< 12px`**). `tabular-nums` universal e valores monetários sempre alinhados à direita (`text-right`).
- **Raio & Superfícies:** `--radius: 2px` (`0.125rem`); cards, inputs, botões, badges, tooltips e modais usam cantos retos de `0` a `2px`. Zero gradientes, zero `backdrop-blur`, zero sombras em repouso e zero cards aninhados dentro de cards (substituídos por divisórias `1px`).
- **Espaçamento, Densidade (`DENSITY=8`) & Mobile:** Grade `4/8px` (`p-4 md:p-6` no canvas, `gap-4` `16px` entre painéis, `p-4` `16px` interno, linhas de lista `44–48px`). No mobile (`375px`), a sidebar recolhe para drawer off-canvas acionado no header, todos os alvos de toque têm `≥ 40px` (`min-h-10`) e o container aplica `min-w-0` para eliminar rolagem horizontal. Movimento `MOTION=2`: transições secas de `120–150ms`, sem `animate-pulse` decorativo nem bounce.
- **Ícones (`lucide-react`):** Biblioteca única com `strokeWidth={1.5}` padronizado e apenas dois tamanhos: `16px` (`w-4 h-4`, controles, KPIs e linhas) e `20px` (`w-5 h-5`, navegação e ações do header). Sem caixas ou círculos coloridos em KPIs.
- **Estilo dos Gráficos:** Guiado exclusivamente por `var(--*)`. No `Fluxo de Caixa`, linhas de `2px` sem marcadores fixos (`dot={false}`), preenchimento plano sutil (`fillOpacity={0.08}` apenas em Receitas com `var(--chart-2)`, `fillOpacity={0}` em Despesas com `var(--chart-4)` — sem `<linearGradient>`), grade horizontal `1px` tracejada em `var(--border)`, ticks `12px` mono `tabular-nums` em `var(--muted-foreground)` e tooltip opaco de canto `2px` com `1px solid var(--input)`. Em `Despesas por Categoria`, barras retas de `6px` (`rounded-[1px]`) usando os tokens `--chart-1..3`, `--accent` e `--warning`, com moeda e `%` em mono alinhados à mesma margem direita.

