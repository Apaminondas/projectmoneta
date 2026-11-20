# Guia de Deploy — Moneta

Este documento descreve como publicar o **Moneta** (`moneta-api` + `moneta-dashboard` + PostgreSQL 16) em produção com segurança, sem exposição de credenciais e com plano de reversão (*rollback*).

---

## 1. Arquitetura de publicação

```text
Navegador (Zero JWT / Zero Cookie)
   │  HTTPS (Mesma origem /bff/*)
   ▼
moneta-dashboard (Next.js 16 SSR + BFF)
   │  HTTPS / Rede privada + X-BFF-Secret + Bearer JWT (apenas RAM do servidor)
   ▼
moneta-api (Java 17 / Spring Boot 3.5 — perfil prod: register off + demo readonly)
   │  JDBC + Flyway (11 migrations)
   ▼
PostgreSQL 16
```

- **Sem login no navegador:** o usuário navega em modo público de demonstração; toda autenticação JWT com a API ocorre somente no servidor BFF (`moneta-dashboard/lib/server/demo-session.ts`).
- **Banco de demonstração:** utilize apenas dados fictícios (ex.: `db/demo/01_seed_demo_company.sql`), mantendo `DEMO_MODE=readonly` na publicação pública para evitar alterações persistentes por visitantes.

---

## 2. Pré-requisitos

- **Back-end:** Java 17+, Maven Wrapper (`./mvnw`) ou Docker.
- **Front-end:** Node.js 20 LTS (ou 22 LTS) e npm 10+.
- **Banco de dados:** PostgreSQL 16.
- **Segredos gerados com entropia forte:** `POSTGRES_PASSWORD`, `JWT_SECRET` (mínimo 32 caracteres), `BFF_SHARED_SECRET` (mínimo 32 caracteres compartilhado entre BFF e API) e senha do usuário de demonstração (`DEMO_PASSWORD`, obrigatoriamente diferente da senha `Demo#2026` da seed local). Nunca reutilize senhas locais em produção.

---

## 3. Variáveis de ambiente (somente nomes)

> Nunca versione arquivos `.env` ou `.env.local` no repositório. Configure todas as variáveis diretamente no painel da plataforma ou no gerenciador de segredos do servidor.

### Back-end (`moneta-api`)

| Variável | Obrigatória | Descrição / Observação |
|---|---|---|
| `DB_URL` | Sim | String JDBC do PostgreSQL (`jdbc:postgresql://<host>:<porta>/<db>?sslmode=require`) |
| `DB_USERNAME` | Sim | Usuário do banco PostgreSQL |
| `DB_PASSWORD` | Sim | Senha do banco PostgreSQL |
| `JWT_SECRET` | Sim | Chave HMAC HS256 com no mínimo 32 caracteres (`openssl rand -base64 48`) |
| `JWT_EXPIRATION_MS` | Não | Expiração do JWT em milissegundos (padrão `3600000` = 1h) |
| `SPRING_PROFILES_ACTIVE` | Sim (`prod`) | Em produção use `prod` (exige `BFF_SHARED_SECRET`, desativa `/api/auth/register` e Swagger/OpenAPI, ativa `demo.read-only` na API e oculta detalhes do Actuator) |
| `BFF_SHARED_SECRET` | Sim (em `prod`) | Segredo compartilhado (>= 32 chars, `openssl rand -base64 48`) validado no header `X-BFF-Secret`; a API aborta a subida em `prod` se ausente ou menor que 32 caracteres |
| `REGISTRATION_ENABLED` | Não (padrão `false` em `prod`) | Controla `POST /api/auth/register`; mantenha `false` em demonstrações públicas (`403 Forbidden`) |
| `DEMO_API_READ_ONLY` | Não (padrão `true` em `prod`) | Quando `true`, bloqueia na própria API (`403 DEMO_READ_ONLY`) escritas (`POST`/`PUT`/`PATCH`/`DELETE`) da conta `DEMO_USER_EMAIL` |
| `DEMO_USER_EMAIL` | Sim se customizado | E-mail da conta demo sujeita ao `DemoReadOnlyFilter` (padrão `empresa.demo@example.test`; deve coincidir com `DEMO_EMAIL` do BFF) |
| `CORS_ALLOWED_ORIGINS` | Sim | Lista separada por vírgula com a URL pública exata do front-end (ex.: `https://moneta.seudominio.com`). Não usar `*`. |
| `PORT` | Não | Porta HTTP do Spring Boot (padrão `8080`, ajustada automaticamente por plataformas PaaS) |

### Front-end + BFF (`moneta-dashboard`)

