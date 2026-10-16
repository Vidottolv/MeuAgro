-- Requer as migrações comerciais/gerenciais e o offline da etapa 31.
begin;
create table if not exists public.technical_visits (
  id uuid primary key, author_id uuid not null references auth.users(id),
  technician_name text not null check(length(technician_name) between 1 and 254),
  seller_id uuid references public.commerce_sellers(id),
  property_id uuid references public.properties(id), area_id uuid references public.areas(id),
  crop_id uuid references public.crops(id), production_cycle_id uuid references public.production_cycles(id),
  producer_name text not null check(length(btrim(producer_name)) between 2 and 120),
  site_name text not null check(length(btrim(site_name)) between 2 and 160),
  area_name text not null default '' check(length(area_name)<=160),
  crop_name text not null default '' check(length(crop_name)<=120),
  visited_at timestamptz not null, next_visit date,
  priority text not null check(priority in ('low','medium','high','urgent')),
  anamnesis jsonb not null check(jsonb_typeof(anamnesis)='object'),
  created_at timestamptz not null default now()
);
create index if not exists technical_visits_author_date on public.technical_visits(author_id,visited_at desc);
create index if not exists technical_visits_company_date on public.technical_visits(seller_id,visited_at desc);
create table if not exists public.technical_visit_photos (
  id uuid primary key, visit_id uuid not null references public.technical_visits(id),
  author_id uuid not null references auth.users(id), storage_path text not null unique,
  description text not null default '' check(length(description)<=1600), created_at timestamptz not null default now()
);
create index if not exists technical_visit_photos_parent on public.technical_visit_photos(visit_id);
create table if not exists public.technical_visit_operations (
  user_id uuid not null references auth.users(id), operation_id uuid not null,
  payload jsonb not null, result jsonb not null, primary key(user_id,operation_id)
);
create or replace function public.technical_visit_can_read(p_visit uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.technical_visits v where v.id=p_visit and (
    (v.seller_id is null and v.author_id=auth.uid()) or
    (v.seller_id is not null and public.trade_agent_active(v.seller_id,auth.uid()) and
      (v.author_id=auth.uid() or public.commerce_can_manage(v.seller_id)))
  ));
