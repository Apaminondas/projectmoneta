# Carga sintética (loadtest)

Dados 100% artificiais de **30 clientes × 12 meses** para testar escala da aplicação e do banco.
Tudo é SQL puro, fora de `src/main/resources/db/migration`. **Não** cria tabelas, colunas, índices nem migrations.

| Arquivo | Função |
|---|---|
| `01_seed_loadtest.sql` | Cria a carga (idempotente) |
| `02_cleanup_loadtest.sql` | Remove só os clientes de carga |
| `03_verify_loadtest.sql` | Contagens, integridade (0 linhas) e `EXPLAIN (ANALYZE, BUFFERS)` |

## Credenciais de teste
- Usuários: `loadtest+01@example.test` … `loadtest+30@example.test`
- **Senha (todos): `LoadTest#2026`**
- O hash BCrypt foi gerado pelo próprio `PasswordEncoder` da aplicação, então o login real funciona.

## Como rodar

### psql via `docker exec` (recomendado no Windows — preserva acentos)
Use `docker cp` + `-f` (pipe `<` no PowerShell pode corromper UTF-8):

```powershell
docker cp db/loadtest finance-db:/tmp/loadtest
docker exec finance-db psql -U finance -d finance -v ON_ERROR_STOP=1 -f /tmp/loadtest/01_seed_loadtest.sql
docker exec finance-db psql -U finance -d finance -v ON_ERROR_STOP=1 -f /tmp/loadtest/03_verify_loadtest.sql
docker exec finance-db psql -U finance -d finance -v ON_ERROR_STOP=1 -f /tmp/loadtest/02_cleanup_loadtest.sql
```
(Usuário/banco: os definidos no seu `.env`/`docker-compose.yml`; `POSTGRES_USER`/`POSTGRES_DB`.)

### DBeaver
Os scripts usam comandos do psql (`\set`, `\if`, `\echo`), que o DBeaver não entende.
Para DBeaver, defina as variáveis no topo e remova as linhas começadas por `\` (ou use a ação *Execute script* após substituir `:n_clients`, `:tx_per_client` e `:months` pelos valores). O caminho mais simples é o psql acima.

## Parâmetros
No topo de `01_seed_loadtest.sql` (padrões) ou via `-v`:

| Parâmetro | Padrão | Significado |
|---|---|---|
| `n_clients` | 30 | Nº de clientes (`loadtest+NN@example.test`) |
| `tx_per_client` | 1200 | Base de transações por cliente |
| `months` | 12 | Meses cobertos, terminando no mês corrente |

Exemplo: `docker exec finance-db psql -U finance -d finance -v ON_ERROR_STOP=1 -v n_clients=10 -v tx_per_client=500 -f /tmp/loadtest/01_seed_loadtest.sql`

Regras de volume: clientes **05, 15 e 25** são "pesados" (5× `tx_per_client`); os demais variam de 0,5× a 1,5×. `setseed(0.42)` + fórmulas determinísticas tornam a carga reproduzível.

## Idempotência e limpeza
- O seed apaga antes (apenas) `email LIKE 'loadtest+%@example.test'` e recria — rodar 2× mantém exatamente `n_clients`.
- `02_cleanup_loadtest.sql` remove só esse padrão (filhos por `ON DELETE CASCADE`). O `admin@moneta.com.br` nunca é tocado.

## Observações
- `generated_reports.pdf_data` e `company_profiles.logo_data` são `NULL`: o histórico de relatórios aparece, mas baixar o PDF desses registros não funciona.
- Datas de transações são sempre ≤ hoje (a API proíbe despesa futura).
- Valores de `report_type`, `severity` e `status` foram extraídos do código do dashboard/Java (somente leitura).
