-- =====================================================================
-- 02_cleanup_demo_company.sql
-- Remove SOMENTE o usuário da empresa demo (empresa.demo@example.test)
-- e todos os seus registros filhos vinculados por ON DELETE CASCADE.
--
-- Uso:
--   docker exec -i finance-db psql -U finance -d finance -v ON_ERROR_STOP=1 -f /tmp/demo/02_cleanup_demo_company.sql
-- =====================================================================
\set ON_ERROR_STOP on

SELECT count(*) AS demo_users_antes FROM users WHERE email = 'empresa.demo@example.test';

BEGIN;
DELETE FROM users WHERE email = 'empresa.demo@example.test';
COMMIT;

SELECT count(*) AS demo_users_depois FROM users WHERE email = 'empresa.demo@example.test';
SELECT count(*) AS total_usuarios_ativos FROM users;
