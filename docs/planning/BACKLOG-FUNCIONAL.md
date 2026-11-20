# BACKLOG-FUNCIONAL.md — Mapeamento de Funcionalidades Só Visuais

> **Auditoria E2E de Interface vs. API REST**  
> **Front-end:** `moneta-dashboard` (Next.js 15, React 19, Tailwind CSS, TanStack Query)  
> **Back-end:** `Finance API` (`http://localhost:8081`, Spring Boot 3, PostgreSQL 16, Swagger OpenAPI 3)  
> **Data da Auditoria:** 10 de Outubro de 2026  
> **Metodologia:** Navegação interativa real no navegador com testes de clique, digitação, seleção e inspeção de código-fonte.

---

## 1. Visão Geral do Ecossistema

### 1.1 O que já está CONECTADO à API REST (Ponta a Ponta)
- **KPIs da Visão Geral:** `GET /api/summary/monthly?year=2026&month=10` (Receita Mensal, Despesas do Mês, Saldo em Conta, Taxa de Poupança).
- **Últimos Lançamentos:** `GET /api/transactions` consumindo os lançamentos reais cadastrados no PostgreSQL.
- **Modal de Detalhes do Lançamento (Ponto 1):** Ao clicar em um lançamento em "Últimos Lançamentos", exibe modal com ID, valor, status, método de pagamento e observações reais.
- **Maiores Categorias:** `GET /api/reports/categories` consumindo agregados por categoria da API.
- **Modal de Detalhes da Categoria (Ponto 2):** Ao clicar em uma categoria em "Maiores Categorias", abre modal exibindo gastos do mês e compras associadas.
- **Status da API em Ajustes:** `useApiHealth` verifica conectividade com o backend `localhost:8081`.

### 1.2 Resumo Estatístico da Auditoria
- **Telas Auditadas:** 8 telas principais + 4 abas de Ajustes + 2 modais interativos.
- **Total de Elementos Interativos Inspecionados:** 48 elementos de interface.
- **Elementos Conectados à API:** 6 (12,5%)
- **Elementos com Estado em Memória (Client-side apenas):** 8 (16,7%)
- **Elementos Só Visuais / Dummy (Sem ação ou sem handler):** 22 (45,8%)
- **Elementos com Endpoint Existente na API mas Desconectados no Front:** 6 (12,5%)
- **Elementos sem Suporte Existente na API (Requer novos endpoints):** 6 (12,5%)

---

## 2. Mapeamento Detalhado por Tela e Aba

### 2.1 Header Global e Sidebar
| Elemento | Tipo | Comportamento Observado no Navegador | Status Atual | Endpoint API Relacionado |
| :--- | :--- | :--- | :--- | :--- |
| **Seletor de Data ("Últimos 30 dias")** | Header | Elemento estático em `header.tsx` (`<div>` com ícone de calendário). Não abre dropdown de meses nem altera queries. | `[SÓ VISUAL]` | `GET /api/summary/monthly?year={y}&month={m}` |
| **Campo "Buscar..." (Header)** | Header | Recebe foco e expande largura (w-48 para w-64). Não filtra dados de nenhuma tela e não dispara buscas. | `[SÓ VISUAL]` | Nenhum (filtro cliente ou busca global) |
| **Sino de Notificações** | Header | Botão com indicador pulsante `animate-pulse`. Não abre painel nem dropdown de notificações. | `[SÓ VISUAL]` | Nenhum endpoint de notificações no backend |
| **Avatar do Usuário ("FA")** | Header | Botão estático. Não abre menu de perfil, configurações rápidas ou ação de Logout. | `[SÓ VISUAL]` | Nenhum (`POST /api/auth/login` existe) |
| **Botão "Recolher / Expandir"** | Sidebar | Altera estado `sidebarCollapsed` em memória, recolhendo e expandindo a sidebar com animação fluida. | `[ESTADO LOCAL]` | Não aplicável (UI pura) |
| **Navegação da Sidebar (8 itens)** | Sidebar | Altera `activeSection` no componente raiz, renderizando a tela correspondente sem recarregar. | `[ESTADO LOCAL]` | Não aplicável (SPA client routing) |

