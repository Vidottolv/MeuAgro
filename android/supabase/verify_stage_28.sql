-- Somente leitura. Execute após stage_28_delivery_notifications.sql.
-- Esperado: três tabelas com rowsecurity=true.
select tablename,rowsecurity from pg_tables where schemaname='public'
and tablename in ('trade_inventory_links','trade_receipt_items','trade_notifications') order by tablename;

-- Esperado: authenticated pode SELECT, mas não INSERT/UPDATE/DELETE.
select table_name,
has_table_privilege('authenticated','public.'||table_name,'SELECT') as can_read,
has_table_privilege('authenticated','public.'||table_name,'INSERT') as can_insert,
has_table_privilege('authenticated','public.'||table_name,'UPDATE') as can_update,
has_table_privilege('authenticated','public.'||table_name,'DELETE') as can_delete
from information_schema.tables where table_schema='public'
and table_name in ('trade_inventory_links','trade_receipt_items','trade_notifications') order by table_name;

-- Esperado: authenticated=true e anonymous=false em todas as operações.
select signature,
has_function_privilege('authenticated',signature,'EXECUTE') as authenticated_can_execute,
has_function_privilege('anon',signature,'EXECUTE') as anonymous_can_execute
from (values('public.fulfillment_command(text,jsonb,uuid)'),('public.trade_notification_inbox()'),('public.trade_mark_notification_read(uuid)')) f(signature);

-- O gatilho deve existir e estar habilitado (O ou A).
select tgname,tgenabled from pg_trigger where tgrelid='public.inventory_lots'::regclass and tgname='trg_create_initial_inventory_entry';

-- Estrutura do barracão usada na integração, útil para diagnóstico sem expor registros.
select table_name,column_name,data_type,numeric_precision,numeric_scale,is_generated
from information_schema.columns where table_schema='public'
and ((table_name='inventory_lots' and column_name in ('purchased_quantity','unit','unit_price','total_price'))
or (table_name='inventory_transactions' and column_name in ('quantity','unit_cost','total_cost'))
or (table_name='trade_orders' and column_name in ('state','delivery_version','delivered_at','received_at')))
order by table_name,column_name;
