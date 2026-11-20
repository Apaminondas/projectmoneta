---
name: Moneta Design System
description: Sistema de design Obsidian Dark Mode para a interface analítica do Moneta Dashboard
colors:
  background: "oklch(0.09 0.005 260)"
  background-hex: "#020203"
  foreground: "oklch(0.95 0 0)"
  foreground-hex: "#EEEEEE"
  card: "oklch(0.12 0.005 260)"
  card-hex: "#050607"
  card-foreground: "oklch(0.95 0 0)"
  popover: "oklch(0.12 0.005 260)"
  sidebar: "oklch(0.11 0.005 260)"
  sidebar-hex: "#040406"
  secondary: "oklch(0.18 0.005 260)"
  secondary-hex: "#101214"
  muted: "oklch(0.18 0.005 260)"
  muted-foreground: "oklch(0.65 0 0)"
  muted-foreground-hex: "#8F8F8F"
  accent: "oklch(0.7 0.18 145)"
  accent-hex: "#45BA50"
  success: "oklch(0.7 0.18 145)"
  success-hex: "#45BA50"
  warning: "oklch(0.75 0.18 55)"
  warning-hex: "#FF8B25"
  destructive: "oklch(0.65 0.2 25)"
  destructive-hex: "#F14D4C"
  border: "oklch(0.22 0.005 260)"
  border-hex: "#191B1D"
  chart-1: "oklch(0.7 0.18 220)"
  chart-1-hex: "#00B1D8"
  chart-2: "oklch(0.7 0.18 145)"
  chart-2-hex: "#45BA50"
  chart-3: "oklch(0.75 0.18 55)"
  chart-3-hex: "#FF8B25"
  chart-4: "oklch(0.65 0.2 25)"
  chart-4-hex: "#F14D4C"
  chart-5: "oklch(0.7 0.15 300)"
  chart-5-hex: "#AD87ED"
typography:
  display:
    fontFamily: "'DM Sans', 'DM Sans Fallback', system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: "2.25rem"
  headline:
    fontFamily: "'DM Sans', 'DM Sans Fallback', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  title:
    fontFamily: "'DM Sans', 'DM Sans Fallback', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  body:
    fontFamily: "'DM Sans', 'DM Sans Fallback', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  label:
    fontFamily: "'DM Sans', 'DM Sans Fallback', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
  badge-rank:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: "1"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  sidebar-width: "260px"
  sidebar-collapsed: "72px"
  header-height: "64px"
components:
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "20px"
  metric-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "20px"
    height: "126px"
  input-search:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 12px 0 36px"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  badge-success:
    backgroundColor: "rgba(69, 186, 80, 0.1)"
    textColor: "{colors.success}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  badge-warning:
    backgroundColor: "rgba(255, 139, 37, 0.1)"
    textColor: "{colors.warning}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  badge-destructive:
    backgroundColor: "rgba(241, 77, 76, 0.1)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
---

# DESIGN-SYSTEM.md — Sistema de Design do Projeto

> **Evidência Visual (Snapshot):** Captura ao vivo inspecionada via subagent no viewport Maximized (1920×1142) em `http://localhost:3000/`.  
> **Artefato de Referência:** `dashboard_snapshot_1791651124930.png`  
> **Orientação Estética:** *Obsidian Finance / Dark Elegance* — Interface corporativa e analítica com paleta em espaço de cores OKLCH, contraste AA/AAA e micro-interações funcionais.

---

## 1. Overview

O **Moneta Design System** é uma linguagem visual unificada, de alta fidelidade e orientada a dados financeiros de missão crítica. Utiliza uma base escura neutra (Onyx / Obsidian) com acentos semânticos de alta luminosidade (esmeralda, âmbar, carmesim e ciano).

* **Objetivo de UX:** Operabilidade, velocidade de escaneamento visual e clareza analítica em decisões orçamentárias.
* **Paradigma de Cores:** Espaço de cores nativo **OKLCH** com fallbacks sRGB / HEX resolvidos em tela.
* **Framework CSS:** Tailwind CSS v4 com variáveis de tema `@theme inline` e suporte total a temas escuros.
* **Tipografia:** Tipografia mista corporativa (`DM Sans` para leitura fluida e `JetBrains Mono` para numerais tabulares).

