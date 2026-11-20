ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS color_token VARCHAR(30) NOT NULL DEFAULT 'chart-1',
    ADD COLUMN IF NOT EXISTS monthly_ceiling NUMERIC(19, 2),
    ADD COLUMN IF NOT EXISTS kind VARCHAR(30) NOT NULL DEFAULT 'VARIABLE';

-- Atualiza dados de demonstração com cores, tetos e tipos
UPDATE categories SET color_token = 'chart-1', monthly_ceiling = 1000.00, kind = 'VARIABLE' WHERE id = 1;
UPDATE categories SET color_token = 'chart-1', monthly_ceiling = 5000.00, kind = 'FIXED' WHERE id = 2;
UPDATE categories SET color_token = 'chart-2', monthly_ceiling = 4000.00, kind = 'VARIABLE' WHERE id = 3;
UPDATE categories SET color_token = 'chart-3', monthly_ceiling = 3500.00, kind = 'INVESTMENT' WHERE id = 4;
UPDATE categories SET color_token = 'chart-4', monthly_ceiling = 3500.00, kind = 'SERVICE' WHERE id = 5;
UPDATE categories SET color_token = 'chart-5', monthly_ceiling = 3000.00, kind = 'SUBSCRIPTION' WHERE id = 6;
