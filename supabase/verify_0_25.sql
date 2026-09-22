-- Conferência somente leitura; execute no SQL Editor como administrador.
select to_regprocedure('public.management_report(uuid,date,date,jsonb,integer)') is not null as painel_instalado,
 to_regprocedure('public.management_command(text,jsonb,uuid)') is not null as comandos_instalados,
 to_regprocedure('public.management_workspace(uuid)') is not null as acompanhamento_instalado;
select not has_function_privilege('authenticated','public.trade_command_before_management(text,jsonb,uuid)','EXECUTE') as funcao_interna_bloqueada,
 has_function_privilege('authenticated','public.management_command(text,jsonb,uuid)','EXECUTE') as comandos_autenticados,
 not has_function_privilege('anon','public.management_command(text,jsonb,uuid)','EXECUTE') as anonimo_bloqueado;
select c.relname,c.relrowsecurity as rls_ativo,
 not has_table_privilege('authenticated',c.oid,'SELECT') as leitura_direta_bloqueada,
 not has_table_privilege('authenticated',c.oid,'INSERT') as insercao_direta_bloqueada
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('management_settings','management_goals','management_notes','management_followups','management_audit','management_approvals') order by c.relname;
select tgname from pg_trigger where not tgisinternal and tgname in ('commerce_clear_management','management_discount_guard','management_approval_notice') order by tgname;
