-- =====================================================================
-- 01_seed_loadtest.sql
-- Carga sintética (100% artificial) para teste de escala: N clientes x 12 meses.
-- Somente SQL orientado a conjunto (generate_series / INSERT ... SELECT / CTEs).
--
-- Uso (parâmetros opcionais via psql -v):
--   psql -v ON_ERROR_STOP=1 -v n_clients=30 -v tx_per_client=1200 -v months=12 -f 01_seed_loadtest.sql
--
-- Idempotente: remove antes SOMENTE os usuários 'loadtest+%@example.test'
-- (filhos saem por ON DELETE CASCADE). Nunca toca em outros usuários.
-- Não cria índices, tabelas ou colunas. Não insere BYTEA.
-- =====================================================================

-- ---------- PARÂMETROS (padrões; sobrescreva com -v) ----------
\if :{?n_clients}
\else
  \set n_clients 30
\endif
\if :{?tx_per_client}
\else
  \set tx_per_client 1200
\endif
\if :{?months}
\else
  \set months 12
\endif

SELECT setseed(0.42);

\set ON_ERROR_STOP on
BEGIN;

-- ---------- 0. Limpeza idempotente (apenas padrão de e-mail de carga) ----------
DELETE FROM users WHERE email LIKE 'loadtest+%@example.test';

-- ---------- 1. Usuários ----------
-- Senha de todos: ver README (hash BCrypt gerado pelo PasswordEncoder da aplicação).
INSERT INTO users (name, email, password_hash)
SELECT (ARRAY['Ana','Bruno','Carla','Diego','Elisa','Fábio','Gabriela','Henrique','Isabela','João',
              'Karina','Leandro','Mariana','Nelson','Olívia','Paulo','Quésia','Rafael','Sabrina','Tiago'])
         [1 + (n % 20)]
       || ' ' ||
       (ARRAY['Almeida','Barbosa','Cardoso','Duarte','Esteves','Ferraz','Gomes','Hashimoto','Ibrahim',
              'Junqueira','Klein','Lopes','Medeiros','Nogueira','Oliveira'])
         [1 + ((n * 7) % 15)]
       || ' (Carga ' || lpad(n::text, 2, '0') || ')',
       'loadtest+' || lpad(n::text, 2, '0') || '@example.test',
       '$2a$10$jwjwv2r0tCeI4dwd2N1s8OX0ye0.o1qvMaVYQE2sUbAB/GZNhWfsy'
FROM generate_series(1, :n_clients) AS n;

-- ---------- 2. Categorias (6 por cliente, padrão da V10) ----------
INSERT INTO categories (name, user_id, color_token, monthly_ceiling, kind)
SELECT c.name, u.id, c.color_token, c.monthly_ceiling, c.kind
FROM users u
CROSS JOIN (VALUES
    ('Folha de Pagamento',      'chart-1', 1000.00, 'VARIABLE'),
    ('Locação Comercial',       'chart-1', 5000.00, 'FIXED'),
    ('Infraestrutura Cloud',    'chart-2', 4000.00, 'VARIABLE'),
    ('Marketing & Aquisição',   'chart-3', 3500.00, 'INVESTMENT'),
    ('Consultorias & Jurídico', 'chart-4', 3500.00, 'SERVICE'),
    ('Softwares & SaaS',        'chart-5', 3000.00, 'SUBSCRIPTION')
) AS c(name, color_token, monthly_ceiling, kind)
WHERE u.email LIKE 'loadtest+%@example.test';

-- ---------- 3. Contatos (6 a 10 por cliente) ----------
INSERT INTO contacts (user_id, name, email, phone)
SELECT u.id,
       (ARRAY['Diretoria Financeira','Gerência Comercial','Controladoria','Gestão Predial','Account Manager B2B',
              'Sócio Tributário','Coordenação de TI','Suprimentos','Recursos Humanos','Relacionamento Corporativo'])
         [1 + ((g.i - 1) % 10)],
       'contato' || g.i || '.cliente' || x.n || '@example.test',
       '+55 (11) 3' || lpad((1000 + x.n * 37 + g.i * 11)::text, 3, '0') || '-' || lpad(((x.n * 131 + g.i * 17) % 10000)::text, 4, '0')
