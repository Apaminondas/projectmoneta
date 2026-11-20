-- =====================================================================
-- 02_cleanup_loadtest.sql
-- Remove SOMENTE os usuários de carga (e filhos por ON DELETE CASCADE).
-- Padrão: email LIKE 'loadtest+%@example.test'. Nada mais é tocado.
-- Uso: psql -v ON_ERROR_STOP=1 -f 02_cleanup_loadtest.sql
-- =====================================================================
\set ON_ERROR_STOP on

SELECT count(*) AS clientes_carga_antes FROM users WHERE email LIKE 'loadtest+%@example.test';

BEGIN;
DELETE FROM users WHERE email LIKE 'loadtest+%@example.test';
COMMIT;

SELECT count(*) AS clientes_carga_depois FROM users WHERE email LIKE 'loadtest+%@example.test';
SELECT count(*) AS usuarios_restantes FROM users;
