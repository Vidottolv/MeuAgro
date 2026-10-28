begin;
-- The legacy own-sales report must honor the manager's financial delegation too.
do $$ begin
 if to_regprocedure('public.trade_sales_report_before_permissions(uuid,date,date,integer)') is null then
  alter function public.trade_sales_report(uuid,date,date,integer) rename to trade_sales_report_before_permissions;
 end if;
end;$$;
revoke all on function public.trade_sales_report_before_permissions(uuid,date,date,integer) from public,anon,authenticated,service_role;
create or replace function public.trade_sales_report(p_seller uuid,p_from date,p_to date,p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;redacted boolean;orders jsonb;
begin
 result:=public.trade_sales_report_before_permissions(p_seller,p_from,p_to,p_offset);
 redacted:=not public.commerce_is_owner(p_seller) and not public.commerce_manage_finance(p_seller)
  and exists(select 1 from public.commerce_memberships where seller_id=p_seller and user_id=auth.uid() and active and management_role='manager');
 if redacted then
  select coalesce(jsonb_agg(item-'commission_amount'-'commission_percent'-'version' order by n),'[]'::jsonb) into orders
   from jsonb_array_elements(result->'orders') with ordinality as x(item,n);
  result:=jsonb_set(result,'{orders}',orders);
  result:=jsonb_set(result,'{totals}',(result->'totals')-'commission_total'-'missing_count');
 end if;
 return result||jsonb_build_object('commission_visible',not redacted);
end;$$;
create or replace function public.app_permissions_context() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 return jsonb_build_object('checked_at',now(),'companies',coalesce((
 select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'role',case when s.owner_id=u then 'owner' else m.management_role end,
 'can_act',public.trade_agent_active(s.id,u),'can_manage',public.commerce_can_manage(s.id),'can_finance',public.commerce_manage_finance(s.id)) order by s.name,s.id)
 from public.commerce_sellers s left join public.commerce_memberships m on m.seller_id=s.id and m.user_id=u and m.active
 where s.kind='company' and (s.owner_id=u or m.user_id=u)),'[]'::jsonb));
end;$$;
revoke all on function public.trade_sales_report(uuid,date,date,integer),public.app_permissions_context() from public,anon,authenticated;
grant execute on function public.trade_sales_report(uuid,date,date,integer),public.app_permissions_context() to authenticated;
commit;