FROM users u
CROSS JOIN LATERAL (SELECT substring(u.email FROM 'loadtest\+(\d+)@')::int AS n) x
CROSS JOIN LATERAL generate_series(1, 6 + ((x.n * 7) % 5)) AS g(i)
WHERE u.email LIKE 'loadtest+%@example.test';

-- ---------- 4. Contas (6 a 10 por cliente; contato principal do MESMO cliente) ----------
INSERT INTO accounts (user_id, name, segment, tier, city, uf, opening_balance, primary_contact_id)
SELECT u.id,
       (ARRAY['Conta Corrente Principal','Conta Reserva','Cartão Corporativo','Conta Folha','Conta Impostos',
              'Conta Investimentos','Conta Operacional','Conta Fornecedores','Conta Filial Sul','Conta Filial Nordeste'])
         [g.i] || ' ' || lpad(x.n::text, 2, '0'),
       (ARRAY['Banco','Investimentos','Cartão','Folha','Tributos','Aplicações','Operacional','Fornecedores','Filial','Filial'])[g.i],
       (ARRAY['Principal','Secundária','Reserva'])[1 + ((g.i + x.n) % 3)],
       (ARRAY['São Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Porto Alegre','Salvador','Recife','Fortaleza'])
         [1 + ((g.i + x.n) % 8)],
       (ARRAY['SP','RJ','MG','PR','RS','BA','PE','CE'])[1 + ((g.i + x.n) % 8)],
       round((1000 + ((x.n * 7919 + g.i * 104729) % 90000))::numeric, 2),
       (SELECT c.id FROM contacts c WHERE c.user_id = u.id ORDER BY c.id
         OFFSET ((g.i - 1) % (SELECT count(*) FROM contacts c2 WHERE c2.user_id = u.id)) LIMIT 1)
FROM users u
CROSS JOIN LATERAL (SELECT substring(u.email FROM 'loadtest\+(\d+)@')::int AS n) x
CROSS JOIN LATERAL generate_series(1, 6 + ((x.n * 3) % 5)) AS g(i)
WHERE u.email LIKE 'loadtest+%@example.test';

