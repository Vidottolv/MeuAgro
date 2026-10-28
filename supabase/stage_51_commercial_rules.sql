begin;
alter table public.app_plans add column if not exists revision integer not null default 1;
alter table public.app_plans add column if not exists trial_days integer not null default 0 check(trial_days between 0 and 30);
alter table public.app_plans add column if not exists change_policy text not null default 'assisted_next_cycle' check(change_policy in ('assisted_next_cycle','blocked'));
alter table public.app_plans add column if not exists change_cooldown_days integer not null default 0 check(change_cooldown_days between 0 and 365);
alter table public.app_subscriptions add column if not exists commercial_snapshot jsonb;
alter table public.app_subscriptions add column if not exists trial_ends_at timestamptz;
alter table public.app_billing_payments add column if not exists required_cents bigint check(required_cents>0);
create table if not exists public.app_plan_versions (
 plan_code text not null references public.app_plans(code),revision integer not null,snapshot jsonb not null,
 actor_id uuid,created_at timestamptz not null default now(),primary key(plan_code,revision)
);
create table if not exists public.app_trial_claims (
 user_id uuid primary key references auth.users(id),operation_id uuid unique,
 plan_snapshot jsonb not null,started_at timestamptz not null,ends_at timestamptz not null,
 source text not null check(source in ('self_service','legacy_manual'))
);
create table if not exists public.app_plan_changes (
 id uuid primary key,user_id uuid not null references auth.users(id),version integer not null default 1,
 status text not null default 'requested' check(status in ('requested','offered','accepted','applied','rejected','cancelled')),
 from_snapshot jsonb not null,target_snapshot jsonb not null,terms_snapshot jsonb not null default '{}',subscription_version integer not null,
 effective_at timestamptz,offered_at timestamptz,accepted_at timestamptz,applied_at timestamptz,
 admin_note text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists app_plan_changes_one_open on public.app_plan_changes(user_id) where status in ('requested','offered','accepted');
create index if not exists app_plan_changes_recent on public.app_plan_changes(created_at desc);
alter table public.app_plan_versions enable row level security;
alter table public.app_trial_claims enable row level security;
alter table public.app_plan_changes enable row level security;
revoke all on public.app_plan_versions,public.app_trial_claims,public.app_plan_changes from public,anon,authenticated;
grant all on public.app_plan_versions,public.app_trial_claims,public.app_plan_changes to service_role;

insert into public.app_plan_versions(plan_code,revision,snapshot) select code,revision,to_jsonb(p) from public.app_plans p on conflict do nothing;
-- Backfill só de metadados: o lock DDL e a transação impedem escritas concorrentes.
-- Restaurar o guard antes de liberar a tabela; erro reverte também a alteração do trigger.
alter table public.app_subscriptions disable trigger app_checkout_subscription_guard;
update public.app_subscriptions s set commercial_snapshot=to_jsonb(p)||jsonb_build_object('monthly_cents',coalesce(s.expected_cents,p.monthly_cents)) from public.app_plans p where p.code=s.plan_code and s.commercial_snapshot is null;
alter table public.app_subscriptions enable trigger app_checkout_subscription_guard;
update public.app_billing_payments b set required_cents=coalesce(s.expected_cents,p.monthly_cents) from public.app_subscriptions s join public.app_plans p on p.code=s.plan_code where b.user_id=s.user_id and b.required_cents is null and b.status in ('CONFIRMED','RECEIVED');
insert into public.app_trial_claims(user_id,plan_snapshot,started_at,ends_at,source)
select s.user_id,s.commercial_snapshot,s.updated_at,s.manual_until,'legacy_manual' from public.app_subscriptions s where s.manual_until is not null on conflict do nothing;
insert into public.app_trial_claims(user_id,plan_snapshot,started_at,ends_at,source)
select u.id,coalesce(a.after_data,'{}'),a.created_at,a.created_at,'legacy_manual' from public.app_admin_audit a join auth.users u on u.id::text=a.target where a.action='trial' order by a.created_at on conflict do nothing;

create or replace function public.app_plan_revision() returns trigger language plpgsql set search_path='' as $$
begin if to_jsonb(new)-'revision' is distinct from to_jsonb(old)-'revision' then new.revision:=old.revision+1;else new.revision:=old.revision;end if;return new;end;$$;
create or replace function public.app_plan_history() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.app_plan_versions(plan_code,revision,snapshot,actor_id) values(new.code,new.revision,to_jsonb(new),auth.uid()) on conflict do nothing;return new;end;$$;
drop trigger if exists app_plan_revision on public.app_plans;
create trigger app_plan_revision before update on public.app_plans for each row execute function public.app_plan_revision();
drop trigger if exists app_plan_history on public.app_plans;
create trigger app_plan_history after insert or update on public.app_plans for each row execute function public.app_plan_history();

create or replace function public.app_contract_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
declare snapshot jsonb;
begin
 if new.commercial_snapshot is null or (tg_op='UPDATE' and new.commercial_snapshot is not distinct from old.commercial_snapshot and
 (new.plan_code is distinct from old.plan_code or new.expected_cents is distinct from old.expected_cents or new.provider_subscription is distinct from old.provider_subscription)) then
 select to_jsonb(p)||jsonb_build_object('monthly_cents',coalesce(new.expected_cents,p.monthly_cents)) into snapshot from public.app_plans p where code=new.plan_code;
 new.commercial_snapshot:=snapshot;
 end if;return new;
end;$$;
drop trigger if exists app_contract_snapshot on public.app_subscriptions;
create trigger app_contract_snapshot before insert or update on public.app_subscriptions for each row execute function public.app_contract_snapshot();

create or replace function public.app_access_until(p_user uuid) returns timestamptz language sql stable security definer set search_path='' as $$
 select greatest(s.manual_until,s.trial_ends_at,(select max(b.valid_until) from public.app_billing_payments b where b.user_id=s.user_id and b.subscription_id=s.provider_subscription and b.status in ('RECEIVED','CONFIRMED') and b.amount_cents>=coalesce(b.required_cents,s.expected_cents,(select monthly_cents from public.app_plans where code=s.plan_code),9223372036854775807))) from public.app_subscriptions s where user_id=p_user;
$$;

create or replace function public.app_seat_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare owner uuid;limit_seats integer;used integer;
begin
 if not new.active or (tg_op='UPDATE' and old.active and old.user_id=new.user_id and old.seller_id=new.seller_id) then return new;end if;
 select owner_id into owner from public.commerce_sellers where id=new.seller_id;
 if not exists(select 1 from public.app_subscriptions where user_id=owner) then return new;end if;
 perform pg_advisory_xact_lock(hashtext('app-seats'),hashtext(owner::text));
 if public.app_access_until(owner) is null or public.app_access_until(owner)<=now() then raise exception 'Plano sem vigência. Renove antes de adicionar pessoas.';end if;
 select coalesce((commercial_snapshot->>'seat_limit')::integer,p.seat_limit) into limit_seats from public.app_subscriptions s join public.app_plans p on p.code=s.plan_code where s.user_id=owner;
 select 1+count(distinct m.user_id) into used from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=owner and m.active and m.user_id<>owner;
 if new.user_id<>owner and not exists(select 1 from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=owner and m.active and m.user_id=new.user_id) and used>=limit_seats then raise exception 'Limite de pessoas contratado atingido.';end if;
 return new;
end;$$;

create or replace function public.app_commercial_plan_save(p_operation uuid,p_expected jsonb,p_data jsonb,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.app_plans%rowtype;payload jsonb;a public.app_admin_audit%rowtype;after_row jsonb;
begin
 if not public.app_is_platform_admin() then raise exception 'Acesso exclusivo da administração.' using errcode='42501';end if;
 if p_operation is null or coalesce(length(btrim(p_reason)),0) not between 5 and 500 or octet_length(p_data::text)>6000 then raise exception 'Motivo ou dados inválidos.';end if;
 payload:=jsonb_build_object('expected',p_expected,'data',p_data,'reason',p_reason);
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_operation::text,51));
 select * into a from public.app_admin_audit where actor_id=auth.uid() and operation_id=p_operation;
 if found then if a.payload is distinct from payload then raise exception 'Operação reutilizada.';end if;return jsonb_build_object('ok',true);end if;
 select * into p from public.app_plans where code=p_expected->>'code' for update;
 if not found or to_jsonb(p) is distinct from p_expected then raise exception 'Plano mudou. Atualize a tela.';end if;
 if coalesce(length(btrim(p_data->>'name')),0) not between 3 and 120 or coalesce(p_data->>'monthly_cents','') !~ '^[0-9]{1,10}$'
 or (p_data->>'monthly_cents')::bigint not between 1 and 9999999999 or coalesce(p_data->>'seat_limit','') !~ '^[0-9]{1,5}$' or (p_data->>'seat_limit')::integer not between 1 and 10000
 or coalesce(p_data->>'trial_days','') !~ '^[0-9]{1,2}$' or (p_data->>'trial_days')::integer not between 0 and 30
 or coalesce(p_data->>'change_cooldown_days','') !~ '^[0-9]{1,3}$' or (p_data->>'change_cooldown_days')::integer not between 0 and 365
 or coalesce(p_data->>'change_policy','') not in ('assisted_next_cycle','blocked') or jsonb_typeof(p_data->'published') is distinct from 'boolean'
 or (p_data->>'storage_bytes' is not null and (p_data->>'storage_bytes' !~ '^[0-9]{1,15}$' or (p_data->>'storage_bytes')::bigint>100000000000000)) then raise exception 'Revise preço, pessoas, teste e política.';end if;
 update public.app_plans set name=btrim(p_data->>'name'),monthly_cents=(p_data->>'monthly_cents')::bigint,seat_limit=(p_data->>'seat_limit')::integer,storage_bytes=(p_data->>'storage_bytes')::bigint,
 published=(p_data->>'published')::boolean,trial_days=(p_data->>'trial_days')::integer,change_policy=p_data->>'change_policy',change_cooldown_days=(p_data->>'change_cooldown_days')::integer where code=p.code returning to_jsonb(app_plans.*) into after_row;
 insert into public.app_admin_audit(actor_id,operation_id,action,target,reason,payload,before_data,after_data) values(auth.uid(),p_operation,'commercial-plan',p.code,btrim(p_reason),payload,to_jsonb(p),after_row);
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.app_commercial_plan_save(uuid,jsonb,jsonb,text) from public,anon;
grant execute on function public.app_commercial_plan_save(uuid,jsonb,jsonb,text) to authenticated;

