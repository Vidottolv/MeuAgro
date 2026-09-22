-- Meu Agro 0.22.0 | Consultor 5/5. Requer stage_28 instalada.
-- Custos comerciais são privados. Não modifica preço aceito, estoque ou pagamentos.
begin;
create table if not exists public.trade_financial_versions (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.trade_orders(id),
 version integer not null check(version>0),items jsonb not null,
 product_cost numeric(16,2) not null check(product_cost>=0),delivery_cost numeric(16,2) not null check(delivery_cost>=0),
 other_cost numeric(16,2) not null check(other_cost>=0),commission_percent numeric(5,2) not null check(commission_percent between 0 and 100),
 commission_base numeric(16,2) not null,commission_amount numeric(16,2) not null,
 result_amount numeric(16,2) not null,reason text not null check(length(btrim(reason)) between 5 and 500),
 author_id uuid not null references auth.users(id),created_at timestamptz not null default now(),unique(order_id,version)
);
create index if not exists trade_finance_order_version on public.trade_financial_versions(order_id,version desc);
alter table public.trade_financial_versions enable row level security;
drop policy if exists trade_finance_owner_read on public.trade_financial_versions;
create policy trade_finance_owner_read on public.trade_financial_versions for select to authenticated using(exists(
 select 1 from public.trade_orders o where o.id=order_id and public.commerce_is_owner(o.seller_id) and public.trade_agent_active(o.seller_id,auth.uid())));
revoke all on public.trade_financial_versions from public,anon,authenticated;
grant select on public.trade_financial_versions to authenticated;