-- ---------- 5. Transações (grosso do volume) ----------
-- Clientes "pesados" (5, 15, 25): 5x tx_per_client. Demais: 0,5x a 1,5x (determinístico por cliente).
-- Garante >= 1 transação por mês por cliente (as primeiras `months` linhas cobrem cada mês).
-- Datas sempre <= hoje (a API proíbe despesa com data futura). Sazonalidade leve (meio do ano e dezembro).
WITH cfg AS (
    SELECT (date_trunc('month', current_date) - ((:months - 1) * interval '1 month'))::date AS start_month
), mw AS (   -- peso de sazonalidade por mês (CDF)
    SELECT m,
           sum(w) OVER (ORDER BY m) / sum(w) OVER () AS cum
    FROM (
        SELECT m,
               1 + 0.25 * sin(2 * pi() * extract(month FROM (cfg.start_month + m * interval '1 month'))::numeric / 12)
                 + CASE WHEN extract(month FROM (cfg.start_month + m * interval '1 month')) = 12 THEN 0.30 ELSE 0 END AS w
        FROM cfg, generate_series(0, :months - 1) AS m
    ) s
), u AS (
    SELECT id, substring(email FROM 'loadtest\+(\d+)@')::int AS n
    FROM users WHERE email LIKE 'loadtest+%@example.test'
), vol AS (
    SELECT id AS user_id, n,
           GREATEST(:months,
                    round(:tx_per_client * CASE WHEN n IN (5, 15, 25) THEN 5.0
                                                ELSE 0.5 + ((n * 37) % 101) / 100.0 END)::int) AS ntx
    FROM u
), cats AS (
    SELECT c.id, c.user_id, c.kind, row_number() OVER (PARTITION BY c.user_id ORDER BY c.id) AS rn
    FROM categories c JOIN u ON u.id = c.user_id
), accs AS (
    SELECT a.id, a.user_id,
           row_number() OVER (PARTITION BY a.user_id ORDER BY a.id) AS rn,
           count(*) OVER (PARTITION BY a.user_id) AS cnt
    FROM accounts a JOIN u ON u.id = a.user_id
), gen AS (
    SELECT v.user_id, g.i FROM vol v CROSS JOIN LATERAL generate_series(1, v.ntx) AS g(i)
), draws AS MATERIALIZED (
    SELECT user_id, i,
           random() AS r_m, random() AS r_d, random() AS r_t, random() AS r_c, random() AS r_a,
           random() AS r_s, random() AS r_amt, random() AS r_desc, random() AS r_pm,
           random() AS r_due, random() AS r_note, random() AS r_time
    FROM gen
), dated AS (
    SELECT d.*,
           CASE WHEN d.i <= :months THEN d.i - 1
                ELSE (SELECT mw.m FROM mw WHERE mw.cum >= d.r_m ORDER BY mw.m LIMIT 1) END AS m_idx
    FROM draws d
), dated2 AS (
    SELECT t.*,
           (cfg.start_month + t.m_idx * interval '1 month')::date AS month_start
    FROM dated t, cfg
), dated3 AS (
    SELECT t.*,
           (t.month_start
             + floor(t.r_d * LEAST(extract(day FROM (t.month_start + interval '1 month - 1 day'))::int,
                                   (current_date - t.month_start) + 1))::int) AS tx_date,
           (t.r_t < 0.35) AS is_income,
           (1 + floor(t.r_c * 6))::int AS cat_rn
    FROM dated2 t
), kr(kind, lo, hi) AS (
    VALUES ('VARIABLE', 300, 6000), ('FIXED', 2000, 9000), ('INVESTMENT', 1500, 15000),
           ('SERVICE', 800, 8000), ('SUBSCRIPTION', 150, 3000)
), ed(rn, descs, notes) AS (   -- descrições/notas de despesa por categoria (rn 1..6)
    VALUES
    (1, ARRAY['Folha de Pagamento CLT','Encargos Sociais e FGTS','Pró-labore Sócios','Benefícios Flash Vale-Refeição','13º Salário Provisionado'],
        ARRAY['Pagamento mensal da folha do time','Guias de FGTS e INSS do período','Distribuição mensal de pró-labore','Crédito mensal de benefícios corporativos']),
    (2, ARRAY['Locação Escritório Matriz','Condomínio Corporativo','IPTU Sala Comercial','Contrato Facilities e Limpeza Predial','Seguro Patrimonial'],
        ARRAY['Aluguel do escritório sede referente ao mês','Rateio mensal de condomínio e fundo de reserva','Serviços terceirizados de manutenção predial']),
    (3, ARRAY['Servidores AWS Cloud Infrastructure','Banco de Dados Gerenciado RDS','Link Dedicado Fibra Óptica 1Gbps','Armazenamento S3 e CDN','Monitoramento e Observabilidade'],
        ARRAY['Fatura mensal de instâncias EC2 e RDS','Tráfego de dados e armazenamento do período','Link redundante com IP fixo corporativo']),
    (4, ARRAY['Campanha Google Ads B2B','Mídia Paga LinkedIn Ads','Evento e Patrocínio de Feira','Agência de Conteúdo e SEO','Material Gráfico e Brindes'],
        ARRAY['Investimento em captação de leads corporativos','Campanha de geração de demanda trimestral','Ações de posicionamento de marca']),
    (5, ARRAY['Assessoria Jurídica e Compliance','Auditoria Contábil e Fechamento Fiscal','Consultoria Tributária','Honorários Contábeis','Consultoria de Estratégia Comercial'],
        ARRAY['Honorários mensais de assessoria societária e LGPD','Conciliação de balancetes e obrigações acessórias','Projeto de consultoria por escopo fechado']),
    (6, ARRAY['Licenças Google Workspace e Slack','Assinatura CRM Corporativo','Licenças de Ferramentas de Design','Plataforma de Gestão de Projetos','Antivírus e Segurança Endpoint'],
        ARRAY['Plano empresarial de produtividade e comunicação','Renovação mensal de licenças por usuário','Assinatura recorrente de ferramentas SaaS'])
), inc(descs, notes) AS (
    VALUES (ARRAY['Faturamento Contrato SaaS Enterprise','Recebimento Mensalidade Cliente Alpha Corp','Receita de Implantação e Onboarding',
                  'Renovação Anual de Licenças','Receita de Consultoria Técnica','Faturamento Projeto Sob Demanda',
                  'Recebimento Suporte Premium','Receita de Treinamento Corporativo'],
           ARRAY['Recebimento de mensalidade de contrato anual','Crédito referente a nota fiscal emitida no período',
                 'Liquidação de fatura de cliente corporativo','Receita reconhecida conforme cronograma contratual'])
), pm(methods) AS (
    VALUES (ARRAY['Transferência TED','Boleto Bancário','Cartão de Crédito','Cartão de Débito','Cartão Corporativo','PIX'])
)
INSERT INTO transactions (description, amount, date, type, category_id, user_id, created_at,
                          status, payment_method, notes, account_id, due_date)
