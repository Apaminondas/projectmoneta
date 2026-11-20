-- =====================================================================
-- 03_verify_loadtest.sql
-- Verificação de volume, integridade (0 linhas = OK) e desempenho (EXPLAIN ANALYZE).
-- Uso: psql -v ON_ERROR_STOP=1 -f 03_verify_loadtest.sql
-- Somente leitura.
-- =====================================================================

\echo '== 1. Contagem por tabela (apenas clientes de carga) =='
WITH lu AS (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test')
SELECT 'users' AS tabela, count(*) AS linhas FROM lu
UNION ALL SELECT 'categories',               count(*) FROM categories               WHERE user_id IN (SELECT id FROM lu)
UNION ALL SELECT 'contacts',                 count(*) FROM contacts                 WHERE user_id IN (SELECT id FROM lu)
UNION ALL SELECT 'accounts',                 count(*) FROM accounts                 WHERE user_id IN (SELECT id FROM lu)
UNION ALL SELECT 'transactions',             count(*) FROM transactions             WHERE user_id IN (SELECT id FROM lu)
UNION ALL SELECT 'appointments',             count(*) FROM appointments             WHERE user_id IN (SELECT id FROM lu)
UNION ALL SELECT 'risk_factors',             count(*) FROM risk_factors             WHERE user_id IN (SELECT id FROM lu)
UNION ALL SELECT 'mitigation_plans',         count(*) FROM mitigation_plans         WHERE user_id IN (SELECT id FROM lu)
UNION ALL SELECT 'notifications',            count(*) FROM notifications            WHERE user_id IN (SELECT id FROM lu)
UNION ALL SELECT 'notification_preferences', count(*) FROM notification_preferences WHERE user_id IN (SELECT id FROM lu)
UNION ALL SELECT 'company_profiles',         count(*) FROM company_profiles         WHERE user_id IN (SELECT id FROM lu)
UNION ALL SELECT 'generated_reports',        count(*) FROM generated_reports        WHERE user_id IN (SELECT id FROM lu);

\echo '== 2. Transações por cliente: mínimo / máximo / média =='
SELECT min(c) AS minimo, max(c) AS maximo, round(avg(c), 1) AS media, count(*) AS clientes
FROM (SELECT t.user_id, count(*) AS c
      FROM transactions t JOIN users u ON u.id = t.user_id
      WHERE u.email LIKE 'loadtest+%@example.test' GROUP BY t.user_id) s;

\echo '== 3. Meses com transação por cliente (esperado = months para todos) =='
SELECT meses_cobertos, count(*) AS clientes
FROM (SELECT t.user_id, count(DISTINCT date_trunc('month', t.date)) AS meses_cobertos
      FROM transactions t JOIN users u ON u.id = t.user_id
      WHERE u.email LIKE 'loadtest+%@example.test' GROUP BY t.user_id) s
GROUP BY meses_cobertos ORDER BY 1;

\echo '== 4. Distribuição de tipo e status (esperado ~35% INCOME; ~90/7/3) =='
SELECT t.type, t.status, count(*) AS n,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct
FROM transactions t JOIN users u ON u.id = t.user_id
WHERE u.email LIKE 'loadtest+%@example.test'
GROUP BY 1, 2 ORDER BY 1, 2;

\echo '== 5. INTEGRIDADE (cada consulta deve retornar 0 linhas) =='
\echo '-- 5a. transação com categoria de OUTRO cliente'
SELECT t.id FROM transactions t JOIN categories c ON c.id = t.category_id
WHERE t.user_id <> c.user_id AND t.user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test');
\echo '-- 5b. transação com conta de OUTRO cliente (ou sem conta)'
SELECT t.id FROM transactions t LEFT JOIN accounts a ON a.id = t.account_id
WHERE (a.id IS NULL OR t.user_id <> a.user_id)
  AND t.user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test');
\echo '-- 5c. conta com contato principal de OUTRO cliente (ou nulo)'
SELECT a.id FROM accounts a LEFT JOIN contacts c ON c.id = a.primary_contact_id
WHERE (c.id IS NULL OR c.user_id <> a.user_id)
  AND a.user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test');
\echo '-- 5d. compromisso com conta de OUTRO cliente'
SELECT p.id FROM appointments p JOIN accounts a ON a.id = p.account_id
WHERE p.user_id <> a.user_id AND p.user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test');
\echo '-- 5e. plano de mitigação apontando para categoria de OUTRO cliente'
SELECT m.id FROM mitigation_plans m
JOIN categories c ON c.id = substring(m.risk_key FROM 'auto:category:(\d+)')::bigint
WHERE m.user_id <> c.user_id AND m.user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test');
\echo '-- 5f. amount <= 0, type/status inválidos, data futura, due_date fora de 0..30 dias'
SELECT t.id FROM transactions t
WHERE t.user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test')
  AND (t.amount <= 0
       OR t.type NOT IN ('INCOME', 'EXPENSE')
       OR t.status NOT IN ('COMPLETED', 'PENDING', 'CANCELED')
       OR t.date > current_date
       OR t.due_date < t.date OR t.due_date > t.date + 30);
\echo '-- 5g. enums de categoria/conta inválidos'
SELECT c.id FROM categories c
WHERE c.user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test')
  AND (c.kind NOT IN ('VARIABLE','FIXED','INVESTMENT','SERVICE','SUBSCRIPTION')
       OR c.color_token NOT IN ('chart-1','chart-2','chart-3','chart-4','chart-5'))
UNION ALL
SELECT a.id FROM accounts a
WHERE a.user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test')
  AND (a.tier NOT IN ('Principal','Secundária','Reserva') OR length(a.uf) <> 2 OR a.opening_balance < 0);
\echo '-- 5h. BYTEA preenchido (deve ser NULL)'
SELECT id FROM generated_reports WHERE pdf_data IS NOT NULL
  AND user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test')
UNION ALL
SELECT id FROM company_profiles WHERE logo_data IS NOT NULL
  AND user_id IN (SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test');
\echo '-- 5i. admin intacto (deve retornar exatamente 1 linha)'
SELECT id, email FROM users WHERE email = 'admin@moneta.com.br';

\echo '== 6. DESEMPENHO: EXPLAIN (ANALYZE, BUFFERS) em um cliente pesado (loadtest+05) =='
\echo '-- 6a. transações de um cliente por intervalo de datas (últimos 3 meses)'
EXPLAIN (ANALYZE, BUFFERS)
SELECT t.id, t.date, t.description, t.amount, t.type, t.status
FROM transactions t
WHERE t.user_id = (SELECT id FROM users WHERE email = 'loadtest+05@example.test')
  AND t.date BETWEEN date_trunc('month', current_date) - interval '2 months' AND current_date
ORDER BY t.date DESC;

\echo '-- 6b. soma por categoria no mês corrente de um cliente'
EXPLAIN (ANALYZE, BUFFERS)
SELECT c.name, sum(t.amount) AS total
FROM transactions t JOIN categories c ON c.id = t.category_id
WHERE t.user_id = (SELECT id FROM users WHERE email = 'loadtest+05@example.test')
  AND t.type = 'EXPENSE' AND t.status <> 'CANCELED'
  AND t.date >= date_trunc('month', current_date)::date AND t.date <= current_date
GROUP BY c.name ORDER BY total DESC;

\echo '-- 6c. notificações não lidas de um cliente'
EXPLAIN (ANALYZE, BUFFERS)
SELECT n.id, n.title, n.type, n.created_at
FROM notifications n
WHERE n.user_id = (SELECT id FROM users WHERE email = 'loadtest+05@example.test')
  AND n.read = FALSE
ORDER BY n.created_at DESC;