---

## 2. Colors

A paleta de cores organiza-se em três camadas: **Superfícies de Fundo**, **Texto e Contraste**, e **Semântica / Indicadores de Tendência**.

### 2.1 Superfícies e Estrutura (Neutros Frios)

| Token | Valor OKLCH | Valor HEX | Uso no Layout |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.09 0.005 260)` | `#020203` | Fundo principal da aplicação |
| `--card` / `--popover` | `oklch(0.12 0.005 260)` | `#050607` | Fundo de cartões, painéis e modais |
| `--sidebar` | `oklch(0.11 0.005 260)` | `#040406` | Fundo da barra lateral de navegação |
| `--secondary` / `--input` | `oklch(0.18 0.005 260)` | `#101214` | Campo de busca, trilhas de progresso e itens ativos |
| `--border` / `--sidebar-border` | `oklch(0.22 0.005 260)` | `#191B1D` | Linhas de divisão, bordas de cards e header |

### 2.2 Tipografia e Contraste

| Token | Valor OKLCH | Valor HEX | Uso no Layout |
| :--- | :--- | :--- | :--- |
| `--foreground` | `oklch(0.95 0 0)` | `#EEEEEE` | Títulos primários, valores em destaque e labels ativos |
| `--muted-foreground` | `oklch(0.65 0 0)` | `#8F8F8F` | Rótulos de métricas, subtítulos e itens inativos |
| `--sidebar-foreground` | `oklch(0.95 0 0)` | `#EEEEEE` | Texto dos botões e links da navegação |

### 2.3 Cores Semânticas de Negócio e Tendência

| Token | Valor OKLCH | Valor HEX | Significado Financeiro |
| :--- | :--- | :--- | :--- |
| `--accent` / `--success` | `oklch(0.7 0.18 145)` | `#45BA50` | Receitas, saldo positivo, tendências favoráveis, badge "Concluído" |
| `--warning` | `oklch(0.75 0.18 55)` | `#FF8B25` | Atenção orçamentária, prazos, badge "Pendente", ranking #1 |
| `--destructive` | `oklch(0.65 0.2 25)` | `#F14D4C` | Despesas elevadas, estornos, tendências de queda, badge "Cancelado" |
| `--chart-1` | `oklch(0.7 0.18 220)` | `#00B1D8` | Curva de Receitas no Fluxo de Caixa (Ciano) |
| `--chart-2` | `oklch(0.7 0.18 145)` | `#45BA50` | Curva de Despesas no Fluxo de Caixa (Esmeralda) |
| `--chart-3` | `oklch(0.75 0.18 55)` | `#FF8B25` | Série terciária de categoria (Âmbar) |
| `--chart-5` | `oklch(0.7 0.15 300)` | `#AD87ED` | Série quaternária de categoria (Violeta) |

---

## 3. Typography

A hierarquia tipográfica foi desenhada para diferenciar claramente **rótulos analíticos**, **dados numéricos em destaque** e **metadados contextuais**.

### 3.1 Famílias Tipográficas
* **Sans Primária:** `'DM Sans', 'DM Sans Fallback', system-ui, sans-serif`
* **Mono Numérica:** `'JetBrains Mono', 'JetBrains Mono Fallback', monospace`

### 3.2 Escala de Tipografia e Pisos Mínimos

| Papel | Tamanho | Peso | Line-Height | Aplicação no Sistema |
| :--- | :--- | :--- | :--- | :--- |
| **KPI Metric Display** | `24px` (`30px` em `lg`) | 700 (Bold) | `1.2` | Valores em R$ nos cartões (`R$ 24.850`) |
| **Page Title / H1** | `20px` (`1.25rem`) | 600 (Semibold) | `1.4` | Título no topo do Header e Total de Despesas |
| **Card Header / H2** | `16px` (`1rem`) | 600 (Semibold) | `1.5` | Cabeçalhos de blocos ("Fluxo de Caixa", "Últimos Lançamentos") |
| **Body / Labels / Nav** | `14px` (`0.875rem`) | 500 (Medium) | `1.4` | Navegação da Sidebar, títulos de KPI, nomes de transações |
| **Subtext / Meta / Pills** | `12px` (`0.75rem`) | 400 / 500 | `1.3` | Datas, categorias secundárias, badges de status |
| **Ranking Indicator** | `10px` | 700 (Bold) | `1.0` | **Piso absoluto reservado:** numeral `1`, `2`, `3` no círculo Top 3 |