SELECT CASE WHEN t.is_income
            THEN inc.descs[1 + floor(t.r_desc * cardinality(inc.descs))::int]
            ELSE ed.descs[1 + floor(t.r_desc * cardinality(ed.descs))::int] END
         || ' - ' || to_char(t.tx_date, 'MM/YYYY'),
       GREATEST(0.01, round((CASE WHEN t.is_income
                                  THEN 3000 + power(t.r_amt, 1.5) * 57000
                                  ELSE kr.lo + power(t.r_amt, 1.3) * (kr.hi - kr.lo) END)::numeric, 2)),
       t.tx_date,
       CASE WHEN t.is_income THEN 'INCOME' ELSE 'EXPENSE' END,
       c.id,
       t.user_id,
       t.tx_date + (t.r_time * interval '1 day'),
       CASE WHEN t.r_s < 0.90 THEN 'COMPLETED' WHEN t.r_s < 0.97 THEN 'PENDING' ELSE 'CANCELED' END,
       pm.methods[1 + floor(t.r_pm * 6)::int],
       CASE WHEN t.is_income
            THEN inc.notes[1 + floor(t.r_note * cardinality(inc.notes))::int]
            ELSE ed.notes[1 + floor(t.r_note * cardinality(ed.notes))::int] END,
       a.id,
       t.tx_date + floor(t.r_due * 31)::int
FROM dated3 t
JOIN cats c  ON c.user_id = t.user_id AND c.rn = t.cat_rn
JOIN accs a  ON a.user_id = t.user_id AND a.rn = 1 + floor(t.r_a * a.cnt)::int
JOIN kr      ON kr.kind = c.kind
JOIN ed      ON ed.rn = c.rn
CROSS JOIN inc
CROSS JOIN pm;

-- ---------- 6. Compromissos (20 a 60 por cliente) ----------
INSERT INTO appointments (user_id, account_id, title, scheduled_at, note)
SELECT u.id,
       (SELECT a.id FROM accounts a WHERE a.user_id = u.id ORDER BY a.id
         OFFSET floor(random() * (SELECT count(*) FROM accounts a2 WHERE a2.user_id = u.id))::int LIMIT 1),
       (ARRAY['Alinhamento Trimestral de Metas','Revisão de Contrato','Reunião de Fechamento Mensal','Negociação de Reajuste',
              'Revisão de Consumo de Cloud','Conciliação Bancária','Apresentação de Resultados','Renovação de Licenças'])
         [1 + floor(random() * 8)::int] || ' #' || g.i,
       now() + ((random() * 180 - 90) * interval '1 day'),
       'Compromisso sintético de carga ' || g.i
