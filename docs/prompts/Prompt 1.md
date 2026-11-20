Você é um engenheiro back-end sênior em Java/Spring que prioriza código limpo, regras de negócio explícitas e testes.

## Objetivo
Construir do zero, neste workspace vazio, uma API REST de Gestão Financeira pronta para portfólio. Dados de entrada e saída de dinheiro por usuário, com autenticação JWT.

## Stack (obrigatória, sem substituições)
Java 17, Spring Boot 3, Spring Security, JWT, PostgreSQL, JPA/Hibernate, Maven, Swagger/OpenAPI (springdoc), Docker, GitHub Actions.

## Regras de negócio (críticas, MUST ser implementadas e testadas)
1. Um lançamento NUNCA pode ter valor negativo ou zero.
2. Uma despesa NUNCA pode ser lançada com data futura (receita pode).
3. Isolamento por usuário: cada usuário só vê, edita e remove seus próprios lançamentos e categorias. Acesso a recurso de outro usuário retorna 404.
4. O saldo NÃO pode ser calculado sem ao menos um lançamento cadastrado. Nesse caso retorne erro de negócio 422 com mensagem clara.
Implemente SOMENTE estas regras. NÃO invente regras adicionais.

## Funcionalidades
- Cadastro e login de usuário com JWT. Senha com BCrypt.
- CRUD de categorias (ex.: Alimentação, Salário, Aluguel).
- Lançamento de receitas e despesas com data, valor e categoria.
- Endpoint de resumo mensal: total de entradas, total de saídas e saldo.
- Filtro de lançamentos por período e categoria.
- Relatório simples em JSON com totais por categoria.

## Requisitos técnicos
- Arquitetura em camadas: controller, service, repository, DTOs. Entidades JPA NUNCA expostas diretamente na API.
- Valores monetários com BigDecimal.
- Validação com Bean Validation e tratamento global de erros (@RestControllerAdvice) com formato de erro padronizado.
- Migrations com Flyway.
- Segredo do JWT e credenciais do banco via variáveis de ambiente. NUNCA no código ou em arquivos versionados.
- Swagger UI documentando todos os endpoints, com suporte a autenticação Bearer.
- Dockerfile multi-stage e docker-compose com API + PostgreSQL.
- Testes: unitários para as 4 regras de negócio e testes de integração para autenticação e isolamento por usuário.
- GitHub Actions: build e testes a cada push.
- README com descrição do projeto, como rodar, lista de endpoints e decisões de design.

## Fluxo de trabalho
1. ANTES de escrever código, gere um Artifact com o plano de implementação e a lista de tarefas (estrutura de pacotes, modelo de dados, endpoints, ordem de execução). Pare e aguarde minha aprovação.
2. Após aprovado, execute em ordem: base do projeto, segurança/JWT, categorias, lançamentos, resumo e relatório, testes, Docker, CI, README.
3. Ao final de cada etapa, escreva: ✅ [o que foi concluído].
4. Verificação final com o agente de navegador: suba via docker-compose, abra o Swagger UI, e confirme o fluxo completo (registrar, logar, criar categoria, lançar receita e despesa, consultar resumo mensal) e que cada regra de negócio retorna o erro esperado.

## Autonomia e limites
- Atue apenas dentro do diretório do projeto.
- Pergunte antes de executar comandos destrutivos no terminal (remover diretórios, derrubar volumes do Docker, force push).
- Se algo estiver ambíguo, assuma a opção mais simples e registre a suposição no README.

## Pronto quando
- docker-compose sobe a API e o banco sem erros.
- Todos os testes passam com `mvn test`.
- As 4 regras de negócio estão cobertas por teste.
- O Swagger UI lista todos os endpoints e o fluxo completo funciona.