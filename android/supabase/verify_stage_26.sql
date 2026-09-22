-- Somente leitura. Execute depois de stage_26_catalog_quotes.sql.
-- Esperado: sete tabelas com rowsecurity=true.
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename like 'trade_%' order by tablename;

select tablename,policyname,roles,cmd from pg_policies
where schemaname='public' and (tablename like 'trade_%' or tablename='commerce_sellers')
order by tablename,policyname;

-- Esperado: authenticated=true; anonymous=false.
select has_function_privilege('authenticated','public.trade_command(text,jsonb,uuid)','EXECUTE') as authenticated_can_execute,
       has_function_privilege('anon','public.trade_command(text,jsonb,uuid)','EXECUTE') as anonymous_can_execute;

-- Escritas: todas false. Leitura: true, exceto trade_operations (false).
select table_name,
  has_table_privilege('authenticated','public.'||table_name,'SELECT') as can_read,
  has_table_privilege('authenticated','public.'||table_name,'INSERT') as can_insert,
  has_table_privilege('authenticated','public.'||table_name,'UPDATE') as can_update,
  has_table_privilege('authenticated','public.'||table_name,'DELETE') as can_delete
from information_schema.tables where table_schema='public' and table_name like 'trade_%'
order by table_name;
