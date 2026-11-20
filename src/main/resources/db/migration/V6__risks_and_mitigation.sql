CREATE TABLE IF NOT EXISTS risk_factors (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    severity VARCHAR(30) NOT NULL DEFAULT 'medium',
    estimated_amount NUMERIC(19, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    origin VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_risk_factors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_risk_factors_user_id ON risk_factors(user_id);

CREATE TABLE IF NOT EXISTS mitigation_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    risk_key VARCHAR(100) NOT NULL,
    actions TEXT,
    owner VARCHAR(150),
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    rule_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mitigation_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_mitigation_user_risk UNIQUE (user_id, risk_key)
);
CREATE INDEX IF NOT EXISTS idx_mitigation_plans_user_risk ON mitigation_plans(user_id, risk_key);

-- Seed de exemplo para o usuário admin
DO $$
DECLARE
    v_user_id BIGINT;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = 'admin@moneta.com.br' LIMIT 1;
    IF v_user_id IS NOT NULL THEN
        -- Risco manual de exemplo
        INSERT INTO risk_factors (user_id, title, category, severity, estimated_amount, description, status, origin)
        VALUES (v_user_id, 'Renovação de Contrato Jurídico', 'Consultorias & Jurídico', 'medium', 1200.00,
                'Reajuste anual pelo IGP-M com impacto no segundo semestre', 'ACTIVE', 'MANUAL');

        -- Plano de mitigação para o risco automático de locação comercial (teto próximo)
        INSERT INTO mitigation_plans (user_id, risk_key, actions, owner, due_date, status, rule_reason)
        VALUES (v_user_id, 'auto:category:2',
                'Negociar carência e congelamento de índice com a imobiliária administradora',
                'Diretoria Financeira', CURRENT_DATE + INTERVAL '15 days', 'IN_PROGRESS',
                'Detectado automaticamente: Locação Comercial atingiu 84% do teto mensal.');
    END IF;
END $$;
