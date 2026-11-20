-- V8: Notifications Table and Seed Data
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Seed initial notifications for existing users
INSERT INTO notifications (user_id, title, message, type, read, link, created_at)
SELECT u.id,
       'Teto Orçamentário Atingido (82%)',
       'O centro de custo Infraestrutura Cloud atingiu 82% do limite planejado.',
       'CEILING_ALERT',
       FALSE,
       'team',
       NOW() - INTERVAL '25 minutes'
FROM users u
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, read, link, created_at)
SELECT u.id,
       'Vencimento Próximo',
       'A fatura AWS B2B vence em 3 dias (R$ 2.850,00).',
       'DUE_DATE',
       FALSE,
       'customers',
       NOW() - INTERVAL '2 hours'
FROM users u
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, read, link, created_at)
SELECT u.id,
       'Novo Lançamento Compensado',
       'Receita Faturamento Contrato SaaS Enterprise no valor de R$ 24.850,00 foi creditada.',
       'NEW_TRANSACTION',
       TRUE,
       'deals',
       NOW() - INTERVAL '1 day'
FROM users u
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, read, link, created_at)
SELECT u.id,
       'Risco Orçamentário Identificado',
       'Risco de flutuação cambial (USD) detectado para contratos de nuvem.',
       'RISK_ALERT',
       TRUE,
       'forecasting',
       NOW() - INTERVAL '2 days'
FROM users u
ON CONFLICT DO NOTHING;
