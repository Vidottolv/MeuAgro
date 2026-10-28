begin;
create table if not exists public.app_plans(code text primary key,name text not null,seat_limit int check(seat_limit between 1 and 10000),storage_bytes bigint check(storage_bytes>=0),monthly_cents bigint check(monthly_cents>0),published boolean not null default false);
insert into public.app_plans(code,name,seat_limit) values('producer','Produtor',1),('independent','Consultor independente',1),('company10','Empresa — até 10 representantes',11),('company20','Empresa — até 20 representantes',21),('company50','Empresa — até 50 representantes',51),('company100','Empresa — até 100 representantes',101) on conflict do nothing;
create table if not exists public.app_subscriptions(user_id uuid primary key references auth.users(id),plan_code text not null references public.app_plans(code),provider_customer text,provider_subscription text unique,manual_until timestamptz,checkout_url text,cancel_requested_at timestamptz,updated_at timestamptz not null default now());
alter table public.app_subscriptions add column if not exists expected_cents bigint check(expected_cents>0);
create table if not exists public.app_billing_payments(id text primary key,user_id uuid not null references auth.users(id),subscription_id text not null,status text not null,amount_cents bigint not null,due_date date not null,valid_until timestamptz not null,invoice_url text,checked_at timestamptz not null);
create table if not exists public.app_billing_events(id text primary key,seen_at timestamptz not null default now());
create table if not exists public.app_plan_requests(id uuid primary key,user_id uuid not null references auth.users(id),plan_code text not null references public.app_plans(code),created_at timestamptz not null default now());
alter table public.app_plans enable row level security;alter table public.app_subscriptions enable row level security;alter table public.app_billing_payments enable row level security;alter table public.app_billing_events enable row level security;alter table public.app_plan_requests enable row level security;
revoke all on public.app_plans,public.app_subscriptions,public.app_billing_payments,public.app_billing_events,public.app_plan_requests from public,anon,authenticated;
create or replace function public.app_access_until(p_user uuid) returns timestamptz language sql stable security definer set search_path='' as $$
 select greatest(s.manual_until,(select max(p.valid_until) from public.app_billing_payments p where p.user_id=s.user_id and p.subscription_id=s.provider_subscription and p.status in ('RECEIVED','CONFIRMED') and p.amount_cents>=coalesce(s.expected_cents,(select monthly_cents from public.app_plans where code=s.plan_code),9223372036854775807))) from public.app_subscriptions s where s.user_id=p_user;
$$;
create or replace function public.app_seat_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare owner uuid;limit_seats int;used int;
begin
 if not new.active or (tg_op='UPDATE' and old.active and old.user_id=new.user_id and old.seller_id=new.seller_id) then return new;end if;
 select owner_id into owner from public.commerce_sellers where id=new.seller_id;
 if not exists(select 1 from public.app_subscriptions where user_id=owner) then return new;end if;
 perform pg_advisory_xact_lock(hashtext('app-seats'),hashtext(owner::text));
 if public.app_access_until(owner) is null or public.app_access_until(owner)<=now() then raise exception 'Plano sem vigência. Renove antes de adicionar pessoas.';end if;
 select p.seat_limit into limit_seats from public.app_subscriptions s join public.app_plans p on p.code=s.plan_code where s.user_id=owner;
 select 1+count(distinct m.user_id) into used from public.commerce_memberships m join public.commerce_sellers s on s.id=m.seller_id where s.owner_id=owner and m.active and m.user_id<>owner;
 if new.user_id<>owner and not exists(select 1 from public.commerce_memberships m join public.commerce_sellers s on s.id=m.seller_id where s.owner_id=owner and m.active and m.user_id=new.user_id) and limit_seats is not null and used>=limit_seats then raise exception 'Limite de pessoas do plano atingido.';end if;return new;
