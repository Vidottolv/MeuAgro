begin;

-- Administradores da plataforma são concedidos somente pelo SQL Editor/service role.
create table if not exists public.app_platform_admins (
 user_id uuid primary key references auth.users(id), active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.app_subscriptions add column if not exists version integer not null default 1;
alter table public.app_subscriptions add column if not exists billing_environment text not null default 'sandbox'
 check (billing_environment in ('sandbox','production'));
create table if not exists public.app_admin_audit (
 id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id),
 operation_id uuid not null, action text not null, target text not null, reason text not null,
 payload jsonb not null, before_data jsonb, after_data jsonb, created_at timestamptz not null default now(),
 unique(actor_id,operation_id)
);
create table if not exists public.app_billing_diagnostics (
 environment text not null check(environment in ('sandbox','production')), event_id text not null,
 payment_id text, subscription_id text, outcome text not null
 check(outcome in ('processed','unlinked','environment_mismatch','provider_failed','database_failed','unsupported')),
 attempts integer not null default 1, updated_at timestamptz not null default now(),
 primary key(environment,event_id)
);
create index if not exists app_admin_audit_recent on public.app_admin_audit(created_at desc);
create index if not exists app_billing_diagnostics_recent on public.app_billing_diagnostics(updated_at desc);
alter table public.app_platform_admins enable row level security;
alter table public.app_admin_audit enable row level security;
alter table public.app_billing_diagnostics enable row level security;
revoke all on public.app_platform_admins,public.app_admin_audit,public.app_billing_diagnostics from public,anon,authenticated;
grant all on public.app_platform_admins,public.app_admin_audit,public.app_billing_diagnostics to service_role;

create or replace function public.app_is_platform_admin() returns boolean
 language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.app_platform_admins where user_id=auth.uid() and active);
$$;
revoke all on function public.app_is_platform_admin() from public,anon;
grant execute on function public.app_is_platform_admin() to authenticated;

create or replace function public.app_subscription_version() returns trigger language plpgsql set search_path='' as $$
begin new.version:=old.version+1;new.updated_at:=now();return new;end;$$;
drop trigger if exists app_subscription_version on public.app_subscriptions;
create trigger app_subscription_version before update on public.app_subscriptions for each row execute function public.app_subscription_version();

create or replace function public.app_admin_context(p_search text default '',p_offset integer default 0,p_user uuid default null)
 returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.app_is_platform_admin() then raise exception 'Acesso exclusivo da administração do MeuAgro.' using errcode='42501';end if;
 if length(coalesce(p_search,''))>120 or p_offset<0 then raise exception 'Filtro inválido.';end if;
 select jsonb_build_object(
 'plans',(select coalesce(jsonb_agg(to_jsonb(p) order by p.seat_limit,p.code),'[]') from public.app_plans p),
 'accounts',(select coalesce(jsonb_agg(row),'[]') from (
   select u.id,to_jsonb(u)->>'email' email,to_jsonb(s) subscription,public.app_access_until(u.id) valid_until,
   (select count(distinct person) from (
      select u.id person union select m.user_id from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=u.id and m.active
   ) people) people_count,
   (select count(*) from public.commerce_sellers c where c.owner_id=u.id) company_count
   from auth.users u left join public.app_subscriptions s on s.user_id=u.id
   where (p_user is null or u.id=p_user) and
   (coalesce(p_search,'')='' or position(lower(p_search) in lower(coalesce(to_jsonb(u)->>'email',''))) > 0 or u.id::text=p_search)
   order by u.id limit 25 offset p_offset
 ) row),
 'payments',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from (select * from public.app_billing_payments where p_user is not null and user_id=p_user order by checked_at desc limit 25) p),
 'diagnostics',(select coalesce(jsonb_agg(to_jsonb(d)),'[]') from (select * from public.app_billing_diagnostics order by updated_at desc limit 30) d),
 'audit',(select coalesce(jsonb_agg(to_jsonb(a)-'payload'),'[]') from (select * from public.app_admin_audit where p_user is null or target=p_user::text order by id desc limit 30) a)
 ) into result;
 return result;
end;$$;
revoke all on function public.app_admin_context(text,integer,uuid) from public,anon;
grant execute on function public.app_admin_context(text,integer,uuid) to authenticated;

-- Comandos administrativos têm razão obrigatória, controle de versão e reenvio idempotente.
create or replace function public.app_admin_command(p_operation uuid,p_action text,p_data jsonb)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();previous public.app_admin_audit%rowtype;before_row jsonb;after_row jsonb;
 target text;reason text:=btrim(p_data->>'reason');s public.app_subscriptions%rowtype;plan public.app_plans%rowtype;until_at timestamptz;
