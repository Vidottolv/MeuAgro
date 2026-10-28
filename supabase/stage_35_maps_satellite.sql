-- Contornos e base de franquias. Não consulta nem contrata serviços de satélite.
begin;
create or replace function public.geo_measure(g jsonb) returns double precision
language plpgsql immutable set search_path='' as $$
declare pts jsonb; n int; i int; j int; a double precision[]; b double precision[]; c double precision[]; d double precision[]; x double precision; y double precision; cross1 double precision; cross2 double precision; cross3 double precision; cross4 double precision; area double precision:=0; signed_area double precision:=0; minx double precision:=180;maxx double precision:=-180;miny double precision:=85;maxy double precision:=-85;
begin
 if g is null or octet_length(g::text)>30000 or jsonb_typeof(g)<>'object' or coalesce(g->>'type','') not in ('Point','Polygon') then raise exception 'Geometria inválida.'; end if;
 if g->>'type'='Point' then pts:=jsonb_build_array(g->'coordinates'); else
   if jsonb_typeof(g->'coordinates') is distinct from 'array' or jsonb_array_length(g->'coordinates')<>1 then raise exception 'Use polígono simples, sem furos.'; end if;
   pts:=g->'coordinates'->0;
 end if;
 if jsonb_typeof(pts) is distinct from 'array' then raise exception 'Coordenadas inválidas.'; end if;
 n:=jsonb_array_length(pts);
 if (g->>'type'='Point' and n<>1) or (g->>'type'='Polygon' and (n<4 or n>201 or pts->0<>pts->(n-1))) then raise exception 'Polígono deve ter 3 a 200 vértices e estar fechado.'; end if;
 for i in 0..n-1 loop
   if jsonb_typeof(pts->i) is distinct from 'array' or jsonb_array_length(pts->i)<>2 or jsonb_typeof(pts->i->0) is distinct from 'number' or jsonb_typeof(pts->i->1) is distinct from 'number' then raise exception 'Use coordenadas numéricas longitude/latitude.'; end if;
   x:=(pts->i->>0)::double precision;y:=(pts->i->>1)::double precision;
   if abs(x)>180 or abs(y)>85 then raise exception 'Coordenadas fora do intervalo aceito.'; end if;
   minx:=least(minx,x);maxx:=greatest(maxx,x);miny:=least(miny,y);maxy:=greatest(maxy,y);
 end loop;
 if n=1 then return 0; end if;
 if maxx-minx>5 or maxy-miny>5 then raise exception 'Contorno muito extenso ou cruza o antimeridiano.'; end if;
 for i in 0..n-2 loop
   a:=array[(pts->i->>0)::float8,(pts->i->>1)::float8];b:=array[(pts->(i+1)->>0)::float8,(pts->(i+1)->>1)::float8];
   if a=b then raise exception 'Remova vértices repetidos.'; end if;
   signed_area:=signed_area+(a[1]-minx)*(b[2]-miny)-(b[1]-minx)*(a[2]-miny);
   area:=area+radians(b[1]-a[1])*(2+sin(radians(a[2]))+sin(radians(b[2])));
   for j in i+1..n-2 loop
     c:=array[(pts->j->>0)::float8,(pts->j->>1)::float8];d:=array[(pts->(j+1)->>0)::float8,(pts->(j+1)->>1)::float8];
     if i<>j and a=c then raise exception 'Remova vértices repetidos.'; end if;
     if j=i+1 or (i=0 and j=n-2) then continue; end if;
     cross1:=(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]);cross2:=(b[1]-a[1])*(d[2]-a[2])-(b[2]-a[2])*(d[1]-a[1]);
     cross3:=(d[1]-c[1])*(a[2]-c[2])-(d[2]-c[2])*(a[1]-c[1]);cross4:=(d[1]-c[1])*(b[2]-c[2])-(d[2]-c[2])*(b[1]-c[1]);
     if cross1*cross2<=0 and cross3*cross4<=0 and greatest(least(a[1],b[1]),least(c[1],d[1]))<=least(greatest(a[1],b[1]),greatest(c[1],d[1])) and greatest(least(a[2],b[2]),least(c[2],d[2]))<=least(greatest(a[2],b[2]),greatest(c[2],d[2])) then raise exception 'O contorno se cruza ou se toca.'; end if;
   end loop;
 end loop;
 if abs(signed_area)<1e-12 then raise exception 'Polígono sem área útil.'; end if;
 return abs(area)*6371008.8^2/2/10000;
