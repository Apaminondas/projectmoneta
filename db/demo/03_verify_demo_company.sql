-- =====================================================================
-- 03_verify_demo_company.sql
-- Verificação analítica rigorosa da Empresa Demo (Nexora Soluções Cloud & B2B).
-- 1. Série mensal de 12 meses (Receita, Despesa, Margem, Variação M/M, Queda de Margem).
-- 2. Validação estatística das diretrizes da curva (3+ quedas, desvio-padrão >= 3 p.p., fator 1.9x a 2.3x).
-- 3. Transações sem degraus iguais entre meses consecutivos.
-- 4. Coerência financeira de Folha (R$ 0,9M - 1,2M) e Tributos (R$ 290k - 400k) e direcionamento >= 85%.
-- 5. Distribuição de regularidade (máximo 50% na faixa de 98%).
-- 6. Verificação de 0 nomes de empresas reais no banco.
-- 7. Integridade referencial e regras de negócio (todas as 8 checagens devem retornar 0 linhas).
--
-- Uso:
--   docker exec -i finance-db psql -U finance -d finance -v ON_ERROR_STOP=1 -f /tmp/demo/03_verify_demo_company.sql
-- =====================================================================

\echo '== 1. SÉRIE MENSAL (12 MESES) — CRESCIMENTO, SAZONALIDADE & MARGEM OPERACIONAL =='
WITH monthly_data AS (
    SELECT 
        to_char(date_trunc('month', t.date), 'YYYY-MM') AS mes,
        date_trunc('month', t.date) AS mes_dt,
        round(coalesce(sum(CASE WHEN t.type = 'INCOME' AND t.status = 'COMPLETED' THEN t.amount ELSE 0 END), 0), 2) AS receita,
        round(coalesce(sum(CASE WHEN t.type = 'EXPENSE' AND t.status = 'COMPLETED' THEN t.amount ELSE 0 END), 0), 2) AS despesa,
        count(*) AS total_tx
    FROM transactions t
    JOIN users u ON u.id = t.user_id
    WHERE u.email = 'empresa.demo@example.test'
    GROUP BY 1, 2
),
calculated AS (
    SELECT 
        mes,
        mes_dt,
        receita,
        despesa,
        round(receita - despesa, 2) AS resultado,
        CASE WHEN receita > 0 THEN round(((receita - despesa) / receita * 100), 1) ELSE 0 END AS margem_pct,
        round(coalesce(((receita - lag(receita) OVER (ORDER BY mes_dt)) / nullif(lag(receita) OVER (ORDER BY mes_dt), 0) * 100), 0), 1) AS var_receita_mm,
        total_tx
    FROM monthly_data
)
SELECT 
    mes,
    receita,
    despesa,
    resultado,
    margem_pct AS "margem_%",
    round(coalesce(margem_pct - lag(margem_pct) OVER (ORDER BY mes_dt), 0), 1) AS "var_margem_pp",
    var_receita_mm AS "var_mm_%",
    total_tx
FROM calculated
ORDER BY mes_dt ASC;

\echo '== 2. VALIDAÇÃO DAS DIRETRIZES DA CURVA REALISTA =='
WITH monthly_data AS (
    SELECT 
        date_trunc('month', t.date) AS mes_dt,
        sum(CASE WHEN t.type = 'INCOME' AND t.status = 'COMPLETED' THEN t.amount ELSE 0 END) AS receita
    FROM transactions t
    JOIN users u ON u.id = t.user_id
    WHERE u.email = 'empresa.demo@example.test'
    GROUP BY 1
),
diffs AS (
    SELECT 
        receita,
        mes_dt,
        row_number() OVER (ORDER BY mes_dt ASC) AS rn_asc,
        row_number() OVER (ORDER BY mes_dt DESC) AS rn_desc,
        round(coalesce(((receita - lag(receita) OVER (ORDER BY mes_dt)) / nullif(lag(receita) OVER (ORDER BY mes_dt), 0) * 100), 0), 1) AS var_mm
    FROM monthly_data
)
SELECT 
    round((SELECT receita FROM diffs WHERE rn_asc = 1)::numeric, 2) AS receita_mes_1,
    round((SELECT receita FROM diffs WHERE rn_desc = 1)::numeric, 2) AS receita_mes_12,
    round(((SELECT receita FROM diffs WHERE rn_desc = 1) / (SELECT receita FROM diffs WHERE rn_asc = 1))::numeric, 2) AS fator_crescimento,
    count(*) FILTER (WHERE var_mm < 0) AS total_meses_com_queda,
    (SELECT var_mm FROM diffs WHERE to_char(mes_dt, 'YYYY-MM') = '2025-12') AS queda_dez_2025_pct,
    min(var_mm) AS pior_queda_mensal_pct,
    round(stddev_samp(var_mm) FILTER (WHERE var_mm <> 0)::numeric, 2) AS desvio_padrao_var_mm_pp
