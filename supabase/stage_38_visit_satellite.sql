-- Requer etapas 33, 35 e 36. Metadados históricos; não amplia acesso às imagens.
begin;
alter table public.technical_visits add column if not exists satellite_reference jsonb;
create or replace function public.sync_visit_operation(p_user uuid,p_operation uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); v jsonb:=p_payload->'visit'; p jsonb; vid uuid; sid uuid; pid uuid; aid uuid; cid uuid; cycle_id uuid;
  previous public.technical_visit_operations%rowtype; parent public.technical_visits%rowtype;
  k text; value jsonb; res jsonb; photos jsonb; ref jsonb; img public.satellite_images%rowtype;
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
    ref:=null;
    if v->'satellite_reference' is not null and v->'satellite_reference'<>'null'::jsonb then
      if jsonb_typeof(v->'satellite_reference')<>'object' or length(coalesce(v->'satellite_reference'->>'note',''))>2000 then raise exception 'Referência de satélite inválida.';end if;
      select i.* into img from public.satellite_images i join public.areas a on a.id=i.area_id join public.properties p on p.id=a.property_id
      where i.id=(v->'satellite_reference'->>'image_id')::uuid and i.user_id=u and i.status='ready' and a.id=aid and a.property_id=pid and a.user_id=u and p.user_id=u and a.deleted_at is null and p.deleted_at is null;
      if not found then raise exception 'Selecione uma imagem disponível do talhão desta visita, pertencente à sua conta.' using errcode='42501';end if;
      -- Historical metadata only: linking never grants access to private image bytes.
      ref:=jsonb_build_object('image_id',img.id,'property_id',pid,'area_id',aid,'day',img.day,'layer',img.layer,'revision',img.revision,'acquisition_at',img.metadata->'acquisition_at','scene_cloud_percent',img.metadata->'scene_cloud_percent','resolution_m',img.metadata->'resolution_m','source',img.metadata->'source','note',coalesce(v->'satellite_reference'->>'note',''));
    end if;
    insert into public.technical_visits(id,author_id,technician_name,seller_id,property_id,area_id,crop_id,production_cycle_id,producer_name,site_name,area_name,crop_name,visited_at,next_visit,priority,anamnesis,satellite_reference)
    values(vid,u,coalesce(nullif(btrim((select display_name from public.commerce_accounts where user_id=u)),''),(select email from auth.users where id=u),'Profissional'),sid,pid,aid,cid,cycle_id,btrim(v->>'producer_name'),btrim(v->>'site_name'),coalesce(v->>'area_name',''),coalesce(v->>'crop_name',''),(v->>'visited_at')::timestamptz,nullif(v->>'next_visit','')::date,v->>'priority',v->'anamnesis',ref);
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
