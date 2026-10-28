begin;
create table if not exists public.app_checkout_settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 merchant_name text not null default '', support_email text not null default '',
 terms_url text not null default '', privacy_url text not null default '',
 terms_version text not null default 'piloto-1',
 conditions text not null default 'Assinatura mensal recorrente. O pagamento de cada mensalidade por Pix ou boleto é manual. A criação da cobrança não ativa a licença; a ativação depende da confirmação financeira. O cancelamento interrompe cobranças futuras e não solicita reembolso. Mudanças de plano são atendidas pela administração. Satélite tem franquia separada. Armazenamento é referência, sem bloqueio global por bytes.'
);
insert into public.app_checkout_settings(id) values(true) on conflict do nothing;
create table if not exists public.app_checkout_customers (
 user_id uuid not null references auth.users(id), environment text not null check(environment in ('sandbox','production')),
 provider_customer text not null, document_hash text not null,
 primary key(user_id,environment), unique(environment,provider_customer)
);
create table if not exists public.app_checkouts (
 id uuid primary key, user_id uuid not null references auth.users(id),
 environment text not null check(environment in ('sandbox','production')),
 plan_code text not null references public.app_plans(code), plan_snapshot jsonb not null, terms_snapshot jsonb not null,
 amount_cents bigint not null check(amount_cents>0), billing_type text not null check(billing_type in ('PIX','BOLETO')),
 status text not null default 'quoted' check(status in ('quoted','accepted','provisioning','awaiting_payment','review','completed','cancelled','rejected')),
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '30 minutes',
 accepted_at timestamptz, due_date date, document_hash text,
 provider_customer text, provider_subscription text unique, invoice_url text,
 customer_attempted boolean not null default false, subscription_attempted boolean not null default false,
 lease_id uuid, lease_until timestamptz, checked_at timestamptz,
 problem text check(problem in ('customer_unknown','subscription_unknown','provider_rejected','provider_unavailable','binding_conflict','payment_pending','provider_mismatch')),
 updated_at timestamptz not null default now()
);
create unique index if not exists app_checkout_one_open on public.app_checkouts(user_id)
 where status in ('quoted','accepted','provisioning','awaiting_payment','review');
create index if not exists app_checkout_recent on public.app_checkouts(user_id,created_at desc);
create index if not exists app_checkout_global on public.app_checkouts(created_at);
alter table public.app_checkout_settings enable row level security;
alter table public.app_checkout_customers enable row level security;
alter table public.app_checkouts enable row level security;
revoke all on public.app_checkout_settings,public.app_checkout_customers,public.app_checkouts from public,anon,authenticated;
grant all on public.app_checkout_settings,public.app_checkout_customers,public.app_checkouts to service_role;

create or replace function public.app_checkout_view(q public.app_checkouts) returns jsonb
 language sql immutable set search_path='' as $$
 select (to_jsonb(q)-'document_hash'-'lease_id'-'lease_until'-'customer_attempted'-'subscription_attempted')
 || jsonb_build_object('can_discard',q.status in ('quoted','accepted','provisioning','review') and not q.subscription_attempted and q.provider_subscription is null and (not q.customer_attempted or q.provider_customer is not null));
$$;
revoke all on function public.app_checkout_view(public.app_checkouts) from public,anon,authenticated;

create or replace function public.app_checkout_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 return jsonb_build_object('settings',(select to_jsonb(s)-'id' from public.app_checkout_settings s),
 'plans',(select coalesce(jsonb_agg(to_jsonb(p) order by seat_limit,code),'[]') from public.app_plans p where published and monthly_cents is not null),
 'checkouts',(select coalesce(jsonb_agg(public.app_checkout_view(q) order by created_at desc),'[]') from (select * from public.app_checkouts where user_id=auth.uid() order by created_at desc limit 5) q),
 'has_subscription',exists(select 1 from public.app_subscriptions where user_id=auth.uid() and provider_subscription is not null),
 'valid_until',public.app_access_until(auth.uid()));
end;$$;
revoke all on function public.app_checkout_context() from public,anon;
grant execute on function public.app_checkout_context() to authenticated;

