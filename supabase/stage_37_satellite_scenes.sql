-- Requer etapas 35 e 36. Catálogo privado, cache por conta/contorno/intervalo.
begin;
create table if not exists public.satellite_searches (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 area_id uuid not null references public.areas(id), revision uuid not null references public.geo_versions(id),
 date_from date not null,date_to date not null,status text not null default 'processing' check(status in ('processing','ready','failed')),
 lease uuid not null default gen_random_uuid(),result jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '24 hours'
);
alter table public.satellite_searches enable row level security;
revoke all on public.satellite_searches from public,anon,authenticated;
create index if not exists satellite_search_cache on public.satellite_searches(user_id,area_id,revision,date_from,date_to,created_at desc);
create or replace function public.satellite_search_claim(p_user uuid,p_area uuid,p_from date,p_to date) returns jsonb
language plpgsql security definer set search_path='' as $$
declare info jsonb;s public.satellite_searches%rowtype;
begin
 if p_from is null or p_to is null or p_from>p_to or p_to-p_from>30 or p_to>=(now() at time zone 'UTC')::date or p_from<(now() at time zone 'UTC')::date-366 then raise exception 'Escolha um intervalo de até 31 dias, nos últimos 366 dias, até ontem.';end if;
 info:=public.satellite_info(p_user,p_area);
 perform pg_advisory_xact_lock(hashtext('satellite-search'),hashtext(p_area::text));
 select * into s from public.satellite_searches where user_id=p_user and area_id=p_area and revision=(info->>'revision')::uuid and date_from=p_from and date_to=p_to and expires_at>now() order by created_at desc limit 1;
 if found then return jsonb_build_object('claimed',false,'id',s.id,'status',s.status,'result',s.result,'expires_at',s.expires_at);end if;
 if exists(select 1 from public.satellite_searches where user_id=p_user and area_id=p_area and created_at>now()-interval '1 minute') then raise exception 'Aguarde um minuto entre novas buscas deste talhão.';end if;
 insert into public.satellite_searches(user_id,area_id,revision,date_from,date_to) values(p_user,p_area,(info->>'revision')::uuid,p_from,p_to) returning * into s;
 perform public.satellite_reserve(s.id,p_user,p_area,s.revision,1,0.1);
 return jsonb_build_object('claimed',true,'id',s.id,'lease',s.lease,'geometry',info->'geometry');
end;$$;
create or replace function public.satellite_search_finish(p_id uuid,p_lease uuid,p_status text,p_result jsonb,p_pu numeric) returns void
language plpgsql security definer set search_path='' as $$
declare s public.satellite_searches%rowtype;extra numeric;
begin
 select * into s from public.satellite_searches where id=p_id for update;
 if not found or s.lease is distinct from p_lease or s.status<>'processing' then raise exception 'Busca encerrada ou inválida.';end if;
 if p_status is null or p_status not in ('ready','failed') or jsonb_typeof(p_result) is distinct from 'object' or octet_length(p_result::text)>100000 or (p_pu is not null and (p_pu<0 or p_pu::text in ('NaN','Infinity','-Infinity'))) then raise exception 'Resultado inválido.';end if;
 update public.satellite_searches set status=p_status,result=p_result,expires_at=case when p_status='failed' then now()+interval '1 hour' else expires_at end where id=s.id;
 extra:=coalesce(p_pu,0)-0.1;
 if extra>0 then
 perform pg_advisory_xact_lock(hashtext('satellite-budget'),0);
 update public.satellite_usage set pu=pu+extra where month=(select month from public.satellite_reservations where id=s.id) and scope in ('platform',s.user_id::text);
 update public.satellite_platform_limits set enabled=false where id=true;
 end if;
end;$$;
create or replace function public.satellite_scene_image_claim(p_user uuid,p_area uuid,p_search uuid,p_scene text,p_layer text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare info jsonb;s public.satellite_searches%rowtype;scene jsonb;i public.satellite_images%rowtype;job_id uuid:=gen_random_uuid();token uuid:=gen_random_uuid();d date;
begin
 info:=public.satellite_info(p_user,p_area);
 select * into s from public.satellite_searches where id=p_search and user_id=p_user and area_id=p_area and revision=(info->>'revision')::uuid and status='ready' and expires_at>now();
 if not found then raise exception 'Busca expirada ou contorno alterado. Busque as cenas novamente.';end if;
 select x into scene from jsonb_array_elements(s.result->'scenes') x where x->>'id'=p_scene limit 1;
 if scene is null or (scene->'properties'->>'eo:cloud_cover')::numeric>30 then raise exception 'Escolha uma cena elegível da busca.';end if;
 if p_layer is null or p_layer not in ('rgb','ndvi') then raise exception 'Camada inválida.';end if;
 d:=left(scene->'properties'->>'datetime',10)::date;
 perform pg_advisory_xact_lock(hashtext('satellite-image'),hashtext(p_area::text));
 select * into i from public.satellite_images where user_id=p_user and area_id=p_area and revision=s.revision and day=d and layer=p_layer and algorithm='s2-v1';
 if found then return jsonb_build_object('claimed',false,'id',i.id,'status',i.status,'metadata',i.metadata,'scene',scene);end if;
 if exists(select 1 from public.satellite_images where user_id=p_user and area_id=p_area and created_at>now()-interval '1 minute') then raise exception 'Aguarde um minuto antes de solicitar outra imagem deste talhão.';end if;
 perform public.satellite_reserve(job_id,p_user,p_area,s.revision,1,10);
 insert into public.satellite_images(id,user_id,area_id,revision,day,layer,status,lease) values(job_id,p_user,p_area,s.revision,d,p_layer,'processing',token);
 return jsonb_build_object('claimed',true,'id',job_id,'lease',token,'geometry',info->'geometry','scene',scene);

end;$$;
revoke all on function public.satellite_search_claim(uuid,uuid,date,date),public.satellite_search_finish(uuid,uuid,text,jsonb,numeric),public.satellite_scene_image_claim(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.satellite_search_claim(uuid,uuid,date,date),public.satellite_search_finish(uuid,uuid,text,jsonb,numeric),public.satellite_scene_image_claim(uuid,uuid,uuid,text,text) to service_role;
commit;
