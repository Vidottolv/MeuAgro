begin;
create table if not exists public.weather_sites(property_id uuid primary key references public.properties(id),user_id uuid not null references auth.users(id),latitude numeric(9,6) not null check(latitude between -90 and 90),longitude numeric(10,6) not null check(longitude between -180 and 180),version int not null default 1,updated_at timestamptz not null default now());
create table if not exists public.rain_readings(id uuid primary key,user_id uuid not null references auth.users(id),property_id uuid not null references public.properties(id),day date not null,station text not null check(length(btrim(station)) between 1 and 80),millimeters numeric(8,2) not null check(millimeters between 0 and 2000),note text not null default '' check(length(note)<=1000),voided_at timestamptz,void_reason text,created_at timestamptz not null default now());
create unique index if not exists rain_station_day on public.rain_readings(property_id,day,lower(station)) where voided_at is null;
create table if not exists public.weather_requests(id uuid primary key default gen_random_uuid(),user_id uuid not null,property_id uuid not null,site_version int not null,status text not null default 'pending',created_at timestamptz not null default now());
create index if not exists weather_request_user_date on public.weather_requests(user_id,created_at);
create table if not exists public.weather_cache(property_id uuid primary key,user_id uuid not null,site_version int not null,data jsonb not null,fetched_at timestamptz not null default now());
alter table public.weather_sites enable row level security;alter table public.rain_readings enable row level security;alter table public.weather_requests enable row level security;alter table public.weather_cache enable row level security;
revoke all on public.weather_sites,public.rain_readings,public.weather_requests,public.weather_cache from public,anon,authenticated;
create or replace function public.weather_context(p_property uuid default null,p_station text default 'Principal',p_from date default current_date-30,p_to date default current_date) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_from is null or p_to is null or p_from>p_to or p_to-p_from>366 or length(btrim(coalesce(p_station,''))) not between 1 and 80 then raise exception 'Informe estação e período de até 366 dias.';end if;
 if p_property is not null and not exists(select 1 from public.properties where id=p_property and user_id=auth.uid()) then raise exception 'Propriedade indisponível.' using errcode='42501';end if;
 return jsonb_build_object('properties',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name)) from public.properties where user_id=auth.uid() and deleted_at is null),'[]'::jsonb),
 'site',(select to_jsonb(s) from public.weather_sites s where s.property_id=p_property and s.user_id=auth.uid()),
 'cache',(select to_jsonb(c) from public.weather_cache c join public.weather_sites s on s.property_id=c.property_id and s.version=c.site_version where c.property_id=p_property and c.user_id=auth.uid()),
 'rain',coalesce((select jsonb_agg(to_jsonb(r) order by day desc,created_at desc) from (select * from public.rain_readings where user_id=auth.uid() and property_id=p_property and lower(station)=lower(btrim(p_station)) and day between p_from and p_to order by day desc,created_at desc limit 1000) r),'[]'::jsonb),
 'rain_count',(select count(*) from public.rain_readings where user_id=auth.uid() and property_id=p_property and lower(station)=lower(btrim(p_station)) and day between p_from and p_to),
 'rain_total',(select sum(millimeters) from public.rain_readings where user_id=auth.uid() and property_id=p_property and lower(station)=lower(btrim(p_station)) and day between p_from and p_to and voided_at is null),
 'rain_days',(select count(*) from public.rain_readings where user_id=auth.uid() and property_id=p_property and lower(station)=lower(btrim(p_station)) and day between p_from and p_to and voided_at is null));
