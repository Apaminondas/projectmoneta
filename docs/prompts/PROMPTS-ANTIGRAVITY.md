# Prompts para o Antigravity (gerados com a skill prompt-master)

Ordem de uso, uma sessão por prompt, com commit ao final de cada uma:

1. **Prompt 1: Plano** (só planejamento, nada de código). Revise e aprove o plano antes de seguir.
2. Prompts 2 a 7: uma tela por vez. Eles assumem o plano aprovado do Prompt 1.

Se o plano trouxer decisões suas (D1: status, etc.), responda antes de colar o Prompt 2.

---

## Prompt 1: Plano completo (sem implementar)

```
Use a skill ajuste-fullstack-no-padrao-do-projeto (rode o modo snapshot se faltar DESIGN-SYSTEM.md ou BACKEND-PADROES.md).

## Contexto (carry forward)
- Projeto: dashboard financeiro "Finance API". Front em Next.js 15, React 19, Tailwind e TanStack Query (pasta moneta-dashboard, design travado a partir de template V0). Back-end em Spring Boot 3, PostgreSQL 16 e Flyway, em http://localhost:8081 (Swagger em /swagger-ui.html).
- O design é intocável. Todo elemento novo (modal, painel, formulário, calendário, menu) MUST nascer de components/ui e dos padrões do DESIGN-SYSTEM.md, só com tokens do projeto. NEVER adicionar dependência, cor ou tamanho fora dos tokens sem me perguntar.
- Já existe: modais de detalhe em Últimos Lançamentos e Maiores Categorias, e o modal Novo Lançamento (descrição/fornecedor, valor, data, tipo, categoria, status, forma de pagamento, observações), mas sem lógica ligada.
- Hoje Categorias, Contas, Orçamento, Previsões e Relatórios usam dados fixos escritos no código, em conteúdo corporativo B2B, e os números não batem entre as telas. Exemplos para você verificar: as 4 colunas de Categorias somam R$ 13.105, Orçamento mostra Gasto Consolidado R$ 17.130, e o card de aluguel em Categorias marca 100% de limite enquanto Locação Comercial em Orçamento marca 108% do teto.

## Tarefa
PLANEJAR, sem implementar. Entregue um Implementation Plan (artifact) que cubra os 24 itens abaixo, em português.

### Itens pedidos
Geral: (1) sistema completo de notificações; (2) busca do header funcionando e menu do avatar com os dados do perfil.
Categorias: (1) detalhes ao clicar em um card; (2) arrastar um card para outra categoria move o lançamento; (3) toda a lógica do Novo Lançamento, com gravação imediata no banco e na API; (4) criar novas categorias e, quando as colunas lotarem, paginar; (5) as categorias criadas aparecem nas opções do Novo Lançamento; (6) calendário do campo de data em tema escuro; (7) seletor de período de exibição (último mês, último ano etc.).
Contas: (1) detalhes ao clicar nos 4 cards do topo; (2) Nova Conta com lógica real em banco e API REST; (3) detalhes ao clicar numa conta, com e-mail e agenda editáveis; (4) adicionar e editar contas.
Orçamento: (1) detalhes ao clicar nos 3 cards do topo; (2) editar perfil e contatos dos centros de custo; (3) detalhes ao clicar em um centro de custo.
Previsões: (1) detalhes nos 4 cards do topo; (2) detalhes dos fatores de risco; (3) planos de mitigação com campos de escrita e sugestões; (4) criar fatores de risco com categoria e detalhes.
Relatórios: (1) detalhes nos cards superiores; (2) "Gerar Novo" funcionando; (3) antes de gerar o PDF, poder trocar o logo e incluir dados da empresa (contatos etc.); (4) botões de baixar PDF funcionando.

### Regra central
Todo dado que aparece em mais de uma tela (nome, e-mail, telefone e agenda de uma conta; categorias; centros de custo; totais) MUST vir da mesma entidade e do mesmo endpoint. Contatos e dados editados em uma tela MUST aparecer iguais em todas as outras.

## O plano deve conter
1. Auditoria das inconsistências atuais entre telas (somas, rótulos, percentuais).
2. Modelo de dados unificado (entidades, relacionamentos, migrations Flyway) e tabela "dado → telas que o exibem → fonte".
3. Contratos de API por funcionalidade (método, caminho, JSON de entrada e saída, status e formato de erro iguais aos existentes).
4. Funcionalidades agrupadas (F-01, F-02...), com ordem por dependência, esforço (P/M/G), risco e o que reaproveita do que já existe.
5. Estratégia de dados de demonstração coerentes entre telas (seed via Flyway).
6. Decisões que dependem de mim, em um único bloco, cada uma com opções e uma recomendação.
7. Sugestões de melhoria por tela (até 5 cada), ranqueadas por valor e esforço, aplicando práticas de sistemas financeiros profissionais. Avalie, no mínimo: valores em BigDecimal ou centavos, soft delete, trilha de auditoria (quem alterou o quê e quando), validação de transição de status, lançamentos recorrentes e parcelados, anexo de comprovante, paginação e filtros no servidor, alertas de teto em 80% e 100%, idempotência nos POST, e validação de upload do logo (tipo, tamanho). Marque cada sugestão como "essencial", "recomendada" ou "extra".

## Restrições
- MUST NOT editar código, rodar migration, instalar dependência ou alterar o banco nesta etapa.
- Todo conteúdo gerado por regra ou cálculo (previsões, sugestões de mitigação) MUST ser determinístico e rastreável aos dados reais. NEVER inventar números.
- Stop: ao entregar o plano, PARE e aguarde minha aprovação. Ask before any destructive terminal command.

## Pronto quando
Os 24 itens aparecem no plano, cada um ligado a uma funcionalidade, a um endpoint e a uma entidade, e a tabela "dado → telas → fonte" não tem nenhum dado repetido com fontes diferentes.
```