begin
 if not public.app_is_platform_admin() then raise exception 'Acesso exclusivo da administração do MeuAgro.' using errcode='42501';end if;
 if p_operation is null or p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>10000 or coalesce(length(reason),0) not between 5 and 500 then raise exception 'Informe motivo de 5 a 500 caracteres.';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||p_operation::text,0));
 select * into previous from public.app_admin_audit where actor_id=actor and operation_id=p_operation;
 if found then
   if previous.action<>p_action or previous.payload<>p_data then raise exception 'Identificador reutilizado com outros dados.';end if;
   return jsonb_build_object('ok',true,'replayed',true);
 end if;
 if p_action='plan' then
   target:=p_data->>'code';
   select * into plan from public.app_plans where code=target for update;
   if not found or to_jsonb(plan) is distinct from p_data->'expected' then raise exception 'Plano mudou. Atualize antes de salvar.';end if;
   if coalesce(p_data->>'monthly_cents','') !~ '^[0-9]{1,10}$' or (p_data->>'monthly_cents')::bigint not between 1 and 9999999999
      or (p_data->>'storage_bytes' is not null and (p_data->>'storage_bytes' !~ '^[0-9]{1,15}$' or (p_data->>'storage_bytes')::bigint>100000000000000))
      or jsonb_typeof(p_data->'published') is distinct from 'boolean' then raise exception 'Preço, armazenamento ou publicação inválidos.';end if;
   before_row:=to_jsonb(plan);
   update public.app_plans set monthly_cents=(p_data->>'monthly_cents')::bigint,storage_bytes=(p_data->>'storage_bytes')::bigint,published=(p_data->>'published')::boolean where code=target returning to_jsonb(app_plans.*) into after_row;
 elsif p_action='trial' then
   target:=(p_data->>'user_id')::uuid::text;
   perform pg_advisory_xact_lock(hashtextextended(target,1));
   select * into s from public.app_subscriptions where user_id=target::uuid for update;
   if coalesce(s.version,0) is distinct from (p_data->>'version')::integer then raise exception 'Vínculo mudou. Atualize antes de salvar.';end if;
   until_at:=(p_data->>'until')::timestamptz;
   if until_at is null or until_at<=now() or until_at>now()+interval '90 days' then raise exception 'Escolha uma vigência futura de até 90 dias.';end if;
   before_row:=to_jsonb(s);
   if s.user_id is null then
     select * into plan from public.app_plans where code=p_data->>'plan_code';
     if not found then raise exception 'Plano inválido.';end if;
     if (select count(distinct person) from (select target::uuid person union select m.user_id from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=target::uuid and m.active) people)>plan.seat_limit then raise exception 'Equipe atual excede o limite deste plano.';end if;
     insert into public.app_subscriptions(user_id,plan_code,manual_until) values(target::uuid,plan.code,until_at) returning to_jsonb(app_subscriptions.*) into after_row;
   else
     update public.app_subscriptions set manual_until=until_at where user_id=target::uuid returning to_jsonb(app_subscriptions.*) into after_row;
   end if;
 elsif p_action='revoke_trial' then
   target:=(p_data->>'user_id')::uuid::text;
   select * into s from public.app_subscriptions where user_id=target::uuid for update;
   if not found or s.version<>(p_data->>'version')::integer or p_data->>'version' is null then raise exception 'Vínculo mudou. Atualize antes de salvar.';end if;
   before_row:=to_jsonb(s);
   update public.app_subscriptions set manual_until=null where user_id=target::uuid returning to_jsonb(app_subscriptions.*) into after_row;
 else raise exception 'Comando inválido.';
 end if;
 insert into public.app_admin_audit(actor_id,operation_id,action,target,reason,payload,before_data,after_data) values(actor,p_operation,p_action,target,reason,p_data,before_row,after_row);
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.app_admin_command(uuid,text,jsonb) from public,anon;
grant execute on function public.app_admin_command(uuid,text,jsonb) to authenticated;

-- Chamado só pelo servidor após consultar o Asaas; o ator vem de auth.getUser.
create or replace function public.app_admin_link(p_actor uuid,p_operation uuid,p_data jsonb)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.app_subscriptions%rowtype;plan public.app_plans%rowtype;previous public.app_admin_audit%rowtype;
 target uuid:=(p_data->>'user_id')::uuid;before_row jsonb;after_row jsonb;reason text:=btrim(p_data->>'reason');
