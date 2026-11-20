# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Desenvolvedores e usuários finais que precisam de uma API financeira robusta e integrada com dashboard para gestão pessoal e empresarial.

## Product Purpose
Prover uma plataforma e API REST confiável de controle e gestão financeira com autenticação stateless JWT, regras estritas de domínio contábil, categorização de lançamentos, consolidação analítica mensal de receitas/despesas/saldo e geração de relatórios de fechamento em PDF.

## Positioning
Arquitetura backend de engenharia rigorosa desenvolvida com Spring Boot 3 e Java 17, onde todas as regras de negócio e validações contábeis residem na camada de serviço (não no banco), com isolamento estrito de dados multi-tenant por usuário (retornando HTTP 404 em vez de 403 para prevenir vazamento e enumeração de IDs), testes de integração reais via Testcontainers e 100% de cobertura de regras críticas.

## Operating Context
- Backend executado localmente ou em contêineres Docker (`moneta-api` na porta 8081, `finance-db` PostgreSQL 16 na porta 5433).
- Autenticação stateless via cabeçalho `Authorization: Bearer <token>`.
- Integração client-side via endpoints REST JSON padronizados e documentação OpenAPI 3.1.0 interativa (`/swagger-ui.html`).
- Emissão de relatórios analíticos de fechamento mensal via binário PDF renderizado pelo Thymeleaf + OpenHTMLtoPDF.

## Capabilities and Constraints
- **Autenticação:** Login e registro de usuários com geração de tokens JWT seguros.
- **Transações:** Cadastro, consulta e filtro de lançamentos (receitas `INCOME` e despesas `EXPENSE`), com suporte a campos bilíngues (`descricao`/`description`, `valor`/`amount`, `tipo`/`type`, `data`/`date`, `categoriaId`/`categoryId`).
- **Categorias:** Gestão de grupos contábeis com proteção de integridade referencial (bloqueio de exclusão quando vinculada a transações).
- **Consolidação:** Cálculo sob demanda de saldo, total de receitas e total de despesas por competência (ano/mês).
- **Exportação:** Geração de relatórios mensais analíticos formatados em PDF.
- **Restrições de Domínio Estritas:**
  - Valores obrigatoriamente positivos (nunca zero ou negativo → HTTP 400).
  - Despesas não podem ter data futura → HTTP 422.
  - Saldo condicional a histórico de transações existente → HTTP 422.
  - Isolamento entre tenants por usuário → HTTP 404.
  - Bloqueio de exclusão de categoria em uso → HTTP 409.
  - Falha de token tratado com payload JSON descritivo → HTTP 401.

## Brand Commitments
- Nome: **Moneta**
- Identidade: Engenharia de software moderna, confiabilidade transacional, transparência técnica e alta qualidade de código.

## Evidence on Hand
- 90 testes unitários e de integração automatizados em 18 suítes passando com 100% de sucesso (`./mvnw -B verify`).
- 11 migrations versionadas com Flyway (`V1` a `V11`).
- Dockerfile multi-stage e `docker-compose.yml` orquestrando API e PostgreSQL.
- Documentação interativa Swagger UI ativa e testada.

## Product Principles
1. **Integridade de Domínio em Primeiro Lugar:** Toda regra de negócio é validada explicitamente na camada de serviço, garantindo coerência contábil antes de qualquer persistência.
2. **Segurança por Padrão (Secure by Design):** Isolamento total entre usuários; tentativas de acesso a dados alheios nunca confirmam a existência de identificadores (HTTP 404).
3. **Auditabilidade e Relatórios Reais:** Dados financeiros devem ser facilmente inspecionáveis e exportáveis em formatos analíticos universais (PDF padronizado).
4. **Resiliência e Testabilidade:** Toda alteração de contrato ou regra é coberta por testes de integração automatizados com banco de dados real via Testcontainers.
