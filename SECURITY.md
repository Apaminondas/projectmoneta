# Política e Arquitetura de Segurança — Moneta

Este documento descreve os controles reais implementados no código do projeto **Moneta** (Dashboard Next.js 16 + BFF e API REST Spring Boot 3), seu modelo de ameaça e suas limitações conhecidas.

## 1. Modelo de Ameaça

**O que esta arquitetura protege:**
- **Zero segredos ou tokens no navegador:** O cliente nunca recebe `accessToken`, credenciais da conta de serviço, `BFF_SHARED_SECRET` nem a URL interna da API (`BACKEND_URL`). Não há uso de `localStorage`, `sessionStorage`, `IndexedDB` ou cookies de sessão no navegador.
- **Autenticação interna entre BFF e API em produção:** No perfil `prod`, `BffSecretFilter` exige o header `X-BFF-Secret` (comparado em tempo constante via `MessageDigest.isEqual`, mínimo 32 caracteres) nas rotas `/api/**`, impedindo chamadas diretas externas que contornem o BFF.
- **Integridade da demonstração pública (`readonly`) em duas camadas:** Visitantes anônimos navegam por todas as telas e relatórios em tempo real, mas qualquer tentativa de mutação (`POST`/`PUT`/`PATCH`/`DELETE`) é bloqueada no BFF **e também na própria API** (`DemoReadOnlyFilter` em `prod` quando `DEMO_API_READ_ONLY=true` para `DEMO_USER_EMAIL`) com `403 DEMO_READ_ONLY`.
- **Cadastro público desabilitado em produção:** No perfil `prod` (`REGISTRATION_ENABLED=false`), `POST /api/auth/register` responde `403 Forbidden`.
- **Prevenção de SSRF e Path Traversal:** O proxy BFF valida caminhos brutos e aplica allowlist estrita de recursos `/api/*`.
- **Isolamento multi-tenant na API:** Recursos de outro usuário retornam `404 Not Found` (evitando enumeração de IDs).

**O que esta arquitetura NÃO protege:**
- **Isolamento entre visitantes no modo `sandbox`:** Como a demonstração utiliza uma única conta de serviço no servidor, ativar `DEMO_MODE=sandbox` em ambiente público permite que visitantes editem os mesmos dados sintéticos.
- **DDoS distribuído em múltiplas réplicas:** O rate limit do BFF opera na memória do processo Node.js e não substitui WAF/CDN em borda.

## 2. Arquitetura de Rede e Confiança

```text
+-------------------+        HTTPS / Mesma Origem (/bff/*)        +---------------------------+
|     Navegador     | ------------------------------------------> |   Next.js 16 App + BFF    |
| (Zero JWT/Cookie) | <------------------------------------------ | (lib/server/demo-session) |
+-------------------+      JSON filtrado / PDF + Headers CSP      +-------------+-------------+
                                                                                |
                              Local: 127.0.0.1 | Prod: HTTPS ou Rede Privada    | X-BFF-Secret + Bearer JWT
                              (Em prod: chamadas sem X-BFF-Secret recebem 403)  v
+-------------------+              JDBC (rede privada/docker)     +---------------------------+
|   PostgreSQL 16   | <------------------------------------------ |  API Spring Boot 3 (JWT)  |
|  (local :5433)    |                                             |  (local 127.0.0.1:8081)   |
+-------------------+                                             +---------------------------+
```

## 3. Controles Implementados