end;$$;
drop trigger if exists app_membership_seats on public.commerce_memberships;create trigger app_membership_seats before insert or update of active,user_id,seller_id on public.commerce_memberships for each row execute function public.app_seat_guard();
create or replace function public.app_account_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid();used bigint;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select coalesce(sum(case when coalesce(o.metadata->>'size','') ~ '^[0-9]{1,16}$' then (o.metadata->>'size')::bigint else 0 end),0) into used from storage.objects o where split_part(o.name,'/',1)=u::text or to_jsonb(o)->>'owner_id'=u::text or to_jsonb(o)->>'owner'=u::text;
 return jsonb_build_object('plans',(select jsonb_agg(to_jsonb(p) order by seat_limit,code) from public.app_plans p),
 'subscription',(select jsonb_build_object('plan_code',s.plan_code,'valid_until',public.app_access_until(u),'checkout_url',s.checkout_url,'cancel_requested_at',s.cancel_requested_at,'has_provider',s.provider_subscription is not null) from public.app_subscriptions s where user_id=u),
 'usage',jsonb_build_object('people',(select 1+count(distinct m.user_id) from public.commerce_memberships m join public.commerce_sellers s on s.id=m.seller_id where s.owner_id=u and m.active and m.user_id<>u),'storage_bytes',used),
 'satellite',(select jsonb_build_object('entitlement',to_jsonb(e),'usage',(select to_jsonb(x) from public.satellite_usage x where x.scope=u::text and x.month=date_trunc('month',now() at time zone 'UTC')::date)) from public.satellite_entitlements e where e.user_id=u),
 'steps',jsonb_build_object('properties',(select count(*) from public.properties where user_id=u and deleted_at is null),'cycles',(select count(*) from public.production_cycles where user_id=u and deleted_at is null),'inputs',(select count(*) from public.agricultural_inputs where user_id=u and deleted_at is null)),
 'invoices',coalesce((select jsonb_agg(to_jsonb(x) order by due_date desc,id) from(select id,status,amount_cents,due_date,invoice_url from public.app_billing_payments where user_id=u order by due_date desc,id limit 12)x),'[]'::jsonb));
end;$$;
create or replace function public.app_plan_request(p_operation uuid,p_plan text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();request jsonb;op public.workspace_operations%rowtype;result jsonb;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtext('farm-workspace'),hashtext(u::text));request:=jsonb_build_object('kind','plan-request','plan',p_plan);
 select * into op from public.workspace_operations where user_id=u and operation_id=p_operation;if found then if op.payload is distinct from request then raise exception 'Operação já utilizada.';end if;return op.result;end if;
 if not exists(select 1 from public.app_plans where code=p_plan) then raise exception 'Plano inválido.';end if;
 if exists(select 1 from public.app_plan_requests where user_id=u and created_at>now()-interval '1 day') then raise exception 'Já existe uma solicitação recente. Aguarde o atendimento.';end if;
 insert into public.app_plan_requests(id,user_id,plan_code) values(p_operation,u,p_plan);result:=jsonb_build_object('ok',true);insert into public.workspace_operations(user_id,operation_id,payload,result) values(u,p_operation,request,result);return result;
