CREATE TABLE IF NOT EXISTS contacts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contacts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    segment VARCHAR(100),
    tier VARCHAR(50) NOT NULL DEFAULT 'Principal',
    city VARCHAR(100),
    uf VARCHAR(2),
    opening_balance NUMERIC(19, 2) NOT NULL DEFAULT 0.00,
    primary_contact_id BIGINT,
    archived_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_accounts_primary_contact FOREIGN KEY (primary_contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT ck_accounts_opening_balance CHECK (opening_balance >= 0)
);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_archived ON accounts(user_id, archived_at);

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS responsible_contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS due_date DATE NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);

CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_appointments_user_account ON appointments(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);

-- Seed de Contatos e Contas vinculados ao usuário de teste/demo
DO $$
DECLARE
    v_user_id BIGINT;
    v_contact1 BIGINT;
    v_contact2 BIGINT;
    v_contact3 BIGINT;
    v_contact4 BIGINT;
    v_contact5 BIGINT;
    v_contact6 BIGINT;
    v_account1 BIGINT;
    v_account2 BIGINT;
    v_account3 BIGINT;
    v_account4 BIGINT;
    v_account5 BIGINT;
    v_account6 BIGINT;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = 'admin@moneta.com.br' LIMIT 1;
    IF v_user_id IS NOT NULL THEN
        -- Contatos
        INSERT INTO contacts (user_id, name, email, phone)
        VALUES (v_user_id, 'Diretoria Financeira', 'financeiro@horizonte.example.test', '+55 (11) 3214-5678')
        RETURNING id INTO v_contact1;

        INSERT INTO contacts (user_id, name, email, phone)
        VALUES (v_user_id, 'Gerência Corporate', 'corporate@itau-bba.com.br', '+55 (11) 4004-4828')
        RETURNING id INTO v_contact2;

        INSERT INTO contacts (user_id, name, email, phone)
        VALUES (v_user_id, 'Gestão Predial', 'locacao@corporatetower.com.br', '+55 (21) 2548-9000')
        RETURNING id INTO v_contact3;

        INSERT INTO contacts (user_id, name, email, phone)
        VALUES (v_user_id, 'Account Manager B2B', 'aws-billing@amazon.com', '+55 (11) 3958-5225')
        RETURNING id INTO v_contact4;

        INSERT INTO contacts (user_id, name, email, phone)
        VALUES (v_user_id, 'Sócia Tributária', 'juridico@silveiraadv.com.br', '+55 (31) 3456-7890')
        RETURNING id INTO v_contact5;

        INSERT INTO contacts (user_id, name, email, phone)
        VALUES (v_user_id, 'Gestor Comercial B2B', 'empresas@flashapp.com.br', '+55 (11) 3090-8800')
        RETURNING id INTO v_contact6;

        -- Contas
        INSERT INTO accounts (user_id, name, segment, tier, city, uf, opening_balance, primary_contact_id)
        VALUES (v_user_id, 'Horizonte Tecnologia Ltda', 'SaaS & Tecnologia B2B', 'Principal', 'São Paulo', 'SP', 48500.00, v_contact1)
        RETURNING id INTO v_account1;

        INSERT INTO accounts (user_id, name, segment, tier, city, uf, opening_balance, primary_contact_id)
        VALUES (v_user_id, 'Banco Itaú BBA Corporate', 'Instituição Bancária Corporate', 'Principal', 'São Paulo', 'SP', 32000.00, v_contact2)
        RETURNING id INTO v_account2;

        INSERT INTO accounts (user_id, name, segment, tier, city, uf, opening_balance, primary_contact_id)
        VALUES (v_user_id, 'Corporate Tower Empreendimentos', 'Locação Comercial & Imóveis', 'Secundária', 'Rio de Janeiro', 'RJ', 15600.00, v_contact3)
        RETURNING id INTO v_account3;

        INSERT INTO accounts (user_id, name, segment, tier, city, uf, opening_balance, primary_contact_id)
        VALUES (v_user_id, 'Amazon Web Services (AWS)', 'Infraestrutura Cloud & TI', 'Secundária', 'São Paulo', 'SP', 9800.00, v_contact4)
        RETURNING id INTO v_account4;

        INSERT INTO accounts (user_id, name, segment, tier, city, uf, opening_balance, primary_contact_id)
        VALUES (v_user_id, 'Silveira & Associados Advocacia', 'Assessoria Jurídica & Compliance', 'Reserva', 'Belo Horizonte', 'MG', 4500.00, v_contact5)
        RETURNING id INTO v_account5;

        INSERT INTO accounts (user_id, name, segment, tier, city, uf, opening_balance, primary_contact_id)
        VALUES (v_user_id, 'Flash Benefícios & Corporativo', 'Benefícios Corporativos & RH', 'Principal', 'São Paulo', 'SP', 27500.00, v_contact6)
        RETURNING id INTO v_account6;

        -- Compromissos de exemplo
        INSERT INTO appointments (user_id, account_id, title, scheduled_at, note)
        VALUES (v_user_id, v_account1, 'Alinhamento Trimestral de Metas', CURRENT_TIMESTAMP + INTERVAL '3 days', 'Revisar expansão de licenças e faturamento consolidado');

        INSERT INTO appointments (user_id, account_id, title, scheduled_at, note)
        VALUES (v_user_id, v_account4, 'Revisão de Consumo de Instâncias EC2', CURRENT_TIMESTAMP + INTERVAL '7 days', 'Avaliar migração para Reserved Instances para redução de custos');

        -- Vincular transações existentes às contas
        UPDATE transactions SET account_id = v_account4 WHERE user_id = v_user_id AND (description ILIKE '%cloud%' OR description ILIKE '%aws%' OR category_id = 3);
        UPDATE transactions SET account_id = v_account3 WHERE user_id = v_user_id AND (description ILIKE '%loca%' OR description ILIKE '%aluguel%' OR category_id = 2);
        UPDATE transactions SET account_id = v_account5 WHERE user_id = v_user_id AND (description ILIKE '%jurid%' OR description ILIKE '%consult%' OR category_id = 5);
        UPDATE transactions SET account_id = v_account1 WHERE user_id = v_user_id AND (type = 'INCOME' OR account_id IS NULL);
    END IF;
END $$;