FROM users u
CROSS JOIN LATERAL (SELECT substring(u.email FROM 'loadtest\+(\d+)@')::int AS n) x
CROSS JOIN LATERAL generate_series(1, 20 + ((x.n * 13) % 41)) AS g(i)
WHERE u.email LIKE 'loadtest+%@example.test';

-- ---------- 7. Fatores de risco (3 a 8 por cliente) ----------
INSERT INTO risk_factors (user_id, title, category, severity, estimated_amount, description, status, origin)
SELECT u.id,
       (ARRAY['Renovação de Contrato Jurídico','Flutuação Cambial (USD) em Cloud','Concentração de Receita em Poucos Clientes',
              'Reajuste Anual de Locação','Inadimplência de Clientes Enterprise','Aumento de Encargos Trabalhistas',
              'Dependência de Fornecedor Único','Mudança Regulatória Tributária'])[g.i],
       (ARRAY['Consultorias & Jurídico','Infraestrutura Cloud','Receita','Locação Comercial','Receita','Folha de Pagamento',
              'Softwares & SaaS','Consultorias & Jurídico'])[g.i],
       (ARRAY['low','medium','high'])[1 + floor(random() * 3)::int],
       round((500 + random() * 49500)::numeric, 2),
       'Risco sintético para teste de carga (cliente ' || x.n || ').',
       'ACTIVE',
       'MANUAL'
FROM users u
CROSS JOIN LATERAL (SELECT substring(u.email FROM 'loadtest\+(\d+)@')::int AS n) x
CROSS JOIN LATERAL generate_series(1, 3 + ((x.n * 5) % 6)) AS g(i)
WHERE u.email LIKE 'loadtest+%@example.test';

-- ---------- 8. Planos de mitigação (2 a 5; UNIQUE (user_id, risk_key) respeitado) ----------
-- risk_key = 'auto:category:<id>' com a categoria do próprio cliente (uma por plano => sem duplicata).
INSERT INTO mitigation_plans (user_id, risk_key, actions, owner, due_date, status, rule_reason)
SELECT u.id,
       'auto:category:' || c.id,
       (ARRAY['Negociar carência e congelamento de índice com o fornecedor','Revisar contratos e renegociar prazos de pagamento',
              'Migrar para instâncias reservadas para reduzir custo','Diversificar fornecedores e criar plano de contingência',
              'Implantar aprovação em duas etapas para gastos acima do teto'])[g.i],
       (ARRAY['Diretoria Financeira','Controladoria','Gestão de TI','Suprimentos','Diretoria Comercial'])[g.i],
       current_date + ((5 + g.i * 7) * interval '1 day')::interval,
       'IN_PROGRESS',
       'Detectado automaticamente: ' || c.name || ' próximo do teto mensal.'
FROM users u
CROSS JOIN LATERAL (SELECT substring(u.email FROM 'loadtest\+(\d+)@')::int AS n) x
CROSS JOIN LATERAL generate_series(1, 2 + ((x.n * 3) % 4)) AS g(i)
JOIN LATERAL (SELECT cc.id, cc.name FROM categories cc WHERE cc.user_id = u.id
              ORDER BY cc.id OFFSET (g.i - 1) LIMIT 1) c ON TRUE
WHERE u.email LIKE 'loadtest+%@example.test';

-- ---------- 9. Notificações (30 a 100 por cliente; read variado) ----------
INSERT INTO notifications (user_id, title, message, type, read, link, created_at)
SELECT u.id,
       t.title,
       t.message,
       t.type,
       (random() < 0.55),
       t.link,
       now() - (random() * 60 * interval '1 day')
