-- Meu Agro 0.25.0. Requer a base comercial da versão 0.24.0.
begin;
alter table public.commerce_memberships add column if not exists management_role text not null default 'representative' check(management_role in ('representative','manager'));
alter table public.commerce_memberships add column if not exists can_view_finance boolean not null default false;
create or replace function public.commerce_can_manage(p_seller uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.trade_agent_active(p_seller,auth.uid()) and exists(select 1 from public.commerce_sellers s where s.id=p_seller and s.kind='company' and
 (s.owner_id=auth.uid() or exists(select 1 from public.commerce_memberships m where m.seller_id=s.id and m.user_id=auth.uid() and m.active and m.management_role='manager')));
$$;
create or replace function public.commerce_manage_finance(p_seller uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.commerce_can_manage(p_seller) and (public.commerce_is_owner(p_seller) or exists(select 1 from public.commerce_memberships where seller_id=p_seller and user_id=auth.uid() and active and can_view_finance));
$$;
create or replace function public.commerce_clear_management() returns trigger language plpgsql set search_path='' as $$
begin if not new.active then new.management_role:='representative';new.can_view_finance:=false;end if;return new;end $$;
drop trigger if exists commerce_clear_management on public.commerce_memberships;
create trigger commerce_clear_management before update on public.commerce_memberships for each row execute function public.commerce_clear_management();
create or replace function public.trade_manages_connection(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.trade_connections c where c.id=p_id and
 (public.commerce_is_owner(c.seller_id) or public.commerce_can_manage(c.seller_id) or (c.agent_id=auth.uid() and public.trade_agent_active(c.seller_id,auth.uid()))));
$$;
create table if not exists public.management_settings(seller_id uuid primary key references public.commerce_sellers(id),discount_limit numeric(5,2) not null default 100 check(discount_limit between 0 and 100),stale_hours integer not null default 48 check(stale_hours between 1 and 720));
create table if not exists public.management_followups(request_id uuid primary key references public.trade_requests(id),next_action text not null default '' check(length(next_action)<=500),due_at timestamptz,version integer not null default 1,updated_by uuid not null references auth.users(id),updated_at timestamptz not null default now());
create table if not exists public.management_notes(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.trade_requests(id),author_id uuid not null references auth.users(id),body text not null check(length(btrim(body)) between 1 and 2000),created_at timestamptz not null default now());
create table if not exists public.management_goals(id uuid primary key default gen_random_uuid(),seller_id uuid not null references public.commerce_sellers(id),agent_id uuid references auth.users(id),month date not null check(extract(day from month)=1),amount numeric(16,2) not null check(amount>=0),unique nulls not distinct(seller_id,agent_id,month));
create table if not exists public.management_audit(id uuid primary key default gen_random_uuid(),seller_id uuid not null references public.commerce_sellers(id),actor_id uuid not null references auth.users(id),action text not null,details jsonb not null,created_at timestamptz not null default now());
create table if not exists public.management_approvals(id uuid primary key default gen_random_uuid(),seller_id uuid not null references public.commerce_sellers(id),request_id uuid not null references public.trade_requests(id),requester_id uuid not null references auth.users(id),agent_id uuid not null references auth.users(id),expected_version integer not null,payload jsonb not null,summary jsonb not null,status text not null default 'pending' check(status in ('pending','approved','rejected','superseded')),reason text,reviewer_id uuid references auth.users(id),created_at timestamptz not null default now(),reviewed_at timestamptz);
create unique index if not exists management_one_approval on public.management_approvals(request_id) where status='pending';
create index if not exists management_notes_request on public.management_notes(request_id,created_at);
create or replace function public.management_staff_request(p_request uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.trade_requests r join public.trade_connections c on c.id=r.connection_id where r.id=p_request and public.trade_agent_active(c.seller_id,auth.uid()) and public.trade_manages_connection(c.id));
$$;
do $$ declare tab text;begin
 foreach tab in array array['management_settings','management_followups','management_notes','management_goals','management_audit','management_approvals'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('revoke all on public.%I from public,anon,authenticated',tab);
 end loop;
end $$;
-- Only the dedicated RPCs expose data; the producer cannot select internal tables.
create or replace function public.management_workspace(p_request uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.management_staff_request(p_request) then raise exception 'Acompanhamento interno indisponível.' using errcode='42501';end if;
 return jsonb_build_object('followup',(select to_jsonb(f) from public.management_followups f where request_id=p_request),
 'notes',coalesce((select jsonb_agg(to_jsonb(n) order by created_at desc,id desc) from (select n.id,n.body,n.created_at,coalesce(a.display_name,'Equipe') as author from public.management_notes n left join public.commerce_accounts a on a.user_id=n.author_id where request_id=p_request order by n.created_at desc,n.id desc limit 100) n),'[]'::jsonb),
 'approvals',coalesce((select jsonb_agg(jsonb_build_object('id',id,'status',status,'reason',reason,'created_at',created_at) order by created_at desc) from public.management_approvals where request_id=p_request),'[]'::jsonb));
end $$;
-- The insert trigger uses fully validated amounts from the existing quote command.
create or replace function public.management_discount_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare sid uuid; lim numeric;
begin
 select c.seller_id into sid from public.trade_requests r join public.trade_connections c on c.id=r.connection_id where r.id=new.request_id;
 select discount_limit into lim from public.management_settings where seller_id=sid;
 if not public.commerce_is_owner(sid) and not public.commerce_can_manage(sid) and new.subtotal>0 and new.discount/new.subtotal*100>coalesce(lim,100) then
 raise exception 'Desconto requer aprovação.' using errcode='P0301',detail=jsonb_build_object('subtotal',new.subtotal,'discount',new.discount,'freight',new.freight,'total',new.total,'items',new.items,'valid_until',new.valid_until,'payment_terms',new.payment_terms,'delivery_days',new.delivery_days,'notes',new.notes)::text;
 end if;return new;
end $$;
drop trigger if exists management_discount_guard on public.trade_quotes;
create trigger management_discount_guard before insert on public.trade_quotes for each row execute function public.management_discount_guard();
do $$ begin
 if to_regprocedure('public.trade_command_before_management(text,jsonb,uuid)') is null then alter function public.trade_command(text,jsonb,uuid) rename to trade_command_before_management;end if;
end $$;
revoke all on function public.trade_command_before_management(text,jsonb,uuid) from public,anon,authenticated;
create or replace function public.trade_command(p_action text,p_data jsonb,p_operation_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare res jsonb; info text; sid uuid; agent uuid; rid uuid; aid uuid; old_hash text; expected integer;
begin
 if p_action<>'send_quote' then return public.trade_command_before_management(p_action,p_data,p_operation_id);end if;
 if auth.uid() is null or p_operation_id is null then raise exception 'Entre na conta e tente novamente.';end if;
 perform 1 from auth.users where id=auth.uid() for update;
 select result,fingerprint into res,old_hash from public.trade_operations where user_id=auth.uid() and operation_id=p_operation_id;
 if found then if old_hash<>md5(p_action||p_data::text) then raise exception 'Operação já utilizada.';end if;return res;end if;
 rid:=(p_data->>'request_id')::uuid;
 -- Hold the request lock outside the rollback block so competing revisions cannot race.
 perform 1 from public.trade_requests where id=rid for update;
 begin
 res:=public.trade_command_before_management(p_action,p_data,p_operation_id);
 update public.management_approvals set status='superseded',reviewed_at=now() where request_id=rid and status='pending';
 return res;
 exception when sqlstate 'P0301' then get stacked diagnostics info=pg_exception_detail;
 end;
 select c.seller_id,c.agent_id into sid,agent from public.trade_requests r join public.trade_connections c on c.id=r.connection_id where r.id=rid;
 select coalesce(max(version),0) into expected from public.trade_quotes where request_id=rid;
 update public.management_approvals set status='superseded',reviewed_at=now() where request_id=rid and status='pending';
 insert into public.management_approvals(seller_id,request_id,requester_id,agent_id,expected_version,payload,summary) values(sid,rid,auth.uid(),agent,expected,p_data,info::jsonb) returning id into aid;
 insert into public.management_audit(seller_id,actor_id,action,details) values(sid,auth.uid(),'request_approval',jsonb_build_object('request_id',rid,'approval_id',aid));
 res:=jsonb_build_object('id',aid,'request_id',rid,'approval_pending',true);
 insert into public.trade_operations(user_id,operation_id,fingerprint,result) values(auth.uid(),p_operation_id,md5(p_action||p_data::text),res);
 return res;
end $$;
alter table public.management_goals add column if not exists version integer not null default 1;
create or replace function public.management_command(p_action text,p_data jsonb,p_operation_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare u uuid:=auth.uid();sid uuid:=(p_data->>'seller_id')::uuid;rid uuid;target uuid;res jsonb;old_hash text;fingerprint text:=md5('management:'||p_action||p_data::text);reason text:=btrim(coalesce(p_data->>'reason',''));body text:=btrim(coalesce(p_data->>'body',''));v integer;goal_month date;amt numeric;approval public.management_approvals%rowtype;conn public.trade_connections%rowtype;detail jsonb;
begin
 if u is null or p_operation_id is null then raise exception 'Entre na conta e tente novamente.' using errcode='42501';end if;
 perform 1 from auth.users where id=u for update;
 select o.fingerprint,o.result into old_hash,res from public.trade_operations o where user_id=u and operation_id=p_operation_id;
 if found then if old_hash<>fingerprint then raise exception 'Operação já utilizada com outros dados.';end if;return res;end if;
 if p_action in ('note','followup') then
  rid:=(p_data->>'request_id')::uuid;
  perform 1 from public.trade_requests where id=rid for update;
  select c.seller_id into sid from public.trade_requests r join public.trade_connections c on c.id=r.connection_id where r.id=rid;
  if not public.management_staff_request(rid) then raise exception 'Acompanhamento indisponível.' using errcode='42501';end if;
 else
  if not public.commerce_can_manage(sid) then raise exception 'Acesso gerencial indisponível.' using errcode='42501';end if;
 end if;
 detail:=jsonb_build_object('reason',reason,'request_id',rid);
 if p_action='grant' then
  if not public.commerce_is_owner(sid) then raise exception 'Somente o dono pode alterar permissões.' using errcode='42501';end if;
  if coalesce(p_data->>'role','') not in ('representative','manager') then raise exception 'Papel inválido.';end if;
  target:=(p_data->>'agent_id')::uuid;
  update public.commerce_memberships set management_role=p_data->>'role',can_view_finance=(p_data->>'role'='manager' and coalesce((p_data->>'finance')::boolean,false)) where seller_id=sid and user_id=target and active;
  if not found then raise exception 'Representante ativo não encontrado.';end if;
  detail:=detail||jsonb_build_object('agent_id',target,'role',p_data->>'role','finance',p_data->>'finance');
 elsif p_action='settings' then
  if not public.commerce_is_owner(sid) then raise exception 'Somente o dono pode alterar os limites.' using errcode='42501';end if;
  amt:=(p_data->>'discount_limit')::numeric;v:=(p_data->>'stale_hours')::integer;
  if amt is null or amt<0 or amt>100 or amt<>round(amt,2) or v is null or v<1 or v>720 then raise exception 'Revise o limite e o prazo de atenção.';end if;
  insert into public.management_settings values(sid,amt,v) on conflict(seller_id) do update set discount_limit=excluded.discount_limit,stale_hours=excluded.stale_hours;
  detail:=detail||jsonb_build_object('discount_limit',amt,'stale_hours',v);
 elsif p_action='goal' then
  target:=nullif(p_data->>'agent_id','')::uuid;goal_month:=(p_data->>'month')::date;amt:=(p_data->>'amount')::numeric;
  if goal_month is null or extract(day from goal_month)<>1 or extract(year from goal_month) not between 2000 and 2200 or amt is null or amt<0 or amt>1000000000000 or amt<>round(amt,2) then raise exception 'Revise mês e valor da meta.';end if;
  if target is not null and not public.trade_agent_active(sid,target) then raise exception 'Consultor inativo.';end if;
  -- Lock seller to serialize concurrent goal creation by different managers.
  perform 1 from public.commerce_sellers where id=sid for update;
  select version into v from public.management_goals where seller_id=sid and agent_id is not distinct from target and month=goal_month;
  if coalesce(v,0) is distinct from (p_data->>'expected_version')::integer then raise exception 'A meta mudou. Atualize a tela.';end if;
  insert into public.management_goals(seller_id,agent_id,month,amount) values(sid,target,goal_month,amt)
  on conflict(seller_id,agent_id,month) do update set amount=excluded.amount,version=management_goals.version+1;
  detail:=detail||jsonb_build_object('agent_id',target,'month',goal_month,'amount',amt);
 elsif p_action='transfer' then
  select * into conn from public.trade_connections where id=(p_data->>'connection_id')::uuid and seller_id=sid for update;
  if not found then raise exception 'Carteira indisponível.';end if;
  target:=(p_data->>'agent_id')::uuid;
  if conn.agent_id is distinct from (p_data->>'expected_agent')::uuid then raise exception 'O responsável mudou. Atualize a tela.';end if;
  if not public.trade_agent_active(sid,target) or length(reason) not between 5 and 500 then raise exception 'Escolha um consultor ativo e informe o motivo (5 a 500 caracteres).';end if;
  update public.trade_connections set agent_id=target where id=conn.id;
  update public.management_approvals set status='superseded',reviewed_at=now(),reason='Atendimento transferido.' where status='pending' and request_id in (select id from public.trade_requests where connection_id=conn.id);
  detail:=detail||jsonb_build_object('connection_id',conn.id,'from',conn.agent_id,'to',target);
 elsif p_action='note' then
  if length(body) not between 1 and 2000 then raise exception 'Escreva uma nota de até 2000 caracteres.';end if;
  insert into public.management_notes(request_id,author_id,body) values(rid,u,body);
 elsif p_action='followup' then
  select version into v from public.management_followups where request_id=rid;
  if coalesce(v,0) is distinct from (p_data->>'expected_version')::integer then raise exception 'O acompanhamento mudou. Atualize a tela.';end if;
  if length(body)>500 or (nullif(p_data->>'due_at','') is not null and body='') then raise exception 'Informe a próxima ação (até 500 caracteres).';end if;
  insert into public.management_followups(request_id,next_action,due_at,updated_by) values(rid,body,nullif(p_data->>'due_at','')::timestamptz,u)
  on conflict(request_id) do update set next_action=excluded.next_action,due_at=excluded.due_at,updated_by=u,updated_at=now(),version=management_followups.version+1;
 elsif p_action in ('approve','reject') then
  select * into approval from public.management_approvals where id=(p_data->>'approval_id')::uuid and seller_id=sid;
  if not found then raise exception 'Aprovação indisponível.';end if;
  rid:=approval.request_id;perform 1 from public.trade_requests where id=rid for update;
  select c.* into conn from public.trade_requests r join public.trade_connections c on c.id=r.connection_id where r.id=rid for share of c;
  select * into approval from public.management_approvals where id=approval.id for update;
  if approval.status<>'pending' then raise exception 'Esta aprovação já foi resolvida.';end if;
  select coalesce(max(version),0) into v from public.trade_quotes where request_id=rid;
  if p_action='approve' and (v<>approval.expected_version or conn.agent_id<>approval.agent_id or not public.trade_agent_active(sid,approval.requester_id)) then raise exception 'A negociação mudou. Solicite uma nova proposta.';end if;
  if length(reason) not between 5 and 500 then raise exception 'Informe uma justificativa (5 a 500 caracteres).';end if;
  if p_action='approve' then res:=public.trade_command_before_management('send_quote',approval.payload,gen_random_uuid());end if;
  update public.management_approvals set status=case when p_action='approve' then 'approved' else 'rejected' end,reason=reason,reviewer_id=u,reviewed_at=now() where id=approval.id;
  detail:=detail||jsonb_build_object('request_id',rid,'approval_id',approval.id,'quote',res);
 else raise exception 'Ação desconhecida.';
 end if;
 insert into public.management_audit(seller_id,actor_id,action,details) values(sid,u,p_action,detail);
 res:=coalesce(res,'{}'::jsonb)||jsonb_build_object('saved',true);
 insert into public.trade_operations(user_id,operation_id,fingerprint,result) values(u,p_operation_id,fingerprint,res);
 return res;
end $$;
create or replace function public.management_companies() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'owner',owner_id=auth.uid(),'finance',public.commerce_manage_finance(id)) order by name),'[]'::jsonb)
 from public.commerce_sellers where kind='company' and public.commerce_can_manage(id);
$$;
create or replace view public.management_pipeline with(security_invoker=true) as
select r.id,r.connection_id,c.seller_id,c.agent_id,c.buyer_name,r.created_at,r.state as request_state,r.items,
 coalesce(o.state,r.state) as stage,o.id as order_id,o.total as order_total,o.received_at,o.agent_at_acceptance,
 q.id as quote_id,q.total as quote_total,q.valid_until,q.status as quote_status,q.author_id as quote_author,
 greatest(r.created_at,ev.touched,msg.touched) as last_activity,
 first_reply.created_at as first_response_at,first_reply.actor_id as first_responder,
 first_quote.author_id as first_quote_author,
 f.next_action,f.due_at,coalesce(f.version,0) as followup_version,
 coalesce(a.display_name,'Consultor') as agent_name,
 exists(select 1 from public.management_approvals ap where ap.request_id=r.id and ap.status='pending') as approval_pending
from public.trade_requests r join public.trade_connections c on c.id=r.connection_id
left join public.commerce_accounts a on a.user_id=c.agent_id
left join public.trade_orders o on o.request_id=r.id
left join lateral(select * from public.trade_quotes where request_id=r.id order by version desc limit 1) q on true
left join lateral(select author_id from public.trade_quotes where request_id=r.id order by version limit 1) first_quote on true
left join lateral(select max(created_at) touched from public.trade_events where request_id=r.id) ev on true
left join lateral(select max(created_at) touched from public.trade_messages where request_id=r.id) msg on true
left join lateral(select * from (
 select created_at,actor_id from public.trade_events where request_id=r.id and action in ('send_quote','ask_clarification','reject_request')
 union all select created_at,sender_id from public.trade_messages where request_id=r.id and sender_role='seller'
 ) replies order by created_at,actor_id limit 1) first_reply on true
left join public.management_followups f on f.request_id=r.id;
revoke all on public.management_pipeline from public,anon,authenticated;
create or replace function public.management_report(p_seller uuid,p_from date,p_to date,p_filter jsonb default '{}'::jsonb,p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;finance boolean;stale integer;totals jsonb;team jsonb;queue jsonb;products jsonb;goals jsonb;approvals jsonb;month_start date;scope_agent uuid:=nullif(p_filter->>'agent','')::uuid;scope_product text:=nullif(p_filter->>'product','');scope_status text:=coalesce(nullif(p_filter->>'state',''),'open');
begin
 if not public.commerce_can_manage(p_seller) then raise exception 'Acesso gerencial indisponível.' using errcode='42501';end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>365 or p_offset is null or p_offset<0 then raise exception 'Escolha até 366 dias e uma página válida.';end if;
 finance:=public.commerce_manage_finance(p_seller);month_start:=date_trunc('month',p_from)::date;
 select coalesce((select stale_hours from public.management_settings where seller_id=p_seller),48) into stale;
 with ord as (
 select o.*,f.id as finance_id,f.commission_amount,f.result_amount,f.product_cost+f.delivery_cost+f.other_cost as costs
 from public.trade_orders o left join lateral(select * from public.trade_financial_versions where order_id=o.id order by version desc limit 1) f on true
 where o.seller_id=p_seller and o.state='received' and (o.received_at at time zone 'America/Sao_Paulo')::date between p_from and p_to
 ), sums as (select count(*) n,coalesce(sum(total),0) revenue,count(*) filter(where finance_id is null) missing,
 coalesce(sum(commission_amount),0) commission,coalesce(sum(result_amount),0) profit,coalesce(sum(costs),0) cost from ord),
 current_queue as (select *,stage not in ('received','declined','cancelled','rejected') as active from public.management_pipeline where seller_id=p_seller)
 select jsonb_build_object('received_count',n,'sales_total',revenue,
 'previous_sales',coalesce((select sum(total) from public.trade_orders where seller_id=p_seller and state='received' and (received_at at time zone 'America/Sao_Paulo')::date between p_from-(p_to-p_from+1) and p_from-1),0),
 'open_quotes',coalesce((select sum(quote_total) from current_queue where stage='quoted' and quote_status='sent' and valid_until>now()),0),
 'to_deliver',(select count(*) from current_queue where stage in ('confirmed','delivery_issue')),
 'to_receive',(select count(*) from current_queue where stage='awaiting_receipt'),
 'stale',(select count(*) from current_queue where active and last_activity<now()-make_interval(hours=>stale) and (due_at is null or due_at<=now())),
 'followup_due',(select count(*) from current_queue where active and due_at<=now()),
 'quote_expiring',(select count(*) from current_queue where stage='quoted' and valid_until between now() and now()+interval '48 hours'),
 'delivery_issues',(select count(*) from current_queue where stage='delivery_issue'),
 'quote_requests',(select count(*) from current_queue where (created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to and first_quote_author is not null),
 'converted_requests',(select count(*) from current_queue where (created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to and first_quote_author is not null and order_id is not null))
 ||case when finance then jsonb_build_object('missing_financials',missing,'commission',case when missing=0 then commission end,'result',case when missing=0 then profit end,'cost',case when missing=0 then cost end) else '{}'::jsonb end into totals from sums;
 with agents as (
 select owner_id id from public.commerce_sellers where id=p_seller
 union select user_id from public.commerce_memberships where seller_id=p_seller
 union select agent_at_acceptance from public.trade_orders where seller_id=p_seller
 ), data as (
 select a.id,coalesce(c.display_name,'Consultor') as name,public.trade_agent_active(p_seller,a.id) as active,
 coalesce(m.management_role,'owner') as role,coalesce(m.can_view_finance,false) as finance_permission,
 (select count(*) from public.trade_connections where seller_id=p_seller and agent_id=a.id and active) as customers,
 (select count(*) from public.management_pipeline where seller_id=p_seller and agent_id=a.id and stage not in ('received','declined','cancelled','rejected')) as open_requests,
 coalesce((select sum(total) from public.trade_orders where seller_id=p_seller and agent_at_acceptance=a.id and state='received' and (received_at at time zone 'America/Sao_Paulo')::date between p_from and p_to),0) as revenue,
 (select count(*) from public.management_pipeline where seller_id=p_seller and first_quote_author=a.id and (created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to) as quoted,
 (select count(*) from public.management_pipeline where seller_id=p_seller and first_quote_author=a.id and order_id is not null and (created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to) as converted,
 (select round(avg(extract(epoch from (first_response_at-created_at))/3600)::numeric,2) from public.management_pipeline where seller_id=p_seller and first_responder=a.id and (created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to) as response_hours,
 (select amount from public.management_goals where seller_id=p_seller and agent_id=a.id and month=month_start) as goal,
 coalesce((select sum(total) from public.trade_orders where seller_id=p_seller and agent_at_acceptance=a.id and state='received' and (received_at at time zone 'America/Sao_Paulo')::date>=month_start and (received_at at time zone 'America/Sao_Paulo')::date<(month_start+interval '1 month')::date),0) as month_sales
 from agents a left join public.commerce_accounts c on c.user_id=a.id left join public.commerce_memberships m on m.seller_id=p_seller and m.user_id=a.id
 ) select coalesce(jsonb_agg(to_jsonb(d)||case when finance then jsonb_build_object('commission',(
 select case when count(*) filter(where v.id is null)=0 then coalesce(sum(v.commission_amount),0) end from public.trade_orders o left join lateral(select id,commission_amount from public.trade_financial_versions where order_id=o.id order by version desc limit 1) v on true
 where o.seller_id=p_seller and o.agent_at_acceptance=d.id and o.state='received' and (o.received_at at time zone 'America/Sao_Paulo')::date between p_from and p_to)) else '{}'::jsonb end order by revenue desc,name,id),'[]'::jsonb) into team from data d;
 with filtered as (
 select p.*,case when due_at<=now() then 'Retorno vencido' when stage='delivery_issue' then 'Divergência na entrega' when stage='quoted' and valid_until<=now() then 'Proposta vencida' when stage='quoted' and valid_until<now()+interval '48 hours' then 'Proposta vence em breve' when last_activity<now()-make_interval(hours=>stale) and (due_at is null or due_at<=now()) then 'Sem movimentação' else '' end as attention
 from public.management_pipeline p where seller_id=p_seller
 and (scope_agent is null or agent_id=scope_agent)
 and (scope_product is null or exists(select 1 from jsonb_array_elements(items) i where i->>'product_id'=scope_product))
 and (coalesce(p_filter->>'buyer','')='' or strpos(lower(buyer_name),lower(p_filter->>'buyer'))>0)
 and (case scope_status when 'open' then stage not in ('received','declined','cancelled','rejected')
 when 'all' then (created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to
 when 'received' then stage='received' and (received_at at time zone 'America/Sao_Paulo')::date between p_from and p_to
 when 'stale' then stage not in ('received','declined','cancelled','rejected') and last_activity<now()-make_interval(hours=>stale) and (due_at is null or due_at<=now())
 when 'followup_due' then stage not in ('received','declined','cancelled','rejected') and due_at<=now()
 when 'quote_expiring' then stage='quoted' and valid_until between now() and now()+interval '48 hours'
 when 'quoted_valid' then stage='quoted' and quote_status='sent' and valid_until>now()
 when 'to_deliver' then stage in ('confirmed','delivery_issue')
 else stage=scope_status end)
 ), page as(select * from filtered order by (attention<>'') desc,last_activity,id limit 50 offset p_offset)
 select jsonb_build_object('count',(select count(*) from filtered),'items',coalesce((select jsonb_agg(to_jsonb(p) order by (attention<>'') desc,last_activity,id) from page p),'[]'::jsonb)) into queue;
 with lines as (
 select o.id,o.received_at,i->>'product_id' product_id,i->>'name' name,i->>'package_name' package_name,i->>'base_unit' base_unit,(i->>'package_size')::numeric package_size,(i->>'quantity')::numeric qty,
 (i->>'line_total')::numeric gross,case when (o.quote_snapshot->>'subtotal')::numeric>0 then (i->>'line_total')::numeric*(1-(o.quote_snapshot->>'discount')::numeric/(o.quote_snapshot->>'subtotal')::numeric) else 0 end net,
 v.id finance_id,(select (fi->>'line_cost')::numeric from jsonb_array_elements(v.items) fi where fi->>'product_id'=i->>'product_id') cost
 from public.trade_orders o cross join lateral jsonb_array_elements(o.quote_snapshot->'items') i
 left join lateral(select id,items from public.trade_financial_versions where order_id=o.id order by version desc limit 1) v on true
 where seller_id=p_seller and state='received' and (received_at at time zone 'America/Sao_Paulo')::date between p_from and p_to
 ), grouped as (select product_id,name,package_name,base_unit,package_size,sum(qty) packages,sum(qty*package_size) volume,round(sum(net),2) revenue,
 case when sum(gross)>0 then round((sum(gross)-sum(net))/sum(gross)*100,2) else 0 end discount_percent,
 count(*) filter(where finance_id is null) missing,case when count(*) filter(where finance_id is null)=0 then round(sum(net-cost),2) end product_result
 from lines group by product_id,name,package_name,base_unit,package_size)
 select coalesce(jsonb_agg((to_jsonb(g)-'product_result'-'missing')||case when finance then jsonb_build_object('product_result',product_result,'missing',missing) else '{}'::jsonb end order by revenue desc,name),'[]'::jsonb) into products from grouped g;
 select jsonb_build_object('month',month_start,'items',coalesce((select jsonb_agg(to_jsonb(g)) from public.management_goals g where seller_id=p_seller and month=month_start),'[]'::jsonb),
 'company_sales',coalesce((select sum(total) from public.trade_orders where seller_id=p_seller and state='received' and (received_at at time zone 'America/Sao_Paulo')::date>=month_start and (received_at at time zone 'America/Sao_Paulo')::date<(month_start+interval '1 month')::date),0)) into goals;
 select coalesce(jsonb_agg(to_jsonb(a) order by created_at),'[]'::jsonb) into approvals from public.management_approvals a where seller_id=p_seller and status='pending';
 result:=jsonb_build_object('owner',public.commerce_is_owner(p_seller),'finance',finance,'totals',totals,'team',team,'queue',queue,'products',products,'goals',goals,'approvals',approvals,
 'settings',jsonb_build_object('discount_limit',coalesce((select discount_limit from public.management_settings where seller_id=p_seller),100),'stale_hours',stale),
 'catalog',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.trade_products where seller_id=p_seller),'[]'::jsonb),
 'losses',coalesce((select jsonb_agg(to_jsonb(l) order by created_at desc) from (select p.id,p.buyer_name,p.agent_name,p.items,p.created_at,p.stage,
 (select message from public.trade_events where request_id=p.id and action in ('cancel_request','reject_request','decline_quote') order by created_at desc limit 1) reason
 from public.management_pipeline p where seller_id=p_seller and stage in ('declined','cancelled','rejected') and (created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to order by created_at desc,id desc limit 100) l),'[]'::jsonb),
 'audit',coalesce((select jsonb_agg(to_jsonb(a) order by created_at desc) from(select a.action,a.details,a.created_at,coalesce(c.display_name,'Equipe') as actor from public.management_audit a left join public.commerce_accounts c on c.user_id=a.actor_id where seller_id=p_seller order by created_at desc,a.id desc limit 50) a),'[]'::jsonb));
 return result;
end $$;
create or replace function public.management_wallet(p_seller uuid,p_search text default '',p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare res jsonb;begin
 if not public.commerce_can_manage(p_seller) then raise exception 'Acesso gerencial indisponível.' using errcode='42501';end if;
 if p_offset is null or p_offset<0 then raise exception 'Página inválida.';end if;
 with matched as(select c.*,coalesce(a.display_name,'Consultor') agent_name from public.trade_connections c left join public.commerce_accounts a on a.user_id=c.agent_id where c.seller_id=p_seller and strpos(lower(c.buyer_name),lower(coalesce(p_search,'')))>0),
 page as(select * from matched order by buyer_name,id limit 50 offset p_offset)
 select jsonb_build_object('count',(select count(*) from matched),'items',coalesce((select jsonb_agg(to_jsonb(p) order by buyer_name,id) from page p),'[]'::jsonb)) into res;
 return res;end $$;
revoke all on function public.commerce_can_manage(uuid),public.commerce_manage_finance(uuid),public.commerce_clear_management(),public.management_staff_request(uuid),public.management_discount_guard(),public.management_command(text,jsonb,uuid),public.management_companies(),public.management_workspace(uuid),public.management_report(uuid,date,date,jsonb,integer),public.management_wallet(uuid,text,integer),public.trade_command(text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.commerce_can_manage(uuid),public.commerce_manage_finance(uuid),public.management_command(text,jsonb,uuid),public.management_companies(),public.management_workspace(uuid),public.management_report(uuid,date,date,jsonb,integer),public.management_wallet(uuid,text,integer),public.trade_command(text,jsonb,uuid) to authenticated;

drop policy if exists trade_connection_manager_read on public.trade_connections;
create policy trade_connection_manager_read on public.trade_connections for select to authenticated using(public.commerce_can_manage(seller_id));
create or replace function public.management_approval_notice() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid;source uuid:=gen_random_uuid();begin
 if tg_op='INSERT' then
  for target in select owner_id from public.commerce_sellers where id=new.seller_id union select user_id from public.commerce_memberships where seller_id=new.seller_id and active and management_role='manager' loop
   if target<>new.requester_id and public.trade_agent_active(new.seller_id,target) then
    insert into public.trade_notifications(recipient_id,request_id,source_id,kind,title,body) values(target,new.request_id,new.id,'approval_requested','Desconto aguardando aprovação','Abra a negociação e consulte a gestão da empresa.') on conflict do nothing;
   end if;
  end loop;
 elsif new.status in ('approved','rejected') and old.status<>new.status and public.trade_agent_active(new.seller_id,new.requester_id) then
  insert into public.trade_notifications(recipient_id,request_id,source_id,kind,title,body) values(new.requester_id,new.request_id,source,'approval_reviewed',case when new.status='approved' then 'Proposta aprovada e enviada' else 'Solicitação de desconto recusada' end,'Abra o acompanhamento interno da negociação.') on conflict do nothing;
 end if;return new;end $$;
revoke all on function public.management_approval_notice() from public,anon,authenticated;
drop trigger if exists management_approval_notice on public.management_approvals;
create trigger management_approval_notice after insert or update on public.management_approvals for each row execute function public.management_approval_notice();
do $$ declare definition text;begin
 definition:=pg_get_functiondef('public.trade_claim_push()'::regprocedure);
 definition:=replace(definition,'job.recipient_id in (job.agent_id,job.owner_id)', '(job.recipient_id in (job.agent_id,job.owner_id) or exists(select 1 from public.commerce_memberships m where m.seller_id=job.seller_id and m.user_id=job.recipient_id and m.active and m.management_role=''manager''))');
 -- Reapplication must not grow the expression repeatedly.
 if position('management_role' in pg_get_functiondef('public.trade_claim_push()'::regprocedure))=0 then execute definition;end if;
end $$;
commit;
