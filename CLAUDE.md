# Moneta — Arquitetura, API REST & Dashboard

## 1. Visão Geral do Projeto
- **Nome:** Moneta
- **Propósito:** Plataforma fullstack de controle e gestão financeira composta por uma **API REST em Spring Boot 3.5** (JWT stateless, regras estritas de domínio, isolamento multi-tenant por usuário, consolidação analítica mensal e geração de relatórios em PDF) e um **dashboard corporativo em Next.js 16** com proxy **BFF zero-token**.
- **Stack:**
  - **Linguagem:** Java 17 LTS (Back-end) e TypeScript / React 19 (Front-end)
  - **Framework Back-end:** Spring Boot `3.5.16`
  - **Framework Front-end / BFF:** Next.js `16.4.6` (App Router + `/bff/*`), Tailwind CSS v4, TanStack Query v5, Recharts
  - **Segurança:** Spring Security com JWT Stateless (`io.jsonwebtoken:jjwt:0.12.7`), header compartilhado obrigatório `X-BFF-Secret` em `prod` (`BffSecretFilter`), bloqueio de escrita demo na API (`DemoReadOnlyFilter`) e desabilitação de cadastro público em `prod`
  - **Persistência:** Spring Data JPA / Hibernate (`spring.jpa.open-in-view=false`), PostgreSQL 16
  - **Migrations:** Flyway (**11 migrations**, `V1` a `V11`, incluindo índices `INCLUDE` e schema de contas/orçamentos/previsões/notificações/relatórios)
  - **Relatórios:** Thymeleaf + OpenHTMLtoPDF (`io.github.openhtmltopdf:openhtmltopdf-pdfbox:1.1.7`)
  - **Testes:** JUnit 5, Mockito, Spring Boot Test, Testcontainers (`1.21.4`) PostgreSQL 16 + Playwright E2E
  - **Containerização:** Docker & Docker Compose (`moneta-api` `:8081` em `127.0.0.1`, `finance-db` `:5433` em `127.0.0.1`)
  - **Documentação API:** SpringDoc OpenAPI 3 / Swagger UI (`/swagger-ui.html`, desativado no perfil `prod`)

---

## 2. Controllers e Contratos da API (12 controllers)

1. **Autenticação (`/api/auth`):**
   - `POST /api/auth/login` — Retorna `{ "accessToken": "string", "tokenType": "Bearer", "expiresInSeconds": ..., "user": { ... } }`
   - `POST /api/auth/register` — Cadastra usuário (`201`). **Desabilitado no perfil `prod`** (`REGISTRATION_ENABLED=false` → `403 Forbidden`).
   - `POST /api/auth/logout` — Encerramento lógico de sessão stateless.

2. **Transações (`/api/transactions`, protegido por Bearer JWT):**
   - `GET /api/transactions` — Listagem paginada (header `X-Total-Count`) com filtros (`startDate`, `endDate`, `categoryId`, `type`, `q`).
   - `GET /api/transactions/{id}`, `POST /api/transactions`, `PUT /api/transactions/{id}`, `DELETE /api/transactions/{id}`.
   - Suporta campos em português ou inglês (`descricao`/`description`, `valor`/`amount`, `tipo`/`type`, `data`/`date`, `categoriaId`/`categoryId`).

3. **Categorias (`/api/categories`, protegido por Bearer JWT):**
   - `GET /api/categories`, `GET /api/categories/{id}`, `POST /api/categories`, `PUT /api/categories/{id}`, `DELETE /api/categories/{id}`.

4. **Contas, Contatos & Compromissos (`/api/accounts`, `/api/contacts`, protegido por Bearer JWT):**
   - `GET /api/accounts`, `GET /api/accounts/summary`, `GET /api/accounts/{id}`, `POST /api/accounts`, `PUT /api/accounts/{id}`, `DELETE /api/accounts/{id}`.
   - `GET/POST/PUT/DELETE /api/accounts/{id}/appointments` e `PUT /api/contacts/{id}`.

5. **Orçamentos por Centro de Custo (`/api/budget`, protegido por Bearer JWT):**
   - `GET /api/budget`, `PUT /api/budget/{categoryId}` (definição/atualização de teto mensal e acompanhamento realizado vs teto).

