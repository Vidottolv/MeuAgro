begin;
create table if not exists public.season_budgets(id uuid primary key,user_id uuid not null references auth.users(id),cycle_id uuid not null references public.production_cycles(id),name text not null check(length(btrim(name)) between 2 and 120),status text not null default 'draft' check(status in ('draft','approved','archived')),items jsonb not null default '[]',version int not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create unique index if not exists season_budget_approved on public.season_budgets(cycle_id) where status='approved';
create table if not exists public.workspace_operations(user_id uuid not null references auth.users(id),operation_id uuid not null,payload jsonb not null,result jsonb not null,created_at timestamptz not null default now(),primary key(user_id,operation_id));
alter table public.season_budgets enable row level security;alter table public.workspace_operations enable row level security;revoke all on public.season_budgets,public.workspace_operations from public,anon,authenticated;
create or replace function public.budget_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 return jsonb_build_object('cycles',coalesce((select jsonb_agg(jsonb_build_object('id',pc.id,'property_id',pc.property_id,'label',p.name||' / '||coalesce(a.name,'Sem talhão')||' / '||coalesce(c.name,'Sem cultura')||' / '||coalesce(s.name,'Sem safra')||' / '||right(pc.id::text,8))) from public.production_cycles pc join public.properties p on p.id=pc.property_id left join public.areas a on a.id=pc.area_id left join public.crops c on c.id=pc.crop_id left join public.seasons s on s.id=pc.season_id where pc.user_id=auth.uid() and pc.deleted_at is null),'[]'::jsonb),
 'inputs',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'name',i.name,'unit',i.base_unit)) from public.agricultural_inputs i where i.user_id=auth.uid() and i.active and i.deleted_at is null),'[]'::jsonb));