create or replace function public.app_commercial_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 return jsonb_build_object('plans',(select coalesce(jsonb_agg(to_jsonb(p) order by seat_limit,code),'[]') from public.app_plans p where published and monthly_cents is not null),
 'contract',(select jsonb_build_object('snapshot',commercial_snapshot,'version',version,'has_provider',provider_subscription is not null,'cancelled',cancel_requested_at is not null,'valid_until',public.app_access_until(auth.uid()),'trial_ends_at',trial_ends_at) from public.app_subscriptions where user_id=auth.uid()),
 'trial_used',exists(select 1 from public.app_trial_claims where user_id=auth.uid()) or exists(select 1 from public.app_subscriptions where user_id=auth.uid() and manual_until is not null) or exists(select 1 from public.app_admin_audit where target=auth.uid()::text and action='trial'),
 'changes',(select coalesce(jsonb_agg(to_jsonb(c) order by created_at desc),'[]') from(select * from public.app_plan_changes where user_id=auth.uid() order by created_at desc limit 20)c));
end;$$;
revoke all on function public.app_commercial_context() from public,anon;
grant execute on function public.app_commercial_context() to authenticated;

create or replace function public.app_trial_start(p_operation uuid,p_expected jsonb,p_accepted boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();p public.app_plans%rowtype;s public.app_subscriptions%rowtype;t public.app_trial_claims%rowtype;until_at timestamptz;people integer;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_operation is null or p_accepted is distinct from true then raise exception 'Confirme as condições do teste.';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,50));
 select * into t from public.app_trial_claims where user_id=u;
 if found then if t.operation_id=p_operation then return jsonb_build_object('ok',true,'ends_at',t.ends_at);end if;raise exception 'O período de teste já foi utilizado nesta conta.';end if;
 if exists(select 1 from public.app_checkouts where user_id=u and status in ('accepted','provisioning','awaiting_payment','review')) then raise exception 'Conclua a contratação em andamento antes de solicitar teste.';end if;
 select * into p from public.app_plans where code=p_expected->>'code' and published and monthly_cents is not null for share;
 if not found or to_jsonb(p) is distinct from p_expected or p.trial_days=0 then raise exception 'Teste indisponível ou oferta alterada. Atualize a tela.';end if;
 select * into s from public.app_subscriptions where user_id=u for update;
 if s.provider_subscription is not null or s.manual_until is not null or exists(select 1 from public.app_admin_audit where target=u::text and action='trial') then raise exception 'Conta já contratada ou com teste concedido. Procure o atendimento.';end if;
 select 1+count(distinct m.user_id) into people from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=u and m.active and m.user_id<>u;
 if people>p.seat_limit then raise exception 'Equipe acima do limite deste plano.';end if;
 until_at:=now()+make_interval(days=>p.trial_days);
 insert into public.app_trial_claims(user_id,operation_id,plan_snapshot,started_at,ends_at,source) values(u,p_operation,to_jsonb(p),now(),until_at,'self_service');
 insert into public.app_subscriptions(user_id,plan_code,commercial_snapshot,expected_cents,trial_ends_at) values(u,p.code,to_jsonb(p),p.monthly_cents,until_at)
 on conflict(user_id) do update set plan_code=excluded.plan_code,commercial_snapshot=excluded.commercial_snapshot,expected_cents=excluded.expected_cents,trial_ends_at=excluded.trial_ends_at;
 return jsonb_build_object('ok',true,'ends_at',until_at);