| Variável | Obrigatória | Descrição / Observação |
|---|---|---|
| `BACKEND_URL` | Sim | Origem da API Spring Boot acessível pelo servidor BFF (sem barra no final; preferencialmente HTTPS ou rede privada) |
| `BFF_SHARED_SECRET` | Sim (em `prod`) | Mesmo segredo (>= 32 chars) configurado na API; enviado somente do servidor BFF no header `X-BFF-Secret` (nunca use prefixo `NEXT_PUBLIC_`) |
| `DEMO_EMAIL` | Sim | E-mail do usuário sintético da conta de demonstração (somente servidor; não use prefixo `NEXT_PUBLIC_`) |
| `DEMO_PASSWORD` | Sim | Senha do usuário sintético da conta de demonstração em produção (somente servidor; deve corresponder ao hash atualizado no banco de produção) |
| `DEMO_MODE` | Sim | Use `readonly` em demonstração pública para bloquear `POST`/`PUT`/`DELETE` no BFF (`403 DEMO_READ_ONLY`) |
| `TRUST_PROXY` | Recomendado | `true` atrás de Vercel/Render/Railway/Nginx/Cloudflare para leitura de IP real no rate limit; `false` se exposto direto |

---

## 4. Comandos de build e execução

### Validação completa local antes de publicar

```bash
# 1. Back-end: testes unitários e de integração + pacote JAR
./mvnw -B verify

# 2. Front-end: instalação limpa, lint e build de produção
cd moneta-dashboard
npm ci
npm run lint
npm run build
npm run start
```

### Containers Docker (API + PostgreSQL + Dashboard opcional)

```bash
cp .env.example .env
# Preencha POSTGRES_PASSWORD, JWT_SECRET e CORS_ALLOWED_ORIGINS no .env
docker compose up -d --build

# Para subir também o moneta-dashboard em container (VPS fullstack):
# Defina DEMO_EMAIL, DEMO_PASSWORD e BFF_SHARED_SECRET no .env e execute:
docker compose --profile fullstack up -d --build
```

Para executar a API com perfil de produção em container isolado:

```bash
docker build -t moneta-api:latest .
docker run -d -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_URL=... -e DB_USERNAME=... -e DB_PASSWORD=... \
  -e JWT_SECRET=... -e BFF_SHARED_SECRET=... \
  -e DEMO_USER_EMAIL=empresa.demo@example.test \
  -e CORS_ALLOWED_ORIGINS=https://seu-front.com \
  moneta-api:latest
```

---

## 5. Plataformas recomendadas (limites verificados em novembro/2026)

Como o **Moneta** combina **Next.js 16 com BFF/SSR server-side** (`/bff/*`), **API Java/Spring Boot em Docker** e **PostgreSQL 16**, há duas arquiteturas recomendadas conforme seu orçamento:

### Opção A — Split Cloud (custo zero inicial para portfólio não comercial)

1. **Front-end (`moneta-dashboard`) → Vercel (Hobby Plan — US$ 0/mês)**
   - **Limites atuais verificados:** até 1.000.000 invocações de função/mês, 4 CPU-horas/mês, 360 GB-horas de memória, 100 GB de transferência/mês, timeout máximo de 300s (single-region `iad1`), build máximo de 45 min.
   - **Atenção:** o plano Hobby é estritamente para **uso pessoal e não comercial**; se o limite mensal for atingido, o projeto é pausado até o ciclo seguinte. Configure o *Root Directory* do projeto como `moneta-dashboard`.
2. **Back-end (`moneta-api` Docker) + PostgreSQL 16 → Render ou Railway**
   - **Render (Blueprint pronto em [`render.yaml`](render.yaml)):**
     - Web Service Free (US$ 0/mês): 512 MB RAM, ~0,1 CPU, **hiberna após 15 min sem tráfego** (*cold start* de 30–60s; para JVM caber em 512 MB, defina `JAVA_TOOL_OPTIONS=-Xmx320m -Xms128m`).
     - **Atenção ao Postgres gratuito do Render:** 256 MB RAM / 1 GB disco, mas **expira e é apagado em 30 dias**. Para manter o banco sem expiração, use **Starter Web Service (US$ 7/mês)** + **Postgres Basic (US$ 6/mês)** ou um banco Postgres externo sem expiração de 30 dias.
   - **Railway:**
     - Plano Trial: crédito único de US$ 5 para testes (até 2 vCPU / 1 GB RAM por serviço). Plano Free inclui US$ 1/mês de crédito (limite 0,5 GB RAM / 1 vCPU, sem domínio customizado — insuficiente para Java + Postgres 24/7).
     - Plano Hobby (piso mínimo de **US$ 5/mês**, com US$ 5 de crédito incluídos; cobrança por uso: ~US$ 10/GB RAM/mês, ~US$ 20/vCPU/mês, ~US$ 0,15/GB disco/mês): API + Postgres leve costumam fechar entre **US$ 8–12/mês**, sem hibernação e sem exclusão em 30 dias.

### Opção B — VPS única com Docker Compose (melhor custo-benefício contínuo)