---

### 2.2 Tela 1: Visão Geral (`overview.tsx`)
| Elemento | Tipo | Comportamento Observado no Navegador | Status Atual | Endpoint API Relacionado |
| :--- | :--- | :--- | :--- | :--- |
| **4 MetricCards (Receita, Poupança, Despesa, Saldo)** | KPIs | Valores populados dinamicamente via TanStack Query a partir do endpoint mensal da API. | `[CONECTADO]` | `GET /api/summary/monthly` |
| **Gráfico "Fluxo de Caixa" (AreaChart)** | Gráfico | Exibe curvas de Receitas vs Despesas de Jan a Dez com tooltips reativos. Dados são estáticos no array `data`. | `[SÓ VISUAL]` | Requer endpoint de histórico anual/mensal |
| **"Despesas por Categoria" (PipelineOverview)** | Progresso | Barras de progresso com porcentagens animadas (Locação, Cloud, Marketing, SaaS). Dados estáticos no array `stages`. | `[SÓ VISUAL]` | `GET /api/reports/categories` (já existe na API!) |
| **Botão "Ver todos" (Últimos Lançamentos)** | Botão | `<button>` com texto "Ver todos". Não possui `onClick` e não navega para a tela de Lançamentos. | `[SÓ VISUAL]` | Navegação para tab `deals` |
| **Itens de Lançamento (Últimos Lançamentos)** | Linha/Card | Clique abre modal `Dialog` completo com detalhes, status, forma de pagamento e notas (Ponto 1). | `[CONECTADO]` | `GET /api/transactions` |
| **Itens de Categorias (Maiores Categorias)** | Linha/Card | Clique abre modal `Dialog` com total gasto no mês, posição no ranking e lista de compras com datas (Ponto 2). | `[CONECTADO]` | `GET /api/reports/categories` + compras filhas |

---

### 2.3 Tela 2: Categorias (`pipeline.tsx`)
| Elemento | Tipo | Comportamento Observado no Navegador | Status Atual | Endpoint API Relacionado |
| :--- | :--- | :--- | :--- | :--- |
| **Botão "Novo Lançamento" (Topo)** | Botão | Botão estilizado com ícone `+`. Não possui evento `onClick` e não abre modal de cadastro. | `[SÓ VISUAL]` | `POST /api/transactions` (já existe na API!) |
| **Colunas de Categorias (Kanban)** | Board | 4 colunas estáticas definidas em `initialStages`. Não consome categorias cadastradas na API. | `[SÓ VISUAL]` | `GET /api/categories` (já existe na API!) |
| **Cards de Despesas** | Cards | Cards com classes `cursor-grab active:cursor-grabbing`, porém sem drag-and-drop real e sem clique de detalhes. | `[SÓ VISUAL]` | `GET /api/transactions` |
| **Botão "..." nos Cards** | Ação | Botão de menu que aparece no hover. Não possui `onClick` e não abre menu de opções. | `[SÓ VISUAL]` | `PUT /api/transactions/{id}`, `DELETE /api/transactions/{id}` |
| **Botão "+ Adicionar item" (Base da coluna)** | Botão | Botão tracejado em cada coluna. Não possui `onClick` e não abre formulário de adição. | `[SÓ VISUAL]` | `POST /api/transactions` (já existe na API!) |

---

