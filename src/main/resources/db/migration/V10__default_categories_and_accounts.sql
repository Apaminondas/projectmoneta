-- Preenche categorias e contas iniciais para usuários existentes que ainda não possuem nenhuma.
INSERT INTO categories (name, user_id, color_token, monthly_ceiling, kind)
SELECT c.name, u.id, c.color_token, c.monthly_ceiling, c.kind
FROM users u
CROSS JOIN (VALUES
    ('Folha de Pagamento',       'chart-1', 1000.00, 'VARIABLE'),
    ('Locação Comercial',        'chart-1', 5000.00, 'FIXED'),
    ('Infraestrutura Cloud',     'chart-2', 4000.00, 'VARIABLE'),
    ('Marketing & Aquisição',    'chart-3', 3500.00, 'INVESTMENT'),
    ('Consultorias & Jurídico',  'chart-4', 3500.00, 'SERVICE'),
    ('Softwares & SaaS',         'chart-5', 3000.00, 'SUBSCRIPTION')
) AS c(name, color_token, monthly_ceiling, kind)
WHERE NOT EXISTS (SELECT 1 FROM categories x WHERE x.user_id = u.id);

INSERT INTO accounts (user_id, name, segment, tier, city, uf, opening_balance)
SELECT u.id, a.name, a.segment, a.tier, 'São Paulo', 'SP', a.opening_balance
FROM users u
CROSS JOIN (VALUES
    ('Conta Corrente Principal', 'Banco',         'Principal',  25000.00),
    ('Conta Reserva',            'Investimentos', 'Reserva',    10000.00),
    ('Cartão Corporativo',       'Cartão',        'Secundária',     0.00)
) AS a(name, segment, tier, opening_balance)
WHERE NOT EXISTS (SELECT 1 FROM accounts x WHERE x.user_id = u.id);
