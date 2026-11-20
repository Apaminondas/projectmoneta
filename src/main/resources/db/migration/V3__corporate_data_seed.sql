-- Migração V3: Transição dos dados de demonstração de finanças pessoais para finanças corporativas (B2B)

UPDATE categories SET name = 'Locação Comercial' WHERE name ILIKE '%Moradia%' OR id = 2;
UPDATE categories SET name = 'Infraestrutura Cloud' WHERE name ILIKE '%Alimentação%' OR id = 3;
UPDATE categories SET name = 'Marketing & Aquisição' WHERE name ILIKE '%Transporte%' OR id = 4;
UPDATE categories SET name = 'Consultorias & Jurídico' WHERE name ILIKE '%Lazer%' OR id = 5;
UPDATE categories SET name = 'Softwares & SaaS' WHERE name ILIKE '%Educação%' OR id = 6;

UPDATE transactions
SET description = 'Faturamento Contrato SaaS Enterprise',
    payment_method = 'Transferência TED',
    notes = 'Recebimento de mensalidade contrato anual cliente Alpha Corp'
WHERE description ILIKE '%Salário%' OR id = 3;

UPDATE transactions
SET description = 'Locação Escritório Matriz',
    payment_method = 'Boleto Bancário',
    notes = 'Aluguel do condomínio corporativo e escritório sede Av. Paulista'
WHERE description ILIKE '%Aluguel%' OR id = 4;

UPDATE transactions
SET description = 'Servidores AWS Cloud Infrastructure',
    payment_method = 'Cartão Corporativo',
    notes = 'Fatura mensal de instâncias EC2, banco de dados RDS e buckets S3'
WHERE description ILIKE '%Supermercado%' OR id = 5;

UPDATE transactions
SET description = 'Campanha Google Ads & Mídia B2B',
    payment_method = 'PIX',
    notes = 'Investimento em captação de leads corporativos e tráfego qualificado'
WHERE description ILIKE '%Combustível%' OR id = 6;

UPDATE transactions
SET description = 'Assessoria Jurídica & Compliance',
    payment_method = 'Transferência TED',
    notes = 'Honorários mensais de assessoria societária, contratual e LGPD'
WHERE description ILIKE '%Restaurante%' OR id = 7;

UPDATE transactions
SET description = 'Contrato Facilities & Limpeza Predial',
    payment_method = 'Boleto Bancário',
    notes = 'Serviços terceirizados de higienização e manutenção predial'
WHERE description ILIKE '%Padaria%' OR id = 8;

UPDATE transactions
SET description = 'Link Dedicado Fibra Óptica 1Gbps',
    payment_method = 'Boleto Bancário',
    notes = 'Link redundante de telecomunicações com IP fixo corporativo'
WHERE description ILIKE '%Feira%' OR id = 9;

UPDATE transactions
SET description = 'Auditoria Contábil & Fechamento Fiscal',
    payment_method = 'PIX',
    notes = 'Emissão e conciliação de balancetes fiscais e obrigações acessórias'
WHERE description ILIKE '%Estacionamento%' OR id = 10;

UPDATE transactions
SET description = 'Lote Periféricos TI & Monitores Dell',
    payment_method = 'Cartão Corporativo',
    notes = 'Equipamentos para expansão do time de desenvolvimento e suporte'
WHERE description ILIKE '%Cinema%' OR id = 11;

UPDATE transactions
SET description = 'Licenças Google Workspace & Slack',
    payment_method = 'Cartão Corporativo',
    notes = 'Plano empresarial de produtividade, e-mails e comunicação interna'
WHERE description ILIKE '%Curso%' OR id = 12;
