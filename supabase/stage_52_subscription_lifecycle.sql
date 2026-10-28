begin;
-- Apply after stage 51. Financial observations never extend access by themselves.
create table if not exists public.app_billing_sync (
 user_id uuid primary key references auth.users(id),subscription_id text not null,
 token uuid not null,started_at timestamptz not null default now(),finished_at timestamptz,
 provider_status text,provider_checked_at timestamptz,cancel_intent_at timestamptz
);
alter table public.app_billing_sync enable row level security;
revoke all on public.app_billing_sync from public,anon,authenticated;
alter table public.app_billing_payments add column if not exists refund_review boolean not null default false;
do $$ begin
 if to_regprocedure('public.app_billing_apply_v51(text,jsonb)') is null then
  alter function public.app_billing_apply(text,jsonb) rename to app_billing_apply_v51;
 end if;
end;$$;
revoke all on function public.app_billing_apply_v51(text,jsonb) from public,anon,authenticated,service_role;
create or replace function public.app_billing_apply(p_event text,p_payment jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 result:=public.app_billing_apply_v51(p_event,p_payment);
 if result->>'outcome'='processed' then
  update public.app_billing_payments set refund_review=coalesce((p_payment->>'refund_review')::boolean,false)
   where id=p_payment->>'id' and subscription_id=p_payment->>'subscription' and checked_at=(p_payment->>'checked_at')::timestamptz;
 end if;
 return result;
end;$$;
create or replace function public.app_lifecycle_begin(p_cancel boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();s public.app_subscriptions%rowtype;x public.app_billing_sync%rowtype;t uuid:=gen_random_uuid();
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into s from public.app_subscriptions where user_id=u for update;
 if s.provider_subscription is null then raise exception 'Assinatura não configurada.';end if;
 select * into x from public.app_billing_sync where user_id=u;
 if x.started_at>now()-interval '60 seconds' then raise exception 'Aguarde um minuto entre operações de cobrança.';end if;
 insert into public.app_billing_sync(user_id,subscription_id,token,cancel_intent_at)
 values(u,s.provider_subscription,t,case when p_cancel then now() end)
 on conflict(user_id) do update set subscription_id=excluded.subscription_id,token=t,started_at=now(),finished_at=null,
 provider_status=case when app_billing_sync.subscription_id=excluded.subscription_id then app_billing_sync.provider_status end,
 provider_checked_at=case when app_billing_sync.subscription_id=excluded.subscription_id then app_billing_sync.provider_checked_at end,
 cancel_intent_at=case when p_cancel then now() when app_billing_sync.subscription_id=excluded.subscription_id then app_billing_sync.cancel_intent_at end;
 return jsonb_build_object('token',t,'user_id',u,'subscription',s.provider_subscription,'customer',s.provider_customer,'environment',s.billing_environment);
end;$$;
create or replace function public.app_lifecycle_observe(p_subscription text,p_customer text,p_environment text,p_status text,p_checked timestamptz) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.app_subscriptions%rowtype;
begin
 if p_status is null or p_checked is null or p_checked>now()+interval '5 minutes' or p_status not in ('ACTIVE','INACTIVE','EXPIRED','DELETED') then raise exception 'Estado inválido.';end if;
 select * into s from public.app_subscriptions where provider_subscription=p_subscription and provider_customer=p_customer and billing_environment=p_environment for update;
 if not found then return jsonb_build_object('ignored',true);end if;
 insert into public.app_billing_sync(user_id,subscription_id,token,provider_status,provider_checked_at,started_at)
 values(s.user_id,p_subscription,gen_random_uuid(),p_status,p_checked,'2000-01-01')
 on conflict(user_id) do update set subscription_id=excluded.subscription_id,provider_status=p_status,provider_checked_at=p_checked
 where app_billing_sync.subscription_id<>excluded.subscription_id or app_billing_sync.provider_checked_at is null or app_billing_sync.provider_checked_at<p_checked;
 if found then
  update public.app_subscriptions set cancel_requested_at=case when p_status='DELETED' then coalesce(cancel_requested_at,p_checked) else null end
   where user_id=s.user_id and ((p_status='DELETED' and cancel_requested_at is null) or (p_status<>'DELETED' and cancel_requested_at is not null));
 end if;
 return jsonb_build_object('ok',true);
end;$$;
create or replace function public.app_lifecycle_finish(p_user uuid,p_token uuid,p_subscription text) returns void
language plpgsql security definer set search_path='' as $$
begin
 update public.app_billing_sync x set finished_at=now(),cancel_intent_at=null
 where x.user_id=p_user and token=p_token and x.subscription_id=p_subscription
 and exists(select 1 from public.app_subscriptions s where s.user_id=p_user and s.provider_subscription=p_subscription);
 if not found then raise exception 'A assinatura mudou. Atualize a tela.';end if;
end;$$;
create or replace function public.app_lifecycle_context() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 return jsonb_build_object('has_provider',exists(select 1 from public.app_subscriptions where user_id=u and provider_subscription is not null),
 'valid_until',public.app_access_until(u),'active',coalesce(public.app_access_until(u)>now(),false),
 'sync',(select jsonb_build_object('started_at',x.started_at,'finished_at',x.finished_at,'provider_status',x.provider_status,'provider_checked_at',x.provider_checked_at,'cancel_pending',x.cancel_intent_at is not null) from public.app_billing_sync x join public.app_subscriptions s on s.user_id=x.user_id and s.provider_subscription=x.subscription_id where x.user_id=u),
 'payments',coalesce((select jsonb_agg(to_jsonb(p) order by p.due_date desc,p.id) from (select id,status,amount_cents,due_date,valid_until,invoice_url,checked_at,refund_review from public.app_billing_payments where user_id=u order by due_date desc,id limit 24)p),'[]'::jsonb));
end;$$;
revoke all on function public.app_billing_apply(text,jsonb),public.app_lifecycle_begin(boolean),public.app_lifecycle_observe(text,text,text,text,timestamptz),public.app_lifecycle_finish(uuid,uuid,text),public.app_lifecycle_context() from public,anon,authenticated;
grant execute on function public.app_lifecycle_begin(boolean),public.app_lifecycle_context() to authenticated;
grant execute on function public.app_billing_apply(text,jsonb),public.app_lifecycle_observe(text,text,text,text,timestamptz),public.app_lifecycle_finish(uuid,uuid,text) to service_role;
commit;
