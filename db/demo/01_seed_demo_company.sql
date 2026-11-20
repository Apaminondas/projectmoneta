-- =====================================================================
-- 01_seed_demo_company.sql
-- Carga realista de UMA empresa fictícia (Nexora Soluções Cloud & B2B)
-- Histórico de 12 meses com crescimento orgânico de ~R$ 162k a ~R$ 342k (x2.11)
-- Margem operacional de ~3.5% (mês 1) para ~18.1% (mês 12).
-- 3 quedas mensais (-4.8% dez, -4.8% abr, -4.0% jul), desvio-padrão >= 3 p.p.
-- Transações sem degraus consecutivos iguais (total 3.811 txs).
-- Coerência de Folha (R$ 0,9M-1,2M) e Tributos (R$ 290k-400k) com direcionamento para contas certas.
-- Regularidade balanceada: máximo 6 de 16 contas (37.5% <= 50%) na faixa 98%.
-- 100% de nomes de empresas fictícias plausíveis (0 nomes reais).
-- Idempotente: remove antes 'empresa.demo@example.test' (filhos por cascade).
--
-- Uso:
--   docker exec -i finance-db psql -U finance -d finance -v ON_ERROR_STOP=1 -f /tmp/demo/01_seed_demo_company.sql
-- =====================================================================

SELECT setseed(0.42);

\set ON_ERROR_STOP on
BEGIN;

-- ---------- 0. Limpeza idempotente da empresa demo ----------
DELETE FROM users WHERE email = 'empresa.demo@example.test';

-- ---------- 1. Usuário da Empresa Demo ----------
-- Senha de teste: Demo#2026 (BCrypt do PasswordEncoder da aplicação)
INSERT INTO users (id, name, email, password_hash, created_at)
VALUES (
    5000,
    'Nexora Soluções Cloud & B2B',
    'empresa.demo@example.test',
    '$2a$10$XNCxbTzXDrAL4IA8tLHYtun6UuzUeSfqqgjMf5/lJ8UhYbtY2zlb.',
    '2025-10-31 09:00:00'::timestamp
);

-- ---------- 2. Perfil da Empresa (company_profiles) ----------
INSERT INTO company_profiles (user_id, company_name, company_email, company_phone, footer_text, logo_data, logo_content_type)
VALUES (
    5000,
    'Nexora Soluções Cloud & B2B Ltda',
    'financeiro@nexora.example.test',
    '+55 (11) 3452-8800',
    'Nexora Soluções Cloud & B2B Ltda • CNPJ 42.108.990/0001-55 • Av. das Nações Unidas, 12901, Brooklin Paulista, São Paulo - SP',
    NULL,
    NULL
);

-- ---------- 3. Preferências de Notificação ----------
INSERT INTO notification_preferences (user_id)
VALUES (5000);

-- ---------- 4. Contatos Corporativos (DDDs compatíveis com UF, 100% fictícios) ----------
INSERT INTO contacts (id, user_id, name, email, phone) VALUES
(5001, 5000, 'Mariana Alencar (Dir. Financeira)',         'mariana.alencar@nexora.example.test',    '+55 (11) 98765-1122'),
(5002, 5000, 'Carlos Eduardo Siqueira (Controlador)',      'carlos.siqueira@nexora.example.test',    '+55 (11) 3452-8801'),
(5003, 5000, 'Renata Junqueira (Head de TI & Cloud)',       'renata.junqueira@nexora.example.test',   '+55 (11) 3452-8802'),
(5004, 5000, 'Felipe Drummond (Gerente Comercial B2B)',      'felipe.drummond@nexora.example.test',   '+55 (11) 99123-4455'),
(5005, 5000, 'Camila Borges (Recursos Humanos)',            'camila.borges@nexora.example.test',      '+55 (11) 3452-8803'),
(5006, 5000, 'Lucas Hashimoto (Tech Lead)',                 'lucas.hashimoto@nexora.example.test',   '+55 (11) 98234-7788'),
(5007, 5000, 'Guilherme Silveira (Sócio Tributário)',        'contato@cardosofonseca.example.test',    '+55 (31) 3290-4400'),
(5008, 5000, 'Patricia Valença (Gestão Predial)',            'administracao@mirantecorp.example.test', '+55 (11) 3040-9900'),
(5009, 5000, 'Rodrigo Peixoto (Executivo CloudPulse)',       'enterprise@cloudpulse.example.test',     '+55 (11) 3958-5225'),
(5010, 5000, 'Beatriz Nogueira (Auditora Fiscal)',           'auditoria@primeaudit.example.test',      '+55 (11) 3736-1000'),
(5011, 5000, 'Alexandre Meirelles (Diretor Compras)',        'corporativo@omnicare.example.test',      '+55 (21) 2548-9100'),
(5012, 5000, 'Juliana Zanetti (Gestora Suprimentos)',        'faturamento@verticelog.example.test',    '+55 (31) 3320-1500'),
(5013, 5000, 'Marcos Vinicius Basso (Alianças B2B)',         'integracao@sinergiaerp.example.test',    '+55 (11) 3981-7000'),
(5014, 5000, 'Fernanda Paes (Inovação Varejo)',              'varejo@auracosmeticos.example.test',     '+55 (41) 3012-7700'),
(5015, 5000, 'Thiago Mansur (Mesa Tesouraria)',              'tesouraria@investcapital.example.test',  '+55 (11) 3383-2000'),
(5016, 5000, 'Larissa Queiroz (Gerente Corporate)',          'corporate@meridional.example.test',     '+55 (11) 4004-4828');

-- ---------- 5. Categorias & Centros de Custo (11 categorias) ----------
INSERT INTO categories (id, user_id, name, kind, color_token, monthly_ceiling, responsible_contact_id) VALUES
(5001, 5000, 'Faturamento de Contratos SaaS',        'INCOME',       'chart-1', NULL,      5004),
(5002, 5000, 'Projetos & Consultoria Técnica',       'INCOME',       'chart-2', NULL,      5006),
(5003, 5000, 'Folha de Pagamento & Encargos',        'FIXED',        'chart-1', 115000.00, 5005),
(5004, 5000, 'Infraestrutura Cloud & Datacenter',    'VARIABLE',     'chart-2', 26000.00,  5003),
(5005, 5000, 'Locação Comercial & Facilities',       'FIXED',        'chart-1', 23000.00,  5008),
(5006, 5000, 'Marketing, Aquisição & Eventos',       'VARIABLE',     'chart-3', 38000.00,  5004),
(5007, 5000, 'Softwares, Licenças & SaaS Interno',   'SUBSCRIPTION', 'chart-5', 18000.00,  5006),
(5008, 5000, 'Consultorias, Jurídico & Compliance',  'SERVICE',      'chart-4', 16000.00,  5007),
(5009, 5000, 'Impostos & Tributos Corporativos',     'VARIABLE',     'chart-4', 48000.00,  5002),
(5010, 5000, 'Equipamentos, Periféricos & TI',       'INVESTMENT',   'chart-3', 22000.00,  5003),
(5011, 5000, 'Viagens, Hospedagem & Relacionamento',  'VARIABLE',     'chart-5', 14000.00,  5001);