---

## Prompt 2: Categorias (itens 1 a 7 de Categorias)

```
Use a skill ajuste-fullstack-no-padrao-do-projeto. Siga o Implementation Plan aprovado e o modelo de dados unificado. Design intocável: elementos novos só com components/ui e tokens do DESIGN-SYSTEM.md.

## Escopo
Apenas a tela Categorias (categories/pipeline.tsx), o modal Novo Lançamento e o back-end que eles exigem. NEVER alterar contrato de endpoint existente nem outras telas, exceto para manter dados compartilhados consistentes (liste cada arquivo extra tocado).

## Resultado esperado
1. Clicar em um card abre um painel de detalhes (valores, categoria, centro de custo, conta/fornecedor, status, forma de pagamento, observações), com ações Editar e Excluir (confirmação com o AlertDialog existente).
2. Arrastar um card para outra coluna troca a categoria do lançamento no banco, com atualização imediata na tela e rollback com aviso se a API falhar. Ofereça também um jeito sem arrastar ("Mover para...") para teclado e celular.
3. Novo Lançamento 100% funcional: validação dos campos obrigatórios, valor monetário, data, tipo, status e forma de pagamento. Ao criar, grava na API e no banco e atualiza colunas, KPIs e as outras telas que dependem dele.
4. Criar nova categoria (nome, cor entre os tokens existentes, teto opcional). Quando houver mais colunas do que cabem, paginar de 4 em 4 com os controles de paginação que o projeto já usa.
5. O campo Categoria do Novo Lançamento lista as categorias reais da API, incluindo as recém-criadas, sem recarregar a página.
6. O calendário do campo de data fica em tema escuro com os tokens do projeto (pergunte antes de adicionar qualquer biblioteca de calendário).
7. Seletor de período (último mês, 3 meses, último ano, personalizado) que filtra cards, totais e KPIs. Use o seletor do header se ele for o controle global de período; pergunte se houver conflito.

## Restrições
- Ask before: adicionar dependência (ex.: biblioteca de drag and drop), migration destrutiva, mudar endpoint existente.
- Estados de carregamento, erro e vazio só com componentes que o projeto já tem; NEVER usar dados fictícios como fallback silencioso.

## Verificação (browser agent em 1440px)
Use cada item na tela, recarregue a página, confira o registro no banco e confirme que os mesmos valores aparecem iguais em Visão Geral, Lançamentos e Orçamento. Rode os testes do back-end e o Impeccable (flags <= baseline da tela).

## Pronto quando
Os 7 itens funcionam de ponta a ponta, o diff do front não tem cor ou tamanho fora dos tokens, e você entrega um relatório curto (referências copiadas, contratos, migrations, testes feitos).
```

---

## Prompt 3: Contas