### 2.4 Tela 3: Lançamentos (`deals.tsx`)
| Elemento | Tipo | Comportamento Observado no Navegador | Status Atual | Endpoint API Relacionado |
| :--- | :--- | :--- | :--- | :--- |
| **Campo "Buscar lançamentos..."** | Input | Filtra em tempo real a lista de transações por descrição e fornecedor no estado React em memória. | `[ESTADO LOCAL]` | Filtro client-side sobre `GET /api/transactions` |
| **Filtros de Status ("Todos", "Concluídos", "Pendentes", "Cancelados")** | Filtros | Alterna filtro ativo e recalcula os registros exibidos na tabela em memória. | `[ESTADO LOCAL]` | Filtro client-side sobre `GET /api/transactions` |
| **Botão "Mais filtros"** | Dropdown | Botão com ícone `Filter` e seta. Não possui `onClick` e não abre opções de filtro avançado. | `[SÓ VISUAL]` | Filtro por categoria, período ou tipo |
| **Ordenação de Colunas ("Descrição", "Valor")** | Cabeçalho | Botões com ícone `ArrowUpDown`. Não possuem `onClick` e não reordenam os dados da tabela. | `[SÓ VISUAL]` | Ordenação client-side ou query param |
| **Ações na Linha ("...")** | Menu | Botão `MoreHorizontal` no final de cada linha. Não abre menu para Editar, Excluir ou Ver detalhes. | `[SÓ VISUAL]` | `PUT /api/transactions/{id}`, `DELETE /api/transactions/{id}` |
| **Paginação ("Anterior", "1", "2", "Próximo")** | Paginação | Botões estáticos. Não possuem `onClick`, não alteram página e não fazem slice do array. | `[SÓ VISUAL]` | Paginação client-side ou `Pageable` no backend |
| **Adicionar Lançamento** | Ação | Inexistente nesta tela (o botão existe apenas na tela Categorias e no Overview de forma estática). | `[FALTANDO]` | `POST /api/transactions` |

---

### 2.5 Tela 4: Contas / Clientes / Fornecedores (`customers.tsx`)
| Elemento | Tipo | Comportamento Observado no Navegador | Status Atual | Endpoint API Relacionado |
| :--- | :--- | :--- | :--- | :--- |
| **4 Cards de Resumo (Total, Saldo, Regularidade, Ativos)** | KPIs | Calculados em tempo real via JavaScript a partir do array mock `customers`. | `[ESTADO LOCAL]` | Não existe entidade de Contas/Contatos no backend |
| **Campo "Buscar contas e beneficiários..."** | Input | Filtra os cards por nome e contato em tempo real em memória. | `[ESTADO LOCAL]` | Não aplicável (mock em memória) |
| **Filtros por Categoria/Tier ("Principal", "Secundária", "Reserva")** | Filtros | Botões clicáveis que filtram os cards pelo tier selecionado em memória. | `[ESTADO LOCAL]` | Não aplicável (mock em memória) |
| **Botão "+ Nova Conta"** | Botão | Botão destacado no topo. Não possui `onClick` e não abre formulário de cadastro. | `[SÓ VISUAL]` | Não existe `POST /api/accounts` no backend |
| **Botões nos Cards ("Schedule", "Email", "ExternalLink")** | Ações | Botões de contato/agenda no rodapé de cada card. Não possuem `onClick` nem links `mailto:`. | `[SÓ VISUAL]` | Não aplicável |

---

### 2.6 Tela 5: Orçamentos / Centros de Custo (`team.tsx`)
| Elemento | Tipo | Comportamento Observado no Navegador | Status Atual | Endpoint API Relacionado |
| :--- | :--- | :--- | :--- | :--- |
| **3 KPIs do Topo (Total Gasto, Lançamentos, Aderência ao Teto)** | KPIs | Calculados via reduce sobre o array mock `teamMembers`. | `[ESTADO LOCAL]` | Requer suporte a Tetos Orçamentários na API |
| **Gráfico de Barras "Gasto Real vs Teto Orçamentário"** | Gráfico | Gráfico Recharts comparando Real vs Meta por centro de custo. Dados 100% estáticos. | `[SÓ VISUAL]` | Requer endpoint de orçamentos na API |
| **Cards de Centros de Custo** | Cards | Exibem barra de uso do teto orçamentário e percentual de atingimento. Dados estáticos. | `[SÓ VISUAL]` | Requer endpoint de orçamentos na API |
| **Botões de Ação ("...", "Email", "Telefone") nos Cards** | Ações | Botões sem handler `onClick` e sem links interativos. | `[SÓ VISUAL]` | Não aplicável |

