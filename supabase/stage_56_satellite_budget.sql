-- Requer etapas 35, 36 e 37. Não ativa o provedor nem altera franquias.
begin;
alter table public.satellite_searches add column if not exists actual_requests int;
alter table public.satellite_searches add column if not exists actual_pu numeric;
alter table public.satellite_searches add column if not exists finished_at timestamptz;

create or replace function public.satellite_search_finish(p_id uuid,p_lease uuid,p_status text,p_result jsonb,p_pu numeric) returns void
language plpgsql security definer set search_path='' as $$
declare s public.satellite_searches%rowtype;extra numeric;observed numeric;req int;
begin
 select * into s from public.satellite_searches where id=p_id for update;
 if not found or s.lease is distinct from p_lease or s.status<>'processing' then raise exception 'Busca encerrada ou inválida.';end if;
 if p_status is null or p_status not in ('ready','failed') or jsonb_typeof(p_result) is distinct from 'object' or octet_length(p_result::text)>100000 or (p_pu is not null and (p_pu<0 or p_pu::text in ('NaN','Infinity','-Infinity'))) then raise exception 'Resultado inválido.';end if;
 req:=(p_result->>'actual_requests')::int;
 observed:=coalesce((p_result->>'observed_pu_lower_bound')::numeric,0);
 if (req is not null and req not in (0,1)) or observed<0 or observed::text in ('NaN','Infinity','-Infinity') then raise exception 'Consumo inválido.';end if;
 update public.satellite_searches set status=p_status,result=p_result,actual_requests=req,actual_pu=p_pu,finished_at=now(),expires_at=case when p_status='failed' then now()+interval '1 hour' else expires_at end where id=s.id;
 extra:=greatest(coalesce(p_pu,0),observed)-0.1;
 if extra>0 then
 perform pg_advisory_xact_lock(hashtext('satellite-budget'),0);
 update public.satellite_usage set pu=pu+extra where month=(select month from public.satellite_reservations where id=s.id) and scope in ('platform',s.user_id::text);
 update public.satellite_platform_limits set enabled=false where id=true;
 end if;
end;$$;

-- A conta vê somente seus totais. Mês da reserva, inclusive conclusão no mês seguinte.
create or replace function public.satellite_budget_report() returns jsonb
language sql stable security definer set search_path='' as $$
 with jobs as (
 select r.id,i.status,i.actual_requests,i.actual_pu,
   coalesce((i.metadata->>'observed_pu_lower_bound')::numeric,0) observed
 from public.satellite_reservations r join public.satellite_images i on i.id=r.id
 where r.user_id=auth.uid() and r.month=date_trunc('month',now() at time zone 'UTC')::date
 union all
 select r.id,s.status,s.actual_requests,s.actual_pu,
   coalesce((s.result->>'observed_pu_lower_bound')::numeric,0)
 from public.satellite_reservations r join public.satellite_searches s on s.id=r.id
 where r.user_id=auth.uid() and r.month=date_trunc('month',now() at time zone 'UTC')::date
 )
 select jsonb_build_object(
 'month',date_trunc('month',now() at time zone 'UTC')::date,
 'jobs',count(*),'processing',count(*) filter(where status='processing'),
 'failed',count(*) filter(where status='failed'),
 'no_data',count(*) filter(where status='no_data'),
 'requests_observed',coalesce(sum(actual_requests),0),
 'requests_unknown',count(*) filter(where actual_requests is null),
 'pu_lower_bound',coalesce(sum(greatest(coalesce(actual_pu,0),observed)),0),
 'pu_unknown',count(*) filter(where actual_pu is null)
 ) from jobs having auth.uid() is not null;
$$;

create or replace function public.satellite_status() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('entitlement',(select to_jsonb(e) from public.satellite_entitlements e where user_id=auth.uid()),'usage',(select to_jsonb(s) from public.satellite_usage s where scope=auth.uid()::text and month=date_trunc('month',now() at time zone 'UTC')::date),'fields',(select coalesce(jsonb_agg(area_id),'[]'::jsonb) from public.satellite_fields where user_id=auth.uid()),'provider_ready',coalesce((select enabled from public.satellite_platform_limits where id=true),false),'budget',public.satellite_budget_report()) where auth.uid() is not null;
$$;
revoke all on function public.satellite_search_finish(uuid,uuid,text,jsonb,numeric),public.satellite_budget_report() from public,anon,authenticated;
grant execute on function public.satellite_search_finish(uuid,uuid,text,jsonb,numeric) to service_role;
grant execute on function public.satellite_budget_report() to authenticated;
commit;