```
Use a skill ajuste-fullstack-no-padrao-do-projeto. Siga o Implementation Plan aprovado e o modelo de dados unificado. Design intocável: elementos novos só com components/ui e tokens do DESIGN-SYSTEM.md.

## Escopo
Apenas a tela Contas (customers.tsx) e o back-end que ela exige. A entidade de contato (e-mail, telefone, agenda) é a fonte única usada também por Orçamento, Lançamentos e Previsões. NEVER duplicar esses dados em outra tabela ou array. Liste cada arquivo extra tocado.

## Resultado esperado
1. Os 4 cards do topo (Total de Contas, Saldo Acumulado, Índice de Regularidade, Lançamentos Ativos) abrem um painel de detalhes com o detalhamento do cálculo e a lista de contas que compõem o número.
2. Nova Conta cria uma conta de verdade (nome, segmento, nível Principal/Secundária/Reserva, cidade e UF, e-mail, telefone, saldo inicial) com validação (e-mail, máscara de telefone brasileiro) e gravação no banco via API REST.
3. Clicar em uma conta abre o detalhe: dados cadastrais, e-mail e telefone editáveis, agenda com compromissos (criar, editar, excluir, com data e nota) e os lançamentos vinculados.
4. Adicionar, editar e arquivar contas (soft delete, com confirmação). Os botões Schedule (abre a agenda da conta), Email (mailto com os dados corretos) e o link externo (abre o detalhe) funcionam.
5. Os dados de e-mail, telefone e agenda de uma conta aparecem idênticos em todas as telas que a mencionam. Gere dados de demonstração coerentes por seed Flyway.

## Restrições
- Ask before: adicionar dependência, migration destrutiva, mudar endpoint existente.
- NEVER usar dados fictícios como fallback silencioso quando a API falhar ou vier vazia.

## Verificação (browser agent em 1440px)
Crie, edite e arquive uma conta, recarregue a página, confira no banco e confirme que a edição do e-mail aparece igual em Orçamento. Rode os testes do back-end e o Impeccable (flags <= baseline).

## Pronto quando
Os itens funcionam de ponta a ponta, nenhum contato existe em mais de uma fonte, e você entrega o relatório curto (referências, contratos, migrations, testes feitos).
```

---

## Prompt 4: Orçamento

```
Use a skill ajuste-fullstack-no-padrao-do-projeto. Siga o Implementation Plan aprovado e o modelo de dados unificado. Design intocável: elementos novos só com components/ui e tokens do DESIGN-SYSTEM.md.

## Escopo
Apenas a tela Orçamento (team.tsx) e o back-end que ela exige. Contatos dos centros de custo vêm da mesma entidade usada em Contas. Liste cada arquivo extra tocado.

## Resultado esperado
1. Os 3 cards do topo (Gasto Consolidado, Total de Lançamentos, Aderência Média ao Teto) abrem um painel com o detalhamento por centro de custo e por mês, calculado dos lançamentos reais.
2. Editar o perfil de um centro de custo: nome, tipo (custo fixo, variável, investimento etc.), responsável, teto mensal e contatos (e-mail e telefone da mesma fonte de Contas), com validação e gravação no banco via API.
3. Clicar em um centro de custo abre o detalhe: lançamentos do período, evolução do uso do teto, alertas (80% e 100%) e contatos. Os botões de e-mail e telefone usam mailto e tel com os dados reais.
4. "Uso do Teto" e o gráfico Gasto Real vs Teto vêm do banco: gasto real dividido pelo teto, sem percentuais escritos no código. O valor de cada centro MUST bater com Categorias e Visão Geral.

## Restrições
- Ask before: adicionar dependência, migration destrutiva, mudar endpoint existente.
- NEVER usar dados fictícios como fallback silencioso.

## Verificação (browser agent em 1440px)
Edite o teto de um centro, recarregue, confirme no banco e veja o percentual mudar também onde aparecer em outras telas. Rode os testes do back-end e o Impeccable (flags <= baseline).

## Pronto quando
Os itens funcionam de ponta a ponta, os totais batem entre as telas, e você entrega o relatório curto.
```

---

## Prompt 5: Previsões

```
Use a skill ajuste-fullstack-no-padrao-do-projeto. Siga o Implementation Plan aprovado e o modelo de dados unificado. Design intocável: elementos novos só com components/ui e tokens do DESIGN-SYSTEM.md.

## Escopo
Apenas a tela Previsões (forecasting.tsx) e o back-end que ela exige. Toda previsão e sugestão MUST ser calculada por regra determinística a partir dos lançamentos, contas e tetos reais, com a fórmula documentada. NEVER inventar números nem usar IA generativa sem me perguntar.

## Resultado esperado
1. Os 4 cards do topo (Previsão T2, Acurácia Histórica, Cobertura de Saldo, Despesas em Aberto) mostram valores calculados e, ao clicar, abrem um painel com a fórmula, os dados usados e o período.
2. Clicar em um fator de risco abre o detalhe: valor em risco, severidade, prazo e os lançamentos e contas reais relacionados (links para as outras telas).
3. "Ver plano de mitigação" abre um painel com campos editáveis (ações, responsável, prazo, status) e sugestões geradas por regras a partir dos dados (por exemplo, antecipar pagamento de contrato a vencer), com a regra que gerou cada sugestão visível.
4. Criar fator de risco manual: categoria, severidade, valor estimado, itens relacionados e descrição. Fatores detectados automaticamente (contratos a vencer, oscilação cambial, proximidade do teto) e manuais convivem na mesma lista, identificados pela origem.
5. Os gráficos de projeção e cenários vêm do endpoint de previsão, com a metodologia (por exemplo, média móvel dos últimos meses) descrita na tela.

## Restrições
- Ask before: adicionar dependência, migration destrutiva, mudar endpoint existente.
- Estados de carregamento, erro e vazio só com componentes existentes.

## Verificação (browser agent em 1440px)
Crie um fator de risco e um plano, recarregue, confirme no banco e confira que os números dos cards batem com o cálculo manual dos mesmos dados. Rode os testes do back-end (inclua teste da fórmula) e o Impeccable (flags <= baseline).

## Pronto quando
Nenhum número da tela está escrito no código, cada valor tem fórmula e fonte, e você entrega o relatório curto.
```

