-- Piloto manual Sentinel-2. Requer etapa 35. Não habilita consumo automaticamente.
begin;
create table if not exists public.satellite_images (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),area_id uuid not null references public.areas(id),revision uuid not null references public.geo_versions(id),
 day date not null,layer text not null check(layer in ('rgb','ndvi')),algorithm text not null default 's2-v1',
 status text not null check(status in ('processing','ready','no_data','failed')),lease uuid not null,
 storage_path text,metadata jsonb not null default '{}'::jsonb,actual_pu numeric,actual_requests int,
 created_at timestamptz not null default now(),finished_at timestamptz,
 unique(user_id,area_id,revision,day,layer,algorithm)
);
alter table public.satellite_images enable row level security;
revoke all on public.satellite_images from public,anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('meuagro-satellite','meuagro-satellite',false,2097152,array['image/png']) on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/png'];
drop policy if exists satellite_server_only on storage.objects;
create policy satellite_server_only on storage.objects as restrictive for all to authenticated,anon using(bucket_id<>'meuagro-satellite') with check(bucket_id<>'meuagro-satellite');

create or replace function public.satellite_info(p_user uuid,p_area uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v public.geo_versions%rowtype;e public.satellite_entitlements%rowtype;
begin
 select * into e from public.satellite_entitlements where user_id=p_user and enabled;
 if not found or not exists(select 1 from public.satellite_fields where user_id=p_user and area_id=p_area) then raise exception 'Selecione o talhão em um pacote ativo antes de consultar imagens.' using errcode='42501'; end if;
 select g.* into v from public.geo_versions g join public.geo_current c on c.revision=g.id join public.areas a on a.id=p_area join public.properties p on p.id=a.property_id
 where c.target=p_area and c.property_id=a.property_id and a.user_id=p_user and p.user_id=p_user and a.deleted_at is null and p.deleted_at is null and coalesce(to_jsonb(a)->>'status','active')<>'archived' and coalesce(to_jsonb(p)->>'status','active')<>'archived';
 if not found or v.geometry->>'type'<>'Polygon' or v.hectares>e.max_field_ha or (select count(*) from public.satellite_fields where user_id=p_user)>e.max_fields then raise exception 'Revise o contorno aprovado ou os limites do pacote.' using errcode='42501'; end if;
 return jsonb_build_object('revision',v.id,'geometry',v.geometry,'property_id',v.property_id);
end; $$;
create or replace function public.satellite_image_list(p_property uuid,p_area uuid,p_share uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare ctx jsonb;info jsonb;
begin
 ctx:=public.geo_context(p_property,p_area,p_share);
 if p_area is null then return '[]'::jsonb;end if;
 info:=public.satellite_info((ctx->'property'->>'owner_id')::uuid,p_area);
 return (select coalesce(jsonb_agg(x),'[]'::jsonb) from (select jsonb_build_object('id',i.id,'day',i.day,'layer',i.layer,'status',i.status,'metadata',i.metadata,'created_at',i.created_at,'actual_pu',i.actual_pu) x from public.satellite_images i where i.area_id=p_area and i.user_id=(ctx->'property'->>'owner_id')::uuid and i.revision=(info->>'revision')::uuid order by i.day desc,i.created_at desc limit 30) r);
end; $$;
create or replace function public.satellite_image_access(p_id uuid,p_share uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare i public.satellite_images%rowtype;pid uuid;ctx jsonb;info jsonb;
begin
 select * into i from public.satellite_images where id=p_id and status='ready';
 if not found then raise exception 'Imagem indisponível.' using errcode='42501';end if;
 select property_id into pid from public.areas where id=i.area_id;
 ctx:=public.geo_context(pid,i.area_id,p_share);
 if (ctx->'property'->>'owner_id')::uuid<>i.user_id then raise exception 'Imagem indisponível.' using errcode='42501';end if;
 info:=public.satellite_info(i.user_id,i.area_id);
 if i.revision is distinct from (info->>'revision')::uuid then raise exception 'O contorno mudou. Solicite uma imagem para a versão atual.' using errcode='42501';end if;
 return jsonb_build_object('id',i.id,'storage_path',i.storage_path,'metadata',i.metadata);
end; $$;
create or replace function public.satellite_image_claim(p_user uuid,p_area uuid,p_day date,p_layer text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare info jsonb;i public.satellite_images%rowtype;v uuid;job uuid:=gen_random_uuid();token uuid:=gen_random_uuid();
begin
 if p_day is null or p_day>=(now() at time zone 'UTC')::date or p_day<(now() at time zone 'UTC')::date-366 or p_layer is null or p_layer not in ('rgb','ndvi') then raise exception 'Escolha uma data passada nos últimos 366 dias e uma camada válida.';end if;
 info:=public.satellite_info(p_user,p_area);v:=(info->>'revision')::uuid;
 perform pg_advisory_xact_lock(hashtext('satellite-image'),hashtext(p_area::text));
 select * into i from public.satellite_images where user_id=p_user and area_id=p_area and revision=v and day=p_day and layer=p_layer and algorithm='s2-v1';
 if found then return jsonb_build_object('claimed',false,'id',i.id,'status',i.status,'metadata',i.metadata);end if;
 if exists(select 1 from public.satellite_images where user_id=p_user and area_id=p_area and created_at>now()-interval '1 minute') then raise exception 'Aguarde um minuto antes de solicitar outra imagem deste talhão.';end if;
 perform public.satellite_reserve(job,p_user,p_area,v,2,10);
 insert into public.satellite_images(id,user_id,area_id,revision,day,layer,status,lease) values(job,p_user,p_area,v,p_day,p_layer,'processing',token);
 return jsonb_build_object('claimed',true,'id',job,'lease',token,'status','processing','geometry',info->'geometry');
end; $$;
create or replace function public.satellite_image_finish(p_id uuid,p_lease uuid,p_status text,p_metadata jsonb,p_requests int,p_pu numeric) returns void
language plpgsql security definer set search_path='' as $$
declare i public.satellite_images%rowtype;path text;overrun numeric;
begin
 select * into i from public.satellite_images where id=p_id for update;
 if not found or i.lease is distinct from p_lease or i.status<>'processing' then raise exception 'Processamento encerrado ou identificador inválido.';end if;
 if p_status is null or p_status not in ('ready','no_data','failed') or p_requests is null or p_requests<0 or p_requests>2 or (p_pu is not null and (p_pu<0 or p_pu::text in ('NaN','Infinity','-Infinity'))) or jsonb_typeof(p_metadata) is distinct from 'object' or octet_length(p_metadata::text)>12000 then raise exception 'Resultado inválido.';end if;
 path:=i.user_id::text||'/'||i.id::text||'.png';
 if p_status='ready' and not exists(select 1 from storage.objects where bucket_id='meuagro-satellite' and name=path) then raise exception 'Envie a imagem antes de concluir.';end if;
 update public.satellite_images set status=p_status,metadata=p_metadata,storage_path=case when p_status='ready' then path end,actual_requests=p_requests,actual_pu=p_pu,finished_at=now() where id=i.id;
 -- A reserva permanece conservadora. Se o observado ultrapassar a reserva, pausa novas chamadas.
 overrun:=greatest(coalesce(p_pu,0),coalesce((p_metadata->>'observed_pu_lower_bound')::numeric,0))-10;
 if overrun>0 then
   perform pg_advisory_xact_lock(hashtext('satellite-budget'),0);
   update public.satellite_usage set pu=pu+overrun where month=(select month from public.satellite_reservations where id=i.id) and scope in ('platform',i.user_id::text);
   update public.satellite_platform_limits set enabled=false where id=true;
 end if;
end; $$;
create or replace function public.satellite_status() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('entitlement',(select to_jsonb(e) from public.satellite_entitlements e where user_id=auth.uid()),'usage',(select to_jsonb(s) from public.satellite_usage s where scope=auth.uid()::text and month=date_trunc('month',now() at time zone 'UTC')::date),'fields',(select coalesce(jsonb_agg(area_id),'[]'::jsonb) from public.satellite_fields where user_id=auth.uid()),'provider_ready',coalesce((select enabled from public.satellite_platform_limits where id=true),false)) where auth.uid() is not null;
$$;
revoke all on function public.satellite_info(uuid,uuid),public.satellite_image_list(uuid,uuid,uuid),public.satellite_image_access(uuid,uuid),public.satellite_image_claim(uuid,uuid,date,text),public.satellite_image_finish(uuid,uuid,text,jsonb,int,numeric) from public,anon,authenticated;
grant execute on function public.satellite_image_list(uuid,uuid,uuid),public.satellite_image_access(uuid,uuid) to authenticated;
grant execute on function public.satellite_image_claim(uuid,uuid,date,text),public.satellite_image_finish(uuid,uuid,text,jsonb,int,numeric) to service_role;
commit;