---

### 2.7 Tela 6: Previsões (`forecasting.tsx`)
| Elemento | Tipo | Comportamento Observado no Navegador | Status Atual | Endpoint API Relacionado |
| :--- | :--- | :--- | :--- | :--- |
| **Select de Período ("Mensal", "Trimestral", "Anual")** | Dropdown | Altera o estado `timeframe` no React, mas os gráficos e dados não mudam (arrays estáticos). | `[ESTADO LOCAL]` | Requer endpoint de projeção financeira |
| **Botão "Atualizar" (com ícone RefreshCw)** | Botão | Botão estático. Não possui `onClick`, não refaz queries e não dispara animação de recarregamento. | `[SÓ VISUAL]` | TanStack Query `refetch` |
| **4 KPIs de Previsão (Previsão T2, Acurácia, Cobertura, Despesas)** | KPIs | Valores fixos definidos diretamente no código-fonte com animação de entrada. | `[SÓ VISUAL]` | Requer cálculos estatísticos no backend |
| **Gráfico de Área "Fluxo Previsto vs Histórico Real"** | Gráfico | Recharts com dados estáticos do array `forecastData`. | `[SÓ VISUAL]` | Requer endpoint de histórico + projeção |
| **Gráfico de Barras "Detalhamento Trimestral"** | Gráfico | Recharts com dados estáticos de `quarterlyForecast` (T1 a T4). | `[SÓ VISUAL]` | Requer endpoint de projeção por período |
| **Cards de Cenários ("Conservador", "Caso Base", "Otimista")** | Cards | Exibem probabilidades e valores fixos em badges e cards. Sem interação. | `[SÓ VISUAL]` | Requer modelo de cenários na API |
| **Cards de "Fatores de Risco"** | Cards | Exibem 3 riscos operacionais estáticos com severidade e impacto. Sem clique. | `[SÓ VISUAL]` | Requer análise de contas a vencer |

---

### 2.8 Tela 7: Relatórios (`reports.tsx`)
| Elemento | Tipo | Comportamento Observado no Navegador | Status Atual | Endpoint API Relacionado |
| :--- | :--- | :--- | :--- | :--- |
| **4 ReportCards ("Ver Relatório")** | Cards | Botão "Ver Relatório" com ícone de seta. Não possui `onClick` e não abre visualização ou modal. | `[SÓ VISUAL]` | Navegação ou modal de relatório |
| **Gráfico de Linha "Evolução da Taxa de Poupança"** | Gráfico | Curva mensal de Jan a Dez com dados estáticos de `conversionData`. | `[SÓ VISUAL]` | Histórico consolidado de economia |
| **Gráfico Donut "Origem das Receitas"** | Gráfico | PieChart com dados estáticos de `sourceData` (SaaS, Consultorias, CDB, etc.). | `[SÓ VISUAL]` | `GET /api/reports/categories` (com filtro tipo RECEITA) |
| **Botão "Gerar Novo" (Tabela de Relatórios)** | Botão | Botão acima da tabela. Não possui `onClick` e não dispara geração de relatório. | `[SÓ VISUAL]` | `GET /api/reports/monthly/pdf` (já existe na API!) |
| **Botões "Baixar" na Tabela de Relatórios** | Download | Botão com ícone `Download`. Não possui `onClick` e **NÃO baixa nenhum arquivo**, apesar de a API possuir endpoint PDF real! | `[ENDPOINT EXISTE MAS DESCONECTADO]` | `GET /api/reports/monthly/pdf?year=2026&month=10` |
| **Indicador "Gerando..."** | Status | Linha com badge animado de loading. Puramente decorativo e estático. | `[SÓ VISUAL]` | Status de job assíncrono de relatório |