end; $$;
create table if not exists public.geo_versions (
 id uuid primary key default gen_random_uuid(),property_id uuid not null references public.properties(id),area_id uuid references public.areas(id),owner_id uuid not null references auth.users(id),author_id uuid not null references auth.users(id),share_id uuid references public.property_shares(id),
 base_revision uuid, geometry jsonb not null, hectares double precision not null, source text not null check(source in ('map','coordinates','geojson')),reference text not null check(length(reference)<=80),
 status text not null check(status in ('pending','approved','rejected')),created_at timestamptz not null default now(),decided_at timestamptz,decided_by uuid references auth.users(id)
);
create table if not exists public.geo_current (
 property_id uuid not null references public.properties(id),target uuid not null,revision uuid not null references public.geo_versions(id),primary key(property_id,target)
);
create index if not exists geo_versions_target on public.geo_versions(property_id,area_id,created_at desc);
alter table public.geo_versions enable row level security;alter table public.geo_current enable row level security;
revoke all on public.geo_versions,public.geo_current from public,anon,authenticated;
create or replace function public.geo_context(p_property uuid,p_area uuid default null,p_share uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.properties%rowtype; rev uuid;
begin
 select * into p from public.properties where id=p_property and deleted_at is null and coalesce(to_jsonb(properties)->>'status','active')<>'archived';
 if not found or u is null then raise exception 'Propriedade indisponível.' using errcode='42501'; end if;
 if p.user_id<>u and not exists(select 1 from public.property_shares s join public.commerce_accounts a on a.user_id=u and a.enabled where s.id=p_share and s.property_id=p.id and s.owner_id=p.user_id and s.consultant_id=u and s.status='active') then raise exception 'Compartilhamento indisponível ou revogado.' using errcode='42501'; end if;
 if p_area is not null and not exists(select 1 from public.areas a where a.id=p_area and a.property_id=p.id and a.user_id=p.user_id and a.deleted_at is null and coalesce(to_jsonb(a)->>'status','active')<>'archived') then raise exception 'Talhão indisponível.'; end if;
 select revision into rev from public.geo_current where property_id=p.id and target=coalesce(p_area,'00000000-0000-0000-0000-000000000000'::uuid);
 return jsonb_build_object('property',jsonb_build_object('id',p.id,'name',p.name,'owner_id',p.user_id),'areas',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select jsonb_build_object('id',a.id,'name',to_jsonb(a)->>'name') x from public.areas a where a.property_id=p.id and a.user_id=p.user_id and a.deleted_at is null and coalesce(to_jsonb(a)->>'status','active')<>'archived' order by a.id limit 1000) r),
 'property_boundary',(select v.geometry from public.geo_current c join public.geo_versions v on v.id=c.revision where c.property_id=p.id and c.target='00000000-0000-0000-0000-000000000000'::uuid),
 'current',(select to_jsonb(v) from public.geo_versions v where v.id=rev),
 'versions',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select to_jsonb(v) x from public.geo_versions v where v.property_id=p.id and v.area_id is not distinct from p_area and (v.status='approved' or p.user_id=u or v.author_id=u) order by v.created_at desc,v.id desc limit 50) r));