| Controle | Onde está | Por quê |
| :--- | :--- | :--- |
| Segredo compartilhado BFF → API (`X-BFF-Secret`) | `BffSecretFilter.java`, `application-prod.yml`, `demo-session.ts`, `app/bff/**` | No perfil `prod` (`bff-secret-required=true`), falha na inicialização se `BFF_SHARED_SECRET < 32` chars e bloqueia (`403`) qualquer chamada a `/api/**` sem o header válido, mesmo que a API esteja em URL pública (PaaS). |
| Bloqueio de cadastro e escrita demo na própria API | `AuthController.java`, `DemoReadOnlyFilter.java`, `application-prod.yml` | Em `prod`, desabilita `POST /api/auth/register` (`403`) e bloqueia `POST`/`PUT`/`PATCH`/`DELETE` da conta `DEMO_USER_EMAIL` direto na API (`403 DEMO_READ_ONLY`), impedindo contorno caso alguém obtenha um JWT. |
| JWT stateless e isolamento por usuário (`404`) | `SecurityConfig.java`, `JwtService.java` e `*Service.java` (`findByIdAndUserId`) | Garante autenticação HMAC-SHA256 e impede acesso ou enumeração de registros de outros usuários. |
| Sessão de serviço no BFF sem token no cliente | `moneta-dashboard/lib/server/demo-session.ts` | Autentica no servidor com `single-flight`, guarda o JWT apenas em memória RAM, renova 60s antes de `exp` e repete 1x em `401`. |
| Allowlist `api/*` e anti-traversal / anti-SSRF | `moneta-dashboard/app/bff/[...path]/route.ts` | Rejeita `..`, `//`, `\`, `%2e`, `%2f`, `%5c` e caminhos fora dos 11 recursos `api/*` (bloqueando `/actuator/*` e `/api/auth/*`). |
| Modo `readonly` (padrão) e `sandbox` | `demo-session.ts`, `app/bff/[...path]/route.ts`, `app/bff/demo/route.ts` | Bloqueia mutações no modo público (`403 DEMO_READ_ONLY`) sem acionar o backend e exibe aviso via toast na UI. |
| Limites de taxa, tamanho (64 KB) e timeout | `demo-session.ts` e `app/bff/[...path]/route.ts` | Janela deslizante (300 req/min geral, 60 req/min relatórios/PDF, 30 req/min escrita), `413` acima de 64 KB e timeout 10s (30s PDF → `504`). |
| Proteção CSRF (`Origin` e `Sec-Fetch-Site`) | `app/bff/[...path]/route.ts`, `app/bff/demo/route.ts`, `app/bff/health/route.ts` | Rejeita qualquer requisição com `Sec-Fetch-Site: cross-site` (`403`) e exige `Origin` igual ao host em métodos de escrita. |
| CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS | `moneta-dashboard/next.config.mjs` | Mitiga XSS, clickjacking (`frame-ancestors 'none'`), MIME sniffing e força HTTPS em produção (`max-age=31536000`), sem `X-Powered-By` nem source maps. |
| CORS restrito por variável de ambiente | `SecurityConfig.java` e `application.yml` (`CORS_ALLOWED_ORIGINS`) | Elimina wildcard `*` na API; por padrão nenhuma origem externa de navegador é aceita diretamente. |
| Exposição mínima do Actuator | `src/main/resources/application.yml` e `application-prod.yml` | Expõe apenas `health` (com `show-details: never` em `prod`), mantendo `env`, `heapdump` e `beans` desativados. |
| Segredos obrigatórios no Docker Compose | `docker-compose.yml` e `.env.example` | Usa `${JWT_SECRET:?...}` e `${POSTGRES_PASSWORD:?...}` para abortar a subida caso os segredos não estejam definidos. |
| Portas publicadas apenas em loopback | `docker-compose.yml` | Publica `127.0.0.1:5433:5432` e `127.0.0.1:8081:8080`, impedindo exposição direta na rede local/pública. |
| Swagger / OpenAPI desativado em produção | `src/main/resources/application-prod.yml` | Define `springdoc.api-docs.enabled=false` e `springdoc.swagger-ui.enabled=false` no perfil `prod`. |

## 4. Limitações Conhecidas

1. **Demonstração compartilhada:** Todos os visitantes consomem os dados da mesma conta demo através do token de serviço do BFF.
2. **Rate limit em memória ("melhor esforço"):** O mapa de janela deslizante fica na memória do processo Node.js; múltiplas instâncias serverless não compartilham contadores (recomenda-se WAF/CDN em produção).
3. **Sem rate limit nativo por IP no `/api/auth/login` da API:** A API não mantém contador por IP em memória; em produção o acesso à rota é protegido pelo header compartilhado obrigatório `X-BFF-Secret` (`BffSecretFilter`) somado ao `single-flight` e rate limit em janela deslizante do BFF (e, em ambiente local Docker, adicionalmente pelo bind em loopback `127.0.0.1`).
4. **Sem rotação automática de segredos:** A troca de `JWT_SECRET`, `BFF_SHARED_SECRET` ou `POSTGRES_PASSWORD` requer atualização manual de variáveis e reinício dos serviços.
5. **Histórico e credenciais da seed demo:** O script de seed (`db/demo/01_seed_demo_company.sql`) e documentos de exemplo usam a credencial sintética local (`Demo#2026`). **Em produção, altere obrigatoriamente o hash BCrypt em `users.password_hash` para uma senha gerada exclusivamente para produção (`DEMO_PASSWORD`), diferente da senha da seed local** (ver [`DEPLOY.md`](DEPLOY.md)). Commits anteriores tiveram artefatos de teste (`playwright-report/` e `test-results/`) removidos do índice (`git rm --cached`) e ignorados.

## 5. Como Executar Localmente em Modo `sandbox`

Para testar criação, edição e exclusão no dashboard local:
1. Em `moneta-dashboard/.env.local`, altere `DEMO_MODE=sandbox` (padrão é `readonly`).
2. Reinicie o servidor do dashboard (`npm run dev` ou `npm run build && npm run start`).
3. Volte para `DEMO_MODE=readonly` antes de publicar o ambiente de demonstração.

## 6. Como Relatar uma Vulnerabilidade

Não abra issues públicas com detalhes exploráveis. Envie um relatório privado ao mantenedor do portfólio contendo os passos de reprodução, o endpoint/componente afetado e o impacto estimado.