begin
 if not exists(select 1 from public.app_platform_admins where user_id=p_actor and active) then raise exception 'Administrador não autorizado.' using errcode='42501';end if;
 if p_operation is null or coalesce(length(reason),0) not between 5 and 500 or octet_length(p_data::text)>10000 then raise exception 'Motivo ou operação inválidos.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||p_operation::text,0));
 select * into previous from public.app_admin_audit where actor_id=p_actor and operation_id=p_operation;
 if found then
   if previous.payload<>p_data then raise exception 'Identificador reutilizado.';end if;
   return jsonb_build_object('ok',true,'replayed',true);
 end if;
 perform pg_advisory_xact_lock(hashtextextended(target::text,1));
 select * into s from public.app_subscriptions where user_id=target for update;
 if coalesce(s.version,0) is distinct from (p_data->>'version')::integer then raise exception 'Vínculo mudou. Atualize antes de salvar.';end if;
 select * into plan from public.app_plans where code=p_data->>'plan_code' for update;
 if not found or plan.monthly_cents is null or plan.monthly_cents is distinct from (p_data->>'expected_cents')::bigint then raise exception 'Valor mensal do Asaas difere do preço do plano. Revise o catálogo.';end if;
 if coalesce(p_data->>'customer','') !~ '^cus_[A-Za-z0-9]+$' or coalesce(p_data->>'subscription','') !~ '^sub_[A-Za-z0-9]+$'
 or coalesce(p_data->>'environment','') not in ('sandbox','production') then raise exception 'Referência inválida.';end if;
 if s.provider_subscription is not null and s.billing_environment<>p_data->>'environment' then raise exception 'Não troque o ambiente de um vínculo existente. Faça uma migração administrativa revisada.';end if;
 if (select count(distinct person) from (select target person union select m.user_id from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=target and m.active) people)>plan.seat_limit then raise exception 'Equipe atual excede o limite deste plano.';end if;
 before_row:=to_jsonb(s);
 insert into public.app_subscriptions(user_id,plan_code,provider_customer,provider_subscription,expected_cents,billing_environment)
 values(target,plan.code,p_data->>'customer',p_data->>'subscription',(p_data->>'expected_cents')::bigint,p_data->>'environment')
 on conflict(user_id) do update set plan_code=excluded.plan_code,provider_customer=excluded.provider_customer,provider_subscription=excluded.provider_subscription,expected_cents=excluded.expected_cents,billing_environment=excluded.billing_environment,
 cancel_requested_at=case when app_subscriptions.provider_subscription=excluded.provider_subscription then app_subscriptions.cancel_requested_at else null end
 returning to_jsonb(app_subscriptions.*) into after_row;
 insert into public.app_admin_audit(actor_id,operation_id,action,target,reason,payload,before_data,after_data) values(p_actor,p_operation,'link',target::text,reason,p_data,before_row,after_row);
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.app_admin_link(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.app_admin_link(uuid,uuid,jsonb) to service_role;

create or replace function public.app_billing_reference() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 return (select jsonb_build_object('subscription',provider_subscription,'customer',provider_customer,'cancel_requested_at',cancel_requested_at,'environment',billing_environment) from public.app_subscriptions where user_id=auth.uid());
end;$$;
revoke all on function public.app_billing_reference() from public,anon;
grant execute on function public.app_billing_reference() to authenticated;

create or replace function public.app_billing_log(p_environment text,p_event text,p_payment text,p_subscription text,p_outcome text)
 returns void language plpgsql security definer set search_path='' as $$
begin
 if length(p_event) not between 1 and 120 or length(coalesce(p_payment,''))>120 or length(coalesce(p_subscription,''))>120 then raise exception 'Diagnóstico inválido.';end if;
 insert into public.app_billing_diagnostics(environment,event_id,payment_id,subscription_id,outcome) values(p_environment,p_event,p_payment,p_subscription,p_outcome)
 on conflict(environment,event_id) do update set outcome=excluded.outcome,payment_id=excluded.payment_id,subscription_id=excluded.subscription_id,attempts=app_billing_diagnostics.attempts+1,updated_at=now();
end;$$;
revoke all on function public.app_billing_log(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.app_billing_log(text,text,text,text,text) to service_role;

-- Preserva a conciliação de pagamentos da etapa 48, acrescentando diagnóstico e ambiente.
do $$begin
 if to_regprocedure('public.app_billing_apply_v48(text,jsonb)') is null then
   alter function public.app_billing_apply(text,jsonb) rename to app_billing_apply_v48;
 end if;
end;$$;
revoke all on function public.app_billing_apply_v48(text,jsonb) from public,anon,authenticated,service_role;
create or replace function public.app_billing_apply(p_event text,p_payment jsonb) returns jsonb
 language plpgsql security definer set search_path='' as $$
declare result jsonb;outcome text;environment text:=p_payment->>'environment';s public.app_subscriptions%rowtype;
begin
 if environment is null or environment not in ('sandbox','production') then raise exception 'Publique a versão atualizada da função billing-asaas.';end if;
 select * into s from public.app_subscriptions where provider_subscription=p_payment->>'subscription' and provider_customer=p_payment->>'customer' for update;
 if not found then outcome:='unlinked';
 elsif s.billing_environment<>environment then outcome:='environment_mismatch';
 else result:=public.app_billing_apply_v48(p_event,p_payment);outcome:='processed';end if;
 perform public.app_billing_log(environment,p_event,p_payment->>'id',p_payment->>'subscription',outcome);
 return jsonb_build_object('ok',outcome='processed','outcome',outcome);
end;$$;
revoke all on function public.app_billing_apply(text,jsonb) from public,anon,authenticated;
grant execute on function public.app_billing_apply(text,jsonb) to service_role;
commit;