end; $$;
create or replace function public.geo_command(p_action text,p_data jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare ctx jsonb; pid uuid; aid uuid; sid uuid; rev uuid; expected uuid; owner uuid; u uuid:=auth.uid(); v public.geo_versions%rowtype; g jsonb; ha float8;
begin
 pid:=(p_data->>'property_id')::uuid;aid:=nullif(p_data->>'area_id','')::uuid;sid:=nullif(p_data->>'share_id','')::uuid;
 ctx:=public.geo_context(pid,aid,sid);owner:=(ctx->'property'->>'owner_id')::uuid;
 perform pg_advisory_xact_lock(hashtext(pid::text),hashtext(coalesce(aid::text,'property')));
 if owner<>u then
   perform 1 from public.property_shares where id=sid and property_id=pid and owner_id=owner and consultant_id=u and status='active' for share;
   if not found then raise exception 'O vínculo do consultor foi revogado.' using errcode='42501'; end if;
 end if;
 select revision into rev from public.geo_current where property_id=pid and target=coalesce(aid,'00000000-0000-0000-0000-000000000000'::uuid);
 if p_action='save' then
   expected:=nullif(p_data->>'base_revision','')::uuid;
   if expected is distinct from rev then raise exception 'Contorno alterado por outra pessoa. Atualize antes de salvar.'; end if;
   g:=p_data->'geometry';ha:=public.geo_measure(g);
   if ha>1000000 then raise exception 'Contorno acima de um milhão de hectares. Divida a área.'; end if;
   insert into public.geo_versions(property_id,area_id,owner_id,author_id,share_id,base_revision,geometry,hectares,source,reference,status,decided_at,decided_by)
   values(pid,aid,owner,u,case when owner=u then null else sid end,rev,g,ha,p_data->>'source',coalesce(p_data->>'reference','WGS84'),case when owner=u then 'approved' else 'pending' end,case when owner=u then now() end,case when owner=u then u end) returning * into v;
 elsif p_action in ('approve','reject') then
   if owner<>u then raise exception 'Somente o produtor pode decidir uma proposta.' using errcode='42501'; end if;
   select * into v from public.geo_versions where id=(p_data->>'id')::uuid and property_id=pid and area_id is not distinct from aid for update;
   if not found or v.status<>'pending' then raise exception 'Proposta indisponível.'; end if;
   if p_action='approve' then
     if v.base_revision is distinct from rev then raise exception 'Proposta baseada em contorno antigo. Solicite nova proposta.'; end if;
     perform 1 from public.property_shares where id=v.share_id and status='active' and owner_id=u and consultant_id=v.author_id and property_id=pid for share;
     if not found or not exists(select 1 from public.commerce_accounts where user_id=v.author_id and enabled) then raise exception 'O vínculo do consultor foi revogado.'; end if;
   end if;
   update public.geo_versions set status=case when p_action='approve' then 'approved' else 'rejected' end,decided_at=now(),decided_by=u where id=v.id returning * into v;
 else raise exception 'Ação inválida.'; end if;
 if v.status='approved' then insert into public.geo_current(property_id,target,revision) values(pid,coalesce(aid,'00000000-0000-0000-0000-000000000000'::uuid),v.id) on conflict(property_id,target) do update set revision=excluded.revision; end if;
 return v.id;
end; $$;

-- Franquias são provisionadas somente pelo backend administrativo. Não são preços publicados.
create table if not exists public.satellite_entitlements(user_id uuid primary key references auth.users(id),enabled boolean not null default false,max_fields int not null check(max_fields between 0 and 10000),max_field_ha numeric not null check(max_field_ha>0),requests_month int not null check(requests_month>=0),pu_month numeric not null check(pu_month>=0));
create table if not exists public.satellite_fields(user_id uuid not null references auth.users(id),area_id uuid not null references public.areas(id),primary key(user_id,area_id));
create table if not exists public.satellite_usage(scope text not null,month date not null,requests int not null default 0,pu numeric not null default 0,primary key(scope,month));
create table if not exists public.satellite_platform_limits(id boolean primary key default true check(id),enabled boolean not null default false,requests_month int not null check(requests_month>=0),pu_month numeric not null check(pu_month>=0));
insert into public.satellite_platform_limits values(true,false,0,0) on conflict do nothing;
create table if not exists public.satellite_reservations(id uuid primary key,user_id uuid not null references auth.users(id),area_id uuid not null references public.areas(id),revision uuid not null references public.geo_versions(id),month date not null,requests int not null,pu numeric not null,created_at timestamptz not null default now());
alter table public.satellite_entitlements enable row level security;alter table public.satellite_fields enable row level security;alter table public.satellite_usage enable row level security;alter table public.satellite_platform_limits enable row level security;alter table public.satellite_reservations enable row level security;
revoke all on public.satellite_entitlements,public.satellite_fields,public.satellite_usage,public.satellite_platform_limits,public.satellite_reservations from public,anon,authenticated;
create or replace function public.satellite_status() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('entitlement',(select to_jsonb(e) from public.satellite_entitlements e where user_id=auth.uid()),'usage',(select to_jsonb(s) from public.satellite_usage s where scope=auth.uid()::text and month=date_trunc('month',now() at time zone 'UTC')::date),'fields',(select coalesce(jsonb_agg(area_id),'[]'::jsonb) from public.satellite_fields where user_id=auth.uid()),'provider_ready',false) where auth.uid() is not null;
$$;
create or replace function public.satellite_field(p_area uuid,p_enabled boolean) returns void language plpgsql security definer set search_path='' as $$
declare e public.satellite_entitlements%rowtype; v public.geo_versions%rowtype; u uuid:=auth.uid();
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtext('satellite-fields'),hashtext(u::text));
 if not p_enabled then delete from public.satellite_fields where user_id=u and area_id=p_area;return;end if;
 select * into e from public.satellite_entitlements where user_id=u and enabled;
 if not found then raise exception 'Não há pacote de satélite ativo. Nenhuma cobrança foi realizada.'; end if;
 select v1.* into v from public.geo_versions v1 join public.geo_current c on c.revision=v1.id join public.areas a on a.id=p_area join public.properties p on p.id=a.property_id where c.target=p_area and c.property_id=a.property_id and a.user_id=u and p.user_id=u and a.deleted_at is null and p.deleted_at is null and coalesce(to_jsonb(a)->>'status','active')<>'archived' and coalesce(to_jsonb(p)->>'status','active')<>'archived';
 if not found or v.geometry->>'type'<>'Polygon' or v.hectares>e.max_field_ha then raise exception 'Talhão precisa de polígono aprovado dentro do limite de área do pacote.'; end if;
 if not exists(select 1 from public.satellite_fields where user_id=u and area_id=p_area) and (select count(*) from public.satellite_fields where user_id=u)>=e.max_fields then raise exception 'Limite de talhões do pacote atingido.'; end if;
 insert into public.satellite_fields values(u,p_area) on conflict do nothing;
