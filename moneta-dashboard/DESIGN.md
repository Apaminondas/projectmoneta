---
name: Moneta Design System
description: Sistema visual baseado no preset shadcn Luma com tema Amber e base Stone
colors:
  background: "#0c0a09"
  foreground: "#fafaf9"
  card: "#1c1917"
  card-foreground: "#fafaf9"
  popover: "#1c1917"
  popover-foreground: "#fafaf9"
  primary: "#f59e0b"
  primary-foreground: "#0c0a09"
  secondary: "#292524"
  secondary-foreground: "#fafaf9"
  muted: "#292524"
  muted-foreground: "#a8a29e"
  accent: "#f59e0b"
  accent-foreground: "#0c0a09"
  destructive: "#ef4444"
  border: "#292524"
  input: "#292524"
  ring: "#d97706"
  chart-1: "#f59e0b"
  chart-2: "#10b981"
  chart-3: "#f1645f"
  chart-4: "#3b82f6"
  chart-5: "#8b5cf6"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontWeight: 600
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
  mono:
    fontFamily: "IBM Plex Mono, monospace"
rounded:
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.75rem"
  2xl: "1rem"
  3xl: "1.5rem"
  4xl: "2rem"
  full: "9999px"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
---

## Overview

Sistema visual para Moneta. Utiliza o preset oficial **Luma** (`b1cFHPcq4u`) com paleta base Stone e acento Amber, garantindo estética elegante, contemporânea e de alto contraste em modo escuro.

## Colors

- **Fundo & Superfícies**: Fundo escuro profundo (`#0c0a09`), cards elevados em tom quente (`#1c1917`), e bordas sutis (`#292524`).
- **Acento**: Âmbar vibrante (`#f59e0b`) para estados ativos, destaques operacionais e foco.
- **Semântica**: Verde esmeralda (`#10b981` / `chart-2`) para receitas, saldo e variações positivas; coral suave (`#f1645f` / `chart-3` em `app/globals.css`) para séries de despesas e vermelho (`#ef4444` / `destructive`) para alertas críticos; âmbar (`#f59e0b` / `chart-1`) para destaques operacionais e avisos.

## Typography

- **Headings**: `Inter`, peso 600 (SemiBold), entrelinha proporcional.
- **Corpo e UI**: `Inter`, pesos 400/500/600, leitura confortável.
- **Dados e Código**: `IBM Plex Mono` aplicado exclusivamente a valores numéricos tabulares (`tabular-nums`) e identificadores de sistema.

## Layout

- Grade de 12 colunas responsiva, espaçamento padrão de 1rem a 1.5rem (`gap-4` a `gap-6`).
- Barra lateral recolhível com transições fluidas e cabeçalho fixo com busca global.

## Elevation & Depth

- Cards individuais com elevação suave (`shadow-xs` / `shadow-md`) e anel sutil `ring-1 ring-foreground/5`.
- Sem sobreposição pesada ou drop-shadows borrados artificiais.

## Shapes

- Canto padrão (`--radius: 0.625rem`).
- Cards de métricas e painéis em `rounded-2xl`.
- Linhas interativas e inputs em `rounded-xl`.
- Botões e paginação em `rounded-lg`.
- Badges de status em `rounded-full`.

## Components

- **MetricCard**: Cabeçalho com título à esquerda e ícone suave à direita, valor destacado à esquerda com indicador percentual contextualizado (`vs. mês anterior`).
- **Button**: Alturas confortáveis (mínimo 36px/44px em toque), cantos `rounded-lg`, padding vertical explícito.
- **Table**: Tabelas semânticas com divisores horizontais discretos (`border-b border-border`) e paginação padronizada.

## Do's and Don'ts

- **DO**: Manter valores numéricos e tendências alinhados à esquerda em cards de métricas.
- **DO**: Garantir contraste de texto acima de 4.5:1 (WCAG AA).
- **DON'T**: Usar caixas com bordas aninhadas repetitivas dentro de cards.
- **DON'T**: Aplicar estilos de texto em caixa alta (`uppercase`) em títulos de blocos de conteúdo.
- **DON'T**: Usar cores neon ou clip-paths orgânicos gerados automaticamente.
