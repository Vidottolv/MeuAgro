-- Somente leitura. Execute depois de stage_29_sales_results.sql.
-- Esperado: uma tabela com rowsecurity=true.
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename='trade_financial_versions';

-- Esperado: can_read=true; demais permissões=false.
select has_table_privilege('authenticated','public.trade_financial_versions','SELECT') as can_read,
has_table_privilege('authenticated','public.trade_financial_versions','INSERT') as can_insert,
has_table_privilege('authenticated','public.trade_financial_versions','UPDATE') as can_update,
has_table_privilege('authenticated','public.trade_financial_versions','DELETE') as can_delete;

-- Esperado: authenticated=true e anonymous=false nas duas funções.
select signature,
has_function_privilege('authenticated',signature,'EXECUTE') as authenticated_can_execute,
has_function_privilege('anon',signature,'EXECUTE') as anonymous_can_execute
from (values ('public.trade_save_financials(jsonb,uuid)'),
('public.trade_sales_report(uuid,date,date,integer)')) f(signature);

-- Política de leitura e restrição de uma versão por pedido.
select policyname,cmd,roles from pg_policies
where schemaname='public' and tablename='trade_financial_versions';
select conname,pg_get_constraintdef(oid) as definition from pg_constraint
where conrelid='public.trade_financial_versions'::regclass;
