# BACKEND-PADROES.md — Padrões e Convenções da API REST

> **Objetivo:** Guia normativo da arquitetura e convenções da API Spring Boot 3 para implementação e extensão de funcionalidades de ponta a ponta sem desvios de padrão.

---

## 1. Stack Tecnológica
* **Linguagem:** Java 17 (LTS) — uso obrigatório de `record` para DTOs imutáveis.
* **Framework:** Spring Boot 3.5 (Spring MVC, Spring Data JPA, Spring Security 6).
* **Banco de Dados:** PostgreSQL 16 (porta dev 5433 / produção 5432).
* **Migrations:** Flyway (`src/main/resources/db/migration/V{N}__{descricao}.sql`).
* **Segurança:** Autenticação Stateless via JWT (JJWT 0.12) com HMAC-SHA256 e BCrypt.
* **Validação:** Bean Validation (`jakarta.validation.constraints.*`) com Hibernate Validator.
* **Documentação:** Springdoc OpenAPI 2.8 (`/swagger-ui.html` e `/v3/api-docs`).
* **Testes:** JUnit 5, Mockito, AssertJ, MockMvc e Testcontainers.

---

## 2. Estrutura de Pacotes e Responsabilidade por Camada
A aplicação adota organização **Package-by-Feature** sob `com.portfolio.finance`:
* `auth`: Registro, login, geração de JWT e credenciais.
* `category`: CRUD e regras de negócio de categorias financeiras.
* `transaction`: Entidade `Transaction`, repositório JPA, service com regras monetárias e controller REST.
* `summary`: Agregações mensais (receitas, despesas, saldo).
* `report`: Relatórios analíticos por categoria e exportação PDF via Thymeleaf.
* `user`: Entidade `User` e repositório.
* `security`: Filtro JWT (`JwtAuthenticationFilter`), token provider e `AuthenticatedUser`.
* `exception`: Formato padrão `ApiError` e interceptador `@RestControllerAdvice` (`GlobalExceptionHandler`).
* `config`: Configurações de CORS, beans de `Clock` e OpenAPI.

---

## 3. Convenções de Nomes, Rotas e Verbos HTTP
* **Rotas:** Substantivos no plural minúsculo: `/api/transactions`, `/api/categories`, `/api/summary/monthly`.
* **Verbos e Status HTTP:**
  * `GET /api/recurso`: `200 OK` (lista ou objeto).
  * `POST /api/recurso`: `201 Created` com header `Location`.
  * `PUT /api/recurso/{id}`: `200 OK` com o DTO atualizado.
  * `DELETE /api/recurso/{id}`: `204 No Content`.
* **Erros:**
  * `400 Bad Request`: Falha de validação ou payload malformado.
  * `401 Unauthorized`: Token ausente ou inválido.
  * `404 Not Found`: Recurso inexistente **ou pertencente a outro usuário** (isolamento de segurança).
  * `409 Conflict`: Violação de chave única ou exclusão de categoria com registros vinculados.
  * `422 Unprocessable Entity`: Violação de regra de negócio (ex.: despesa com data futura, saldo sem histórico).

---

## 4. DTOs, Mapeamento e Validação
* **Records Imutáveis:** DTOs são modelados exclusivamente como `public record XxxRequest(...)` e `public record XxxResponse(...)`.
* **Método Factory:** Todo DTO de resposta possui `public static XxxResponse from(Entity e)`. Entidades JPA nunca são expostas no Controller.
* **Anotações de Validação:** `@NotBlank`, `@NotNull`, `@Positive`, `@Size(max = ...)`.
* **Formato Único de Erro:**
  ```json
  {
    "timestamp": "2026-10-10T15:48:43.127Z",
    "status": 400,
    "error": "Bad Request",
    "message": "Mensagem descritiva amigável",
    "path": "/api/transactions",
    "fieldErrors": [
      { "field": "amount", "message": "O valor deve ser estritamente positivo" }
    ]
  }
  ```

---

## 5. Segurança e Isolamento por Usuário
* **Injeção do Usuário:** Parâmetro `@AuthenticationPrincipal AuthenticatedUser user` em todos os métodos protegidos do Controller.
* **Regra Anti-Enumeração:** Consultas, atualizações e deleções filtram obrigatoriamente por `id` E `userId`. Se o ID existir mas pertencer a outro usuário, a resposta DEVE ser `404 Not Found` (nunca `403`), para não confirmar a existência do registro para invasores.

---

## 6. Banco de Dados e Migrations
* **Ferramenta:** Flyway.
* **Convenção de Arquivo:** `src/main/resources/db/migration/V{numero}__{descricao_em_snake_case}.sql`.
* **Regra Absoluta:** NUNCA editar migrations existentes (`V1__init.sql` permanece intocada). Novas colunas ou tabelas entram em `V2`, `V3`, etc.
* **Convenção de Nomes:** Tabelas no plural minúsculo (`transactions`), colunas em snake_case (`payment_method`, `user_id`), chaves estrangeiras com prefixo `fk_` e constraints com `ck_`.

---

## 7. Testes Automatizados
* **Testes Unitários:** Foco em serviços e validações de domínio isoladas (`TransactionServiceTest`).
* **Testes de Integração:** Usam `MockMvc` com contexto real do Spring Security (`UserIsolationIntegrationTest`).
* **Como executar:**
  ```powershell
  .\mvnw.cmd test
  ```

---

## 8. Como Subir o Ambiente em Desenvolvimento
* **PostgreSQL:** `docker compose up -d postgres` (escuta na porta 5433).
* **API:** `.\mvnw.cmd spring-boot:run` ou `docker compose up -d api` (porta 8081).
* **Swagger:** `http://localhost:8081/swagger-ui.html`.

---

## 9. Funcionalidade de Referência para Copiar
* **Módulo:** `com.portfolio.finance.transaction`
  * Entity: `Transaction.java`
  * DTOs: `dto/TransactionRequest.java` e `dto/TransactionResponse.java`
  * Controller: `TransactionController.java`
  * Service: `TransactionService.java`
  * Repository: `TransactionRepository.java`

---

## 10. Regras de Ouro (Backend)
1. **Nunca quebre o isolamento:** Todo SELECT/UPDATE/DELETE de dados sensíveis deve ter `WHERE user_id = :userId`.
2. **DTOs são records com `.from(entity)`:** Nunca retorne entidades do Hibernate para o cliente REST.
3. **Erros passam pelo `GlobalExceptionHandler`:** Use exceções customizadas (`ResourceNotFoundException`, `BusinessException`, `ConflictException`).
4. **Novas colunas via Flyway:** Sempre crie o próximo arquivo versionado (`V2__...`).
5. **Teste o fluxo real:** Antes de conectar ao front-end, execute a chamada real com curl/PowerShell e valide o retorno HTTP 200/201.