FROM diffs;

\echo '== 3. CONFERÊNCIA DE TRANSAÇÕES POR MÊS (SEM DEGRAUS IGUAIS) =='
WITH tx_counts AS (
    SELECT 
        to_char(date_trunc('month', date), 'YYYY-MM') AS mes,
        date_trunc('month', date) AS mes_dt,
        count(*) AS qtd_tx
    FROM transactions
    WHERE user_id = 5000
    GROUP BY 1, 2
),
tx_diffs AS (
    SELECT 
        mes,
        qtd_tx,
        qtd_tx - lag(qtd_tx) OVER (ORDER BY mes_dt) AS diff_tx
    FROM tx_counts
)
SELECT 
    mes, 
    qtd_tx, 
    diff_tx,
    CASE 
        WHEN diff_tx IS NOT NULL AND diff_tx = lag(diff_tx) OVER () THEN 'REPETIDO (ERRO)'
        ELSE 'OK (VARIAÇÃO ORGÂNICA)'
    END AS status_degrau
FROM tx_diffs
ORDER BY mes ASC;

\echo '== 4. COERÊNCIA CONTA × CATEGORIA (FOLHA & TRIBUTOS) =='
SELECT 
    'Folha de Pagamento & Encargos' AS categoria,
    (SELECT round(sum(amount), 2) FROM transactions WHERE user_id = 5000 AND category_id = 5003) AS total_categoria,
    (SELECT round(sum(amount), 2) FROM transactions WHERE user_id = 5000 AND account_id = 5005) AS movimento_conta_folha,
    round((SELECT sum(amount) FROM transactions WHERE user_id = 5000 AND category_id = 5003 AND account_id = 5005) / 
          nullif((SELECT sum(amount) FROM transactions WHERE user_id = 5000 AND category_id = 5003), 0) * 100, 1) AS pct_na_conta_certa
UNION ALL
SELECT 
    'Impostos & Tributos Corporativos' AS categoria,
    (SELECT round(sum(amount), 2) FROM transactions WHERE user_id = 5000 AND category_id = 5009) AS total_categoria,
    (SELECT round(sum(amount), 2) FROM transactions WHERE user_id = 5000 AND account_id = 5006) AS movimento_conta_tributos,
    round((SELECT sum(amount) FROM transactions WHERE user_id = 5000 AND category_id = 5009 AND account_id = 5006) / 
          nullif((SELECT sum(amount) FROM transactions WHERE user_id = 5000 AND category_id = 5009), 0) * 100, 1) AS pct_na_conta_certa;

\echo '== 5. DISTRIBUIÇÃO DAS CONTAS POR FAIXA DE REGULARIDADE (MÁX 50% NA MAIS ALTA) =='
WITH acc_metrics AS (
    SELECT 
        a.id,
        a.name AS conta,
        a.tier,
        count(t.id) AS total_tx,
        round(coalesce(sum(t.amount), 0), 2) AS movimento,
        max(t.date) AS ultima_op,
        (current_date - max(t.date)) AS dias_inatividade,
        CASE 
            WHEN (current_date - max(t.date)) < 10 THEN 98
            WHEN (current_date - max(t.date)) < 30 THEN 88
            WHEN (current_date - max(t.date)) < 60 THEN 75
            ELSE 60
        END AS regularidade_pct
    FROM accounts a
    LEFT JOIN transactions t ON t.account_id = a.id AND t.user_id = a.user_id
    WHERE a.user_id = 5000
    GROUP BY a.id, a.name, a.tier
)
SELECT 
    regularidade_pct || '%' AS faixa_regularidade,
    count(*) AS qtd_contas,
    round(count(*) * 100.0 / 16, 1) AS pct_do_total,
    string_agg(conta, ' | ') AS contas_na_faixa