end; $$;
-- Somente um worker de confiança pode reservar custos. Não faz chamadas ao provedor.
create or replace function public.satellite_reserve(p_id uuid,p_user uuid,p_area uuid,p_revision uuid,p_requests int,p_pu numeric) returns uuid
language plpgsql security definer set search_path='' as $$
declare e public.satellite_entitlements%rowtype;l public.satellite_platform_limits%rowtype;r public.satellite_reservations%rowtype;v public.geo_versions%rowtype;s text;m date:=date_trunc('month',now() at time zone 'UTC')::date; req int; pu numeric;
begin
 if p_id is null or p_user is null or p_requests is null or p_requests<1 or p_pu is null or p_pu<=0 or p_pu::text in ('NaN','Infinity','-Infinity') then raise exception 'Reserva inválida.'; end if;
 perform pg_advisory_xact_lock(hashtext('satellite-budget'),0);
 select * into r from public.satellite_reservations where id=p_id;
 if found then
   if r.user_id<>p_user or r.area_id<>p_area or r.revision<>p_revision or r.requests<>p_requests or r.pu<>p_pu then raise exception 'Identificador de reserva já utilizado.'; end if;
   return r.id;
 end if;
 select * into l from public.satellite_platform_limits where id=true and enabled;
 if not found then raise exception 'Integração de imagens ainda não ativada.'; end if;
 select * into e from public.satellite_entitlements where user_id=p_user and enabled;
 if not found or not exists(select 1 from public.satellite_fields where user_id=p_user and area_id=p_area) then raise exception 'Talhão sem monitoramento autorizado.'; end if;
 select g.* into v from public.geo_versions g join public.geo_current c on c.revision=g.id join public.areas a on a.id=p_area join public.properties p on p.id=a.property_id where c.target=p_area and c.property_id=a.property_id and a.user_id=p_user and p.user_id=p_user and a.deleted_at is null and p.deleted_at is null and coalesce(to_jsonb(a)->>'status','active')<>'archived' and coalesce(to_jsonb(p)->>'status','active')<>'archived';
 if not found or v.id is distinct from p_revision or v.geometry->>'type'<>'Polygon' or v.hectares>e.max_field_ha or (select count(*) from public.satellite_fields where user_id=p_user)>e.max_fields then raise exception 'Contorno ou limite do pacote mudou. Revise o monitoramento.'; end if;
 foreach s in array array['platform',p_user::text] loop
   insert into public.satellite_usage(scope,month) values(s,m) on conflict do nothing;
   select requests, satellite_usage.pu into req,pu from public.satellite_usage where scope=s and month=m;
   if req+p_requests>(case when s='platform' then l.requests_month else e.requests_month end) or pu+p_pu>(case when s='platform' then l.pu_month else e.pu_month end) then raise exception 'Franquia de requisições ou processamento atingida.'; end if;
   update public.satellite_usage set requests=requests+p_requests,pu=satellite_usage.pu+p_pu where scope=s and month=m;
 end loop;
 insert into public.satellite_reservations values(p_id,p_user,p_area,p_revision,m,p_requests,p_pu,now());return p_id;
end; $$;
revoke all on function public.geo_measure(jsonb),public.geo_context(uuid,uuid,uuid),public.geo_command(text,jsonb),public.satellite_status(),public.satellite_field(uuid,boolean),public.satellite_reserve(uuid,uuid,uuid,uuid,int,numeric) from public,anon,authenticated;
grant execute on function public.geo_context(uuid,uuid,uuid),public.geo_command(text,jsonb),public.satellite_status(),public.satellite_field(uuid,boolean) to authenticated;
grant execute on function public.satellite_reserve(uuid,uuid,uuid,uuid,int,numeric) to service_role;
commit;