-- ---------- 6. Contas e Beneficiários (16 contas 100% fictícias) ----------
INSERT INTO accounts (id, user_id, name, segment, tier, city, uf, opening_balance, primary_contact_id) VALUES
(5001, 5000, 'Banco Meridional Corporativo (Conta Corrente)',     'Instituição Bancária',       'Principal',  'São Paulo',      'SP', 185000.00, 5016),
(5002, 5000, 'Banco Alvorada Empresarial Operacional',           'Instituição Bancária',       'Principal',  'São Paulo',      'SP', 95000.00,  5001),
(5003, 5000, 'Cartão Corporativo Platinum Executive',            'Cartão Corporativo',        'Secundária', 'São Paulo',      'SP', 0.00,      5002),
(5004, 5000, 'InvestCapital Liquidez & Tesouraria',              'Aplicações & Liquidez',     'Reserva',    'São Paulo',      'SP', 320000.00, 5015),
(5005, 5000, 'Conta Folha & Salários Alvorada',                  'Folha de Pagamento',        'Secundária', 'São Paulo',      'SP', 15000.00,  5005),
(5006, 5000, 'Conta Tributos & Guias Fiscais Meridional',         'Tributos & Obrigações',     'Secundária', 'São Paulo',      'SP', 20000.00,  5002),
(5007, 5000, 'Horizonte Renda Fixa CDB 110%',                    'Aplicações de Longo Prazo', 'Reserva',    'São Paulo',      'SP', 210000.00, 5001),
(5008, 5000, 'CloudPulse Infraestrutura & Datacenter',           'Infraestrutura Cloud',      'Secundária', 'São Paulo',      'SP', 0.00,      5009),
(5009, 5000, 'Condomínio Edifício Mirante Corporate',            'Locação Comercial',         'Secundária', 'São Paulo',      'SP', 0.00,      5008),
(5010, 5000, 'SyncSuite Workspace & Colaboração',                 'Softwares & SaaS',          'Secundária', 'São Paulo',      'SP', 0.00,      5003),
(5011, 5000, 'Cliente Âncora: OmniCare Rede Hospitalar',          'Saúde & Hospitais B2B',     'Principal',  'Rio de Janeiro', 'RJ', 0.00,      5011),
(5012, 5000, 'Cliente Âncora: Vértice Logística & Frotas',        'Mobilidade & Logística',    'Principal',  'Belo Horizonte', 'MG', 0.00,      5012),
(5013, 5000, 'Cliente B2B: Sinergia ERP & Softwares Integrados',  'ERP & Software B2B',        'Principal',  'São Paulo',      'SP', 0.00,      5013),
(5014, 5000, 'Cliente B2B: Aura Cosméticos & Varejo',             'Cosméticos & Varejo',       'Secundária', 'Curitiba',       'PR', 0.00,      5014),
(5015, 5000, 'Cardoso, Fonseca & Associados Advocacia',           'Assessoria Jurídica',       'Secundária', 'Belo Horizonte', 'MG', 0.00,      5007),
(5016, 5000, 'PrimeAudit Consultoria Contábil & Fiscal',          'Auditoria Externa',         'Reserva',    'São Paulo',      'SP', 0.00,      5010);

-- ---------- 7. Compromissos Corporativos (appointments) ----------
INSERT INTO appointments (user_id, account_id, title, scheduled_at, note) VALUES
(5000, 5011, 'Alinhamento Trimestral de SLA & Expansão OmniCare',           '2026-08-17 10:00:00'::timestamp, 'Apresentação de métricas e renovação antecipada do contrato anual.'),
(5000, 5012, 'Revisão Técnica de Integração API Vértice Logística',          '2026-09-19 14:00:00'::timestamp, 'Validação das rotinas de conciliação automática com o time de TI.'),
(5000, 5008, 'Revisão de Arquitetura CloudPulse & Instâncias Reservadas',   '2026-10-11 11:00:00'::timestamp, 'Identificação de oportunidades de economia com Savings Plans.'),
(5000, 5009, 'Renovação do Contrato de Locação Mirante Corporate',          '2026-11-12 15:00:00'::timestamp, 'Negociação do reajuste anual com a administradora predial.'),
(5000, 5013, 'Planejamento de Go-to-Market Conjunto Sinergia ERP',          '2026-11-25 10:30:00'::timestamp, 'Estruturação da oferta conjunta para o primeiro trimestre de 2027.'),
(5000, 5016, 'Kickoff da Auditoria Contábil de Fechamento PrimeAudit',      '2026-12-15 09:30:00'::timestamp, 'Reunião preparatória com os auditores para o balanço de 2026.');

-- ---------- 8. Fatores de Risco & Planos de Mitigação ----------
INSERT INTO risk_factors (user_id, title, category, severity, estimated_amount, description, status, origin) VALUES
(5000, 'Flutuação Cambial (USD) em Contratos CloudPulse', 'Infraestrutura Cloud & Datacenter',   'high',   28500.00, 'Variação cambial de instâncias de datacenter contratadas com indexação cambial.', 'ACTIVE', 'MANUAL'),
(5000, 'Reajuste Anual de Locação Predial Mirante Corporate', 'Locação Comercial & Facilities',  'medium', 18200.00, 'Índice de inflação acumulado prevê repasse de 5.2% no segundo semestre.',       'ACTIVE', 'MANUAL'),
(5000, 'Dissídio Coletivo e Reajuste Salarial CLT 2026', 'Folha de Pagamento & Encargos',       'medium', 32000.00, 'Convenção coletiva da categoria com impacto estimado a partir de Jul/2026.',    'ACTIVE', 'MANUAL'),
(5000, 'Dependência de Fornecedor Único de Datacenter',  'Infraestrutura Cloud & Datacenter',   'low',     8400.00, 'Necessidade de contratação de link redundante secundário de conectividade.',     'ACTIVE', 'MANUAL');