---

## Prompt 6: Relatórios

```
Use a skill ajuste-fullstack-no-padrao-do-projeto. Siga o Implementation Plan aprovado e o modelo de dados unificado. Design intocável: elementos novos só com components/ui e tokens do DESIGN-SYSTEM.md.

## Escopo
Apenas a tela Relatórios (reports.tsx) e o back-end de geração de PDF. Use o gerador de PDF que o projeto já tem (GET /api/reports/monthly/pdf) e estenda; pergunte antes de trocar a biblioteca.

## Resultado esperado
1. Os cards superiores de relatório abrem um painel com o resumo do relatório e os números reais do período.
2. "Gerar Novo" abre um modal para escolher tipo de relatório, período, filtros (categoria, conta, centro de custo) e formato. Ao confirmar, gera de verdade e a lista de Relatórios Recentes mostra o novo item, com o estado "Gerando..." só enquanto a geração ocorre.
3. Antes de gerar, o modal permite trocar o logo e informar dados da empresa (nome, e-mail, telefone, rodapé), com pré-visualização. Esses dados ficam salvos como perfil da empresa e são reutilizados nos próximos PDFs. Upload com validação: apenas PNG ou JPG, até 1 MB; NEVER aceitar SVG ou outro tipo.
4. Os botões Baixar fazem o download real do PDF, com nome de arquivo padronizado (tipo, período e data), inclusive para relatórios já gerados antes.
5. Gráficos e totais da tela vêm da API e batem com as demais telas.

## Restrições
- Ask before: adicionar dependência, migration destrutiva, mudar endpoint existente.
- O arquivo do logo MUST ser validado no servidor (tipo real, tamanho) e armazenado fora de qualquer pasta pública sem controle de acesso.

## Verificação (browser agent em 1440px)
Gere um relatório com logo novo, baixe e abra o PDF, confira que os números do PDF batem com a tela. Recarregue e baixe de novo. Rode os testes do back-end e o Impeccable (flags <= baseline).

## Pronto quando
Gerar e baixar funcionam de ponta a ponta com o logo escolhido, e você entrega o relatório curto.
```

---

## Prompt 7: Geral (notificações, busca e avatar)

```
Use a skill ajuste-fullstack-no-padrao-do-projeto. Siga o Implementation Plan aprovado e o modelo de dados unificado. Design intocável: elementos novos só com components/ui e tokens do DESIGN-SYSTEM.md.

## Escopo
Apenas o Header global (sino, busca, avatar), a aba Notificações de Ajustes e o back-end que eles exigem. Faça este prompt por último: ele depende das telas anteriores.

## Resultado esperado
1. Notificações: o sino abre um painel com a lista (lida e não lida), contador no indicador, marcar uma ou todas como lidas e link para o item relacionado. Os eventos nascem das regras reais (teto de centro de custo em 80% e 100%, contrato a vencer, lançamento criado). Os switches da aba Notificações de Ajustes passam a persistir no banco e a controlar quais eventos geram aviso.
2. Busca do header: pesquisa em lançamentos, contas, categorias e centros de custo, resultados agrupados por tipo, navegando para o item ao escolher. Busca no servidor com debounce.
3. Avatar: menu com nome e e-mail do usuário logado (vindos da API), atalho para Ajustes e Sair (encerra a sessão de verdade).
4. Atualização por refetch periódico; pergunte antes de usar WebSocket ou push.

## Restrições
- Ask before: adicionar dependência, migration destrutiva, mudar endpoint existente.
- NEVER usar dados fictícios como fallback silencioso.

## Verificação (browser agent em 1440px)
Dispare um evento (ultrapasse 80% do teto de um centro), veja a notificação aparecer, marque como lida, recarregue e confirme a persistência. Teste a busca e o logout. Rode os testes do back-end e o Impeccable (flags <= baseline).

## Pronto quando
Os 3 itens funcionam de ponta a ponta e você entrega o relatório curto.
```
