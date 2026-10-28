begin;
-- Requer despesas operacionais (43) e tabelas agrícolas/financeiras existentes.
create table if not exists public.expense_allocations (
 expense_id uuid not null references public.operating_expenses(id),cycle_id uuid not null references public.production_cycles(id),
 amount_cents bigint not null check(amount_cents between 1 and 99999999999),cycle_label text not null,primary key(expense_id,cycle_id)
);
create index if not exists expense_allocations_cycle on public.expense_allocations(cycle_id);
alter table public.expense_allocations enable row level security;
revoke all on public.expense_allocations from public,anon,authenticated;
create or replace function public.expense_allocation_context(p_expense uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare e public.operating_expenses%rowtype;
begin
 select * into e from public.operating_expenses where id=p_expense and user_id=auth.uid();
 if not found then raise exception 'Despesa indisponível para sua conta.' using errcode='42501';end if;
 return jsonb_build_object('version',44,'expense',to_jsonb(e),
 'allocations',coalesce((select jsonb_agg(to_jsonb(a) order by cycle_label,cycle_id) from public.expense_allocations a where a.expense_id=e.id),'[]'::jsonb),
 'cycles',coalesce((select jsonb_agg(jsonb_build_object('id',pc.id,'label',coalesce(a.name,'Sem talhão')||' / '||coalesce(c.name,'Sem cultura')||' / '||coalesce(s.name,'Sem safra')||' / '||coalesce(pc.planting_date::text,'Sem data')||' / '||right(pc.id::text,8)) order by pc.planting_date desc,pc.id)
 from public.production_cycles pc left join public.areas a on a.id=pc.area_id left join public.crops c on c.id=pc.crop_id left join public.seasons s on s.id=pc.season_id
 where pc.user_id=auth.uid() and pc.property_id=e.property_id and pc.deleted_at is null and (e.season_id is null or pc.season_id=e.season_id)),'[]'::jsonb),
 'history',coalesce((select jsonb_agg(to_jsonb(h) order by h.created_at desc,h.operation_id) from (select operation_id,created_at,payload->'data'->>'reason' as reason,result->'allocations' as allocations from public.expense_operations where user_id=auth.uid() and payload->>'action'='allocate' and payload->'data'->>'id'=e.id::text order by created_at desc,operation_id limit 20) h),'[]'::jsonb));
end;$$;
create or replace function public.expense_allocate(p_operation uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();e public.operating_expenses%rowtype;o public.expense_operations%rowtype;request jsonb;result jsonb;item jsonb;cid uuid;n bigint;total bigint:=0;seen uuid[]:='{}';canonical jsonb:='[]';label text;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>20000 or jsonb_typeof(p_data->'allocations') is distinct from 'array' or jsonb_array_length(p_data->'allocations')>50 then raise exception 'Informe até 50 plantios para o rateio.';end if;
 if length(btrim(coalesce(p_data->>'reason',''))) not between 2 and 1000 then raise exception 'Informe o motivo do rateio (2 a 1000 caracteres).';end if;
 perform pg_advisory_xact_lock(hashtext('operating-expense'),hashtext(u::text));
 request:=jsonb_build_object('action','allocate','data',p_data);
 select * into o from public.expense_operations where user_id=u and operation_id=p_operation;
 if found then if o.payload is distinct from request then raise exception 'Identificador usado em outra operação.';end if;return o.result;end if;
 select * into e from public.operating_expenses where id=(p_data->>'id')::uuid and user_id=u for update;
 if not found then raise exception 'Despesa indisponível para sua conta.' using errcode='42501';end if;
 if e.version is distinct from (p_data->>'version')::int then raise exception 'A despesa mudou. Atualize antes de ratear.' using errcode='40001';end if;
 if e.cancelled_at is not null then raise exception 'Despesa cancelada não pode ser rateada.';end if;
 for item in select * from jsonb_array_elements(p_data->'allocations') loop
  cid:=(item->>'cycle_id')::uuid;
  if cid is null or cid=any(seen) or coalesce(item->>'amount_cents','') !~ '^[0-9]{1,11}$' then raise exception 'Plantio duplicado ou valor inválido.';end if;
  n:=(item->>'amount_cents')::bigint;if n<1 or n>e.amount_cents then raise exception 'Valor de rateio inválido.';end if;
  select coalesce(a.name,'Sem talhão')||' / '||coalesce(c.name,'Sem cultura')||' / '||coalesce(s.name,'Sem safra')||' / '||coalesce(pc.planting_date::text,'Sem data')||' / '||right(pc.id::text,8) into label
   from public.production_cycles pc left join public.areas a on a.id=pc.area_id left join public.crops c on c.id=pc.crop_id left join public.seasons s on s.id=pc.season_id
   where pc.id=cid and pc.user_id=u and pc.property_id=e.property_id and (e.season_id is null or pc.season_id=e.season_id)
   and (pc.deleted_at is null or exists(select 1 from public.expense_allocations old where old.expense_id=e.id and old.cycle_id=pc.id));
  if label is null then raise exception 'Plantio inválido para a propriedade ou safra da despesa.' using errcode='42501';end if;
  total:=total+n;seen:=array_append(seen,cid);canonical:=canonical||jsonb_build_array(jsonb_build_object('cycle_id',cid,'amount_cents',n,'cycle_label',label));
 end loop;
 if total>e.amount_cents then raise exception 'O rateio ultrapassa o valor da despesa.';end if;
 delete from public.expense_allocations where expense_id=e.id;
 insert into public.expense_allocations(expense_id,cycle_id,amount_cents,cycle_label) select e.id,(v->>'cycle_id')::uuid,(v->>'amount_cents')::bigint,v->>'cycle_label' from jsonb_array_elements(canonical) v;
 update public.operating_expenses set version=version+1,updated_at=now() where id=e.id returning * into e;
 result:=jsonb_build_object('id',e.id,'version',e.version,'allocations',canonical,'unallocated_cents',e.amount_cents-total);
 insert into public.expense_operations(user_id,operation_id,payload,result) values(u,p_operation,request,result);return result;
end;$$;
create or replace function public.operating_cost_report(p_property uuid default null,p_season uuid default null,p_cycle uuid default null,p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_offset is null or p_offset<0 or p_offset>1000000 then raise exception 'Página inválida.';end if;
 with costs as (
 select pc.id,pc.property_id,pc.season_id,pc.deleted_at,pc.planting_date,coalesce(p.name,'Propriedade') as property_name,coalesce(s.name,'Sem safra') as season_name,coalesce(a.name,'Sem talhão') as area_name,coalesce(c.name,'Sem cultura') as crop_name,
 round(coalesce((select sum(t.total_cost) from public.inventory_transactions t where t.production_cycle_id=pc.id and t.user_id=auth.uid() and t.transaction_type='usage'),0)*100)::bigint as input_cents,
 round(coalesce((select sum(v.total_value) from public.harvests h join public.harvest_sales v on v.harvest_id=h.id where h.production_cycle_id=pc.id and h.user_id=auth.uid() and v.user_id=auth.uid()),0)*100)::bigint as revenue_cents,
 coalesce((select sum(al.amount_cents) from public.expense_allocations al join public.operating_expenses e on e.id=al.expense_id where al.cycle_id=pc.id and e.user_id=auth.uid() and e.cancelled_at is null),0)::bigint as operating_cents
 from public.production_cycles pc left join public.properties p on p.id=pc.property_id left join public.seasons s on s.id=pc.season_id left join public.areas a on a.id=pc.area_id left join public.crops c on c.id=pc.crop_id
 where pc.user_id=auth.uid() and (p_property is null or pc.property_id=p_property) and (p_season is null or pc.season_id=p_season) and (p_cycle is null or pc.id=p_cycle)
 ), calculated as (select *,input_cents+operating_cents as total_cost_cents,revenue_cents-input_cents-operating_cents as result_cents from costs),
 page as (select * from calculated order by planting_date desc nulls last,id limit 50 offset p_offset),
 groups as (select property_id,property_name,season_id,season_name,count(*) as cycles,sum(input_cents) as input_cents,sum(operating_cents) as operating_cents,sum(revenue_cents) as revenue_cents,sum(result_cents) as result_cents from calculated group by property_id,property_name,season_id,season_name)
 select jsonb_build_object('version',44,'count',(select count(*) from calculated),'items',coalesce((select jsonb_agg(to_jsonb(p) order by planting_date desc nulls last,id) from page p),'[]'::jsonb),
 'groups',coalesce((select jsonb_agg(to_jsonb(g) order by property_name,season_name,property_id,season_id) from groups g),'[]'::jsonb),
 'totals',(select jsonb_build_object('input_cents',coalesce(sum(input_cents),0),'operating_cents',coalesce(sum(operating_cents),0),'revenue_cents',coalesce(sum(revenue_cents),0),'result_cents',coalesce(sum(result_cents),0)) from calculated),
 'unallocated_cents',coalesce((select sum(e.amount_cents-coalesce((select sum(al.amount_cents) from public.expense_allocations al where al.expense_id=e.id),0)) from public.operating_expenses e where e.user_id=auth.uid() and e.cancelled_at is null and (p_property is null or e.property_id=p_property) and (p_season is null or e.season_id=p_season)),0)) into result;
 return result;
end;$$;
revoke all on function public.expense_allocation_context(uuid),public.expense_allocate(uuid,jsonb),public.operating_cost_report(uuid,uuid,uuid,int) from public,anon,authenticated;
grant execute on function public.expense_allocation_context(uuid),public.expense_allocate(uuid,jsonb),public.operating_cost_report(uuid,uuid,uuid,int) to authenticated;
commit;
