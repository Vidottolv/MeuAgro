-- Meu Agro 0.23.0: convites curtos e ranking comercial. Requer atualização de vendas.
begin;
create or replace function public.commerce_invite_code() returns text language sql volatile set search_path='' as $$
 select lpad(mod((('x'||substr(replace(gen_random_uuid()::text,'-',''),1,16))::bit(64)::bigint)::numeric+9223372036854775808,10000000000000000)::text,16,'0');
$$;
revoke all on function public.commerce_invite_code() from public,anon,authenticated;
alter table public.trade_invitations alter column token drop default;
alter table public.trade_invitations alter column token type text using token::text;
alter table public.trade_invitations alter column token set default public.commerce_invite_code();
alter table public.commerce_invitations alter column token drop default;
alter table public.commerce_invitations alter column token type text using token::text;
alter table public.commerce_invitations alter column token set default public.commerce_invite_code();
-- Preserva convites antigos e a lógica de autorização das funções instaladas.
do $$ declare sig text; definition text; begin
 foreach sig in array array['public.commerce_command(text,jsonb)','public.trade_command(text,jsonb,uuid)'] loop
  definition:=pg_get_functiondef(sig::regprocedure);
  definition:=replace(definition,'token=(p_data->>''token'')::uuid','token=btrim(p_data->>''token'')');
  execute definition;
 end loop;
end $$;
create or replace function public.trade_product_ranking(p_seller uuid,p_year integer,p_month integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare is_owner boolean; result jsonb;
begin
 if auth.uid() is null or not public.trade_agent_active(p_seller,auth.uid()) then raise exception 'Selecione uma atuação comercial ativa.' using errcode='42501';end if;
 if p_year is null or p_year not between 2000 and 2200 or p_month is null or p_month not between 1 and 12 then raise exception 'Selecione ano e mês válidos.';end if;
 select owner_id=auth.uid() into is_owner from public.commerce_sellers where id=p_seller;
 with lines as (
 select o.id,o.received_at at time zone 'America/Sao_Paulo' as received,
 item->>'product_id' as product_id,item->>'name' as name,
 case when (o.quote_snapshot->>'subtotal')::numeric>0 then (item->>'line_total')::numeric*((o.quote_snapshot->>'subtotal')::numeric-(o.quote_snapshot->>'discount')::numeric)/(o.quote_snapshot->>'subtotal')::numeric else 0 end as revenue
 from public.trade_orders o cross join lateral jsonb_array_elements(o.quote_snapshot->'items') item
 where o.seller_id=p_seller and o.state='received' and (is_owner or o.agent_at_acceptance=auth.uid())
 and (o.received_at at time zone 'America/Sao_Paulo')::date>=make_date(p_year,1,1)
 and (o.received_at at time zone 'America/Sao_Paulo')::date<make_date(p_year+1,1,1)
 ), periods as (
 select 'year' as period,* from lines union all select 'month',* from lines where extract(month from received)=p_month
 ), totals as (
 select period,product_id,max(name) as name,round(sum(revenue),2) as revenue,count(distinct id) as orders
 from periods group by period,product_id
 ), ranked as (
 select *,dense_rank() over(partition by period order by revenue desc) as rank,
 row_number() over(partition by period order by revenue desc,name,product_id) as position from totals
 )
 select jsonb_build_object('year',p_year,'month',p_month,'owner',is_owner,
 'annual',coalesce((select jsonb_agg(to_jsonb(r)-'period'-'position' order by position) from ranked r where period='year' and position<=10),'[]'::jsonb),
 'monthly',coalesce((select jsonb_agg(to_jsonb(r)-'period'-'position' order by position) from ranked r where period='month' and position<=10),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function public.trade_product_ranking(uuid,integer,integer) from public,anon;
grant execute on function public.trade_product_ranking(uuid,integer,integer) to authenticated;
commit;