FROM acc_metrics
GROUP BY regularidade_pct
ORDER BY regularidade_pct DESC;

\echo '== 6. AUDITORIA DE NOMES REAIS PROIBIDOS (DEVE RETORNAR 0 LINHAS) =='
SELECT 'accounts' AS tabela, id, name FROM accounts 
WHERE user_id = 5000 AND (name ~* 'Itau|Bradesco|AWS|Google|Safra|BTG|KPMG|Totvs|Localiza|Rede D.Or|Boticario|Faria Lima')
UNION ALL
SELECT 'contacts' AS tabela, id, name || ' (' || email || ')' FROM contacts 
WHERE user_id = 5000 AND (name ~* 'Itau|Bradesco|AWS|Google|Safra|BTG|KPMG|Totvs|Localiza|Rede D.Or|Boticario|Faria Lima' OR email ~* 'itau|bradesco|aws|google|safra|btg|kpmg|totvs|localiza|rededor|boticario|farialima')
UNION ALL
SELECT 'transactions' AS tabela, id, description FROM transactions 
WHERE user_id = 5000 AND (description ~* 'Itau|Bradesco|AWS|Google|Safra|BTG|KPMG|Totvs|Localiza|Rede D.Or|Boticario|Faria Lima');

\echo '== 7. INTEGRIDADE REFERENCIAL & REGRAS DE NEGÓCIO (TODAS DEVEM RETORNAR 0 LINHAS) =='
\echo '-- 7a. Lançamentos com categoria de outro usuário'
SELECT t.id FROM transactions t JOIN categories c ON c.id = t.category_id
WHERE t.user_id <> c.user_id AND t.user_id = 5000;

\echo '-- 7b. Lançamentos com conta de outro usuário ou nula'
SELECT t.id FROM transactions t LEFT JOIN accounts a ON a.id = t.account_id
WHERE (a.id IS NULL OR t.user_id <> a.user_id) AND t.user_id = 5000;

\echo '-- 7c. Contas com contato de outro usuário ou nulo'
SELECT a.id FROM accounts a LEFT JOIN contacts c ON c.id = a.primary_contact_id
WHERE (c.id IS NULL OR c.user_id <> a.user_id) AND a.user_id = 5000;

\echo '-- 7d. Transações COMPLETED com data futura'
SELECT id, description, date, status FROM transactions
WHERE user_id = 5000 AND status = 'COMPLETED' AND date > current_date;

\echo '-- 7e. Transações com amount <= 0 ou enums inválidos'
SELECT id, amount, type, status FROM transactions
WHERE user_id = 5000 AND (amount <= 0 OR type NOT IN ('INCOME','EXPENSE') OR status NOT IN ('COMPLETED','PENDING','CANCELED'));

\echo '-- 7f. Vencimento anterior à emissão ou com prazo excessivo (> 30 dias)'
SELECT id, date, due_date FROM transactions
WHERE user_id = 5000 AND due_date IS NOT NULL AND (due_date < date OR due_date > date + interval '31 days');

\echo '-- 7g. Registros órfãos vinculados à demo'
SELECT id FROM transactions WHERE user_id NOT IN (SELECT id FROM users)
UNION ALL SELECT id FROM accounts WHERE user_id NOT IN (SELECT id FROM users);

\echo '-- 7h. Admin intacto (deve retornar exatamente 1 linha)'
SELECT id, email, name FROM users WHERE email = 'admin@moneta.com.br';
