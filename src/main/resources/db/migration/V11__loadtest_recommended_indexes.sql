-- V11: índices recomendados após a carga sintética de 30 clientes x 12 meses (EXPLAIN ANALYZE).
-- Índice de cobertura para somas por categoria/mês: evita ler a tabela e descartar linhas por type/status.
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_cover
    ON transactions (user_id, date) INCLUDE (type, status, amount, category_id);

-- Notificações não lidas ordenadas por data: evita o Sort em memória.
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
    ON notifications (user_id, read, created_at DESC);

-- Filtros por conta no dashboard (contas/transações por período).
CREATE INDEX IF NOT EXISTS idx_transactions_user_account_date
    ON transactions (user_id, account_id, date);