end;$$;
revoke all on function public.app_trial_start(uuid,jsonb,boolean) from public,anon;
grant execute on function public.app_trial_start(uuid,jsonb,boolean) to authenticated;

-- Congelar condições aceitas pelo checkout e preservar pagamentos de contratos anteriores.
do $$begin
 if to_regprocedure('public.app_checkout_step_v50(uuid,uuid,text,jsonb)') is null then alter function public.app_checkout_step(uuid,uuid,text,jsonb) rename to app_checkout_step_v50;end if;
 if to_regprocedure('public.app_billing_apply_v50(text,jsonb)') is null then alter function public.app_billing_apply(text,jsonb) rename to app_billing_apply_v50;end if;
 if to_regprocedure('public.app_account_context_v48()') is null then alter function public.app_account_context() rename to app_account_context_v48;end if;
 if to_regprocedure('public.app_admin_link_v49(uuid,uuid,jsonb)') is null then alter function public.app_admin_link(uuid,uuid,jsonb) rename to app_admin_link_v49;end if;
end;$$;
revoke all on function public.app_checkout_step_v50(uuid,uuid,text,jsonb),public.app_billing_apply_v50(text,jsonb),public.app_account_context_v48(),public.app_admin_link_v49(uuid,uuid,jsonb) from public,anon,authenticated,service_role;
create or replace function public.app_checkout_step(p_id uuid,p_lease uuid,p_action text,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;q public.app_checkouts%rowtype;
begin
 result:=public.app_checkout_step_v50(p_id,p_lease,p_action,p_data);
 if p_action='finish' then select * into q from public.app_checkouts where id=p_id;update public.app_subscriptions set commercial_snapshot=q.plan_snapshot where user_id=q.user_id and provider_subscription=q.provider_subscription;end if;
 return result;
end;$$;
revoke all on function public.app_checkout_step(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.app_checkout_step(uuid,uuid,text,jsonb) to service_role;
create or replace function public.app_billing_apply(p_event text,p_payment jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;before_row public.app_billing_payments%rowtype;required bigint;
begin
 perform 1 from public.app_subscriptions where provider_subscription=p_payment->>'subscription' for update;
 select * into before_row from public.app_billing_payments where id=p_payment->>'id';
 result:=public.app_billing_apply_v50(p_event,p_payment);
 if result->>'outcome'='processed' then
   select coalesce(s.expected_cents,p.monthly_cents) into required from public.app_subscriptions s join public.app_plans p on p.code=s.plan_code where s.provider_subscription=p_payment->>'subscription';
   update public.app_billing_payments set required_cents=case when before_row.status in ('CONFIRMED','RECEIVED') and before_row.required_cents is not null and before_row.amount_cents>=before_row.required_cents then before_row.required_cents else required end
   where id=p_payment->>'id' and checked_at=(p_payment->>'checked_at')::timestamptz and status in ('CONFIRMED','RECEIVED');
 end if;return result;
end;$$;
revoke all on function public.app_billing_apply(text,jsonb) from public,anon,authenticated;
grant execute on function public.app_billing_apply(text,jsonb) to service_role;
create or replace function public.app_account_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;s public.app_subscriptions%rowtype;
begin
 result:=public.app_account_context_v48();select * into s from public.app_subscriptions where user_id=auth.uid();
 if found then result:=jsonb_set(result,'{subscription}',result->'subscription'||jsonb_build_object('commercial_snapshot',s.commercial_snapshot,'trial_ends_at',s.trial_ends_at));end if;return result;
end;$$;
revoke all on function public.app_account_context() from public,anon;
grant execute on function public.app_account_context() to authenticated;
create or replace function public.app_admin_link(p_actor uuid,p_operation uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.app_subscriptions%rowtype;
begin
 select * into s from public.app_subscriptions where user_id=(p_data->>'user_id')::uuid for update;
 if s.provider_subscription is not null and (s.plan_code<>p_data->>'plan_code' or s.expected_cents is distinct from (p_data->>'expected_cents')::bigint) then raise exception 'Use a troca comercial com aceite do titular para alterar plano ou preço contratado.';end if;
 return public.app_admin_link_v49(p_actor,p_operation,p_data);
end;$$;
revoke all on function public.app_admin_link(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.app_admin_link(uuid,uuid,jsonb) to service_role;

create or replace function public.app_change_request(p_operation uuid,p_expected jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();s public.app_subscriptions%rowtype;p public.app_plans%rowtype;c public.app_plan_changes%rowtype;people integer;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_operation is null then raise exception 'Operação inválida.';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,51));
 select * into c from public.app_plan_changes where id=p_operation;
 if found then if c.user_id<>u or c.target_snapshot is distinct from p_expected then raise exception 'Operação reutilizada.';end if;return jsonb_build_object('ok',true);end if;
 select * into s from public.app_subscriptions where user_id=u for update;
 if not found or s.provider_subscription is null or s.cancel_requested_at is not null then raise exception 'Troca exige assinatura recorrente vinculada e não cancelada.';end if;
 if coalesce(s.commercial_snapshot->>'change_policy','assisted_next_cycle')='blocked' then raise exception 'O contrato exige atendimento específico para alterações.';end if;
 if exists(select 1 from public.app_checkouts where user_id=u and status in ('accepted','provisioning','awaiting_payment','review')) then raise exception 'Conclua a contratação em andamento.';end if;
 if exists(select 1 from public.app_plan_changes where user_id=u and status='applied' and applied_at>now()-make_interval(days=>coalesce((s.commercial_snapshot->>'change_cooldown_days')::integer,0))) then raise exception 'Aguarde o intervalo contratado entre alterações.';end if;
 select * into p from public.app_plans where code=p_expected->>'code' and published and monthly_cents is not null for share;
 if not found or to_jsonb(p) is distinct from p_expected then raise exception 'Plano mudou ou não está publicado.';end if;
 if s.commercial_snapshot is not distinct from to_jsonb(p) then raise exception 'Este já é o contrato vigente.';end if;
 select 1+count(distinct m.user_id) into people from public.commerce_memberships m join public.commerce_sellers co on co.id=m.seller_id where co.owner_id=u and m.active and m.user_id<>u;
 if people>p.seat_limit then raise exception 'Reduza a equipe antes de solicitar este plano.';end if;
 if exists(select 1 from public.app_plan_changes where user_id=u and status in ('requested','offered','accepted')) then raise exception 'Já existe uma troca em andamento.';end if;
 if (select count(*) from public.app_plan_changes where user_id=u and created_at>now()-interval '1 day')>=5 then raise exception 'Limite diário de solicitações atingido.';end if;
 insert into public.app_plan_changes(id,user_id,from_snapshot,target_snapshot,terms_snapshot,subscription_version) values(p_operation,u,s.commercial_snapshot,to_jsonb(p),(select to_jsonb(x)-'id' from public.app_checkout_settings x),s.version);
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.app_change_request(uuid,jsonb) from public,anon;
grant execute on function public.app_change_request(uuid,jsonb) to authenticated;

create or replace function public.app_change_reply(p_operation uuid,p_id uuid,p_version integer,p_action text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();c public.app_plan_changes%rowtype;op public.workspace_operations%rowtype;payload jsonb;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,51));
 payload:=jsonb_build_object('kind','commercial-reply','id',p_id,'version',p_version,'action',p_action);
 select * into op from public.workspace_operations where user_id=u and operation_id=p_operation;
 if found then if op.payload is distinct from payload then raise exception 'Operação reutilizada.';end if;return op.result;end if;
 select * into c from public.app_plan_changes where id=p_id and user_id=u for update;
 if not found or c.version is distinct from p_version then raise exception 'Solicitação mudou. Atualize a tela.';end if;
 if p_action='accept' then
   if c.status<>'offered' or c.effective_at<now() then raise exception 'A proposta precisa de revisão administrativa.';end if;
   update public.app_plan_changes set status='accepted',accepted_at=now(),version=version+1,updated_at=now() where id=p_id;
 elsif p_action='cancel' then
   if c.status not in ('requested','offered','accepted') then raise exception 'Solicitação já encerrada.';end if;
   update public.app_plan_changes set status='cancelled',version=version+1,updated_at=now() where id=p_id;
 else raise exception 'Resposta inválida.';end if;
 insert into public.workspace_operations(user_id,operation_id,payload,result) values(u,p_operation,payload,'{"ok":true}');
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.app_change_reply(uuid,uuid,integer,text) from public,anon;
grant execute on function public.app_change_reply(uuid,uuid,integer,text) to authenticated;

create or replace function public.app_commercial_admin_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.app_is_platform_admin() then raise exception 'Acesso exclusivo da administração.' using errcode='42501';end if;
 return jsonb_build_object('versions',(select coalesce(jsonb_agg(to_jsonb(v) order by created_at desc),'[]') from(select * from public.app_plan_versions order by created_at desc limit 30)v),
 'changes',(select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('earliest_at',greatest(now(),public.app_access_until(c.user_id)))),'[]') from(select * from public.app_plan_changes order by updated_at desc limit 30)c));
end;$$;
revoke all on function public.app_commercial_admin_context() from public,anon;
grant execute on function public.app_commercial_admin_context() to authenticated;

create or replace function public.app_change_offer(p_operation uuid,p_id uuid,p_version integer,p_action text,p_effective_at timestamptz,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.app_plan_changes%rowtype;s public.app_subscriptions%rowtype;p public.app_plans%rowtype;a public.app_admin_audit%rowtype;payload jsonb;before_row jsonb;
begin
 if not public.app_is_platform_admin() then raise exception 'Acesso exclusivo da administração.' using errcode='42501';end if;
 if p_operation is null or coalesce(length(btrim(p_reason)),0) not between 5 and 500 then raise exception 'Informe o motivo.';end if;
 payload:=jsonb_build_object('id',p_id,'version',p_version,'action',p_action,'effective_at',p_effective_at,'reason',p_reason);
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_operation::text,51));
 select * into a from public.app_admin_audit where actor_id=auth.uid() and operation_id=p_operation;
 if found then if a.payload is distinct from payload then raise exception 'Operação reutilizada.';end if;return jsonb_build_object('ok',true);end if;
 select * into c from public.app_plan_changes where id=p_id for update;
 if not found or c.version is distinct from p_version or c.status not in ('requested','offered','accepted') then raise exception 'Solicitação mudou ou já foi encerrada.';end if;
 before_row:=to_jsonb(c);
 select * into s from public.app_subscriptions where user_id=c.user_id for update;
 if p_action='offer' then
   if s.provider_subscription is null or s.cancel_requested_at is not null then raise exception 'Assinatura indisponível.';end if;
   if p_effective_at is null or p_effective_at<greatest(now(),public.app_access_until(c.user_id)) or p_effective_at>now()+interval '366 days' then raise exception 'A troca deve preservar toda a vigência atual e ocorrer em até 366 dias.';end if;
   select * into p from public.app_plans where code=c.target_snapshot->>'code' and published and monthly_cents is not null for share;
   if not found then raise exception 'Plano não está publicado.';end if;
   if (select 1+count(distinct m.user_id) from public.commerce_memberships m join public.commerce_sellers co on co.id=m.seller_id where co.owner_id=c.user_id and m.active and m.user_id<>c.user_id)>p.seat_limit then raise exception 'Equipe acima do limite da proposta.';end if;
   update public.app_plan_changes set status='offered',from_snapshot=s.commercial_snapshot,target_snapshot=to_jsonb(p),terms_snapshot=(select to_jsonb(x)-'id' from public.app_checkout_settings x),subscription_version=s.version,effective_at=p_effective_at,offered_at=now(),accepted_at=null,admin_note=btrim(p_reason),version=version+1,updated_at=now() where id=p_id;
 elsif p_action='reject' then
   update public.app_plan_changes set status='rejected',admin_note=btrim(p_reason),version=version+1,updated_at=now() where id=p_id;
 else raise exception 'Ação inválida.';end if;
 insert into public.app_admin_audit(actor_id,operation_id,action,target,reason,payload,before_data,after_data) values(auth.uid(),p_operation,'commercial-'||p_action,c.user_id::text,btrim(p_reason),payload,before_row,(select to_jsonb(x) from public.app_plan_changes x where id=p_id));
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.app_change_offer(uuid,uuid,integer,text,timestamptz,text) from public,anon;
grant execute on function public.app_change_offer(uuid,uuid,integer,text,timestamptz,text) to authenticated;

