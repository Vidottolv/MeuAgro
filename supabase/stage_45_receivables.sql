begin;
-- Etapa 45: contas a receber operacionais pessoais. Não altera os resultados de insumos/vendas.
create table if not exists public.operating_receivables (
 id uuid primary key,user_id uuid not null references auth.users(id),property_id uuid not null references public.properties(id),season_id uuid references public.seasons(id),
 property_name text not null,season_name text not null default '',title text not null check(length(btrim(title)) between 2 and 160),
 category text not null check(category in ('services','harvest','other')),
 amount_cents bigint not null check(amount_cents between 1 and 99999999999),record_date date not null,due_date date not null,
 notes text not null default '' check(length(notes)<=2000),version int not null default 1,cancelled_at timestamptz,cancel_reason text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists operating_receivables_owner_due on public.operating_receivables(user_id,due_date,id);
create table if not exists public.receivable_payments (
 id uuid primary key,receivable_id uuid not null references public.operating_receivables(id),amount_cents bigint not null check(amount_cents between 1 and 99999999999),
 paid_on date not null,note text not null default '' check(length(note)<=1000),created_at timestamptz not null default now(),reversed_at timestamptz,reverse_reason text
);
create index if not exists receivable_payments_receivable on public.receivable_payments(receivable_id);
create table if not exists public.receivable_operations (
 user_id uuid not null references auth.users(id),operation_id uuid not null,payload jsonb not null,result jsonb not null,created_at timestamptz not null default now(),primary key(user_id,operation_id)
);
alter table public.operating_receivables enable row level security;
alter table public.receivable_payments enable row level security;
alter table public.receivable_operations enable row level security;
revoke all on public.operating_receivables,public.receivable_payments,public.receivable_operations from public,anon,authenticated;
create or replace function public.receivable_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 return jsonb_build_object('properties',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name) order by p.name) from public.properties p where p.user_id=auth.uid() and p.deleted_at is null),'[]'::jsonb),
 'seasons',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'property_id',s.property_id) order by s.name) from public.seasons s where s.user_id=auth.uid() and s.deleted_at is null),'[]'::jsonb));
end;$$;
create or replace function public.receivable_list(p_offset int default 0,p_property uuid default null,p_from date default null,p_to date default null,p_state text default 'active') returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_offset is null or p_offset<0 or p_offset>1000000 or p_state is null or p_state not in ('active','open','paid','cancelled') or (p_from is not null and p_to is not null and p_from>p_to) then raise exception 'Filtros inválidos.';end if;
 with balances as (
 select e.*,coalesce((select sum(p.amount_cents) from public.receivable_payments p where p.receivable_id=e.id and p.reversed_at is null),0)::bigint as paid_cents
 from public.operating_receivables e where e.user_id=auth.uid() and (p_property is null or e.property_id=p_property) and (p_from is null or e.due_date>=p_from) and (p_to is null or e.due_date<=p_to)
 ), filtered as (
 select *,case when cancelled_at is null then amount_cents-paid_cents else 0 end as balance_cents from balances where case p_state when 'cancelled' then cancelled_at is not null when 'paid' then cancelled_at is null and paid_cents=amount_cents when 'open' then cancelled_at is null and paid_cents<amount_cents else cancelled_at is null end
 ), page as (select * from filtered order by due_date,id limit 50 offset p_offset)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(p) order by due_date,id) from page p),'[]'::jsonb),'count',(select count(*) from filtered),
 'totals',(select jsonb_build_object('amount_cents',coalesce(sum(amount_cents) filter(where cancelled_at is null),0),'paid_cents',coalesce(sum(paid_cents) filter(where cancelled_at is null),0),'balance_cents',coalesce(sum(balance_cents) filter(where cancelled_at is null),0)) from filtered)) into result;
 return result;