---

## 4. Layout

A estrutura espacial obedece a um grid determinístico com largura de sidebar fixa e áreas de rolagem protegidas.

### 4.1 Grid Estrutural (Shell)
* **Sidebar:**
  * Largura expandida: `260px` (`w-[260px]`).
  * Largura colapsada: `72px` (`w-[72px]`).
  * Posição: Fixa à esquerda (`fixed left-0 top-0 h-screen`).
* **Header:**
  * Altura: `64px` (`h-16`).
  * Posição: Sticky (`sticky top-0 z-40`).
  * Efeito: Efeito vidro escuro (`bg-background/80 backdrop-blur-sm border-b border-border`).
  * Padding horizontal: `24px` (`px-6`).
* **Main Content Container:**
  * Margem esquerda: Sincronizada com o estado da sidebar (`ml-[260px]` ou `ml-[72px]`).
  * Padding interno: `24px` (`p-6`).
  * Limite de largura máxima: Fluido até `1920px+` sem quebra de containers.

### 4.2 Grids de Conteúdo
* **Linha 1 (KPI Metrics):** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
* **Linha 2 (Gráficos Analíticos):** `grid-cols-1 lg:grid-cols-3 gap-6` (Gráfico de área ocupa 2 colunas; Distribuição por categoria ocupa 1 coluna).
* **Linha 3 (Tabelas e Extrato):** `grid-cols-1 lg:grid-cols-2 gap-6` (Últimos lançamentos na esquerda; Maiores categorias no ranking da direita).

---

## 5. Elevation & Depth

O sistema rejeita sombras difusas ou neomórficas, priorizando **camadas tonais (Tonal Layering)** e **bordas sutis de contraste**:

* **Nível 0 (Canvas):** Fundo `#020203` sem bordas.
* **Nível 1 (Superfícies de Conteúdo):** Cards com fundo `#050607`, borda sólida `1px solid #191B1D`.
* **Nível 2 (Componentes Interativos / Inputs):** Fundo `#101214`, borda `1px solid #191B1D`.
* **Nível 3 (Hover States):** Transição suave (`transition-all duration-300`) elevando o contraste da borda para `hover:border-accent/50`.
* **Glassmorphism:** Usado exclusivamente no Header (`bg-background/80` com `backdrop-blur-sm`).

---

## 6. Shapes

O vocabulário de bordas e geometrias estabelece consistência precisa:

* **Container Cards & Painéis:** `rounded-xl` (`12px` / `0.75rem`).
* **Botões, Inputs e Links de Navegação:** `rounded-lg` (`8px` / `0.5rem`).
* **Badges, Status Pills e Filtros:** `rounded-md` (`6px` / `0.375rem`).
* **Trilhas de Progresso:** `rounded-full` (`9999px`) com altura de trilha `h-2` (`8px`).
* **Avatars, Indicadores de Status e Ranking:** Círculos perfeitos `rounded-full` (`w-8 h-8`, `w-5 h-5` ou `w-2 h-2`).

---

## 7. Components

Especificação detalhada dos blocos de interface fundamentais:

### 7.1 Cartão de Métrica (`MetricCard`)
* **Estrutura:** Container `bg-card border border-border rounded-xl p-5`.
* **Dimensões:** Altura fixa de `126px`.
* **Composição Interna:**
  * Linha Superior: Título (`text-sm font-medium text-muted-foreground`) + Ícone em container circular discreto.
  * Linha Inferior: Valor numérico formatado (`text-2xl lg:text-3xl font-bold text-foreground`) + Badge de variação com seta direcional (`text-xs font-medium`).