end;$$;
create or replace function public.weather_command(p_operation uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();request jsonb;op public.workspace_operations%rowtype;result jsonb;r public.rain_readings%rowtype;d date;s public.weather_sites%rowtype;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_action is null or p_action not in ('site','rain','void') or jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>6000 then raise exception 'Operação inválida.';end if;
 perform pg_advisory_xact_lock(hashtext('farm-workspace'),hashtext(u::text));request:=jsonb_build_object('kind','weather','action',p_action,'data',p_data);
 select * into op from public.workspace_operations where user_id=u and operation_id=p_operation;if found then if op.payload is distinct from request then raise exception 'Operação já utilizada.';end if;return op.result;end if;
 if p_action='void' then
  select * into r from public.rain_readings where id=(p_data->>'id')::uuid and user_id=u and voided_at is null for update;
  if not found then raise exception 'Leitura indisponível.' using errcode='42501';end if;
  if length(btrim(coalesce(p_data->>'reason',''))) not between 2 and 1000 then raise exception 'Informe o motivo da anulação.';end if;
  update public.rain_readings set voided_at=now(),void_reason=btrim(p_data->>'reason') where id=r.id;result:=jsonb_build_object('id',r.id);
 else
  if not exists(select 1 from public.properties where id=(p_data->>'property_id')::uuid and user_id=u and deleted_at is null) then raise exception 'Propriedade indisponível.' using errcode='42501';end if;
  if p_action='site' then
   select * into s from public.weather_sites where property_id=(p_data->>'property_id')::uuid for update;
   if coalesce(s.version,0) is distinct from (p_data->>'version')::int then raise exception 'Localização alterada. Atualize a tela.' using errcode='40001';end if;
   if coalesce(p_data->>'latitude','') !~ '^-?[0-9]{1,3}(\.[0-9]{1,6})?$' or coalesce(p_data->>'longitude','') !~ '^-?[0-9]{1,3}(\.[0-9]{1,6})?$' then raise exception 'Informe coordenadas decimais com até seis casas.';end if;
   insert into public.weather_sites(property_id,user_id,latitude,longitude) values((p_data->>'property_id')::uuid,u,(p_data->>'latitude')::numeric,(p_data->>'longitude')::numeric) on conflict(property_id) do update set latitude=excluded.latitude,longitude=excluded.longitude,version=weather_sites.version+1,updated_at=now();
   delete from public.weather_cache where property_id=(p_data->>'property_id')::uuid;result:=jsonb_build_object('ok',true);
  else
   if coalesce(p_data->>'day','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.';end if;d:=(p_data->>'day')::date;if d not between date '1900-01-01' and current_date then raise exception 'A leitura não pode ser futura.';end if;
   if coalesce(p_data->>'millimeters','') !~ '^[0-9]{1,4}(\.[0-9]{1,2})?$' then raise exception 'Chuva inválida.';end if;
   insert into public.rain_readings(id,user_id,property_id,day,station,millimeters,note) values(p_operation,u,(p_data->>'property_id')::uuid,d,btrim(p_data->>'station'),(p_data->>'millimeters')::numeric,coalesce(p_data->>'note',''));result:=jsonb_build_object('id',p_operation);
  end if;
 end if;
 insert into public.workspace_operations(user_id,operation_id,payload,result) values(u,p_operation,request,result);return result;
end;$$;
create or replace function public.weather_prepare(p_property uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.weather_sites%rowtype;c public.weather_cache%rowtype;job uuid;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select * into s from public.weather_sites where property_id=p_property and user_id=auth.uid();if not found then raise exception 'Cadastre a localização meteorológica.';end if;
 perform pg_advisory_xact_lock(hashtext('weather-provider'),0);
 select * into c from public.weather_cache where property_id=p_property and site_version=s.version and fetched_at>now()-interval '2 hours';if found then return jsonb_build_object('cached',true,'data',c.data,'fetched_at',c.fetched_at);end if;
 if exists(select 1 from public.weather_requests where property_id=p_property and created_at>now()-interval '10 minutes') then raise exception 'Aguarde dez minutos antes de outra tentativa de previsão.';end if;
 if (select count(*) from public.weather_requests where user_id=auth.uid() and created_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC')>=300 or (select count(*) from public.weather_requests where created_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC')>=30000 then raise exception 'Franquia mensal de clima atingida.';end if;
 insert into public.weather_requests(user_id,property_id,site_version) values(auth.uid(),s.property_id,s.version) returning id into job;
 return jsonb_build_object('cached',false,'id',job,'latitude',s.latitude,'longitude',s.longitude);
end;$$;
create or replace function public.weather_complete(p_job uuid,p_data jsonb) returns void language plpgsql security definer set search_path='' as $$
declare job public.weather_requests%rowtype;
begin
 select * into job from public.weather_requests where id=p_job and status='pending' for update;if not found then raise exception 'Reserva indisponível.';end if;
 if p_data is null then update public.weather_requests set status='failed' where id=job.id;return;end if;
 if octet_length(p_data::text)>15000 or jsonb_typeof(p_data->'days') is distinct from 'array' or jsonb_array_length(p_data->'days')>7 then raise exception 'Previsão inválida.';end if;
 if not exists(select 1 from public.weather_sites where property_id=job.property_id and version=job.site_version) then raise exception 'Localização foi alterada.';end if;
 insert into public.weather_cache(property_id,user_id,site_version,data) values(job.property_id,job.user_id,job.site_version,p_data) on conflict(property_id) do update set user_id=excluded.user_id,site_version=excluded.site_version,data=excluded.data,fetched_at=now();update public.weather_requests set status='done' where id=job.id;
end;$$;
revoke all on function public.weather_context(uuid,text,date,date),public.weather_command(uuid,text,jsonb),public.weather_prepare(uuid),public.weather_complete(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.weather_context(uuid,text,date,date),public.weather_command(uuid,text,jsonb),public.weather_prepare(uuid) to authenticated;
grant execute on function public.weather_complete(uuid,jsonb) to service_role;
commit;