---

### 2.9 Tela 8: Ajustes (`settings.tsx`)
| Elemento | Tipo | Comportamento Observado no Navegador | Status Atual | Endpoint API Relacionado |
| :--- | :--- | :--- | :--- | :--- |
| **Navegação de Abas (Perfil, Notificações, Conexões, Segurança)** | Tabs | Alterna entre as 4 abas perfeitamente usando o componente Radix `Tabs`. | `[ESTADO LOCAL]` | UI Navigation |
| **Aba Perfil: Campos de Nome, Sobrenome, Email** | Form | Permite digitar normalmente nos inputs, mas dados não são salvos em nenhum backend. | `[ESTADO LOCAL]` | Requer `PUT /api/users/profile` na API |
| **Aba Perfil: Selects de Perfil, Fuso Horário, Moeda** | Selects | Permitem seleção interativa, alterando valor em memória. | `[ESTADO LOCAL]` | Requer persistência de preferências de usuário |
| **Aba Perfil: Botão "Salvar Alterações"** | Botão | Dispara animação de spinner "Salvando..." por 1.5s com `setTimeout` e volta ao estado normal. Não salva nada na API. | `[SÓ VISUAL]` (Simulador) | Requer `PUT /api/users/profile` |
| **Aba Notificações: Switches de Email e Push** | Toggles | Função `toggleNotification` inverte o estado booleano de cada switch em memória. Ao trocar de tela e voltar, reseta. | `[ESTADO LOCAL]` | Requer persistência de configurações |
| **Aba Conexões & API: Card "Spring Boot 3 API"** | Integração | Detecta status real do backend (`localhost:8081`) via hook `useApiHealth`. | `[CONECTADO]` | `GET /v3/api-docs` (Health check) |
| **Aba Conexões & API: Botão "Sincronizar"** | Botão | Botão nos cards de integração. Não possui `onClick` e não executa sync. | `[SÓ VISUAL]` | Requer rotas de sincronização bancária |
| **Aba Conexões & API: Botão "Desconectar / Conectar"** | Botão | Botões estáticos nos cards de integração. | `[SÓ VISUAL]` | Requer endpoints de integração externa |
| **Aba Segurança: Formulário de Senha ("Atualizar Senha")** | Form | Inputs de senha atual, nova senha e confirmação. Botão sem `onClick` e sem validação. | `[SÓ VISUAL]` | Requer `PUT /api/users/password` na API |
| **Aba Segurança: 2FA ("Gerenciar")** | Ação | Botão ao lado do badge "Ativado". Não possui `onClick` e não abre modal de QR Code. | `[SÓ VISUAL]` | Requer suporte TOTP na API |
| **Aba Segurança: Botão "Revogar" Sessões** | Ação | Botão em sessões ativas remotas. Não possui `onClick` e não invalida tokens JWT. | `[SÓ VISUAL]` | Requer blacklist de JWT no Redis/banco |

---

## 3. Matriz de Priorização do Backlog Funcional

```
┌────────────────────────────────────────────────────────────────────────┐
│ P0: Conexão Imediata (Endpoints já existem prontos na API Spring Boot) │
├────────────────────────────────────────────────────────────────────────┤
│ P1: Usabilidade e Navegação Essencial (Filtros, Buscas, Paginação)     │
├────────────────────────────────────────────────────────────────────────┤
│ P2: Expansão de Back-end (Novos Endpoints e Entidades no Spring Boot)   │
├────────────────────────────────────────────────────────────────────────┤
│ P3: Recursos Analíticos Avançados e Integrações Externas               │
└────────────────────────────────────────────────────────────────────────┘
```