create or replace function public.app_checkout_quote(p_user uuid,p_environment text,p_plan text,p_method text,p_operation uuid)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.app_checkouts%rowtype;p public.app_plans%rowtype;s public.app_checkout_settings%rowtype;people integer;
begin
 if p_user is null or p_operation is null or coalesce(p_environment,'') not in ('sandbox','production') or coalesce(p_method,'') not in ('PIX','BOLETO') then raise exception 'Solicitação inválida.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,50));
 select * into q from public.app_checkouts where id=p_operation;
 if found then
   if q.user_id<>p_user or q.environment<>p_environment or q.plan_code<>p_plan or q.billing_type<>p_method then raise exception 'Operação já utilizada.';end if;
   return public.app_checkout_view(q);
 end if;
 if exists(select 1 from public.app_subscriptions where user_id=p_user and provider_subscription is not null) then raise exception 'Você já possui assinatura. Abra a cobrança existente ou solicite alteração à administração.';end if;
 select * into s from public.app_checkout_settings;
 if not s.enabled then raise exception 'Contratação ainda não liberada.';end if;
 if p_environment='production' and (s.merchant_name='' or s.support_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or s.terms_url !~ '^https://' or s.privacy_url !~ '^https://') then raise exception 'Conclua as condições comerciais de produção.';end if;
 select * into p from public.app_plans where code=p_plan and published and monthly_cents is not null for share;
 if not found then raise exception 'Plano indisponível para contratação.';end if;
 select 1+count(distinct m.user_id) into people from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=p_user and m.active and m.user_id<>p_user;
 if people>p.seat_limit then raise exception 'Sua equipe excede o limite deste plano.';end if;
 update public.app_checkouts set status='cancelled',updated_at=now() where user_id=p_user and status='quoted' and expires_at<now();
 if exists(select 1 from public.app_checkouts where user_id=p_user and status in ('quoted','accepted','provisioning','awaiting_payment','review')) then raise exception 'Retome ou descarte a contratação em andamento.';end if;
 perform pg_advisory_xact_lock(50,50);
 if (select count(*) from public.app_checkouts where user_id=p_user and created_at>now()-interval '1 day')>=10 or (select count(*) from public.app_checkouts where created_at>now()-interval '1 day')>=1000 then raise exception 'Limite de solicitações atingido. Procure o atendimento.';end if;
 insert into public.app_checkouts(id,user_id,environment,plan_code,plan_snapshot,terms_snapshot,amount_cents,billing_type,due_date)
 values(p_operation,p_user,p_environment,p.code,to_jsonb(p),to_jsonb(s)-'id',p.monthly_cents,p_method,(now() at time zone 'America/Sao_Paulo')::date+3) returning * into q;
 return public.app_checkout_view(q);
