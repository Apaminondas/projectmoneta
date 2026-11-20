-- V7__company_profiles_and_generated_reports.sql
-- Tabela de perfil da empresa (dados cadastrais e logo para relatórios em PDF)
CREATE TABLE IF NOT EXISTS company_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(150),
    company_email VARCHAR(150),
    company_phone VARCHAR(50),
    footer_text VARCHAR(255),
    logo_data BYTEA,
    logo_content_type VARCHAR(50),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de relatórios gerados
CREATE TABLE IF NOT EXISTS generated_reports (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    period VARCHAR(50) NOT NULL,
    file_format VARCHAR(10) NOT NULL DEFAULT 'PDF',
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    file_size_bytes BIGINT,
    pdf_data BYTEA,
    download_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_user ON generated_reports(user_id, created_at DESC);