$$;
alter table public.technical_visits enable row level security;
alter table public.technical_visit_photos enable row level security;
alter table public.technical_visit_operations enable row level security;
revoke all on public.technical_visits,public.technical_visit_photos,public.technical_visit_operations from public,anon,authenticated;
grant select on public.technical_visits,public.technical_visit_photos to authenticated;
drop policy if exists technical_visits_read on public.technical_visits;
create policy technical_visits_read on public.technical_visits for select to authenticated using(public.technical_visit_can_read(id));
drop policy if exists technical_visit_photos_read on public.technical_visit_photos;
create policy technical_visit_photos_read on public.technical_visit_photos for select to authenticated using(public.technical_visit_can_read(visit_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('meu-agro-visit-photos','meu-agro-visit-photos',false,8388608,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
drop policy if exists visit_photos_upload on storage.objects;
create policy visit_photos_upload on storage.objects for insert to authenticated with check(bucket_id='meu-agro-visit-photos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists visit_photos_download on storage.objects;
create or replace function public.technical_visit_photo_can_read(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.technical_visit_photos p where p.storage_path=p_path and public.technical_visit_can_read(p.visit_id)) or
    (split_part(p_path,'/',1)=auth.uid()::text and not exists(select 1 from public.technical_visit_photos p where p.storage_path=p_path));
$$;
revoke all on function public.technical_visit_photo_can_read(text) from public,anon;
grant execute on function public.technical_visit_photo_can_read(text) to authenticated;
create policy visit_photos_download on storage.objects for select to authenticated using(bucket_id='meu-agro-visit-photos' and public.technical_visit_photo_can_read(name));

create or replace function public.sync_visit_operation(p_user uuid,p_operation uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); v jsonb:=p_payload->'visit'; p jsonb; vid uuid; sid uuid; pid uuid; aid uuid; cid uuid; cycle_id uuid;
  previous public.technical_visit_operations%rowtype; parent public.technical_visits%rowtype;
  k text; value jsonb; res jsonb; photos jsonb;
begin
  if u is null or u is distinct from p_user or p_operation is null then raise exception 'Entre na conta que registrou a visita.' using errcode='42501'; end if;
  if p_payload is null or coalesce(p_payload->>'kind','') not in ('visit','visit_photo') or octet_length(p_payload::text)>80000 then raise exception 'Operação de visita inválida.'; end if;
  perform pg_advisory_xact_lock(hashtext(u::text),hashtext(p_operation::text));
  select * into previous from public.technical_visit_operations where user_id=u and operation_id=p_operation;
  if found then
    if previous.payload is distinct from p_payload then raise exception 'Operação já utilizada para outros dados.'; end if;
    return previous.result;
  end if;
  if p_payload->>'kind'='visit' then
    vid:=(v->>'id')::uuid; sid:=nullif(v->>'seller_id','')::uuid;
    pid:=nullif(v->>'property_id','')::uuid; aid:=nullif(v->>'area_id','')::uuid;
    cid:=nullif(v->>'crop_id','')::uuid; cycle_id:=nullif(v->>'production_cycle_id','')::uuid;
    if vid is distinct from p_operation then raise exception 'Identificador de visita inválido.'; end if;
    if sid is not null and (not public.trade_agent_active(sid,u) or not exists(select 1 from public.commerce_sellers where id=sid and kind='company')) then raise exception 'Seu vínculo com esta empresa não está ativo. A visita foi preservada no dispositivo.' using errcode='42501'; end if;
    -- Link only records already owned by the author. Text names cover external farms;
    -- commercial relationships never grant access to a producer's agricultural records.
    if pid is not null and not exists(select 1 from public.properties where id=pid and user_id=u and deleted_at is null) then raise exception 'Propriedade indisponível para sua conta.' using errcode='42501'; end if;
    if aid is not null and not exists(select 1 from public.areas where id=aid and user_id=u and property_id=pid and deleted_at is null) then raise exception 'Talhão inválido para esta propriedade.'; end if;
    if cid is not null and not exists(select 1 from public.crops where id=cid and (is_system or user_id=u) and active) then raise exception 'Cultura indisponível.'; end if;
    if cycle_id is not null and not exists(select 1 from public.production_cycles where id=cycle_id and user_id=u and property_id=pid and area_id=aid and crop_id=cid and deleted_at is null) then raise exception 'Plantio incompatível com propriedade, talhão ou cultura.'; end if;
    if coalesce(jsonb_typeof(v->'anamnesis'),'')<>'object' or length(btrim(coalesce(v->'anamnesis'->>'reason','')))=0 then raise exception 'Informe o motivo da visita.'; end if;
    for k,value in select * from jsonb_each(v->'anamnesis') loop
      if k not in ('reason','producer_report','symptoms','history','previous_treatments','soil','weather','assessment','recommendations','followup') or jsonb_typeof(value)<>'string' or length(value#>>'{}')>4000 then raise exception 'Campos da anamnese inválidos.'; end if;
    end loop;
    if nullif(v->>'next_visit','')::date < ((v->>'visited_at')::timestamptz at time zone 'America/Sao_Paulo')::date then raise exception 'O retorno não pode ser anterior à visita.'; end if;
    insert into public.technical_visits(id,author_id,technician_name,seller_id,property_id,area_id,crop_id,production_cycle_id,producer_name,site_name,area_name,crop_name,visited_at,next_visit,priority,anamnesis)
    values(vid,u,coalesce(nullif(btrim((select display_name from public.commerce_accounts where user_id=u)),''),(select email from auth.users where id=u),'Profissional'),sid,pid,aid,cid,cycle_id,btrim(v->>'producer_name'),btrim(v->>'site_name'),coalesce(v->>'area_name',''),coalesce(v->>'crop_name',''),(v->>'visited_at')::timestamptz,nullif(v->>'next_visit','')::date,v->>'priority',v->'anamnesis');
    photos:=coalesce(p_payload->'photos','[]'::jsonb);
  else
    p:=p_payload->'photo'; vid:=(p->>'visit_id')::uuid;
    select * into parent from public.technical_visits where id=vid for share;
    if not found or parent.author_id<>u or not public.technical_visit_can_read(vid) then raise exception 'Somente o autor com acesso à visita pode adicionar fotos.' using errcode='42501'; end if;
    if (p->>'id')::uuid is distinct from p_operation then raise exception 'Identificador de foto inválido.'; end if;
    photos:=jsonb_build_array(p);
  end if;
  if jsonb_typeof(photos)<>'array' then raise exception 'Lista de fotos inválida.'; end if;
  if jsonb_array_length(photos)>5 then raise exception 'Adicione até cinco fotos por envio.'; end if;
  for p in select * from jsonb_array_elements(photos) loop
    if (p->>'visit_id')::uuid is distinct from vid or coalesce(p->>'storage_path','') !~ ('^'||u::text||'/'||vid::text||'/'||coalesce(p->>'id','INVALID')||'\.(jpg|png|webp)$')
      or length(coalesce(p->>'description',''))>1600 then raise exception 'Dados da foto de visita inválidos.'; end if;
    if not exists(select 1 from storage.objects where bucket_id='meu-agro-visit-photos' and name=p->>'storage_path') then raise exception 'Envie a foto antes de confirmar a visita.'; end if;
    insert into public.technical_visit_photos(id,visit_id,author_id,storage_path,description)
      values((p->>'id')::uuid,vid,u,p->>'storage_path',coalesce(p->>'description',''));
  end loop;
  res:=jsonb_build_object('id',p_operation,'visit_id',vid,'synced',true);
  insert into public.technical_visit_operations(user_id,operation_id,payload,result) values(u,p_operation,p_payload,res);
  return res;
end;
$$;
revoke all on function public.technical_visit_can_read(uuid),public.sync_visit_operation(uuid,uuid,jsonb) from public,anon;
grant execute on function public.technical_visit_can_read(uuid),public.sync_visit_operation(uuid,uuid,jsonb) to authenticated;
commit;