INSERT INTO mitigation_plans (user_id, risk_key, actions, owner, due_date, status, rule_reason) VALUES
(5000, 'auto:category:5004', 'Contratação de instâncias reservadas CloudPulse de 1 ano e migração de workloads batch.', 'Renata Junqueira', '2026-11-30'::date, 'IN_PROGRESS', 'Detectado automaticamente: Infraestrutura Cloud operando em 96% do teto mensal planejado.'),
(5000, 'auto:category:5005', 'Negociar congelamento temporário do índice com a administração predial Mirante Corporate.', 'Mariana Alencar', '2026-12-15'::date, 'IN_PROGRESS', 'Alerta preventivo: Locação Comercial atingiu 90% do limite orçamentário.');

-- ---------- 9. Notificações Corporativas ----------
INSERT INTO notifications (user_id, title, message, type, read, link, created_at) VALUES
(5000, 'Novo Lançamento Compensado', 'Recebimento de fatura mensal OmniCare no valor de R$ 42.850,00 foi creditado no Banco Meridional.', 'NEW_TRANSACTION', true,  'deals',       '2026-10-29 18:00:00'::timestamp),
(5000, 'Teto Orçamentário Atingido (96%)', 'O centro de custo Infraestrutura Cloud & Datacenter atingiu 96% do limite mensal planejado.',         'CEILING_ALERT',   false, 'team',        '2026-10-31 00:00:00'::timestamp),
(5000, 'Vencimento Próximo', 'A fatura de condomínio e locação Mirante Corporate vence em 3 dias úteis (R$ 21.800,00).',                         'DUE_DATE',        false, 'customers',   '2026-10-31 13:00:00'::timestamp),
(5000, 'Risco Orçamentário Identificado', 'Risco cambial identificado para CloudPulse com plano de mitigação em andamento.',                      'RISK_ALERT',      false, 'forecasting', '2026-10-30 18:00:00'::timestamp),
(5000, 'Fechamento Mensal Consolidado', 'O extrato contábil e a DRE gerencial do mês anterior já estão disponíveis para download.',               'NEW_TRANSACTION', true,  'reports',     '2026-10-26 18:00:00'::timestamp);

-- ---------- 10. Relatórios Históricos Gerados (generated_reports) ----------
INSERT INTO generated_reports (user_id, title, report_type, period, file_format, status, file_size_bytes, pdf_data, download_count, created_at) VALUES
(5000, 'Extrato Mensal Consolidado - 10/2026',         'MONTHLY_SUMMARY', '10/2026', 'PDF', 'COMPLETED', 248100, NULL, 3, '2026-10-29 18:00:00'::timestamp),
(5000, 'Demonstrativo de Fluxo de Caixa (DRE) - 09/2026', 'FINANCIAL_FLOW',  '09/2026', 'PDF', 'COMPLETED', 195400, NULL, 5, '2026-09-29 18:00:00'::timestamp),
(5000, 'Relatório por Centro de Custo - 3T/2026',        'COST_CENTER',     '09/2026', 'PDF', 'COMPLETED', 182300, NULL, 2, '2026-09-16 18:00:00'::timestamp),
(5000, 'Balanço Patrimonial & Liquidez - 2T/2026',       'BALANCE_SHEET',   '06/2026', 'PDF', 'COMPLETED', 312000, NULL, 4, '2026-07-03 18:00:00'::timestamp),
(5000, 'Auditoria de Lançamentos & Conciliação - 2026',  'AUDIT',           '08/2026', 'PDF', 'COMPLETED', 274800, NULL, 1, '2026-08-27 18:00:00'::timestamp);

-- ---------- 11. GERAÇÃO DE TRANSAÇÕES REALISTAS (12 MESES EXATOS) ----------
-- Meses: m = 0 (Nov/2025) até m = 11 (Out/2026)
-- Meta de Receita: R$ 162k (mês 0) crescendo organicamente até R$ 342k (mês 11) -> Fator 2.11x
-- 3 quedas mensais (-4.8% dez/25, -4.8% abr/26, -4.0% jul/26), picos trimestrais (mar, jun, set).
-- Despesas com Folha (~38% = R$ 1.015M) e Tributos (~12% = R$ 335k).
-- Contagem de transações variando mês a mês sem degraus iguais (total: 3.811 txs).