end;$$;
create or replace function public.budget_list(p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_offset is null or p_offset<0 or p_offset>1000000 then raise exception 'Página inválida.';end if;
 return jsonb_build_object('count',(select count(*) from public.season_budgets where user_id=auth.uid()),'items',coalesce((select jsonb_agg(to_jsonb(x) order by x.updated_at desc,x.id) from(select b.*,coalesce((select sum((v->>'total_cents')::bigint) from jsonb_array_elements(b.items) v),0) as planned_cents from public.season_budgets b where user_id=auth.uid() order by updated_at desc,id limit 50 offset p_offset)x),'[]'::jsonb));
end;$$;
create or replace function public.budget_command(p_operation uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare u uuid:=auth.uid();b public.season_budgets%rowtype;o public.workspace_operations%rowtype;request jsonb;result jsonb;item jsonb;items jsonb:='[]';seen uuid[]:='{}';iid uuid;inputid uuid;unit text;label text;qty numeric;price bigint;total bigint;cid uuid;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_action is null or p_action not in ('create','update','status') or jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>80000 then raise exception 'Operação inválida.';end if;
 perform pg_advisory_xact_lock(hashtext('farm-workspace'),hashtext(u::text));request:=jsonb_build_object('kind','budget','action',p_action,'data',p_data);
 select * into o from public.workspace_operations where user_id=u and operation_id=p_operation;
 if found then if o.payload is distinct from request then raise exception 'Identificador usado em outra operação.';end if;return o.result;end if;
 if p_action='create' then
  if (select count(*) from public.season_budgets where user_id=u)>=1000 then raise exception 'Limite de 1000 orçamentos por conta.';end if;
  cid:=(p_data->>'cycle_id')::uuid;
 else
  select * into b from public.season_budgets where id=(p_data->>'id')::uuid and user_id=u for update;
  if not found then raise exception 'Orçamento indisponível.' using errcode='42501';end if;
  if b.version is distinct from (p_data->>'version')::int then raise exception 'Orçamento alterado. Atualize a tela.' using errcode='40001';end if;
  cid:=b.cycle_id;
 end if;
 if not exists(select 1 from public.production_cycles pc where pc.id=cid and pc.user_id=u and (pc.deleted_at is null or p_action='status' and p_data->>'status'='archived')) then raise exception 'Plantio indisponível.' using errcode='42501';end if;
 if p_action in ('create','update') then
  if p_action='update' and b.status='archived' then raise exception 'Reabra como rascunho antes de editar.';end if;
  if jsonb_typeof(p_data->'items') is distinct from 'array' or jsonb_array_length(p_data->'items')>100 then raise exception 'Use até 100 operações no orçamento.';end if;
  for item in select * from jsonb_array_elements(p_data->'items') loop
   iid:=(item->>'id')::uuid;inputid:=nullif(item->>'input_id','')::uuid;
   if iid is null or iid=any(seen) or coalesce(item->>'quantity','') !~ '^[0-9]{1,7}(\.[0-9]{1,4})?$' or coalesce(item->>'unit_cents','') !~ '^[0-9]{1,11}$' then raise exception 'Operação duplicada, quantidade ou preço inválido.';end if;
   qty:=(item->>'quantity')::numeric;price:=(item->>'unit_cents')::bigint;total:=round(qty*price);
   if qty<=0 or total>99999999999 then raise exception 'Quantidade ou custo fora do limite.';end if;
   label:=btrim(item->>'label');unit:=btrim(item->>'unit');
   if label is null or length(label) not between 2 and 160 or unit is null or length(unit) not between 1 and 20 or coalesce(item->>'category','') not in ('input','labor','services','fuel','freight','energy','maintenance','other') then raise exception 'Descrição, unidade ou categoria inválida.';end if;
   if inputid is not null then
    select i.base_unit into unit from public.agricultural_inputs i where i.id=inputid and i.user_id=u and i.active and i.deleted_at is null;
    if unit is null or item->>'category'<>'input' then raise exception 'Insumo inválido.' using errcode='42501';end if;
   elsif item->>'category'='input' then raise exception 'Selecione o insumo para planejar o consumo.';end if;
   if coalesce(item->>'due_date','') !~ '^\d{4}-\d{2}-\d{2}$' or (item->>'due_date')::date not between date '1900-01-01' and date '2100-12-31' then raise exception 'Data da operação inválida.';end if;
   if item ? 'completed' and jsonb_typeof(item->'completed') is distinct from 'boolean' then raise exception 'Situação da operação inválida.';end if;
   seen:=array_append(seen,iid);items:=items||jsonb_build_array(jsonb_build_object('id',iid,'input_id',inputid,'label',label,'category',item->>'category','quantity',qty,'unit',unit,'unit_cents',price,'total_cents',total,'due_date',(item->>'due_date')::date,'completed',coalesce((item->>'completed')::boolean,false)));
  end loop;
  if p_action='create' then insert into public.season_budgets(id,user_id,cycle_id,name,items) values(p_operation,u,cid,btrim(p_data->>'name'),items) returning * into b;
  else update public.season_budgets set name=btrim(p_data->>'name'),items=items,version=version+1,updated_at=now() where id=b.id returning * into b;end if;
 else
  if coalesce(p_data->>'status','') not in ('draft','approved','archived') then raise exception 'Situação inválida.';end if;
  if p_data->>'status'='approved' and not exists(select 1 from public.production_cycles pc where pc.id=cid and coalesce(to_jsonb(pc)->>'status','planned') in ('planned','planted','developing','near_harvest','ready_to_harvest')) then raise exception 'Aprove somente orçamento de plantio em aberto.';end if;
  if p_data->>'status'='approved' and jsonb_array_length(b.items)=0 then raise exception 'Adicione operações antes de aprovar.';end if;
  update public.season_budgets set status=p_data->>'status',version=version+1,updated_at=now() where id=b.id returning * into b;
 end if;
 result:=jsonb_build_object('id',b.id,'version',b.version);insert into public.workspace_operations(user_id,operation_id,payload,result) values(u,p_operation,request,result);return result;
end;$$;
create or replace function public.budget_actual(p_budget uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare b public.season_budgets%rowtype;actual jsonb;planned bigint;
begin
 select * into b from public.season_budgets where id=p_budget and user_id=auth.uid();if not found then raise exception 'Orçamento indisponível.' using errcode='42501';end if;
 actual:=public.operating_cost_report(null,null,b.cycle_id,0);select coalesce(sum((v->>'total_cents')::bigint),0) into planned from jsonb_array_elements(b.items)v;
 return jsonb_build_object('planned_cents',planned,'actual',actual->'totals','variance_cents',coalesce((actual->'totals'->>'input_cents')::bigint,0)+coalesce((actual->'totals'->>'operating_cents')::bigint,0)-planned,'status',b.status);
end;$$;
create or replace function public.procurement_link(p_operation uuid,p_product uuid,p_input uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();request jsonb;result jsonb;op public.workspace_operations%rowtype;unit text;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtext('farm-workspace'),hashtext(u::text));request:=jsonb_build_object('kind','procurement','product',p_product,'input',p_input);
 select * into op from public.workspace_operations where user_id=u and operation_id=p_operation;if found then if op.payload is distinct from request then raise exception 'Operação já utilizada.';end if;return op.result;end if;
 select i.base_unit into unit from public.agricultural_inputs i where id=p_input and user_id=u and active and deleted_at is null;
 if unit is null or not exists(select 1 from public.trade_orders o cross join lateral jsonb_array_elements(o.quote_snapshot->'items')x where o.buyer_id=u and o.state in ('confirmed','awaiting_receipt','delivery_issue') and (x->>'product_id')::uuid=p_product and case x->>'base_unit' when 'kg' then 'kg' when 'L' then 'l' when 'un' then 'unit' end=unit) then raise exception 'Produto de pedido ou unidade incompatível.' using errcode='42501';end if;
 insert into public.trade_inventory_links(buyer_id,product_id,agricultural_input_id) values(u,p_product,p_input) on conflict(buyer_id,product_id) do update set agricultural_input_id=excluded.agricultural_input_id;
 result:=jsonb_build_object('ok',true);insert into public.workspace_operations(user_id,operation_id,payload,result) values(u,p_operation,request,result);return result;
end;$$;
create or replace function public.procurement_report(p_until date,p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_until is null or p_until<current_date or p_until>current_date+366 or p_offset is null or p_offset<0 or p_offset>1000000 then raise exception 'Escolha uma data entre hoje e os próximos 366 dias.';end if;
 with ordered as (
 select (x->>'product_id')::uuid as product_id,x->>'name' as name,case x->>'base_unit' when 'kg' then 'kg' when 'L' then 'l' when 'un' then 'unit' end as unit,(x->>'quantity')::numeric*(x->>'package_size')::numeric as quantity
 from public.trade_orders o cross join lateral jsonb_array_elements(o.quote_snapshot->'items') x where o.buyer_id=auth.uid() and o.state in ('confirmed','awaiting_receipt','delivery_issue')
 ), valueset as (
 select i.id,i.name,i.base_unit,i.minimum_stock,i.ideal_stock,coalesce(b.current_quantity,0) as stock,
 coalesce((select sum(lb.current_quantity) from public.inventory_lot_balances lb join public.inventory_lots l on l.id=lb.inventory_lot_id where l.user_id=auth.uid() and l.agricultural_input_id=i.id and l.deleted_at is null and lb.expiration_date<current_date and lb.current_quantity>0 and lb.unit=i.base_unit),0) as expired,
 coalesce((select sum((x->>'quantity')::numeric) from public.season_budgets budget join public.production_cycles pc on pc.id=budget.cycle_id and pc.deleted_at is null and coalesce(to_jsonb(pc)->>'status','planned') in ('planned','planted','developing','near_harvest','ready_to_harvest') cross join lateral jsonb_array_elements(budget.items)x where budget.user_id=auth.uid() and budget.status='approved' and (x->>'input_id')::uuid=i.id and not (x->>'completed')::boolean and (x->>'due_date')::date<=p_until),0) as demand,
 coalesce((select sum(o.quantity) from ordered o join public.trade_inventory_links link on link.product_id=o.product_id and link.buyer_id=auth.uid() and link.agricultural_input_id=i.id where o.unit=i.base_unit),0) as incoming
 from public.agricultural_inputs i left join public.inventory_balances b on b.agricultural_input_id=i.id where i.user_id=auth.uid() and i.active and i.deleted_at is null
 ), calculated as (select *,greatest(stock-expired,0) as usable,greatest(greatest(coalesce(ideal_stock,minimum_stock,0),demand+coalesce(minimum_stock,0))-greatest(stock-expired,0)-incoming,0) as suggested from valueset),
 page as (select * from calculated order by suggested desc,name,id limit 50 offset p_offset)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(p) order by suggested desc,name,id) from page p),'[]'::jsonb),'count',(select count(*) from calculated),
 'unmapped',coalesce((select jsonb_agg(to_jsonb(z)) from (select o.product_id,o.name,o.unit,sum(o.quantity) as quantity from ordered o where not exists(select 1 from public.trade_inventory_links l join public.agricultural_inputs i on i.id=l.agricultural_input_id and i.active and i.deleted_at is null and i.user_id=auth.uid() and i.base_unit=o.unit where l.product_id=o.product_id and l.buyer_id=auth.uid()) group by o.product_id,o.name,o.unit limit 50) z),'[]'::jsonb)) into result;return result;
end;$$;
revoke all on function public.budget_context(),public.budget_list(int),public.budget_command(uuid,text,jsonb),public.budget_actual(uuid),public.procurement_link(uuid,uuid,uuid),public.procurement_report(date,int) from public,anon,authenticated;
grant execute on function public.budget_context(),public.budget_list(int),public.budget_command(uuid,text,jsonb),public.budget_actual(uuid),public.procurement_link(uuid,uuid,uuid),public.procurement_report(date,int) to authenticated;
commit;
