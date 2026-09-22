-- Somente leitura. Execute depois de stage_25_commerce_foundation.sql.
select tablename,rowsecurity from pg_tables
where schemaname='public' and tablename in ('commerce_accounts','commerce_sellers','commerce_memberships','commerce_invitations','commerce_audit') order by tablename;

select tablename,policyname,roles,cmd from pg_policies
where schemaname='public' and tablename like 'commerce_%' order by tablename;

-- Esperado: execute=true em authenticated e false em anon.
select has_function_privilege('authenticated','public.commerce_command(text,jsonb)','EXECUTE') as authenticated_can_execute,
       has_function_privilege('anon','public.commerce_command(text,jsonb)','EXECUTE') as anonymous_can_execute;

-- Esperado: todas as permissões de escrita false; read=true para authenticated.
select table_name,
  has_table_privilege('authenticated','public.'||table_name,'SELECT') as can_read,
  has_table_privilege('authenticated','public.'||table_name,'INSERT') as can_insert,
  has_table_privilege('authenticated','public.'||table_name,'UPDATE') as can_update,
  has_table_privilege('authenticated','public.'||table_name,'DELETE') as can_delete
from information_schema.tables where table_schema='public' and table_name like 'commerce_%' order by table_name;
