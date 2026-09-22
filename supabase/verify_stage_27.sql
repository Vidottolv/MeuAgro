-- Somente leitura. Execute após stage_27_orders_messages.sql.
-- Esperado: duas tabelas, ambas com rowsecurity=true.
select tablename,rowsecurity from pg_tables
where schemaname='public' and tablename in ('trade_orders','trade_messages') order by tablename;

select tablename,policyname,roles,cmd from pg_policies
where schemaname='public' and tablename in ('trade_orders','trade_messages') order by tablename;

-- Esperado: authenticated=true; anonymous=false.
select has_function_privilege('authenticated','public.trade_command(text,jsonb,uuid)','EXECUTE') as authenticated_can_execute,
       has_function_privilege('anon','public.trade_command(text,jsonb,uuid)','EXECUTE') as anonymous_can_execute;

-- Leitura true, escritas false. A proteção por linha limita quais registros são visíveis.
select table_name,
 has_table_privilege('authenticated','public.'||table_name,'SELECT') as can_read,
 has_table_privilege('authenticated','public.'||table_name,'INSERT') as can_insert,
 has_table_privilege('authenticated','public.'||table_name,'UPDATE') as can_update,
 has_table_privilege('authenticated','public.'||table_name,'DELETE') as can_delete
from information_schema.tables where table_schema='public' and table_name in ('trade_orders','trade_messages') order by table_name;

-- A definição deve incluir o estado ordered para solicitações e accepted para propostas.
select conname,pg_get_constraintdef(oid) as definition from pg_constraint
where conrelid in ('public.trade_requests'::regclass,'public.trade_quotes'::regclass)
and conname in ('trade_requests_state_check','trade_quotes_status_check');