### 7.2 Badges e Pílulas de Status (`StatusBadge`)
* **Pílula "Concluído" (Sucesso):**
  * Fundo: `rgba(69, 186, 80, 0.1)` (`bg-success/10`)
  * Texto: `#45BA50` (`text-success`)
  * Borda: `rgba(69, 186, 80, 0.2)`
* **Pílula "Pendente" (Alerta):**
  * Fundo: `rgba(255, 139, 37, 0.1)` (`bg-warning/10`)
  * Texto: `#FF8B25` (`text-warning`)
  * Borda: `rgba(255, 139, 37, 0.2)`
* **Pílula "Cancelado" (Erro/Cancelamento):**
  * Fundo: `rgba(241, 77, 76, 0.1)` (`bg-destructive/10`)
  * Texto: `#F14D4C` (`text-destructive`)
  * Borda: `rgba(241, 77, 76, 0.2)`

### 7.3 Barra Lateral de Navegação (`Sidebar`)
* **Item Ativo:** `bg-sidebar-accent` (`#101214`), `text-sidebar-foreground` (`#EEEEEE`), ícone iluminado com traço de destaque.
* **Item Inativo:** `text-muted-foreground` (`#8F8F8F`), hover para `#EEEEEE` e fundo sutil `rgba(16, 18, 20, 0.5)`.
* **Espaçamento entre Itens:** `space-y-1` com `gap-3` interno entre ícone e texto.

### 7.4 Barra de Busca e Entradas de Texto (`InputSearch`)
* **Dimensões:** Altura `36px` (`h-9`), largura `192px` (expansível em foco).
* **Fundo e Borda:** `bg-secondary` (`#101214`), `border-border` (`#191B1D`).
* **Ícone Integrado:** Ícone de lupa posicionado com padding esquerdo `pl-9`.
* **Foco:** `ring-2 ring-accent/20 outline-none`.

### 7.5 Barras de Progresso e Distribuição
* **Trilha:** `h-2 bg-secondary rounded-full overflow-hidden`.
* **Preenchimento:** Cores sincronizadas com o gráfico (`bg-chart-1`, `bg-chart-2`, `bg-chart-3`).

---

## 8. Do's and Don'ts

### ✅ O que FAZER (Do's)
1. **Preservar a hierarquia de contraste:** Sempre utilize `--muted-foreground` para labels secundárias e `--foreground` para valores numéricos e nomes principais.
2. **Respeitar o piso de fonte:** Nunca utilize fontes menores que `12px` para textos legíveis. A classe `text-[10px]` é estritamente restrita ao badge numérico do Top 3.
3. **Usar semântica financeira correta:** Verde (`#45BA50`) para receitas e saldos positivos; Vermelho (`#F14D4C`) para despesas e cancelamentos; Âmbar (`#FF8B25`) para pendências.
4. **Manter as bordas sutis:** Use `1px solid var(--border)` para delimitar containers sem sobrecarregar a visão do usuário.
5. **Formatar valores monetários:** Utilize sempre o padrão monetário brasileiro `R$ 0.000,00` ou abreviações limpas (`R$ 24,8K`).

### ❌ O que NÃO FAZER (Don'ts)
1. **NÃO introduza fundos brancos ou claros:** O sistema é 100% Dark Mode (`#020203` e `#050607`); componentes em fundo branco quebram a imersão visual.
2. **NÃO use sombras projetadas intensas:** O design se apoia em camadas tonais e bordas finas; sombras pretas pesadas criam ruído no tema escuro.
3. **NÃO altere a largura da Sidebar:** A sidebar tem largura calculada matematicamente (`260px` / `72px`); mudar sua largura desalinha todo o cabeçalho e os grids do conteúdo.
4. **NÃO invente novas variantes de cores:** Mantenha-se fiel aos tokens estabelecidos (`chart-1` a `chart-5`, `accent`, `warning`, `destructive`).
5. **NÃO adicione spinners de loading invasivos:** O carregamento deve ser suave e não bloqueante, priorizando fallbacks imediatos e transições de opacidade.