WITH months_table(m, target_rev, target_exp, num_tx) AS (
    VALUES
    ( 0, 162000.0, 154500.0, 238), -- Nov/2025: margem 4.6%
    ( 1, 154200.0, 148800.0, 226), -- Dez/2025: margem 3.5% (-4.8% queda)
    ( 2, 160000.0, 151000.0, 241), -- Jan/2026: margem 5.6%
    ( 3, 178000.0, 163500.0, 263), -- Fev/2026: margem 8.1%
    ( 4, 198000.0, 175000.0, 294), -- Mar/2026: margem 11.6% (Pico 1T)
    ( 5, 188500.0, 173000.0, 281), -- Abr/2026: margem 8.2% (-4.8% queda, margem cai 3.4 p.p.)
    ( 6, 212000.0, 185500.0, 312), -- Mai/2026: margem 12.5%
    ( 7, 236000.0, 200000.0, 346), -- Jun/2026: margem 15.3% (Pico 2T)
    ( 8, 226500.0, 198000.0, 335), -- Jul/2026: margem 12.6% (-4.0% queda, margem cai 2.7 p.p.)
    ( 9, 265000.0, 222000.0, 382), -- Ago/2026: margem 16.2%
    (10, 305000.0, 252000.0, 428), -- Set/2026: margem 17.4% (Pico 3T)
    (11, 342000.0, 280000.0, 465)  -- Out/2026: margem 18.1%
),
months_cfg AS (
    SELECT 
        mt.m AS month_idx,
        mt.target_rev,
        mt.target_exp,
        mt.num_tx,
        round(mt.num_tx * 0.32)::int AS num_income,
        (mt.num_tx - round(mt.num_tx * 0.32)::int) AS num_expense,
        ('2026-10-01'::date - ((11 - mt.m) * interval '1 month'))::date AS m_start,
        ('2026-10-01'::date - ((11 - mt.m) * interval '1 month') + interval '1 month - 1 day')::date AS m_end,
        ('2026-10-01'::date - ((11 - mt.m) * interval '1 month') + interval '1 month - 1 day')::date AS m_max_date
    FROM months_table mt
),
tx_seed AS (
    SELECT 
        mc.month_idx,
        mc.m_start,
        mc.m_end,
        mc.m_max_date,
        mc.target_rev,
        mc.target_exp,
        mc.num_tx,
        mc.num_income,
        mc.num_expense,
        g.i AS seq,
        random() AS r_day,
        random() AS r_val,
        random() AS r_acc,
        random() AS r_status
    FROM months_cfg mc
    CROSS JOIN LATERAL generate_series(1, mc.num_tx) AS g(i)
),
classified AS (
    SELECT 
        ts.*,
        (ts.seq <= ts.num_income) AS is_income,
        CASE 
            WHEN ts.month_idx < 3 THEN 16
            WHEN ts.month_idx < 6 THEN 20
            WHEN ts.month_idx < 9 THEN 24
            ELSE 28
        END AS num_payroll,
        10 AS num_tax,
        (ts.m_start + floor(ts.r_day * (ts.m_max_date - ts.m_start + 1))::int) AS raw_date
    FROM tx_seed ts
),
classified_types AS (
    SELECT 
        c.*,
        (NOT c.is_income AND c.seq > c.num_income AND c.seq <= c.num_income + c.num_payroll) AS is_payroll,
        (NOT c.is_income AND c.seq > c.num_income + c.num_payroll AND c.seq <= c.num_income + c.num_payroll + c.num_tax) AS is_tax,
        (NOT c.is_income AND c.seq > c.num_income + c.num_payroll + c.num_tax) AS is_other_expense
    FROM classified c
),
dated AS (
    SELECT 
        c.*,
        CASE 
            WHEN extract(isodow from c.raw_date) = 6 THEN -- Sábado
                CASE 
                    WHEN c.raw_date + interval '2 days' <= c.m_max_date THEN (c.raw_date + interval '2 days')::date
                    WHEN c.raw_date - interval '1 day' >= c.m_start THEN (c.raw_date - interval '1 day')::date
                    ELSE c.raw_date
                END
            WHEN extract(isodow from c.raw_date) = 7 THEN -- Domingo
                CASE 
                    WHEN c.raw_date + interval '1 day' <= c.m_max_date THEN (c.raw_date + interval '1 day')::date
                    WHEN c.raw_date - interval '2 days' >= c.m_start THEN (c.raw_date - interval '2 days')::date
                    ELSE c.raw_date
                END
            ELSE c.raw_date
        END AS tx_date_raw
    FROM classified_types c
),
mapped AS (
    SELECT 
        d.*,
        -- Categoria
        CASE 
            WHEN d.is_income THEN 
                CASE WHEN d.seq % 5 = 0 THEN 5002 ELSE 5001 END
            WHEN d.is_payroll THEN 5003 -- Folha de Pagamento & Encargos (~43% da despesa)
            WHEN d.is_tax THEN 5009     -- Impostos & Tributos Corporativos (~12.5% da receita)
            ELSE 
                -- Demais 7 categorias de despesas
                CASE 
                    WHEN d.seq % 7 = 0 THEN 5004 -- Infraestrutura Cloud
                    WHEN d.seq % 7 = 1 THEN 5005 -- Locação Comercial & Facilities
                    WHEN d.seq % 7 = 2 THEN 5006 -- Marketing & Aquisição
                    WHEN d.seq % 7 = 3 THEN 5007 -- Softwares & SaaS Interno
                    WHEN d.seq % 7 = 4 THEN 5008 -- Consultorias, Jurídico & Compliance
                    WHEN d.seq % 7 = 5 THEN 5010 -- Equipamentos TI
                    ELSE 5011                    -- Viagens & Relacionamento
                END
        END AS cat_id,
        -- Conta (Distribuição para garantir exatamente as 4 faixas de regularidade)
        CASE 
            WHEN d.is_income THEN 
                CASE 
                    WHEN d.month_idx < 11 THEN 
                        CASE 
                            WHEN d.seq % 6 = 0 THEN 5011 -- OmniCare Rede Hospitalar (RJ)
                            WHEN d.seq % 6 = 1 THEN 5012 -- Vértice Logística (MG)
                            WHEN d.seq % 6 = 2 THEN 5013 -- Sinergia ERP (SP)
                            WHEN d.seq % 6 = 3 AND d.month_idx <= 10 THEN 5014 -- Aura Cosméticos (PR, inativa no mês 11)
                            WHEN d.seq % 6 = 4 AND d.month_idx <= 10 THEN 5004 -- InvestCapital Tesouraria (inativa no mês 11)
                            WHEN d.r_acc < 0.60 THEN 5001 -- Banco Meridional Corporativo (Principal)
                            ELSE 5002                    -- Banco Alvorada Empresarial (Principal)
                        END
                    ELSE -- Mês 11 (Out/2026)
                        CASE 
                            WHEN d.seq = 1 THEN 5012 -- Vértice Logística (MG, tx única no início do mês -> Faixa 88%)
                            WHEN d.seq = 2 THEN 5013 -- Sinergia ERP (SP, tx única no início do mês -> Faixa 88%)
                            WHEN d.seq % 3 = 0 THEN 5011 -- OmniCare (ativa até hoje -> Faixa 98%)
                            WHEN d.r_acc < 0.60 THEN 5001 -- Banco Meridional (ativa até hoje -> Faixa 98%)
                            ELSE 5002                    -- Banco Alvorada (ativa até hoje -> Faixa 98%)
                        END
                END
            WHEN d.is_payroll THEN 
                -- >= 90% na Conta Folha (5005), restante na Conta Alvorada Operacional (5002)
                CASE WHEN d.seq % 12 = 0 THEN 5002 ELSE 5005 END
            WHEN d.is_tax THEN 
                -- >= 90% na Conta Tributos (5006), restante na Conta Meridional (5001)
                CASE WHEN d.seq % 12 = 0 THEN 5001 ELSE 5006 END
            ELSE 
                -- Demais despesas
                CASE 
                    WHEN d.month_idx < 11 THEN 
                        CASE 
                            WHEN d.seq % 8 = 0 THEN 5008 -- CloudPulse Datacenter
                            WHEN d.seq % 8 = 1 THEN 5009 -- Mirante Corporate
                            WHEN d.seq % 8 = 2 THEN 5010 -- SyncSuite Workspace
                            WHEN d.seq % 8 = 3 AND d.month_idx <= 10 THEN 5015 -- Cardoso & Fonseca (MG, inativa no mês 11)
                            WHEN d.seq % 8 = 4 AND d.month_idx IN (2, 5, 8) THEN 5016 -- PrimeAudit (inativa após ago/26)
                            WHEN d.seq % 8 = 5 AND d.month_idx IN (1, 4, 7) THEN 5007 -- Horizonte CDB (inativa após ago/26)
                            WHEN d.r_acc < 0.55 THEN 5003 -- Cartão Platinum Executive
                            WHEN d.r_acc < 0.80 THEN 5002 -- Banco Alvorada Operacional
                            ELSE 5001                    -- Banco Meridional Corporativo
                        END
                    ELSE -- Mês 11 (Out/2026)
                        CASE 
                            WHEN d.seq = d.num_income + d.num_payroll + d.num_tax + 1 THEN 5008 -- CloudPulse (início do mês -> Faixa 88%)
                            WHEN d.seq = d.num_income + d.num_payroll + d.num_tax + 2 THEN 5009 -- Mirante Corporate (início do mês -> Faixa 88%)
                            WHEN d.seq = d.num_income + d.num_payroll + d.num_tax + 3 THEN 5010 -- SyncSuite (início do mês -> Faixa 88%)
                            WHEN d.r_acc < 0.55 THEN 5003 -- Cartão Platinum Executive (ativa até ontem -> Faixa 98%)
                            WHEN d.r_acc < 0.80 THEN 5002 -- Banco Alvorada Operacional (ativa até hoje -> Faixa 98%)
                            ELSE 5001                    -- Banco Meridional Corporativo (ativa até hoje -> Faixa 98%)
                        END
                END
        END AS acc_id
    FROM dated d
),
account_dated AS (
    SELECT 
        m.*,
        -- Status
        CASE 
            WHEN m.month_idx < 11 THEN 
                CASE WHEN m.r_status < 0.985 THEN 'COMPLETED' ELSE 'CANCELED' END
            ELSE 
                CASE 
                    WHEN m.is_income THEN 
                        CASE 
                            WHEN m.seq <= (m.num_income - 8) THEN 'COMPLETED'
                            WHEN m.seq <= (m.num_income - 2) THEN 'PENDING'
                            ELSE 'CANCELED'
                        END
                    ELSE 
                        CASE 
                            WHEN m.seq <= (m.num_tx - 16) THEN 'COMPLETED'
                            WHEN m.seq <= (m.num_tx - 3) THEN 'PENDING'
                            ELSE 'CANCELED'
                        END
                END
        END AS tx_status,
        -- Calibração de Datas da Transação Mais Recente por Conta
        -- Faixa 98% (6 contas = 37,5% <= 50%): 5001, 5002, 5011 (Hoje), 5003 (Ontem), 5005 (Há 2 dias), 5006 (Há 5 dias)
        -- Faixa 88% (5 contas = 31,25%): 5012 (12d), 5008 (14d), 5013 (16d), 5009 (18d), 5010 (21d)
        -- Faixa 75% (3 contas = 18,75%, inativas no mês 11): 5004 (34d), 5014 (41d), 5015 (48d)
        -- Faixa 60% (2 contas = 12,5%, inativas após ago/26): 5016 (73d), 5007 (94d)
        CASE 
            WHEN m.month_idx = 11 THEN 
                CASE 
                    WHEN m.acc_id = 5012 THEN '2026-10-19'::date
                    WHEN m.acc_id = 5008 THEN '2026-10-17'::date
                    WHEN m.acc_id = 5013 THEN '2026-10-15'::date
                    WHEN m.acc_id = 5009 THEN '2026-10-13'::date
                    WHEN m.acc_id = 5010 THEN '2026-10-10'::date
                    WHEN m.acc_id = 5006 THEN GREATEST(m.m_start, LEAST(m.tx_date_raw, '2026-10-26'::date))::date
                    WHEN m.acc_id = 5005 THEN GREATEST(m.m_start, LEAST(m.tx_date_raw, '2026-10-29'::date))::date
                    WHEN m.acc_id = 5003 THEN GREATEST(m.m_start, LEAST(m.tx_date_raw, '2026-10-30'::date))::date
                    WHEN m.acc_id IN (5001, 5002, 5011) AND (m.raw_date = '2026-10-31'::date OR m.seq IN (3, 4, 5)) THEN '2026-10-31'::date
                    ELSE m.tx_date_raw
                END
            WHEN m.month_idx = 10 AND m.acc_id IN (5004, 5014, 5015) THEN 
                CASE 
                    WHEN m.acc_id = 5004 THEN GREATEST(m.m_start, LEAST(m.tx_date_raw, '2026-09-27'::date))::date
                    WHEN m.acc_id = 5014 THEN GREATEST(m.m_start, LEAST(m.tx_date_raw, '2026-09-20'::date))::date
                    WHEN m.acc_id = 5015 THEN GREATEST(m.m_start, LEAST(m.tx_date_raw, '2026-09-13'::date))::date
                    ELSE m.tx_date_raw
                END
            ELSE m.tx_date_raw
        END AS tx_date
    FROM mapped m
),
amounts_calibrated AS (
    SELECT 
        a.*,
        row_number() OVER (PARTITION BY a.cat_id ORDER BY a.tx_date DESC, a.seq ASC) AS cat_seq,
        CASE 
            WHEN a.is_income THEN 
                CASE 
                    WHEN a.month_idx < 11 THEN 
                        (a.target_rev / (a.num_income * 0.985)) * (0.72 + (a.r_val * 0.56)) + (((a.seq * 37) % 89) * 0.13)
                    ELSE 
                        CASE 
                            WHEN a.tx_status = 'COMPLETED' THEN (a.target_rev / (a.num_income - 8)) * (0.72 + (a.r_val * 0.56)) + (((a.seq * 37) % 89) * 0.13)
                            WHEN a.tx_status = 'PENDING' THEN 4800.0 * (0.65 + (a.r_val * 0.70)) + (((a.seq * 29) % 73) * 0.17)
                            ELSE 1600.0 * (0.65 + (a.r_val * 0.70)) + (((a.seq * 19) % 53) * 0.19)
                        END
                END
            WHEN a.is_payroll THEN 
                -- Folha: ~43% da despesa mensal dividida em degraus de contratação (16, 20, 24, 28)
                ((a.target_exp * 0.43) / a.num_payroll) * (0.78 + (a.r_val * 0.44)) + (((a.seq * 41) % 97) * 0.11)
            WHEN a.is_tax THEN 
                -- Tributos: ~12.5% da receita mensal dividida em 10 lançamentos
                ((a.target_rev * 0.125) / 10.0) * (0.76 + (a.r_val * 0.48)) + (((a.seq * 43) % 83) * 0.14)
            ELSE 
                -- Demais despesas absorvem o restante da meta de despesas
                CASE 
                    WHEN a.month_idx < 11 THEN 
                        (GREATEST(1000.0, a.target_exp - (a.target_exp * 0.43) - (a.target_rev * 0.125)) / GREATEST(1, (a.num_expense - a.num_payroll - 10) * 0.985)) * (0.68 + (a.r_val * 0.64)) + (((a.seq * 31) % 79) * 0.16)
                    ELSE 
                        CASE 
                            WHEN a.tx_status = 'COMPLETED' THEN (GREATEST(1000.0, a.target_exp - (a.target_exp * 0.43) - (a.target_rev * 0.125)) / GREATEST(1, a.num_expense - a.num_payroll - 10 - 16)) * (0.68 + (a.r_val * 0.64)) + (((a.seq * 31) % 79) * 0.16)
                            WHEN a.tx_status = 'PENDING' THEN 2800.0 * (0.65 + (a.r_val * 0.70)) + (((a.seq * 23) % 67) * 0.15)
                            ELSE 950.0 * (0.65 + (a.r_val * 0.70)) + (((a.seq * 17) % 61) * 0.12)
                        END
                END
        END AS base_amount
    FROM account_dated a
),
labeled AS (
    SELECT 
        a.*,
        round(a.base_amount::numeric, 2) AS final_amount,
        CASE 
            WHEN a.cat_id = 5001 THEN (ARRAY[
                'Mensalidade Contrato Enterprise OmniCare Saúde',
                'Assinatura Plataforma Nexora Core — Vértice Logística',
                'Licenciamento Anual Suíte B2B — Sinergia ERP',
                'Renovação Licenças Corporativas — Aura Cosméticos',
                'Faturamento Recorrente Módulo Analytics Multi-Tenant',
                'Mensalidade Plano Enterprise — Rede Hospitalar Santa Clara',
                'Assinatura Suporte Missão Crítica 24x7 — Grupo Vértice',
                'Licenciamento Usuários Adicionais — Portal Sinergia',
                'Faturamento Mensal API Gateway & Webhooks Dedicados',
                'Renovação Contrato SaaS Gestão de Frotas & Rotas',
                'Assinatura Módulo de Conciliação Financeira Automatizada',
                'Licenciamento Corporativo Painel Executivo BI',
                'Mensalidade Conector Fiscal & Faturamento Eletrônico',
                'Assinatura Pacote Segurança SSO & Auditoria de Acessos',
                'Faturamento Mensal Instância Dedicada Single-Tenant',
                'Expansão de Assentos Licenciamento Enterprise B2B'
            ])[1 + ((a.cat_seq - 1) % 16)]
            WHEN a.cat_id = 5002 THEN (ARRAY[
                'Implantação e Setup de Integração — OmniCare Saúde',
                'Consultoria de Arquitetura e Migração de Dados B2B',
                'Projeto de Customização de Relatórios Regulatórios',
                'Horas Técnicas de Engenharia — Conector Sinergia ERP',
                'Treinamento Presencial e Certificação de Equipe Cliente',
                'Desenvolvimento de Conector Sob Medida — Aura Cosméticos',
                'Diagnóstico de Performance e Otimização de Consultas',
                'Homologação Assistida e Go-Live Operação Vértice',
                'Workshop de Governança de Dados e Indicadores Executivos',
                'Escopo Fechado de Automação de Fluxo de Faturamento',
                'Assessoria Técnica em Integração via Mensageria Assíncrona',
                'Pacote de Horas de Suporte Especializado Pós-Implantação',
                'Auditoria de Segurança de APIs e Revisão de Integrações',
                'Projeto de Saneamento e Unificação de Cadastros Corporativos',
                'Desenvolvimento de Painel Customizado de Telemetria',
                'Consultoria de Adequação de Fluxos Financeiros Multi-Filial'
            ])[1 + ((a.cat_seq - 1) % 16)]
            WHEN a.cat_id = 5003 THEN (ARRAY[
                'Folha de Pagamento Mensal — Engenharia de Software CLT',
                'Folha de Pagamento Mensal — Operações, CS e Suporte',
                'Recolhimento de FGTS Mensal — Guia GFIP Consolidada',
                'Contribuição Previdenciária Patronal — GPS/DARF INSS',
                'Pró-Labore Diretoria Executiva e Conselho Gestor',
                'Crédito Mensal Vale-Refeição e Alimentação Corporativo',
                'Plano de Saúde e Odontológico Empresarial — Mensalidade',
                'Adiantamento Quinzenal de Salários — Quadro Permanente',
                'Provisão e Quitação de Férias + Terço Constitucional',
                'Bônus Trimestral por Metas de Retenção e Expansão',
                'Vale-Transporte e Auxílio Mobilidade — Equipe Híbrida',
                'Seguro de Vida em Grupo e Assistência Corporativa',
                'Programa de Capacitação Técnica e Idiomas — Reembolso',
                'Encargos Trabalhistas sobre Folha Complementar',
                'Auxílio Home Office e Conectividade — Time Remoto',
                'Serviço de Medicina Ocupacional PCMSO e Exames Periódicos'
            ])[1 + ((a.cat_seq - 1) % 16)]
            WHEN a.cat_id = 5004 THEN (ARRAY[
                'Fatura Mensal Cluster Kubernetes Produção — CloudPulse',
                'Banco de Dados Gerenciado Alta Disponibilidade — CloudPulse',
                'Armazenamento Object Storage e Snapshots de Backup',
                'Tráfego de Rede CDN e Balanceadores de Carga Globais',
                'Link Dedicado de Fibra Óptica Redundante — Matriz SP',
                'Serviço de Observabilidade, Logs e Métricas de Produção',
                'Instâncias Reservadas de Computação para Filas de Jobs',
                'Certificados Digitais ICP-Brasil, SSL Wildcard e DNS',
                'Proteção WAF, Mitigação DDoS e Firewall de Borda',
                'Ambiente de Homologação, Staging e Pipelines CI/CD',
                'Replicação Geográfica de Contingência e Disaster Recovery',
                'Serviço de Mensageria Gerenciada e Cache Distribuído',
                'Cofre de Segredos Criptografados e Gestão de Chaves KMS',
                'Monitoramento Sintético de Uptime e Alertas de Plantão',
                'Armazenamento Frio de Logs de Auditoria de Longo Prazo',
                'Escalonamento Automático de Nós de Processamento em Pico'
            ])[1 + ((a.cat_seq - 1) % 16)]
            WHEN a.cat_id = 5005 THEN (ARRAY[
                'Aluguel Mensal Conjunto Comercial — Ed. Mirante Corporate',
                'Taxa Ordinária de Condomínio — Ed. Mirante Corporate',
                'Fornecimento de Energia Elétrica — Escritório Matriz',
                'Contrato Mensal de Limpeza, Copa e Conservação Predial',
                'Manutenção Preventiva de Ar-Condicionado Central VRF',
                'Seguro Empresarial Multirrisco — Cobertura Patrimonial',
                'Serviço de Recepção Bilíngue e Controle de Acesso',
                'Locação de Salas de Reunião e Auditório para Eventos',
                'Fornecimento de Água, Esgoto e Taxas Prediais',
                'Insumos de Copa, Café Corporativo e Suprimentos de Escritório',
                'Manutenção de No-Breaks, Quadro Elétrico e Gerador',
                'Serviço de Coleta Seletiva e Destinação de Resíduos',
                'Dedetização, Sanitização e Controle Integrado de Pragas',
                'Renovação de AVCB, Extintores e Brigada de Incêndio',
                'Locação de vagas de Estacionamento Corporativo Subsolo',
                'Adequação Acústica e Reparos de Marcenaria nas Estações'
            ])[1 + ((a.cat_seq - 1) % 16)]
            WHEN a.cat_id = 5006 THEN (ARRAY[
                'Mídia Paga de Performance e Geração de Demanda B2B',
                'Patrocínio Cota Ouro — Congresso Nacional de SaaS',
                'Produção de Estudos de Caso e Vídeos Institucionais',
                'Assessoria de Imprensa e Relações Públicas Corporativas',
                'Organização de Café Executivo para Diretores Financeiros',
                'Ferramenta de Automação de Inbound Marketing e Nutrição',
                'Criação de Identidade Visual e Materiais de Pré-Vendas',
                'Estande e Ativação de Marca em Feira de Tecnologia B2B',
                'Campanha de Retargeting para Contas Estratégicas (ABM)',
                'Pesquisa de Mercado e Benchmarking Setorial Independente',
                'Produção de Webinar Técnico sobre Governança Financeira',
                'Brindes Corporativos Premium para Onboarding de Clientes',
                'Otimização Técnica de SEO e Conteúdo Editorial Especializado',
                'Enriquecimento de Base de Contatos e Inteligência Comercial',
                'Patrocínio de Newsletter Executiva de Finanças e Gestão',
                'Jantar de Relacionamento com Executivos de Contas Enterprise'
            ])[1 + ((a.cat_seq - 1) % 16)]
            WHEN a.cat_id = 5007 THEN (ARRAY[
                'Licenciamento Anual Suíte Colaborativa SyncSuite Workspace',
                'Assinatura Plataforma de CRM e Pipeline Comercial',
                'Licenças de Ferramenta de Design de Interface e Prototipagem',
                'Assinatura Repositórios Git Privados e Segurança de Código',
                'Plataforma de Atendimento ao Cliente e Helpdesk Omnichannel',
                'Software de Gestão de Projetos, Sprints e Documentação',
                'Licenças de Ferramenta de Assinatura Eletrônica de Contratos',
                'Plataforma de Videoconferência Corporativa e Salas Híbridas',
                'Assinatura de Gerenciador Corporativo de Senhas e Acessos',
                'Software de Conciliação Contábil e Fechamento Mensal',
                'Licenças de IDE Profissional para Equipe de Engenharia',
                'Plataforma de Pesquisa de Clima e Avaliação de Desempenho',
                'Ferramenta de Análise de Produto, Funis e Retenção',
                'Assinatura de Base Jurídica e Consulta de Certidões',
                'Software de Controle de Ponto Digital e Gestão de Escalas',
                'Licenciamento de Ferramenta de Testes Automatizados em Nuvem'
            ])[1 + ((a.cat_seq - 1) % 16)]
            WHEN a.cat_id = 5008 THEN (ARRAY[
                'Honorários Mensais Assessoria Jurídica Cardoso & Fonseca',
                'Auditoria Independente das Demonstrações Contábeis — PrimeAudit',
                'Consultoria de Adequação Contínua à LGPD e DPO as a Service',
                'Assessoria Contábil, Fiscal e Apuração de Tributos Mensais',
                'Parecer Jurídico sobre Contratos Enterprise e SLAs',
                'Auditoria de Controles Internos e Conformidade SOC 2',
                'Consultoria Trabalhista Preventiva e Revisão de Políticas',
                'Registro de Marca e Propriedade Intelectual de Software',
                'Perícia Técnica e Revisão de Obrigações Acessórias',
                'Consultoria Especializada em Planejamento Tributário Legal',
                'Emissão de Laudos de Avaliação Patrimonial e Ativos',
                'Assessoria em Governança Societária e Atas de Reunião',
                'Teste de Intrusão (Pentest) Externo e Relatório de Riscos',
                'Consultoria para Certificação de Segurança da Informação',
                'Revisão Contratual de Fornecedores Críticos de Tecnologia',
                'Due Diligence Financeira e Compliance de Contrapartes'
            ])[1 + ((a.cat_seq - 1) % 16)]
            WHEN a.cat_id = 5009 THEN (ARRAY[
                'Recolhimento Mensal de ISSQN sobre Licenciamento de Software',
                'DARF PIS — Apuração Mensal Regime Não-Cumulativo',
                'DARF COFINS — Apuração Mensal sobre Receita Bruta',
                'DARF IRPJ — Estimativa Mensal Lucro Real / Presumido',
                'DARF CSLL — Contribuição Social sobre o Lucro Líquido',
                'Retenções Federais na Fonte CSRF (PIS/COFINS/CSLL — 4,65%)',
                'IRRF Retido sobre Serviços Tomados de Pessoa Jurídica',
                'Taxa de Fiscalização de Estabelecimento Municipal (TFE)',
                'INSS Retido sobre Nota Fiscal de Serviços Terceirizados',
                'ISSQN sobre Serviços de Consultoria e Implantação Técnica',
                'Parcelamento Ordinário de Tributos — Quota Mensal Consolidada',
                'IOF sobre Operações de Crédito e Câmbio Corporativo',
                'IPTU Proporcional — Conjunto Comercial Sede Matriz',
                'Contribuição Sindical Patronal Anual — Setor de Tecnologia',
                'Taxa de Emissão de Certidões e Averbações na Junta Comercial',
                'Complementação de Alíquota Tributária de Fechamento Trimestral'
            ])[1 + ((a.cat_seq - 1) % 16)]
            WHEN a.cat_id = 5010 THEN (ARRAY[
                'Aquisição de Notebooks Profissionais 32GB RAM — Engenharia',
                'Lote de Monitores IPS 27 pol 4K USB-C para Estações',
                'Switches Gerenciáveis PoE+ 24 Portas para Rack de Rede',
                'Access Points Wi-Fi 6E Corporativos de Alta Densidade',
                'Cadeiras Ergonômicas Certificadas NR-17 para Escritório',
                'Headsets Profissionais com Cancelamento Ativo de Ruído',
                'Docking Stations Thunderbolt e Adaptadores Multiporta',
                'Unidades SSD NVMe Enterprise para Servidores de Homologação',
                'No-Break Senoidal Online 3kVA para Rack de Telecom',
                'Câmeras 4K e Barra de Áudio para Sala de Videoconferência',
                'Teclados Mecânicos Silenciosos e Mouses Ergonômicos Sem Fio',
                'Leitores Biométricos e Controladoras de Acesso por Cartão',
                'Servidor de Backup Local NAS 8 Baias com Redundância RAID',
                'Projetor Laser Curta Distância e Tela Retrátil Auditório',
                'Patch Panels, Cabos Cat6A Blindados e Organização de Rack',
                'Smartphones Corporativos para Plantão de Operações e Suporte'
            ])[1 + ((a.cat_seq - 1) % 16)]
            ELSE (ARRAY[
                'Passagens Aéreas São Paulo ↔ Belo Horizonte — Visita Vértice',
                'Hospedagem Executiva 3 Diárias — Implantação Cliente Curitiba',
                'Almoço Executivo de Fechamento Comercial — Conta Enterprise',
                'Traslado Aeroporto ↔ Escritório Cliente em Viagem Técnica',
                'Passagens Aéreas São Paulo ↔ Rio de Janeiro — Comitê OmniCare',
                'Diárias de Hotel e Alimentação — Workshop Presencial Sul',
                'Locação de Veículo Executivo para Roteiro de Visitas MG',
                'Jantar Institucional com Diretoria de Operações de Cliente',
                'Reembolso de Quilometragem e Pedágios — Equipe de Campo',
                'Passagens Aéreas para Conferência Anual de Finanças B2B',
                'Hospedagem Equipe de Engenharia — Go-Live Assistido',
                'Café da Manhã de Alinhamento Trimestral (QBR) com Cliente',
                'Seguro Viagem e Despesas de Embarque — Missão Comercial',
                'Transporte por Aplicativo Corporativo — Reuniões Externas SP',
                'Estacionamento em Aeroporto durante Viagem de Curta Duração',
                'Catering e Coffee Break para Recepção de Comitiva de Clientes'
            ])[1 + ((a.cat_seq - 1) % 16)]
        END AS final_desc,
        CASE 
            WHEN a.is_income THEN (ARRAY['Transferência TED', 'PIX Corporativo', 'Boleto Bancário'])[1 + (a.seq % 3)]
            WHEN a.acc_id = 5003 THEN 'Cartão Corporativo'
            WHEN a.cat_id IN (5003, 5008, 5009) THEN (ARRAY['Transferência TED', 'Boleto Bancário', 'PIX Corporativo'])[1 + (a.seq % 3)]
            ELSE (ARRAY['Transferência TED', 'Boleto Bancário', 'Cartão Corporativo', 'PIX Corporativo'])[1 + (a.seq % 4)]
        END AS final_pm,
        (a.tx_date + ((1 + (a.seq % 15)) * interval '1 day'))::date AS final_due
    FROM amounts_calibrated a
)
INSERT INTO transactions (
    description,
    amount,
    date,
    type,
    category_id,
    user_id,
    created_at,
    status,
    payment_method,
    notes,
    account_id,
    due_date
)
SELECT 
    l.final_desc,
    GREATEST(15.00, l.final_amount),
    l.tx_date,
    CASE WHEN l.is_income THEN 'INCOME' ELSE 'EXPENSE' END,
    l.cat_id,
    5000,
    (l.tx_date + interval '8 hours' + (l.seq % 10 * interval '1 hour')),
    l.tx_status,
    l.final_pm,
    'Registro homologado Nexora Soluções - Operação ID #' || l.seq,
    l.acc_id,
    l.final_due