FROM users u
CROSS JOIN LATERAL (SELECT substring(u.email FROM 'loadtest\+(\d+)@')::int AS n) x
CROSS JOIN LATERAL generate_series(1, 30 + ((x.n * 17) % 71)) AS g(i)
JOIN (VALUES
    (1, 'Teto Orçamentário Atingido', 'O centro de custo Infraestrutura Cloud atingiu 82% do limite planejado.', 'CEILING_ALERT', 'team'),
    (2, 'Vencimento Próximo', 'A fatura de fornecedor vence em 3 dias.', 'DUE_DATE', 'customers'),
    (3, 'Novo Lançamento Compensado', 'Receita de contrato foi creditada na conta principal.', 'NEW_TRANSACTION', 'deals'),
    (4, 'Risco Orçamentário Identificado', 'Risco de flutuação cambial detectado para contratos de nuvem.', 'RISK_ALERT', 'forecasting')
) AS t(k, title, message, type, link) ON t.k = 1 + ((g.i + x.n) % 4)
WHERE u.email LIKE 'loadtest+%@example.test';

-- ---------- 10. Preferências de notificação (1 por cliente; defaults do schema) ----------
INSERT INTO notification_preferences (user_id)
SELECT id FROM users WHERE email LIKE 'loadtest+%@example.test';

-- ---------- 11. Perfil da empresa (1 por cliente; logo_data NULL) ----------
INSERT INTO company_profiles (user_id, company_name, company_email, company_phone, footer_text, logo_data, logo_content_type)
SELECT u.id,
       'Empresa Sintética ' || lpad(x.n::text, 2, '0') || ' Ltda',
       'financeiro@empresa' || lpad(x.n::text, 2, '0') || '.example.test',
       '+55 (11) 4000-' || lpad((1000 + x.n)::text, 4, '0'),
       'Documento gerado automaticamente - dados fictícios para teste de carga',
       NULL, NULL
FROM users u
CROSS JOIN LATERAL (SELECT substring(u.email FROM 'loadtest\+(\d+)@')::int AS n) x
WHERE u.email LIKE 'loadtest+%@example.test';

-- ---------- 12. Relatórios gerados (10 a 30 por cliente; pdf_data NULL) ----------
INSERT INTO generated_reports (user_id, title, report_type, period, file_format, status,
                               file_size_bytes, pdf_data, download_count, created_at)
SELECT u.id,
       rt.title || ' ' || to_char(p.d, 'MM/YYYY'),
       rt.type,
       to_char(p.d, 'MM/YYYY'),
       'PDF',
       'COMPLETED',
       (80000 + floor(random() * 820000))::bigint,
       NULL,
       floor(random() * 9)::int,
       p.d + ((1 + floor(random() * 27)::int) * interval '1 day')
FROM users u
CROSS JOIN LATERAL (SELECT substring(u.email FROM 'loadtest\+(\d+)@')::int AS n) x
CROSS JOIN LATERAL generate_series(1, 10 + ((x.n * 11) % 21)) AS g(i)
CROSS JOIN LATERAL (SELECT (date_trunc('month', current_date) - (((g.i - 1) % :months) * interval '1 month'))::date AS d) p
JOIN (VALUES
    (0, 'MONTHLY_SUMMARY', 'Extrato Mensal Consolidado'),
    (1, 'FINANCIAL_FLOW',  'Demonstrativo de Fluxo de Caixa'),
    (2, 'COST_CENTER',     'Relatório por Centro de Custo'),
    (3, 'BALANCE_SHEET',   'Balanço Patrimonial e Investimentos'),
    (4, 'AUDIT',           'Auditoria de Lançamentos')
) AS rt(k, type, title) ON rt.k = (g.i % 5)
WHERE u.email LIKE 'loadtest+%@example.test';

COMMIT;

-- Resumo rápido
SELECT (SELECT count(*) FROM users WHERE email LIKE 'loadtest+%@example.test') AS clientes_carga,
       (SELECT count(*) FROM transactions t JOIN users u ON u.id = t.user_id
         WHERE u.email LIKE 'loadtest+%@example.test') AS transacoes_carga;