end;$$;
revoke all on function public.app_checkout_quote(uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.app_checkout_quote(uuid,text,text,text,uuid) to service_role;

create or replace function public.app_checkout_claim(p_user uuid,p_id uuid,p_environment text,p_accept boolean,p_document_hash text,p_lease uuid)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.app_checkouts%rowtype;p public.app_plans%rowtype;s public.app_checkout_settings%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,50));
 select * into q from public.app_checkouts where id=p_id and user_id=p_user for update;
 if not found or q.environment is distinct from p_environment then raise exception 'Contratação não encontrada neste ambiente.';end if;
 if q.status in ('cancelled','rejected') then raise exception 'Contratação encerrada. Solicite uma nova revisão.';end if;
 if p_lease is null then raise exception 'Operação inválida.';end if;
 if q.lease_until>now() then raise exception 'Uma operação já está em andamento. Aguarde antes de atualizar.';end if;
 if q.checked_at>now()-interval '15 seconds' then raise exception 'Aguarde 15 segundos entre consultas ao provedor.';end if;
 if q.status='quoted' then
   if p_accept is distinct from true or coalesce(p_document_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Revise as condições e confirme a contratação.';end if;
   select * into p from public.app_plans where code=q.plan_code for share;
   select * into s from public.app_checkout_settings;
   if q.expires_at<=now() or to_jsonb(p) is distinct from q.plan_snapshot or (to_jsonb(s)-'id') is distinct from q.terms_snapshot or not s.enabled then raise exception 'A oferta mudou ou expirou. Descarte e revise uma nova oferta.';end if;
   if exists(select 1 from public.app_subscriptions where user_id=p_user and provider_subscription is not null) then raise exception 'Já existe assinatura vinculada a esta conta.';end if;
   if (select 1+count(distinct m.user_id) from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=p_user and m.active and m.user_id<>p_user)>p.seat_limit then raise exception 'Equipe acima do limite do plano.';end if;
   q.accepted_at:=now();q.document_hash:=p_document_hash;q.status:='accepted';
 elsif p_document_hash is not null and q.document_hash is distinct from p_document_hash then raise exception 'Documento diferente do informado no aceite.';
 end if;
 update public.app_checkouts set accepted_at=q.accepted_at,due_date=q.due_date,document_hash=q.document_hash,status=q.status,
 lease_id=p_lease,lease_until=now()+interval '5 minutes',checked_at=now(),updated_at=now() where id=q.id returning * into q;
 return to_jsonb(q);
end;$$;
revoke all on function public.app_checkout_claim(uuid,uuid,text,boolean,text,uuid) from public,anon,authenticated;
grant execute on function public.app_checkout_claim(uuid,uuid,text,boolean,text,uuid) to service_role;

create or replace function public.app_checkout_step(p_id uuid,p_lease uuid,p_action text,p_data jsonb default '{}')
 returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.app_checkouts%rowtype;customer public.app_checkout_customers%rowtype;s public.app_subscriptions%rowtype;
begin
 select * into q from public.app_checkouts where id=p_id for update;
 if not found or q.lease_id is distinct from p_lease or p_lease is null or q.lease_until<now() then raise exception 'Operação expirada. Atualize a contratação.';end if;
 if q.status in ('cancelled','rejected') and p_action<>'release' then raise exception 'Contratação encerrada.';end if;
 if p_action='customer_intent' then
   if q.customer_attempted or q.accepted_at<now()-interval '1 day' then raise exception 'Criação de cliente já enviada ou aceite antigo. Consulte o resultado.';end if;
   update public.app_checkouts set customer_attempted=true,status='provisioning' where id=p_id;
 elsif p_action='customer' then
   if coalesce(p_data->>'id','') !~ '^cus_[A-Za-z0-9]{1,116}$' or p_data->>'document_hash' is distinct from q.document_hash then raise exception 'Cliente inconsistente.';end if;
   select * into customer from public.app_checkout_customers where user_id=q.user_id and environment=q.environment for update;
   if found and (customer.provider_customer<>p_data->>'id' or customer.document_hash<>q.document_hash) then raise exception 'Cliente já cadastrado com outro documento. Procure o atendimento.';end if;
   insert into public.app_checkout_customers(user_id,environment,provider_customer,document_hash) values(q.user_id,q.environment,p_data->>'id',q.document_hash) on conflict do nothing;
   update public.app_checkouts set provider_customer=p_data->>'id' where id=p_id;
 elsif p_action='subscription_intent' then
   if q.subscription_attempted or q.provider_customer is null or q.accepted_at<now()-interval '1 day' then raise exception 'Criação já enviada, cliente ausente ou aceite antigo.';end if;
   if (select 1+count(distinct m.user_id) from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=q.user_id and m.active and m.user_id<>q.user_id)>(q.plan_snapshot->>'seat_limit')::integer then raise exception 'Equipe acima do limite contratado.';end if;
   update public.app_checkouts set subscription_attempted=true,status='provisioning' where id=p_id;
 elsif p_action='subscription' then
   if coalesce(p_data->>'id','') !~ '^sub_[A-Za-z0-9]{1,116}$' then raise exception 'Assinatura inválida.';end if;
   update public.app_checkouts set provider_subscription=p_data->>'id' where id=p_id;
 elsif p_action='finish' then
   if q.provider_customer is null or q.provider_subscription is null then raise exception 'Assinatura não confirmada no provedor.';end if;
   select * into s from public.app_subscriptions where user_id=q.user_id for update;
   if s.provider_subscription is not null and s.provider_subscription<>q.provider_subscription then raise exception 'Já existe outro vínculo. Revise com a administração.';end if;
   if coalesce(p_data->>'invoice_url','')<>'' and (p_data->>'invoice_url' !~ '^https://(www\.)?asaas\.com/' and p_data->>'invoice_url' !~ '^https://sandbox\.asaas\.com/') then raise exception 'Link de pagamento inválido.';end if;
   insert into public.app_subscriptions(user_id,plan_code,provider_customer,provider_subscription,expected_cents,billing_environment,checkout_url)
   values(q.user_id,q.plan_code,q.provider_customer,q.provider_subscription,q.amount_cents,q.environment,p_data->>'invoice_url')
   on conflict(user_id) do update set plan_code=excluded.plan_code,provider_customer=excluded.provider_customer,provider_subscription=excluded.provider_subscription,expected_cents=excluded.expected_cents,billing_environment=excluded.billing_environment,
   checkout_url=coalesce(excluded.checkout_url,app_subscriptions.checkout_url);
   update public.app_checkouts set invoice_url=coalesce(p_data->>'invoice_url',invoice_url),status=case when status='completed' then status else 'awaiting_payment' end,problem=case when p_data->>'invoice_url' is null then 'payment_pending' else null end where id=p_id;
 elsif p_action='review' then
   update public.app_checkouts set status=case when status in ('completed','awaiting_payment') then status else 'review' end,problem=p_data->>'problem' where id=p_id;
 elsif p_action='rejected' then
   -- Somente para resposta HTTP 400 inequívoca do POST correspondente, nunca timeout/5xx.
   if q.provider_subscription is not null then raise exception 'Não descarte uma assinatura existente.';end if;
   update public.app_checkouts set status='rejected',problem='provider_rejected' where id=p_id;
 elsif p_action='release' then
   update public.app_checkouts set lease_id=null,lease_until=null where id=p_id;
 else raise exception 'Passo inválido.';end if;
 update public.app_checkouts set updated_at=now() where id=p_id returning * into q;
 return to_jsonb(q);
end;$$;
revoke all on function public.app_checkout_step(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.app_checkout_step(uuid,uuid,text,jsonb) to service_role;

create or replace function public.app_checkout_customer(p_user uuid,p_environment text) returns jsonb
 language sql stable security definer set search_path='' as $$
 select to_jsonb(c) from public.app_checkout_customers c where user_id=p_user and environment=p_environment;
$$;
revoke all on function public.app_checkout_customer(uuid,text) from public,anon,authenticated;
grant execute on function public.app_checkout_customer(uuid,text) to service_role;

create or replace function public.app_checkout_discard(p_operation uuid,p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.app_checkouts%rowtype;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,50));
 select * into q from public.app_checkouts where id=p_id and user_id=auth.uid() for update;
 if not found then raise exception 'Contratação não encontrada.';end if;
 if q.status='cancelled' then return jsonb_build_object('ok',true);end if;
 if q.subscription_attempted or q.provider_subscription is not null or q.status in ('completed','awaiting_payment') or q.lease_until>now() or (q.customer_attempted and q.provider_customer is null) then raise exception 'Operação enviada ao provedor. Reconcilie antes de cancelar.';end if;
 update public.app_checkouts set status='cancelled',lease_id=null,lease_until=null,updated_at=now() where id=p_id;
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.app_checkout_discard(uuid,uuid) from public,anon;
grant execute on function public.app_checkout_discard(uuid,uuid) to authenticated;

create or replace function public.app_checkout_subscription_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare q public.app_checkouts%rowtype;
begin
 select * into q from public.app_checkouts where user_id=new.user_id and status in ('accepted','provisioning','review','awaiting_payment') order by created_at desc limit 1;
 if found and (new.provider_subscription is distinct from q.provider_subscription or new.plan_code<>q.plan_code or (new.expected_cents is not null and new.expected_cents<>q.amount_cents)) then raise exception 'Há contratação em andamento. Reconcilie antes de alterar o vínculo.';end if;
 return new;
end;$$;
drop trigger if exists app_checkout_subscription_guard on public.app_subscriptions;
create trigger app_checkout_subscription_guard before insert or update on public.app_subscriptions for each row execute function public.app_checkout_subscription_guard();

create or replace function public.app_checkout_seat_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare owner uuid;limit_people integer;used integer;
begin
 if not new.active then return new;end if;
 select owner_id into owner from public.commerce_sellers where id=new.seller_id;
 if owner is null or new.user_id=owner then return new;end if;
 perform pg_advisory_xact_lock(hashtext('app-seats'),hashtext(owner::text));
 select (q.plan_snapshot->>'seat_limit')::integer into limit_people from public.app_checkouts q
 where user_id=owner and status in ('accepted','provisioning','review','awaiting_payment') order by created_at desc limit 1;
 if limit_people is null then return new;end if;
 if exists(select 1 from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=owner and m.active and m.user_id=new.user_id) then return new;end if;
 select 1+count(distinct m.user_id) into used from public.commerce_memberships m join public.commerce_sellers c on c.id=m.seller_id where c.owner_id=owner and m.active and m.user_id<>owner;
 if used>=limit_people then raise exception 'Equipe atingiu o limite da contratação em andamento.';end if;
 return new;
end;$$;
drop trigger if exists app_checkout_seats on public.commerce_memberships;
create trigger app_checkout_seats before insert or update of active,user_id,seller_id on public.commerce_memberships for each row execute function public.app_checkout_seat_guard();

do $$begin
 if to_regprocedure('public.app_billing_apply_v49(text,jsonb)') is null then alter function public.app_billing_apply(text,jsonb) rename to app_billing_apply_v49;end if;
end;$$;
revoke all on function public.app_billing_apply_v49(text,jsonb) from public,anon,authenticated,service_role;
create or replace function public.app_billing_apply(p_event text,p_payment jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 result:=public.app_billing_apply_v49(p_event,p_payment);
 if result->>'outcome'='processed' then
   update public.app_checkouts q set status='completed',problem=null,updated_at=now()
   where provider_subscription=p_payment->>'subscription' and environment=p_payment->>'environment'
   and exists(select 1 from public.app_billing_payments p where p.subscription_id=q.provider_subscription and p.user_id=q.user_id and p.status in ('CONFIRMED','RECEIVED') and p.amount_cents>=q.amount_cents and p.valid_until>now());
 end if;
 return result;
end;$$;
revoke all on function public.app_billing_apply(text,jsonb) from public,anon,authenticated;
grant execute on function public.app_billing_apply(text,jsonb) to service_role;

create or replace function public.app_checkout_admin_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.app_is_platform_admin() then raise exception 'Acesso exclusivo da administração.' using errcode='42501';end if;
 return jsonb_build_object('settings',(select to_jsonb(s)-'id' from public.app_checkout_settings s),
 'checkouts',(select coalesce(jsonb_agg(public.app_checkout_view(q) order by updated_at desc),'[]') from(select * from public.app_checkouts order by updated_at desc limit 30) q));
end;$$;
revoke all on function public.app_checkout_admin_context() from public,anon;
grant execute on function public.app_checkout_admin_context() to authenticated;

create or replace function public.app_checkout_settings_save(p_operation uuid,p_expected jsonb,p_settings jsonb,p_reason text)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.app_checkout_settings%rowtype;a public.app_admin_audit%rowtype;payload jsonb;
begin
 if not public.app_is_platform_admin() then raise exception 'Acesso exclusivo da administração.' using errcode='42501';end if;
 if p_operation is null or coalesce(length(btrim(p_reason)),0) not between 5 and 500 or jsonb_typeof(p_settings) is distinct from 'object' or octet_length(p_settings::text)>6000 then raise exception 'Configuração ou motivo inválidos.';end if;
 payload:=jsonb_build_object('settings',p_settings,'expected',p_expected,'reason',p_reason);
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_operation::text,50));
 select * into a from public.app_admin_audit where actor_id=auth.uid() and operation_id=p_operation;
 if found then if a.payload is distinct from payload then raise exception 'Operação já utilizada.';end if;return jsonb_build_object('ok',true);end if;
 select * into s from public.app_checkout_settings for update;
 if (to_jsonb(s)-'id') is distinct from p_expected then raise exception 'Condições mudaram. Atualize a tela.';end if;
 if jsonb_typeof(p_settings->'enabled') is distinct from 'boolean' or coalesce(length(btrim(p_settings->>'terms_version')),0) not between 1 and 60
 or coalesce(length(btrim(p_settings->>'conditions')),0) not between 50 and 3000 or coalesce(length(p_settings->>'merchant_name'),0)>160
 or coalesce(length(p_settings->>'support_email'),0)>254 or coalesce(length(p_settings->>'terms_url'),0)>500 or coalesce(length(p_settings->>'privacy_url'),0)>500
 or (coalesce(p_settings->>'terms_url','')<>'' and p_settings->>'terms_url' !~ '^https://[^[:space:]]+$')
 or (coalesce(p_settings->>'privacy_url','')<>'' and p_settings->>'privacy_url' !~ '^https://[^[:space:]]+$') then raise exception 'Revise as condições e os links HTTPS.';end if;
 if (to_jsonb(s)-'id'-'enabled') is distinct from (p_settings-'enabled') and s.terms_version=p_settings->>'terms_version' then raise exception 'Atualize a versão ao alterar as condições comerciais.';end if;
 update public.app_checkout_settings set enabled=(p_settings->>'enabled')::boolean,merchant_name=btrim(p_settings->>'merchant_name'),support_email=btrim(p_settings->>'support_email'),terms_url=btrim(p_settings->>'terms_url'),privacy_url=btrim(p_settings->>'privacy_url'),terms_version=btrim(p_settings->>'terms_version'),conditions=btrim(p_settings->>'conditions');
 insert into public.app_admin_audit(actor_id,operation_id,action,target,reason,payload,before_data,after_data) values(auth.uid(),p_operation,'checkout-settings','checkout',btrim(p_reason),payload,to_jsonb(s)-'id',p_settings);
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.app_checkout_settings_save(uuid,jsonb,jsonb,text) from public,anon;
grant execute on function public.app_checkout_settings_save(uuid,jsonb,jsonb,text) to authenticated;
commit;