create or replace function public.trade_save_financials(p_data jsonb,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare u uuid:=auth.uid();o public.trade_orders%rowtype;item jsonb;priced jsonb;arr jsonb:='[]';
 price numeric;line_cost numeric;product_cost numeric:=0;delivery_cost numeric;other_cost numeric;rate numeric;base numeric;commission numeric;
 previous integer;new_id uuid;fingerprint text;old_fingerprint text;result jsonb;reason text:=btrim(coalesce(p_data->>'reason',''));
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_operation_id is null then raise exception 'Identificação da operação ausente.';end if;
 perform 1 from auth.users where id=u for update;
 fingerprint:=md5('finance:'||p_data::text);
 select t.fingerprint,t.result into old_fingerprint,result from public.trade_operations t where user_id=u and operation_id=p_operation_id;
 if found then
  if fingerprint is distinct from old_fingerprint then raise exception 'Esta operação já foi usada com outros dados.';end if;
  return result;
 end if;
 select * into o from public.trade_orders where id=(p_data->>'order_id')::uuid for update;
 if not found or not public.commerce_is_owner(o.seller_id) or not public.trade_agent_active(o.seller_id,u) then raise exception 'Somente o responsável pelo vendedor pode informar custos e comissões.' using errcode='42501';end if;
 select coalesce(max(v.version),0) into previous from public.trade_financial_versions v where order_id=o.id;
 if previous is distinct from (p_data->>'expected_version')::integer then raise exception 'A apuração mudou. Atualize a página antes de salvar.';end if;
 if length(reason) not between 5 and 500 then raise exception 'Descreva a apuração ou o motivo da correção (5 a 500 caracteres).';end if;
 if jsonb_typeof(p_data->'items') is distinct from 'array' or jsonb_array_length(p_data->'items')<>jsonb_array_length(o.quote_snapshot->'items') then raise exception 'Informe o custo de todos os produtos.';end if;
 for item in select value from jsonb_array_elements(o.quote_snapshot->'items') loop
  if (select count(*) from jsonb_array_elements(p_data->'items') x where x->>'product_id'=item->>'product_id')<>1 then raise exception 'Os produtos não correspondem ao pedido.';end if;
  select value into priced from jsonb_array_elements(p_data->'items') where value->>'product_id'=item->>'product_id';
  price:=nullif(priced->>'unit_cost','')::numeric;
  if price is null or price<0 or price>1000000000 or price<>round(price,2) then raise exception 'Informe custos por embalagem válidos, com até duas casas decimais.';end if;
  line_cost:=round(price*(item->>'quantity')::numeric,2);product_cost:=product_cost+line_cost;
  arr:=arr||jsonb_build_array(item||jsonb_build_object('unit_cost',price,'line_cost',line_cost));
 end loop;
 delivery_cost:=nullif(p_data->>'delivery_cost','')::numeric;other_cost:=nullif(p_data->>'other_cost','')::numeric;rate:=nullif(p_data->>'commission_percent','')::numeric;
 if product_cost>1000000000000 or delivery_cost is null or delivery_cost<0 or delivery_cost>1000000000 or delivery_cost<>round(delivery_cost,2)
 or other_cost is null or other_cost<0 or other_cost>1000000000 or other_cost<>round(other_cost,2)
 or rate is null or rate<0 or rate>100 or rate<>round(rate,2) then raise exception 'Revise custos adicionais e comissão (0 a 100%%).';end if;
 base:=(o.quote_snapshot->>'subtotal')::numeric-(o.quote_snapshot->>'discount')::numeric;
 commission:=round(base*rate/100,2);
 insert into public.trade_financial_versions(order_id,version,items,product_cost,delivery_cost,other_cost,commission_percent,commission_base,commission_amount,result_amount,reason,author_id)
 values(o.id,previous+1,arr,product_cost,delivery_cost,other_cost,rate,base,commission,o.total-product_cost-delivery_cost-other_cost-commission,reason,u) returning id into new_id;
 insert into public.commerce_audit(actor_id,seller_id,action,subject_id) values(u,o.seller_id,'save_financials',new_id);
 result:=jsonb_build_object('id',new_id,'version',previous+1,'order_id',o.id);
 insert into public.trade_operations(user_id,operation_id,fingerprint,result) values(u,p_operation_id,fingerprint,result);
 return result;
end $$;

create or replace function public.trade_sales_report(p_seller uuid,p_from date,p_to date,p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare owner boolean;result jsonb;s public.commerce_sellers%rowtype;
begin
 if auth.uid() is null or not public.trade_agent_active(p_seller,auth.uid()) then raise exception 'Selecione uma atuação comercial ativa.' using errcode='42501';end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>365 or p_offset is null or p_offset<0 then raise exception 'Escolha um período de até 366 dias.';end if;
 select * into s from public.commerce_sellers where id=p_seller;owner:=s.owner_id=auth.uid();
 with sales as (
  select o.*,f.id as financial_id,f.version,f.product_cost,f.delivery_cost,f.other_cost,f.commission_percent,f.commission_amount,f.result_amount,
   coalesce(a.display_name,'Consultor') as agent_name,
   case when o.state='received' then o.received_at else o.created_at end as reporting_at
  from public.trade_orders o
  left join lateral(select * from public.trade_financial_versions v where v.order_id=o.id order by version desc limit 1) f on true
  left join public.commerce_accounts a on a.user_id=o.agent_at_acceptance
  where o.seller_id=p_seller and (owner or o.agent_at_acceptance=auth.uid())
  and (case when o.state='received' then o.received_at else o.created_at end at time zone 'America/Sao_Paulo')::date between p_from and p_to
 ), totals as (
  select count(*) as order_count,count(*) filter(where state='received') as received_count,
   count(*) filter(where state<>'received') as pending_count,
   coalesce(sum(total) filter(where state='received'),0) as sales_total,
   coalesce(sum(total) filter(where state<>'received'),0) as pending_total,
   count(*) filter(where state='received' and financial_id is null) as missing_count,
   coalesce(sum(commission_amount) filter(where state='received'),0) as calculated_commission,
   coalesce(sum(product_cost+delivery_cost+other_cost) filter(where state='received'),0) as calculated_cost,
   coalesce(sum(result_amount) filter(where state='received'),0) as calculated_result
  from sales
 ), products as (
  select item->>'product_id' as product_id,item->>'name' as name,item->>'package_name' as package_name,item->>'base_unit' as base_unit,
   (item->>'package_size')::numeric as package_size,sum((item->>'quantity')::numeric) as packages,
   sum((item->>'quantity')::numeric*(item->>'package_size')::numeric) as base_quantity
  from sales cross join lateral jsonb_array_elements(quote_snapshot->'items') item where state='received'
  group by item->>'product_id',item->>'name',item->>'package_name',item->>'base_unit',(item->>'package_size')::numeric
 ), page as (select * from sales order by reporting_at desc,id desc limit 50 offset p_offset)
 select jsonb_build_object('seller',jsonb_build_object('id',s.id,'name',s.name,'kind',s.kind),'owner',owner,
 'totals',(select jsonb_build_object('order_count',order_count,'received_count',received_count,'pending_count',pending_count,'sales_total',sales_total,
 'pending_total',pending_total,'missing_count',missing_count,'commission_total',case when missing_count=0 then calculated_commission else null end)
 ||case when owner then jsonb_build_object('cost_total',case when missing_count=0 then calculated_cost else null end,
 'result_total',case when missing_count=0 then calculated_result else null end,
 'margin_percent',case when missing_count=0 and sales_total>0 then round(calculated_result/sales_total*100,2) else null end) else '{}'::jsonb end from totals),
 'products',coalesce((select jsonb_agg(to_jsonb(p) order by name,package_size) from products p),'[]'::jsonb),
 'orders',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'request_id',p.request_id,'state',p.state,'date',p.reporting_at,'total',p.total,
 'buyer_name',p.buyer_name,'agent_name',p.agent_name,'agent_id',p.agent_at_acceptance,'version',p.version,'commission_percent',p.commission_percent,
 'commission_amount',p.commission_amount,'can_open',public.trade_reads_request(p.request_id))
 ||case when owner then jsonb_build_object('product_cost',p.product_cost,'delivery_cost',p.delivery_cost,'other_cost',p.other_cost,'result_amount',p.result_amount) else '{}'::jsonb end
 order by p.reporting_at desc,p.id desc) from page p),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function public.trade_save_financials(jsonb,uuid),public.trade_sales_report(uuid,date,date,integer) from public,anon;
grant execute on function public.trade_save_financials(jsonb,uuid),public.trade_sales_report(uuid,date,date,integer) to authenticated;
commit;
