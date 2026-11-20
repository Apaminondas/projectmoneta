# Plano de execução das funcionalidades

Derivado do `BACKLOG-FUNCIONAL.md`, reorganizado por funcionalidade, com dependências e prompt pronto.
Use uma funcionalidade por vez, com a skill `ajuste-fullstack-no-padrao-do-projeto`, e faça um commit por funcionalidade.

## Antes de começar: 3 decisões e 3 verificações

### Decisões (suas)
- **D1. O conceito de status (Concluído, Pendente, Cancelado).** Vem do template (Won, Pending, Lost). O DTO da API
  que o agente listou (`description, amount, date, type, categoryId, categoryName`) **não tem status**.
  Opções: (A) adicionar `status` à entidade `Transaction` com migration; (B) remover o conceito da tela
  (mudança estrutural, precisa da sua autorização); (C) manter rotulado como demonstração.
  Recomendo A se você quer pendências e cancelamentos no produto; senão B.
- **D2. O que a tela "Categorias" deve ser.** Hoje é um Kanban com colunas por categoria. Opções: (A) Kanban real
  (colunas = categorias da API, cards = lançamentos, arrastar = trocar a categoria do lançamento); (B) gestão de
  categorias (criar, renomear, excluir); (C) as duas coisas.
- **D3. Escopo de P2 e P3.** Contas, Orçamentos, Notificações, Previsões, Open Finance, Webhooks, 2FA e revogação de
  sessões são projetos grandes (veja a nota ao final). Defina o que entra agora e o que fica rotulado como "em breve".

### Verificações (rápidas, pedir ao agente antes da F-02)
- **V1.** Os modais já feitos (Ponto 1 e Ponto 2) mostram "status, método de pagamento e observações". Confirme de onde
  vem cada campo, porque o DTO listado não tem esses campos. Se vierem de dado fixo, isso é dado fictício apresentado como real.
- **V2.** Confirme no Swagger se `PUT /api/transactions/{id}` e `DELETE /api/transactions/{id}` existem de verdade
  (o backlog afirma, mas o contrato mapeado na Fase 4 listava só GET e POST).
- **V3.** Os rótulos "Locação, Cloud, Marketing, SaaS" (Despesas por Categoria) e "SaaS, Consultorias, CDB" (donut de
  receitas) citados no backlog não batem com o conteúdo de finanças pessoais da Fase 2 (Moradia, Alimentação...).
  Confirme com um `grep` o que está de fato no código.

## Ordem de execução

| ID | Funcionalidade | Depende de | Back-end | Esforço |
|---|---|---|---|---|
| F-01 | "Ver todos" navega para Lançamentos | nada | existe | P |
| F-02 | Cadastro de lançamento | V1, D1 | existe (POST) | M |
| F-03 | Editar e excluir lançamento | F-02, V2 | verificar | M |
| F-04 | Lançamentos: ordenação, paginação, mais filtros | nada | cliente | M |
| F-05 | Visão Geral com dados reais e seletor de período | nada | 1 endpoint novo (histórico anual) | M/G |
| F-06 | Relatórios: PDF, gerar novo, donut | F-05 | existe | M |
| F-07 | Perfil e senha | nada | novos endpoints | G |
| F-08 | Tela Categorias | D2, F-02, F-03 | existe ou novo | M/G |

## Prompts prontos

### F-01 "Ver todos" navega para Lançamentos
```
Use a skill ajuste-fullstack-no-padrao-do-projeto.
Tipo: A (comportamento no front, zero mudança em className).
Alvo: botão "Ver todos" do bloco Últimos Lançamentos (recent-deals.tsx).
Quero: ao clicar, a aplicação troca para a seção Lançamentos (a mesma troca que a sidebar faz).
Use o mecanismo de navegação que a sidebar já usa. Não crie rota nova.
No final: relatório e teste real (clicar, conferir a tela, conferir que o diff não tem className).
```

### F-02 Cadastro de lançamento
```
Use a skill ajuste-fullstack-no-padrao-do-projeto.
Tipo: D. Funcionalidade F-02: cadastro de lançamento.
Alvos: botão "Novo Lançamento" (tela Categorias), botão "+ Adicionar item" de cada coluna (pré-seleciona a
categoria da coluna) e um botão equivalente na tela Lançamentos (que hoje não tem; pergunte onde posicionar).
Quero: um modal usando o Dialog e o Form que já existem no projeto, com description, amount, date, type
e categoryId (as categorias vêm de GET /api/categories). Ao salvar, chama POST /api/transactions, fecha o modal
e atualiza as listas e os KPIs (invalidar as queries do TanStack Query).
Contrato: POST /api/transactions { description, amount, date, type, categoryId }. Confira no Swagger e me mostre
antes de codar. [Se D1 = A: incluir status no contrato e criar a migration.]
Estados de erro de validação e de rede: use só componentes de feedback que o projeto já tem; se faltar, pergunte.
No final: teste ponta a ponta (tela, API, banco, volta à tela), inclusive caso de erro, e relatório.
```

### F-03 Editar e excluir lançamento
```
Use a skill ajuste-fullstack-no-padrao-do-projeto.
Tipo: D. Funcionalidade F-03: editar e excluir lançamento.
Alvos: botão "..." das linhas da tabela em Lançamentos e dos cards da tela Categorias.
Quero: menu com Ver detalhes, Editar e Excluir (use o DropdownMenu que já existe). Editar reutiliza o modal da F-02
preenchido. Excluir pede confirmação com o AlertDialog que já existe.
Contrato: PUT /api/transactions/{id} e DELETE /api/transactions/{id}. Se não existirem, defina e me mostre antes,
com testes no mesmo estilo dos outros endpoints. O isolamento por usuário deve valer (acesso a lançamento de outro
usuário falha como nos endpoints existentes).
No final: teste ponta a ponta, incluindo excluir e editar de verdade no banco, e relatório.
```