6. **Previsões & Riscos (`/api/forecast`, protegido por Bearer JWT):**
   - `GET /api/forecast`, `POST /api/forecast/risks`, `GET /api/forecast/mitigation/{riskKey}`, `PUT /api/forecast/mitigation/{riskKey}`.

7. **Resumo Mensal & PDF Mensal (`/api`, protegido por Bearer JWT):**
   - `GET /api/summary/reference-period`
   - `GET /api/summary/monthly?year=YYYY&month=MM`
   - `GET /api/reports/categories?year=YYYY&month=MM`
   - `GET /api/reports/monthly/pdf?year=YYYY&month=MM` (`application/pdf` via Thymeleaf + OpenHTMLtoPDF).

8. **Relatórios Executivos & Perfil (`/api/reports`, protegido por Bearer JWT):**
   - `GET /api/reports/dashboard`, `GET /api/reports/profile`, `PUT /api/reports/profile`, `POST /api/reports/profile/logo` (PNG/JPG até 1 MB; SVG bloqueado), `GET /api/reports/history`, `POST /api/reports/generate`, `GET /api/reports/{id}/download`.

9. **Notificações (`/api/notifications`, protegido por Bearer JWT):**
   - `GET /api/notifications`, `GET /api/notifications/unread-count`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all`, `GET /api/notifications/preferences`, `PUT /api/notifications/preferences`.

10. **Busca Global & Usuário (`/api/search`, `/api/users`, protegido por Bearer JWT):**
    - `GET /api/search`, `GET /api/users/me`.

---

## 3. Regras de Negócio, Segurança e Códigos HTTP
- **RULE 01:** Valor de transação nunca pode ser zero ou negativo (`BigDecimal`, `NUMERIC(19,2)`, `CHECK (amount > 0)`) → `400 Bad Request`.
- **RULE 02:** Despesa (`EXPENSE`) não pode ser lançada com data futura (via `java.time.Clock` injetável) → `422 Unprocessable Entity`.
- **RULE 03:** Isolamento multi-tenant (`findByIdAndUserId`): acesso a recurso de outro usuário retorna `404 Not Found` (não `403`, para evitar enumeração de IDs).
- **RULE 04:** Saldo condicional: se o usuário não possuir lançamentos no histórico → `422 Unprocessable Entity`.
- **RULE 05:** Integridade referencial: categoria com lançamentos vinculados não pode ser excluída → `409 Conflict`.
- **RULE 06:** Token ausente ou expirado retorna `401 Unauthorized` com payload `ApiError` JSON padronizado.
- **Blindagem de Produção (`prod`):**
  - `BffSecretFilter` exige `X-BFF-Secret` (>= 32 chars) em `/api/**` (aborta a subida em `prod` se ausente).
  - `AuthController` bloqueia `POST /api/auth/register` (`403`) quando `app.security.registration-enabled=false`.
  - `DemoReadOnlyFilter` bloqueia mutações (`POST`/`PUT`/`PATCH`/`DELETE`, exceto login/logout) da conta `DEMO_USER_EMAIL` direto na API com `403 DEMO_READ_ONLY`.

---

## 4. Comandos, Variáveis e Testes

- **Executar todos os testes Java e empacotar (17 suítes executáveis / 90 testes com Testcontainers Postgres 16):**
  ```powershell
  .\mvnw.cmd -B verify
  ```

- **Validar e compilar o dashboard (`moneta-dashboard/`):**
  ```powershell
  cd moneta-dashboard
  npm run lint
  npm run build
  ```

- **Subir os containers locais (Docker Compose):**
  ```powershell
  cp .env.example .env
  # Defina POSTGRES_PASSWORD e JWT_SECRET no .env (nunca versione .env)
  docker compose up -d --build
  ```
  - API REST: `http://127.0.0.1:8081` (Swagger UI no perfil `default`: `http://127.0.0.1:8081/swagger-ui.html`)
  - PostgreSQL: `127.0.0.1:5433` (credenciais via `.env`: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`)