create or replace function public.app_change_reference(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('change',to_jsonb(c),'subscription',s.provider_subscription,'customer',s.provider_customer,'environment',s.billing_environment)
 from public.app_plan_changes c join public.app_subscriptions s on s.user_id=c.user_id where c.id=p_id;
$$;
revoke all on function public.app_change_reference(uuid) from public,anon,authenticated;
grant execute on function public.app_change_reference(uuid) to service_role;

create or replace function public.app_change_apply(p_actor uuid,p_operation uuid,p_id uuid,p_version integer,p_canonical jsonb,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.app_plan_changes%rowtype;s public.app_subscriptions%rowtype;a public.app_admin_audit%rowtype;payload jsonb;before_row jsonb;
begin
 if not exists(select 1 from public.app_platform_admins where user_id=p_actor and active) then raise exception 'Administrador não autorizado.' using errcode='42501';end if;
 if p_operation is null or coalesce(length(btrim(p_reason)),0) not between 5 and 500 then raise exception 'Informe o motivo.';end if;
 payload:=jsonb_build_object('id',p_id,'version',p_version,'canonical',p_canonical,'reason',p_reason);
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||p_operation::text,51));
 select * into a from public.app_admin_audit where actor_id=p_actor and operation_id=p_operation;
 if found then if a.payload is distinct from payload then raise exception 'Operação reutilizada.';end if;return jsonb_build_object('ok',true);end if;
 select * into c from public.app_plan_changes where id=p_id for update;
 if not found or c.status<>'accepted' or c.version is distinct from p_version then raise exception 'A proposta exige aceite atual do titular.';end if;
 select * into s from public.app_subscriptions where user_id=c.user_id for update;
 if c.effective_at>now() or c.effective_at<public.app_access_until(c.user_id) then raise exception 'Aguarde a data acordada ou revise a proposta para preservar a vigência atual.';end if;
 if s.provider_subscription is null or s.cancel_requested_at is not null or s.commercial_snapshot is distinct from c.from_snapshot then raise exception 'Contrato alterado. Revise e obtenha novo aceite.';end if;
 if coalesce(p_canonical->>'subscription','')<>s.provider_subscription or coalesce(p_canonical->>'customer','')<>s.provider_customer or coalesce(p_canonical->>'environment','')<>s.billing_environment
 or coalesce(p_canonical->>'cycle','')<>'MONTHLY' or (p_canonical->>'amount_cents')::bigint is distinct from (c.target_snapshot->>'monthly_cents')::bigint
 or p_canonical->>'verified_at' is null or (p_canonical->>'verified_at')::timestamptz<now()-interval '2 minutes' or (p_canonical->>'verified_at')::timestamptz>now()+interval '1 minute' or (p_canonical->>'open_invoices_compatible')::boolean is distinct from true then raise exception 'Valor, cliente, ambiente ou cobranças pendentes não conferem.';end if;
 if exists(select 1 from public.app_checkouts where user_id=c.user_id and status in ('accepted','provisioning','awaiting_payment','review')) then raise exception 'Existe contratação em andamento.';end if;
 perform pg_advisory_xact_lock(hashtext('app-seats'),hashtext(c.user_id::text));
 if (select 1+count(distinct m.user_id) from public.commerce_memberships m join public.commerce_sellers co on co.id=m.seller_id where co.owner_id=c.user_id and m.active and m.user_id<>c.user_id)>(c.target_snapshot->>'seat_limit')::integer then raise exception 'Reduza a equipe antes de aplicar este plano.';end if;
 before_row:=to_jsonb(s);
 update public.app_subscriptions set plan_code=c.target_snapshot->>'code',expected_cents=(c.target_snapshot->>'monthly_cents')::bigint,commercial_snapshot=c.target_snapshot where user_id=c.user_id;
 update public.app_plan_changes set status='applied',applied_at=now(),updated_at=now(),version=version+1 where id=p_id;
 insert into public.app_admin_audit(actor_id,operation_id,action,target,reason,payload,before_data,after_data) values(p_actor,p_operation,'commercial-apply',c.user_id::text,btrim(p_reason),payload,before_row,(select to_jsonb(x) from public.app_subscriptions x where user_id=c.user_id));
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.app_change_apply(uuid,uuid,uuid,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.app_change_apply(uuid,uuid,uuid,integer,jsonb,text) to service_role;

commit;