end;$$;
create or replace function public.receivable_detail(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare e public.operating_receivables%rowtype;
begin
 select * into e from public.operating_receivables where id=p_id and user_id=auth.uid();
 if not found then raise exception 'Conta a receber indisponível para sua conta.' using errcode='42501';end if;
 return jsonb_build_object('receivable',to_jsonb(e),'payments',coalesce((select jsonb_agg(to_jsonb(p) order by created_at,id) from public.receivable_payments p where p.receivable_id=e.id),'[]'::jsonb));
end;$$;
create or replace function public.receivable_command(p_operation uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();e public.operating_receivables%rowtype;o public.receivable_operations%rowtype;request jsonb;result jsonb;total bigint;n bigint;d date;prop uuid;sn uuid;pn text;ss text;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_action is null or p_action not in ('create','pay','reverse','cancel') or jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>12000 then raise exception 'Operação inválida.';end if;
 perform pg_advisory_xact_lock(hashtext('operating-receivable'),hashtext(u::text));
 request:=jsonb_build_object('action',p_action,'data',p_data);
 select * into o from public.receivable_operations where user_id=u and operation_id=p_operation;
 if found then if o.payload is distinct from request then raise exception 'Identificador usado em outra operação.';end if;return o.result;end if;
 if p_action in ('create','pay') then
   if coalesce(p_data->>'amount_cents','') !~ '^[0-9]{1,11}$' then raise exception 'Informe um valor positivo em centavos.';end if;
   n:=(p_data->>'amount_cents')::bigint;
   if n<1 or n>99999999999 then raise exception 'Valor fora do limite.';end if;
 end if;
 if p_action='create' then
   if (select count(*) from public.operating_receivables where user_id=u)>=10000 then raise exception 'Limite de 10000 contas a receber por conta atingido.';end if;
   prop:=(p_data->>'property_id')::uuid;sn:=nullif(p_data->>'season_id','')::uuid;
   select name into pn from public.properties where id=prop and user_id=u and deleted_at is null;
   if pn is null then raise exception 'Propriedade indisponível para sua conta.' using errcode='42501';end if;
   if sn is not null then
    select name into ss from public.seasons where id=sn and user_id=u and property_id=prop and deleted_at is null;
    if ss is null then raise exception 'Safra inválida para a propriedade.';end if;
   end if;
   if coalesce(p_data->>'record_date','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(p_data->>'due_date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Informe as datas da conta a receber.';end if;
   if (p_data->>'record_date')::date not between date '1900-01-01' and current_date or (p_data->>'due_date')::date not between date '1900-01-01' and date '2100-12-31' then raise exception 'Datas fora do período permitido.';end if;
   insert into public.operating_receivables(id,user_id,property_id,season_id,property_name,season_name,title,category,amount_cents,record_date,due_date,notes)
   values(p_operation,u,prop,sn,pn,coalesce(ss,''),btrim(p_data->>'title'),p_data->>'category',n,(p_data->>'record_date')::date,(p_data->>'due_date')::date,coalesce(p_data->>'notes','')) returning * into e;
 else
   select * into e from public.operating_receivables where id=(p_data->>'id')::uuid and user_id=u for update;
   if not found then raise exception 'Conta a receber indisponível para sua conta.' using errcode='42501';end if;
   if e.version is distinct from (p_data->>'version')::int then raise exception 'A conta a receber mudou. Atualize antes de continuar.' using errcode='40001';end if;
   if e.cancelled_at is not null then raise exception 'Esta conta a receber está cancelada.';end if;
   select coalesce(sum(amount_cents),0) into total from public.receivable_payments where receivable_id=e.id and reversed_at is null;
   if p_action='pay' then
    if total+n>e.amount_cents then raise exception 'Recebimento maior que o saldo em aberto.';end if;
    if (select count(*) from public.receivable_payments where receivable_id=e.id)>=100 then raise exception 'Limite de 100 recebimentos por conta a receber.';end if;
    if coalesce(p_data->>'paid_on','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Informe a data do recebimento.';end if;
    d:=(p_data->>'paid_on')::date;
    if d not between date '1900-01-01' and current_date then raise exception 'Recebimento deve ter uma data válida até hoje.';end if;
    insert into public.receivable_payments(id,receivable_id,amount_cents,paid_on,note) values(p_operation,e.id,n,d,coalesce(p_data->>'note',''));
   elsif p_action='reverse' then
    if length(btrim(coalesce(p_data->>'reason',''))) not between 2 and 1000 then raise exception 'Informe o motivo do estorno (2 a 1000 caracteres).';end if;
    update public.receivable_payments set reversed_at=now(),reverse_reason=btrim(p_data->>'reason') where id=(p_data->>'payment_id')::uuid and receivable_id=e.id and reversed_at is null;
    if not found then raise exception 'Recebimento indisponível para estorno.';end if;
   else
    if total<>0 then raise exception 'Estorne os recebimentos antes de cancelar a conta a receber.';end if;
    if length(btrim(coalesce(p_data->>'reason',''))) not between 2 and 1000 then raise exception 'Informe o motivo do cancelamento (2 a 1000 caracteres).';end if;
    update public.operating_receivables set cancelled_at=now(),cancel_reason=btrim(p_data->>'reason') where id=e.id;
   end if;
   update public.operating_receivables set version=version+1,updated_at=now() where id=e.id returning * into e;
 end if;
 result:=jsonb_build_object('id',e.id,'version',e.version);
 insert into public.receivable_operations(user_id,operation_id,payload,result) values(u,p_operation,request,result);
 return result;
end;$$;
revoke all on function public.receivable_context(),public.receivable_list(int,uuid,date,date,text),public.receivable_detail(uuid),public.receivable_command(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.receivable_context(),public.receivable_list(int,uuid,date,date,text),public.receivable_detail(uuid),public.receivable_command(uuid,text,jsonb) to authenticated;
create or replace function public.cash_flow_report(p_from date,p_to date) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_from is null or p_to is null or p_from>p_to or p_to-p_from>366 then raise exception 'Use um período de até 366 dias.';end if;
 return (with movements as (
 select p.paid_on as day,p.amount_cents as incoming,0::bigint as outgoing from public.receivable_payments p join public.operating_receivables r on r.id=p.receivable_id where r.user_id=auth.uid() and p.reversed_at is null and r.cancelled_at is null and p.paid_on between p_from and p_to
 union all select p.paid_on,0::bigint,p.amount_cents from public.expense_payments p join public.operating_expenses e on e.id=p.expense_id where e.user_id=auth.uid() and p.reversed_at is null and e.cancelled_at is null and p.paid_on between p_from and p_to
 ), days as(select day,sum(incoming) as incoming,sum(outgoing) as outgoing,sum(incoming-outgoing) as net from movements group by day)
 select jsonb_build_object('days',coalesce((select jsonb_agg(to_jsonb(d) order by day) from days d),'[]'::jsonb),'incoming',coalesce((select sum(incoming) from movements),0),'outgoing',coalesce((select sum(outgoing) from movements),0),'net',coalesce((select sum(incoming-outgoing) from movements),0)));
end;$$;
revoke all on function public.cash_flow_report(date,date) from public,anon,authenticated;grant execute on function public.cash_flow_report(date,date) to authenticated;
commit;
