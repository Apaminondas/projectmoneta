ALTER TABLE transactions
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    ADD COLUMN payment_method VARCHAR(50),
    ADD COLUMN notes VARCHAR(500);

ALTER TABLE transactions
    ADD CONSTRAINT ck_transactions_status CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELED'));

-- Enriquecer dados dos lançamentos existentes de exemplo se houver
UPDATE transactions
SET payment_method = 'Transferência TED',
    notes = 'Depósito de salário mensal líquido - Empresa Tech Corp'
WHERE description ILIKE '%Salário%';

UPDATE transactions
SET status = 'PENDING',
    payment_method = 'Boleto Bancário',
    notes = 'Aluguel do apartamento referente ao mês corrente'
WHERE description ILIKE '%Aluguel%';

UPDATE transactions
SET payment_method = 'Cartão de Crédito',
    notes = 'Compras de mantimentos mensais para a residência'
WHERE description ILIKE '%Supermercado%';

UPDATE transactions
SET payment_method = 'PIX',
    notes = 'Abastecimento semanal de combustível no posto Shell'
WHERE description ILIKE '%Combustível%';

UPDATE transactions
SET payment_method = 'Cartão de Débito',
    notes = 'Jantar de confraternização no fim de semana'
WHERE description ILIKE '%Restaurante%';
