-- Fila de envio remoto. Requer as tabelas comerciais e trade_notifications.
begin;
create table if not exists public.trade_push_devices (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 token text not null unique check(length(token) between 20 and 4096),enabled boolean not null default true,updated_at timestamptz not null default now()
);
create table if not exists public.trade_push_queue (
 id uuid primary key default gen_random_uuid(),notification_id uuid not null references public.trade_notifications(id) on delete cascade,
 device_id uuid not null references public.trade_push_devices(id) on delete cascade,
 attempts integer not null default 0,next_at timestamptz not null default now(),lease uuid,lease_until timestamptz,
 finished_at timestamptz,outcome text,unique(notification_id,device_id)
);
create index if not exists trade_push_pending on public.trade_push_queue(next_at) where finished_at is null;
alter table public.trade_push_devices enable row level security;
alter table public.trade_push_queue enable row level security;
revoke all on public.trade_push_devices,public.trade_push_queue from public,anon,authenticated;
create or replace function public.trade_register_push(p_token text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_token is null or length(p_token) not between 20 and 4096 then raise exception 'Dispositivo inválido.';end if;
 perform 1 from auth.users where id=auth.uid() for update;
 if (select count(*) from public.trade_push_devices where user_id=auth.uid() and enabled and token<>p_token)>=20 then raise exception 'Limite de dispositivos atingido.';end if;
 insert into public.trade_push_devices(user_id,token) values(auth.uid(),p_token)
 on conflict(token) do update set user_id=excluded.user_id,enabled=true,updated_at=now();
end $$;
create or replace function public.trade_unregister_push(p_token text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 update public.trade_push_devices set enabled=false,updated_at=now() where token=p_token and user_id=auth.uid();
end $$;
create or replace function public.trade_enqueue_push() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.trade_push_queue(notification_id,device_id) select new.id,id from public.trade_push_devices where user_id=new.recipient_id and enabled on conflict do nothing;
 return new;
end $$;
drop trigger if exists trade_push_enqueue on public.trade_notifications;
create trigger trade_push_enqueue after insert on public.trade_notifications for each row execute function public.trade_enqueue_push();
create or replace function public.trade_claim_push() returns jsonb language plpgsql security definer set search_path='' as $$
declare job record; result jsonb:='[]'; lock_id uuid; allowed boolean;
begin
 for job in select q.*,d.token,d.user_id,d.enabled,n.recipient_id,n.request_id,n.title,n.body,n.created_at,n.read_at,
 c.buyer_id,c.agent_id,c.seller_id,s.owner_id
 from public.trade_push_queue q join public.trade_push_devices d on d.id=q.device_id
 join public.trade_notifications n on n.id=q.notification_id join public.trade_requests r on r.id=n.request_id
 join public.trade_connections c on c.id=r.connection_id join public.commerce_sellers s on s.id=c.seller_id
 where q.finished_at is null and q.next_at<=now() and (q.lease_until is null or q.lease_until<now())
 order by q.next_at,q.id limit 50 for update of q skip locked loop
  allowed:=job.enabled and job.user_id=job.recipient_id and job.read_at is null and job.created_at>now()-interval '24 hours'
   and (job.recipient_id=job.buyer_id or (job.recipient_id in (job.agent_id,job.owner_id) and public.trade_agent_active(job.seller_id,job.recipient_id)));
  if not allowed or job.attempts>=6 then
   update public.trade_push_queue set finished_at=now(),outcome='discarded' where id=job.id;
  else
   lock_id:=gen_random_uuid();
   update public.trade_push_queue set attempts=attempts+1,lease=lock_id,lease_until=now()+interval '5 minutes' where id=job.id;
   result:=result||jsonb_build_array(jsonb_build_object('id',job.id,'lease',lock_id,'token',job.token,'notification_id',job.notification_id,
    'title',job.title,'body',job.body,'recipient_id',job.recipient_id,
    'route',case when job.recipient_id=job.buyer_id then '/compras?request=' else '/consultor/negociacoes?request=' end||job.request_id::text));
  end if;
 end loop;
 return result;
end $$;
create or replace function public.trade_finish_push(p_id uuid,p_lease uuid,p_outcome text,p_token text) returns void language plpgsql security definer set search_path='' as $$
declare job public.trade_push_queue%rowtype;
begin
 if p_outcome not in ('sent','retry','invalid') then raise exception 'Resultado inválido.';end if;
 select * into job from public.trade_push_queue where id=p_id and lease=p_lease and finished_at is null for update;
 if not found then return;end if;
 update public.trade_push_queue set finished_at=case when p_outcome<>'retry' or attempts>=6 then now() else null end,
 outcome=p_outcome,next_at=now()+make_interval(secs=>least(3600,30*power(2,attempts)::integer)),lease=null,lease_until=null where id=p_id;
 if p_outcome='invalid' then update public.trade_push_devices set enabled=false where id=job.device_id and token=p_token;end if;
end $$;
revoke all on function public.trade_register_push(text),public.trade_unregister_push(text),public.trade_enqueue_push(),public.trade_claim_push(),public.trade_finish_push(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.trade_register_push(text),public.trade_unregister_push(text) to authenticated;
grant execute on function public.trade_claim_push(),public.trade_finish_push(uuid,uuid,text,text) to service_role;
commit;