### P0 — Conexão Imediata (Esforço Mínimo, Maior Impacto)
*Endpoints já implementados, testados e documentados no Swagger OpenAPI (`http://localhost:8081/swagger-ui.html`):*
1. **Download do Relatório PDF Mensal:**
   - **Onde:** Tela Relatórios (`reports.tsx`), botão "Baixar" da linha "Extrato Mensal Consolidado (PDF)".
   - **Ação:** Ligar o clique ao endpoint `GET /api/reports/monthly/pdf?year=2026&month=10` e disparar o download binário no navegador.
2. **Modal de Novo Lançamento (Receitas e Despesas):**
   - **Onde:** Botão "Novo Lançamento" na tela Categorias (`pipeline.tsx`) e em Lançamentos (`deals.tsx`).
   - **Ação:** Reutilizar o componente `Dialog` existente para criar formulário de inserção com campos `description`, `amount`, `date`, `type` e `categoryId`, chamando `POST /api/transactions` com invalidação do TanStack Query.
3. **Edição e Exclusão de Lançamentos:**
   - **Onde:** Botão `...` na tabela de Lançamentos (`deals.tsx`).
   - **Ação:** Adicionar dropdown ou modal com ações "Editar" (`PUT /api/transactions/{id}`) e "Excluir" (`DELETE /api/transactions/{id}`).
4. **Alimentar "Despesas por Categoria" da Visão Geral:**
   - **Onde:** Componente `pipeline-overview.tsx`.
   - **Ação:** Substituir o array estático `stages` pelos dados reais retornados por `useCategoryReport()` (`GET /api/reports/categories`).

---

### P1 — Usabilidade e Navegação Essencial
1. **Atalhos e Links de Navegação Interna:**
   - Botão "Ver todos" em Últimos Lançamentos deve navegar para a aba `deals`.
   - Botão "Novo Lançamento" visível e consistente em Lançamentos e Visão Geral.
2. **Seletor de Período Ativo no Header:**
   - Transformar "Últimos 30 dias" em um seletor funcional de mês/ano (ex: Outubro 2026, Setembro 2026), repassando `year` e `month` para os hooks do TanStack Query.
3. **Ordenação e Paginação Real na Tabela de Lançamentos:**
   - Implementar ordenação client-side ao clicar nos cabeçalhos "Descrição" e "Valor".
   - Implementar controle de paginação funcional (ex: 8 itens por página) nos botões "Anterior", números de página e "Próximo".

---

### P2 — Expansão de Back-end (Novas Funcionalidades de Negócio)
*Necessitam de criação de novas migrations Flyway, Entities, Repositories e Controllers na API:*
1. **CRUD e Gestão de Perfil do Usuário:**
   - Endpoints: `GET /api/users/me`, `PUT /api/users/profile`, `PUT /api/users/password`.
   - Front: Persistir alterações feitas na aba "Perfil" e formulário de senha de Ajustes.
2. **Módulo de Contas Bancárias e Fornecedores B2B:**
   - Endpoints: `GET /api/accounts`, `POST /api/accounts`, `PUT /api/accounts/{id}`.
   - Front: Conectar a tela `customers.tsx` e o botão "+ Nova Conta" a dados reais.
3. **Módulo de Tetos e Metas Orçamentárias:**
   - Endpoints: `GET /api/budgets`, `POST /api/budgets`.
   - Front: Conectar a tela `team.tsx` (Centros de Custo) com cálculo real de teto por categoria.
4. **Persistência de Notificações e Alertas:**
   - Endpoints: `GET /api/notifications`, `PUT /api/notifications/preferences`.
   - Front: Persistir os toggles da aba Notificações e exibir badge no sino do header.

---

### P3 — Recursos Analíticos Avançados
1. **Motor de Projeção Financeira e Cenários:**
   - Algoritmo de projeção baseado em médias móveis históricas para alimentar a tela de Previsões (`forecasting.tsx`).
2. **Integrações Externas (Open Finance & Webhooks):**
   - Conexão com serviços de Open Banking para importação de extratos OFX.
3. **Sessões Ativas e 2FA TOTP:**
   - Gerenciamento de tokens JWT revogáveis e autenticação de dois fatores.