end;$$;
create or replace function public.app_billing_apply(p_event text,p_payment jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.app_subscriptions%rowtype;plan public.app_plans%rowtype;d date;checked timestamptz;pid text;
begin
 if p_event is null or jsonb_typeof(p_payment) is distinct from 'object' or length(p_event) not between 1 and 120 or octet_length(p_payment::text)>10000 then raise exception 'Evento inválido.';end if;
 select * into s from public.app_subscriptions where provider_subscription=p_payment->>'subscription' and provider_customer=p_payment->>'customer' for update;
 if not found then return jsonb_build_object('ignored',true);end if;
 select * into plan from public.app_plans where code=s.plan_code;
 if plan.monthly_cents is null then raise exception 'Defina o preço do plano antes de ativar a cobrança.';end if;
 if s.expected_cents is null then update public.app_subscriptions set expected_cents=plan.monthly_cents where user_id=s.user_id;end if;
 pid:=p_payment->>'id';checked:=(p_payment->>'checked_at')::timestamptz;d:=(p_payment->>'dueDate')::date;
 if checked is null or d is null or coalesce(pid,'') !~ '^[A-Za-z0-9_]{3,100}$' or checked>now()+interval '5 minutes' or d not between date '2000-01-01' and current_date+366 or coalesce(p_payment->>'amount_cents','') !~ '^[0-9]{1,11}$' or coalesce(p_payment->>'status','') not in ('PENDING','RECEIVED','CONFIRMED','OVERDUE','REFUNDED','REFUND_REQUESTED','REFUND_IN_PROGRESS','CHARGEBACK_REQUESTED','CHARGEBACK_DISPUTE','AWAITING_CHARGEBACK_REVERSAL','DELETED','DUNNING_REQUESTED','DUNNING_RECEIVED') then raise exception 'Cobrança inválida.';end if;
 insert into public.app_billing_events(id) values(p_event) on conflict do nothing;
 insert into public.app_billing_payments(id,user_id,subscription_id,status,amount_cents,due_date,valid_until,invoice_url,checked_at) values(pid,s.user_id,s.provider_subscription,p_payment->>'status',(p_payment->>'amount_cents')::bigint,d,(d+interval '1 month') at time zone 'America/Sao_Paulo',p_payment->>'invoiceUrl',checked)
 on conflict(id) do update set status=excluded.status,amount_cents=excluded.amount_cents,due_date=excluded.due_date,valid_until=excluded.valid_until,invoice_url=excluded.invoice_url,checked_at=excluded.checked_at where app_billing_payments.user_id=excluded.user_id and app_billing_payments.subscription_id=excluded.subscription_id and app_billing_payments.checked_at<excluded.checked_at;
 return jsonb_build_object('ok',true);
end;$$;
create or replace function public.app_billing_reference() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;return (select jsonb_build_object('subscription',provider_subscription,'customer',provider_customer,'cancel_requested_at',cancel_requested_at) from public.app_subscriptions where user_id=auth.uid());end;$$;
create or replace function public.app_billing_cancelled(p_user uuid,p_subscription text) returns void language plpgsql security definer set search_path='' as $$
begin update public.app_subscriptions set cancel_requested_at=now(),updated_at=now() where user_id=p_user and provider_subscription=p_subscription;if not found then raise exception 'Assinatura indisponível.';end if;end;$$;
create or replace function public.onboarding_import(p_operation uuid,p_rows jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();request jsonb;op public.workspace_operations%rowtype;result jsonb;x jsonb;n int:=0;seen text[]:='{}';signature text;minimum numeric;ideal numeric;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) not between 1 and 100 or octet_length(p_rows::text)>60000 then raise exception 'Importe de 1 a 100 insumos por arquivo.';end if;
 perform pg_advisory_xact_lock(hashtext('farm-workspace'),hashtext(u::text));request:=jsonb_build_object('kind','input-import','rows',p_rows);select * into op from public.workspace_operations where user_id=u and operation_id=p_operation;
 if found then if op.payload is distinct from request then raise exception 'Operação já utilizada.';end if;return op.result;end if;
 for x in select * from jsonb_array_elements(p_rows) loop
 if length(btrim(coalesce(x->>'name',''))) not between 2 and 160 or length(coalesce(x->>'brand',''))>160 or coalesce(x->>'category','') not in ('seeds','seedlings','fertilizers','manures','herbicides','fungicides','insecticides','defensives','biologicals','soil_amendments','other') or coalesce(x->>'base_unit','') not in ('kg','g','l','ml','unit','bag','box','bottle','package','seed','seedling','other') or coalesce(x->>'minimum_stock','') !~ '^[0-9]{1,7}(\.[0-9]{1,4})?$' then raise exception 'Linha de insumo inválida.';end if;
 minimum:=(x->>'minimum_stock')::numeric;ideal:=null;
 if nullif(x->>'ideal_stock','') is not null then if x->>'ideal_stock' !~ '^[0-9]{1,7}(\.[0-9]{1,4})?$' then raise exception 'Estoque ideal inválido.';end if;ideal:=(x->>'ideal_stock')::numeric;if ideal<minimum then raise exception 'Estoque ideal menor que o mínimo.';end if;end if;
 signature:=lower(btrim(x->>'name'))||'|'||lower(btrim(coalesce(x->>'brand','')))||'|'||(x->>'base_unit');
 if signature=any(seen) or exists(select 1 from public.agricultural_inputs i where i.user_id=u and i.deleted_at is null and lower(btrim(i.name))=lower(btrim(x->>'name')) and lower(btrim(coalesce(i.brand,'')))=lower(btrim(coalesce(x->>'brand',''))) and i.base_unit=x->>'base_unit') then raise exception 'Insumo duplicado no arquivo ou no cadastro. Nenhuma linha foi importada.';end if;
 seen:=array_append(seen,signature);n:=n+1;
 insert into public.agricultural_inputs(id,user_id,name,brand,category,base_unit,minimum_stock,ideal_stock,active) values(md5(p_operation::text||':'||n)::uuid,u,btrim(x->>'name'),nullif(btrim(x->>'brand'),''),x->>'category',x->>'base_unit',minimum,ideal,true);
 end loop;
 result:=jsonb_build_object('imported',n);insert into public.workspace_operations(user_id,operation_id,payload,result) values(u,p_operation,request,result);return result;
end;$$;

-- Contas legadas sem assinatura provisionada mantêm o piloto; planos provisionados precisam de vigência para gravar.
create or replace function public.app_write_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();owner uuid;
begin
 if u is null then return new;end if;
 owner:=coalesce(nullif(to_jsonb(new)->>'user_id','')::uuid,nullif(to_jsonb(new)->>'author_id','')::uuid,nullif(to_jsonb(new)->>'created_by','')::uuid);
 if tg_table_name in ('technical_visits','technical_tasks') and nullif(to_jsonb(new)->>'seller_id','') is not null then select owner_id into owner from public.commerce_sellers where id=(to_jsonb(new)->>'seller_id')::uuid;end if;
 if owner is null and tg_table_name='expense_payments' then select user_id into owner from public.operating_expenses where id=(to_jsonb(new)->>'expense_id')::uuid;end if;
 if owner is null and tg_table_name='receivable_payments' then select user_id into owner from public.operating_receivables where id=(to_jsonb(new)->>'receivable_id')::uuid;end if;
 if (owner=u or (tg_table_name in ('technical_visits','technical_tasks') and nullif(to_jsonb(new)->>'seller_id','') is not null)) and exists(select 1 from public.app_subscriptions where user_id=owner) and (public.app_access_until(owner) is null or public.app_access_until(owner)<=now()) then raise exception 'Plano sem vigência. Renove em Conta e plano para continuar gravando. A consulta e exportação permanecem disponíveis.';end if;
 return new;
end;$$;
do $$ declare name text;begin
 foreach name in array array['properties','areas','seasons','production_cycles','agricultural_inputs','inventory_lots','inventory_transactions','production_events','harvests','harvest_sales','technical_visits','technical_tasks','operating_expenses','operating_receivables','expense_payments','receivable_payments','season_budgets','weather_sites','rain_readings'] loop
 if to_regclass('public.'||name) is not null then execute format('drop trigger if exists app_write_license on public.%I',name);execute format('create trigger app_write_license before insert or update on public.%I for each row execute function public.app_write_guard()',name);end if;
 end loop;
end;$$;
revoke all on function public.app_write_guard() from public,anon,authenticated;

revoke all on function public.app_access_until(uuid),public.app_seat_guard(),public.app_account_context(),public.app_plan_request(uuid,text),public.app_billing_apply(text,jsonb),public.app_billing_reference(),public.app_billing_cancelled(uuid,text),public.onboarding_import(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.app_account_context(),public.app_plan_request(uuid,text),public.app_billing_reference(),public.onboarding_import(uuid,jsonb) to authenticated;
grant execute on function public.app_billing_apply(text,jsonb),public.app_billing_cancelled(uuid,text) to service_role;
commit;