### F-04 Lançamentos: ordenação, paginação, filtros
```
Use a skill ajuste-fullstack-no-padrao-do-projeto.
Tipo: A/B (comportamento no front; sem endpoint novo por enquanto).
Alvos em deals.tsx: cabeçalhos "Descrição" e "Valor" (ordenação), botões Anterior/1/2/Próximo (paginação) e
"Mais filtros" (categoria, período e tipo).
Quero: ordenação alternando crescente/decrescente, paginação real com 8 itens por página (o número de páginas
deve vir do total, não fixo em 2), e filtros avançados combinando com busca e status. Dados vêm de GET /api/transactions.
Não mude a aparência: reutilize os componentes do projeto. Se o filtro precisar de um componente que não existe,
pergunte antes.
No final: teste real de cada combinação e relatório.
```

### F-05 Visão Geral com dados reais e seletor de período
```
Use a skill ajuste-fullstack-no-padrao-do-projeto.
Tipo: D. Funcionalidade F-05: dados reais na Visão Geral.
Quero: (1) "Despesas por Categoria" alimentado por GET /api/reports/categories (hoje é array fixo; o total deve ser
a soma real); (2) "Fluxo de Caixa" alimentado por histórico real dos 12 meses (proponha o contrato de um endpoint
novo, por exemplo GET /api/summary/yearly?year=2026, e me mostre antes de codar); (3) o seletor "Últimos 30 dias"
do header vira seletor de mês e ano que repassa year e month para as queries.
Variações percentuais dos KPIs (+12.5% etc.): calcule de verdade comparando com o mês anterior ou me pergunte
como tratar. Não deixe número fictício ao lado de dado real.
No final: tabela por tela dizendo o que vem da API e o que ainda é fixo, teste ponta a ponta e relatório.
```

### F-06 Relatórios
```
Use a skill ajuste-fullstack-no-padrao-do-projeto.
Tipo: D. Funcionalidade F-06: relatórios funcionais.
Alvos em reports.tsx: botão "Baixar" do Extrato Mensal (PDF), botão "Gerar Novo", botões "Ver Relatório", donut
"Origem das Receitas" e linha "Evolução da Taxa de Poupança".
Quero: "Baixar" e "Gerar Novo" usam GET /api/reports/monthly/pdf?year&month com download real (peça o mês e ano
com o Select e Dialog que o projeto já tem); o donut vem de GET /api/reports/categories filtrando receitas; a linha
de poupança usa o histórico da F-05. O indicador "Gerando..." só aparece enquanto o download realmente ocorre.
Remova ou rotule o que não tiver back-end, depois de me perguntar.
No final: teste real do download (abrir o PDF) e relatório.
```

### F-07 Perfil e senha
```
Use a skill ajuste-fullstack-no-padrao-do-projeto.
Tipo: D. Funcionalidade F-07: perfil e senha.
Alvos em settings.tsx: aba Perfil (nome, sobrenome, e-mail, selects, "Salvar Alterações", que hoje é um setTimeout
falso) e aba Segurança (formulário de senha).
Quero: carregar os dados do usuário logado (nome vem do login, nunca fixo), salvar de verdade e trocar a senha.
Primeiro me mostre o contrato: GET /api/users/me, PUT /api/users/profile, PUT /api/users/password, com validações,
hash de senha como no cadastro existente, migration se precisar e testes no estilo do projeto.
Selects de fuso horário e moeda: pergunte se devem ser persistidos antes de criar colunas.
No final: teste ponta a ponta (alterar, recarregar, logar de novo com a senha nova) e relatório.
```

### F-08 Tela Categorias (depende de D2)
```
Use a skill ajuste-fullstack-no-padrao-do-projeto.
Tipo: D. Funcionalidade F-08: tela Categorias conforme a decisão D2: [A / B / C].
[A] Colunas = categorias de GET /api/categories, cards = lançamentos (GET /api/transactions), arrastar um card
para outra coluna chama PUT /api/transactions/{id} trocando o categoryId. Use a biblioteca de drag que o projeto
já tem; se não houver, pergunte antes de adicionar dependência.
[B] Criar, renomear e excluir categorias (contrato novo: mostre antes de codar; excluir categoria com lançamentos
deve ter regra definida e aprovada por mim).
No final: teste ponta a ponta e relatório.
```

## Sobre o escopo de P2 e P3 (para a decisão D3)

- **Contas e fornecedores**, **Orçamentos (tetos)** e **Notificações** são módulos completos (entidade, migration,
  CRUD, testes, tela). Cada um tende a ser maior do que as F-01 a F-06 somadas.
- **Orçamentos** é o que mais se encaixa num produto financeiro e reaproveita seus dados (compara gasto real com teto).
- **Projeção financeira**, **Open Finance**, **webhooks**, **2FA TOTP** e **revogação de sessões** são projetos à parte
  (algoritmo, integração externa, segredo TOTP, lista de revogação). A revogação de JWT não exige Redis: tokens de curta
  duração com refresh e uma tabela de revogação já resolvem.
- Enquanto não existirem, essas telas devem estar claramente rotuladas como demonstração ou em breve.
