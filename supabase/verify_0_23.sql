-- Verificação de estrutura e permissões, sem expor tokens ou mensagens.
select tablename,rowsecurity from pg_tables where schemaname='public'
and tablename in ('trade_push_devices','trade_push_queue');
select table_name,data_type from information_schema.columns where table_schema='public'
and table_name in ('trade_invitations','commerce_invitations') and column_name='token';
select signature,has_function_privilege('authenticated',signature,'EXECUTE') as authenticated,
has_function_privilege('anon',signature,'EXECUTE') as anonymous
from (values('public.trade_product_ranking(uuid,integer,integer)'),('public.trade_register_push(text)'),('public.trade_unregister_push(text)')) f(signature);
select signature,has_function_privilege('service_role',signature,'EXECUTE') as server,
has_function_privilege('authenticated',signature,'EXECUTE') as authenticated
from (values('public.trade_claim_push()'),('public.trade_finish_push(uuid,uuid,text,text)')) f(signature);