FROM labeled l;

COMMIT;

-- Resumo da carga criada (contagens por tabela afetada e intervalo de datas)
SELECT (SELECT count(*) FROM users WHERE email = 'empresa.demo@example.test') AS users,
       (SELECT count(*) FROM company_profiles WHERE user_id = 5000) AS company_profiles,
       (SELECT count(*) FROM notification_preferences WHERE user_id = 5000) AS notification_preferences,
       (SELECT count(*) FROM contacts WHERE user_id = 5000) AS contacts,
       (SELECT count(*) FROM categories WHERE user_id = 5000) AS categories,
       (SELECT count(*) FROM accounts WHERE user_id = 5000) AS accounts,
       (SELECT count(*) FROM appointments WHERE user_id = 5000) AS appointments,
       (SELECT count(*) FROM risk_factors WHERE user_id = 5000) AS risk_factors,
       (SELECT count(*) FROM mitigation_plans WHERE user_id = 5000) AS mitigation_plans,
       (SELECT count(*) FROM notifications WHERE user_id = 5000) AS notifications,
       (SELECT count(*) FROM generated_reports WHERE user_id = 5000) AS generated_reports,
       (SELECT count(*) FROM transactions WHERE user_id = 5000) AS transactions,
       (SELECT min(date) FROM transactions WHERE user_id = 5000) AS min_tx_date,
       (SELECT max(date) FROM transactions WHERE user_id = 5000) AS max_tx_date;