- Ideal para portfólio sempre ligado, sem *cold start* nem expiração de banco (ex.: VPS com 2 vCPU / 2–4 GB RAM rodando `postgres:16-alpine`, `moneta-api` e `moneta-dashboard` atrás de Caddy ou Nginx com TLS automático Let's Encrypt).
- **Por quê:** garante zero expiração do PostgreSQL, latência mínima em `127.0.0.1` entre BFF e API e compatibilidade direta com [`docker-compose.yml`](docker-compose.yml) (`--profile fullstack`) + [`moneta-dashboard/Dockerfile`](moneta-dashboard/Dockerfile).

---

## 6. Domínio, DNS e incorporação em portfólio

- **HTTPS obrigatório:** todas as plataformas PaaS (Vercel, Render, Railway) emitem certificado TLS gerenciado automaticamente ao apontar registros `CNAME` / `A`.
- **Incorporação no site de portfólio:**
  - **Link direto ou subdomínio (recomendado):** ex. `moneta.seudominio.com` via `CNAME`. Mantém `X-Frame-Options: DENY` e `frame-ancestors 'none'` em [`moneta-dashboard/next.config.mjs`](moneta-dashboard/next.config.mjs) contra *clickjacking*.
  - **Iframe dentro do portfólio:** só habilite se necessário, alterando `frame-ancestors 'none'` para `frame-ancestors 'self' https://seu-portfolio.com` em `next.config.mjs`.
- **Degradação graciosa se a API cair:** se a API ou o banco estiverem fora do ar (ou durante *cold start*), o `/bff/health` responde `503` e a Visão Geral exibe banner amigável (*"Demonstração temporariamente indisponível — não foi possível conectar à API do Moneta"*), sem expor stack traces nem deixar tela em branco.

---

## 7. Healthcheck e monitoramento

- **API Spring Boot (`/actuator/health`):** com `SPRING_PROFILES_ACTIVE=prod`, responde `200 OK` (`{"status":"UP"}`) sem expor detalhes internos (`show-details: never`). Use `/actuator/health` como *Health Check Path* no Render/Railway/VPS.
- **Front-end / BFF (`/bff/health`):** verifica conectividade com `${BACKEND_URL}/actuator/health` e retorna `200 {"ok":true}` ou `503 {"ok":false}` com `Cache-Control: no-store`.
- **Swagger / OpenAPI:** desativado por padrão no perfil `prod` (`springdoc.api-docs.enabled: false`).

---

## 8. Procedimento pós-deploy e rollback

1. Subir o banco PostgreSQL 16 e garantir que as 11 migrations Flyway (`V1`..`V11`) concluíram nos logs da API.
2. Aplicar o seed de demonstração (`db/demo/01_seed_demo_company.sql`) e validar com `db/demo/03_verify_demo_company.sql`.
3. **Alinhar a senha de produção do usuário demo (`DEMO_PASSWORD` vs `users.password_hash`):**
   - Nunca mantenha a senha pública `Demo#2026` do script de seed local no banco de produção.
   - Gere uma senha aleatória forte (ex.: `openssl rand -base64 24`), gere o respectivo hash BCrypt (`$2a$10$...` / `$2b$10$...`) e atualize o registro no PostgreSQL:
     ```bash
     # Exemplo gerando hash BCrypt via Python (custo 10, compatível com Spring Security BCryptPasswordEncoder):
     python3 -c 'import bcrypt, getpass; pw = getpass.getpass("Nova DEMO_PASSWORD: "); print(bcrypt.hashpw(pw.encode(), bcrypt.gensalt(10)).decode())'
     ```
     ```sql
     UPDATE users
        SET password_hash = '<HASH_BCRYPT_GERADO>'
      WHERE LOWER(email) = LOWER('<DEMO_EMAIL>');
     ```
4. Definir `DEMO_EMAIL`, a nova `DEMO_PASSWORD`, `BFF_SHARED_SECRET` (idêntico ao da API) e `DEMO_MODE=readonly` no `moneta-dashboard`. Confirme também que `DEMO_USER_EMAIL` na API corresponde exatamente ao `DEMO_EMAIL` do BFF.
5. Validar as defesas em produção:
   - `GET https://<front>/bff/health` retorna `200 {"ok":true}`.
   - Chamada direta à URL da API sem `X-BFF-Secret` (`GET https://<api>/api/categories`) retorna `403`.
   - `POST /api/auth/register` mesmo com `X-BFF-Secret` retorna `403`.
   - No dashboard, navegar sem erros de console e confirmar `403 DEMO_READ_ONLY` ao tentar qualquer escrita.

### Rollback
- **Vercel / Render / Railway:** reverter para o deployment/imagem anterior em 1 clique no painel (*Instant Rollback*) enquanto investiga logs.
- **Docker / VPS:** manter tag da versão anterior da imagem (`moneta-api:<tag-anterior>`) e fazer backup lógico (`pg_dump`) antes de aplicar novas migrations. Caso uma nova migration futura precise de reversão, execute script corretivo versionado em nova migration Flyway — nunca edite migrations já aplicadas em produção.

