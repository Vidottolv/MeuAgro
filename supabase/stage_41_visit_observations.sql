-- Requer etapas 38, 39 e 40. Observações por talhão e vínculo explícito de tarefas.
begin;
alter table public.technical_visits add column if not exists field_observations jsonb not null default '[]'::jsonb;
alter table public.technical_tasks add column if not exists observation_id uuid;
create or replace function public.visit_observations_validate(p_items jsonb,p_user uuid,p_property uuid,p_day date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare x jsonb;result jsonb:='[]'::jsonb;seen uuid[]:=array[]::uuid[];key uuid;aid uuid;cid uuid;area_name text;crop_name text;due date;
begin
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>20 then raise exception 'Adicione até 20 observações por visita.';end if;
 for x in select value from jsonb_array_elements(p_items) loop
   if jsonb_typeof(x) is distinct from 'object' then raise exception 'Observação inválida.';end if;
   key:=(x->>'id')::uuid;aid:=nullif(x->>'area_id','')::uuid;cid:=nullif(x->>'crop_id','')::uuid;
   if key is null or key=any(seen) then raise exception 'Identificador inválido ou duplicado nas observações.';end if;
   seen:=array_append(seen,key);area_name:=btrim(coalesce(x->>'area_name',''));crop_name:=btrim(coalesce(x->>'crop_name',''));
   if length(area_name) not between 2 and 160 or length(crop_name)>120 or jsonb_typeof(x->'observation') is distinct from 'string' or length(btrim(x->>'observation')) not between 2 and 2000 or jsonb_typeof(x->'recommendation') is distinct from 'string' or length(x->>'recommendation')>2000 or coalesce(x->>'priority','') not in ('low','medium','high','urgent') then raise exception 'Confira talhão, cultura, textos e prioridade da observação.';end if;
   if aid is not null then
     select coalesce(nullif(to_jsonb(a)->>'name',''),area_name) into area_name from public.areas a where a.id=aid and a.user_id=p_user and a.property_id=p_property and a.deleted_at is null;
     if not found then raise exception 'Talhão da observação não pertence à propriedade da visita.' using errcode='42501';end if;
   end if;
   if cid is not null then
     select coalesce(nullif(to_jsonb(c)->>'name',''),crop_name) into crop_name from public.crops c where c.id=cid and (c.is_system or c.user_id=p_user) and c.active;
     if not found then raise exception 'Cultura indisponível na observação.' using errcode='42501';end if;
   end if;
   due:=nullif(x->>'next_visit','')::date;
   if due is not null and (not isfinite(due) or due<p_day) then raise exception 'O retorno da observação deve ser igual ou posterior à visita.';end if;
   result:=result||jsonb_build_array(jsonb_build_object('id',key,'area_id',aid,'crop_id',cid,'area_name',area_name,'crop_name',crop_name,'observation',btrim(x->>'observation'),'recommendation',btrim(x->>'recommendation'),'priority',x->>'priority','next_visit',due));
 end loop;return result;
end;$$;
create or replace function public.sync_visit_operation(p_user uuid,p_operation uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); v jsonb:=p_payload->'visit'; p jsonb; vid uuid; sid uuid; pid uuid; aid uuid; cid uuid; cycle_id uuid;
  previous public.technical_visit_operations%rowtype; parent public.technical_visits%rowtype;
  k text; value jsonb; res jsonb; photos jsonb; observations jsonb; ref jsonb; img public.satellite_images%rowtype;
begin
  if u is null or u is distinct from p_user or p_operation is null then raise exception 'Entre na conta que registrou a visita.' using errcode='42501'; end if;
  if p_payload is null or coalesce(p_payload->>'kind','') not in ('visit','visit_photo') or octet_length(p_payload::text)>200000 then raise exception 'Operação de visita inválida.'; end if;
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
    observations:=public.visit_observations_validate(coalesce(v->'field_observations','[]'::jsonb),u,pid,((v->>'visited_at')::timestamptz at time zone 'America/Sao_Paulo')::date);
    ref:=null;
    if v->'satellite_reference' is not null and v->'satellite_reference'<>'null'::jsonb then
      if jsonb_typeof(v->'satellite_reference')<>'object' or length(coalesce(v->'satellite_reference'->>'note',''))>2000 then raise exception 'Referência de satélite inválida.';end if;
      select i.* into img from public.satellite_images i join public.areas a on a.id=i.area_id join public.properties p on p.id=a.property_id
      where i.id=(v->'satellite_reference'->>'image_id')::uuid and i.user_id=u and i.status='ready' and a.id=aid and a.property_id=pid and a.user_id=u and p.user_id=u and a.deleted_at is null and p.deleted_at is null;
      if not found then raise exception 'Selecione uma imagem disponível do talhão desta visita, pertencente à sua conta.' using errcode='42501';end if;
      -- Historical metadata only: linking never grants access to private image bytes.
      ref:=jsonb_build_object('image_id',img.id,'property_id',pid,'area_id',aid,'day',img.day,'layer',img.layer,'revision',img.revision,'acquisition_at',img.metadata->'acquisition_at','scene_cloud_percent',img.metadata->'scene_cloud_percent','resolution_m',img.metadata->'resolution_m','source',img.metadata->'source','note',coalesce(v->'satellite_reference'->>'note',''));
    end if;
    insert into public.technical_visits(id,author_id,technician_name,seller_id,property_id,area_id,crop_id,production_cycle_id,producer_name,site_name,area_name,crop_name,visited_at,next_visit,priority,anamnesis,satellite_reference,field_observations)
    values(vid,u,coalesce(nullif(btrim((select display_name from public.commerce_accounts where user_id=u)),''),(select email from auth.users where id=u),'Profissional'),sid,pid,aid,cid,cycle_id,btrim(v->>'producer_name'),btrim(v->>'site_name'),coalesce(v->>'area_name',''),coalesce(v->>'crop_name',''),(v->>'visited_at')::timestamptz,nullif(v->>'next_visit','')::date,v->>'priority',v->'anamnesis',ref,observations);
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

create or replace function public.technical_task_context(p_visit uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v public.technical_visits%rowtype;manage boolean;
begin
 if auth.uid() is null or not public.technical_visit_can_read(p_visit) then raise exception 'Visita indisponível para criar tarefas.' using errcode='42501';end if;
 select * into v from public.technical_visits where id=p_visit;
 manage:=v.seller_id is not null and public.commerce_can_manage(v.seller_id);
 return jsonb_build_object('collaboration_version',40,'observations_version',41,'can_create',v.author_id=auth.uid() or manage,'can_assign',manage,'next_visit',v.next_visit,'seller_id',v.seller_id,
 'people',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'name',coalesce(nullif(c.display_name,''),a.email,'Profissional')) order by a.id),'[]'::jsonb)
 from auth.users a left join public.commerce_accounts c on c.user_id=a.id where a.id=auth.uid() or (manage and public.trade_agent_active(v.seller_id,a.id))));
end;$$;

create or replace function public.technical_task_command(p_operation uuid,p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();t public.technical_tasks%rowtype;v public.technical_visits%rowtype;
 previous public.technical_task_operations%rowtype;target_id uuid;who uuid;manage boolean;editable boolean;payload jsonb;result jsonb;checks jsonb;item jsonb;found_item boolean;comment_body text;source_observation jsonb;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_action is null or p_action not in ('create','update','check','comment') or jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>16000 then raise exception 'Operação de tarefa inválida.';end if;
 payload:=jsonb_build_object('action',p_action,'data',p_data);
 perform pg_advisory_xact_lock(hashtext('technical-task-operation'),hashtext(u::text||p_operation::text));
 select * into previous from public.technical_task_operations where user_id=u and operation_id=p_operation;
 if found then
   if previous.payload is distinct from payload then raise exception 'Identificador já usado para outra operação.';end if;
   if not public.technical_task_can_read((previous.result->>'id')::uuid) then raise exception 'Tarefa indisponível.' using errcode='42501';end if;
   return previous.result;
 end if;
 if p_action='create' then
   select * into v from public.technical_visits where id=(p_data->>'visit_id')::uuid;
   if not found or not public.technical_visit_can_read(v.id) then raise exception 'Sincronize a visita e confira sua permissão antes de criar tarefas.' using errcode='42501';end if;
   manage:=v.seller_id is not null and public.commerce_can_manage(v.seller_id);
   if v.author_id<>u and not manage then raise exception 'Somente o autor ou a gestão pode criar tarefas.' using errcode='42501';end if;
   who:=coalesce(nullif(p_data->>'assigned_to','')::uuid,u);
   if (v.seller_id is null and who<>u) or (v.seller_id is not null and (not public.trade_agent_active(v.seller_id,who) or (who<>u and not manage))) then raise exception 'Responsável não autorizado para esta tarefa.' using errcode='42501';end if;
   source_observation:=null;
   if nullif(p_data->>'observation_id','') is not null then
     select x into source_observation from jsonb_array_elements(v.field_observations) x where x->>'id'=p_data->>'observation_id' limit 1;
     if source_observation is null then raise exception 'Observação indisponível nesta visita.';end if;
   end if;
   checks:=public.technical_task_checklist(coalesce(p_data->'checklist','[]'::jsonb));
   target_id:=p_operation;
   insert into public.technical_tasks(id,visit_id,seller_id,created_by,assigned_to,title,description,due_date,priority,site_name,area_name,producer_name,checklist,observation_id)
   values(target_id,v.id,v.seller_id,u,who,btrim(p_data->>'title'),coalesce(p_data->>'description',''),(p_data->>'due_date')::date,p_data->>'priority',v.site_name,coalesce(source_observation->>'area_name',v.area_name),v.producer_name,checks,nullif(p_data->>'observation_id','')::uuid) returning * into t;
 else
   target_id:=(p_data->>'id')::uuid;
   select * into t from public.technical_tasks where technical_tasks.id=target_id for update;
   if not found or not public.technical_task_can_read(target_id) then raise exception 'Tarefa indisponível.' using errcode='42501';end if;
   if p_action='comment' then
     if jsonb_typeof(p_data->'body') is distinct from 'string' then raise exception 'Informe um comentário em texto.';end if;
     comment_body:=btrim(p_data->>'body');
     if length(comment_body)<1 or length(comment_body)>2000 then raise exception 'O comentário deve ter de 1 a 2.000 caracteres.';end if;
     insert into public.technical_task_comments(id,task_id,author_id,body) values(p_operation,t.id,u,comment_body);
   else
   if (p_data->>'version')::int is distinct from t.version then raise exception 'Esta tarefa mudou. Atualize a lista antes de salvar.' using errcode='40001';end if;
   if p_action='check' then
     if t.status not in ('pending','doing') then raise exception 'Reabra a tarefa antes de alterar o checklist.';end if;
     if jsonb_typeof(p_data->'done') is distinct from 'boolean' then raise exception 'Situação do item inválida.';end if;
     checks:='[]'::jsonb;found_item:=false;
     for item in select value from jsonb_array_elements(t.checklist) loop
       if item->>'id'=p_data->>'item_id' then item:=jsonb_set(item,'{done}',p_data->'done');found_item:=true;end if;
       checks:=checks||jsonb_build_array(item);
     end loop;
     if not found_item then raise exception 'Item indisponível. Atualize a tarefa.';end if;
     update public.technical_tasks set checklist=checks,version=t.version+1,updated_at=now() where technical_tasks.id=target_id returning * into t;
   else
   manage:=t.seller_id is not null and public.commerce_can_manage(t.seller_id);editable:=t.created_by=u or manage;
   if not editable and (p_data ? 'title' or p_data ? 'description' or p_data ? 'due_date' or p_data ? 'priority' or p_data ? 'assigned_to' or p_data ? 'checklist') then raise exception 'Você pode atualizar a situação, mas não editar os dados da tarefa.' using errcode='42501';end if;
   who:=case when p_data ? 'assigned_to' then (p_data->>'assigned_to')::uuid else t.assigned_to end;
   if who is null or (who is distinct from t.assigned_to and (not manage or not public.trade_agent_active(t.seller_id,who))) then raise exception 'Somente a gestão pode atribuir a tarefa a outro integrante ativo.' using errcode='42501';end if;
   if p_data ? 'status' and (p_data->>'status' is null or p_data->>'status' not in ('pending','doing','done','cancelled')) then raise exception 'Situação inválida.';end if;
   if coalesce(p_data->>'status',t.status) in ('done','cancelled') and length(btrim(coalesce(p_data->>'outcome',t.outcome)))<2 then raise exception 'Registre o resultado ou o motivo do encerramento.';end if;
   checks:=case when p_data ? 'checklist' then public.technical_task_checklist(p_data->'checklist') else t.checklist end;
   if coalesce(p_data->>'status',t.status)='done' and exists(select 1 from jsonb_array_elements(checks) x where not (x->>'done')::boolean) then raise exception 'Conclua os itens do checklist antes de encerrar a tarefa.';end if;
   update public.technical_tasks set
    checklist=checks,assigned_to=who,title=case when p_data ? 'title' then btrim(p_data->>'title') else t.title end,
    description=case when p_data ? 'description' then p_data->>'description' else t.description end,
    due_date=case when p_data ? 'due_date' then (p_data->>'due_date')::date else t.due_date end,
    priority=case when p_data ? 'priority' then p_data->>'priority' else t.priority end,
    status=coalesce(p_data->>'status',t.status),outcome=coalesce(p_data->>'outcome',t.outcome),
    completed_at=case when coalesce(p_data->>'status',t.status)='done' then coalesce(t.completed_at,now()) else null end,
    version=t.version+1,updated_at=now() where technical_tasks.id=target_id returning * into t;
   end if; -- check/update
   end if; -- comment/mutation
 end if;
 insert into public.technical_task_audit(task_id,actor_id,action,snapshot) values(t.id,u,p_action,to_jsonb(t)||case when p_action='comment' then jsonb_build_object('comment_id',p_operation,'comment',comment_body) else '{}'::jsonb end);
 result:=jsonb_build_object('id',t.id,'version',t.version);
 insert into public.technical_task_operations values(u,p_operation,payload,result);
 return result;
end;$$;


revoke all on function public.visit_observations_validate(jsonb,uuid,uuid,date) from public,anon,authenticated;
create table if not exists public.visit_templates (
 id uuid primary key,user_id uuid not null references auth.users(id),name text not null check(length(btrim(name)) between 2 and 100),
 anamnesis jsonb not null,active boolean not null default true,version int not null default 1,updated_at timestamptz not null default now()
);
create table if not exists public.visit_template_operations (
 user_id uuid not null references auth.users(id),operation_id uuid not null,payload jsonb not null,result jsonb not null,primary key(user_id,operation_id)
);
alter table public.visit_templates enable row level security;
alter table public.visit_template_operations enable row level security;
revoke all on public.visit_templates,public.visit_template_operations from public,anon,authenticated;
create or replace function public.visit_template_list() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(t) order by t.active desc,t.name,t.id),'[]'::jsonb) from public.visit_templates t where t.user_id=auth.uid();
$$;
create or replace function public.visit_template_command(p_operation uuid,p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();t public.visit_templates%rowtype;o public.visit_template_operations%rowtype;request jsonb;result jsonb;k text;v jsonb;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_action is null or p_action not in ('create','update','archive','restore') or jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>60000 then raise exception 'Operação de modelo inválida.';end if;
 perform pg_advisory_xact_lock(hashtext('visit-template'),hashtext(u::text));
 request:=jsonb_build_object('action',p_action,'data',p_data);
 select * into o from public.visit_template_operations where user_id=u and operation_id=p_operation;
 if found then if o.payload is distinct from request then raise exception 'Identificador usado para outra operação.';end if;return o.result;end if;
 if p_action<>'create' then
  select * into t from public.visit_templates where id=(p_data->>'id')::uuid and user_id=u for update;
  if not found then raise exception 'Modelo indisponível para sua conta.' using errcode='42501';end if;
  if t.version is distinct from (p_data->>'version')::int then raise exception 'O modelo mudou. Atualize a biblioteca antes de salvar.' using errcode='40001';end if;
 end if;
 if p_action in ('create','update') then
  if jsonb_typeof(p_data->'anamnesis') is distinct from 'object' then raise exception 'Informe os textos da anamnese para o modelo.';end if;
  for k,v in select * from jsonb_each(p_data->'anamnesis') loop
    if k not in ('reason','producer_report','symptoms','history','previous_treatments','soil','weather','assessment','recommendations','followup') or jsonb_typeof(v) is distinct from 'string' or length(v#>>'{}')>4000 then raise exception 'Campos do modelo inválidos.';end if;
  end loop;
  if not exists(select 1 from jsonb_each_text(p_data->'anamnesis') where length(btrim(value))>0) then raise exception 'Preencha ao menos um campo da anamnese antes de salvar um modelo.';end if;
 end if;
 if p_action='create' or (p_action='restore' and not t.active) then
  if (select count(*) from public.visit_templates where user_id=u and active)>=20 then raise exception 'Você já possui 20 modelos ativos. Arquive um antes de continuar.';end if;
 end if;
 if p_action='create' then
  if (select count(*) from public.visit_templates where user_id=u)>=100 then raise exception 'Limite de 100 modelos, incluindo arquivados, atingido. Atualize um modelo existente.';end if;
  insert into public.visit_templates(id,user_id,name,anamnesis) values(p_operation,u,btrim(p_data->>'name'),p_data->'anamnesis') returning * into t;
 elsif p_action='update' then
  update public.visit_templates set name=btrim(p_data->>'name'),anamnesis=p_data->'anamnesis',version=t.version+1,updated_at=now() where id=t.id returning * into t;
 else
  update public.visit_templates set active=(p_action='restore'),version=t.version+1,updated_at=now() where id=t.id returning * into t;
 end if;
 result:=jsonb_build_object('id',t.id,'version',t.version);
 insert into public.visit_template_operations values(u,p_operation,request,result);return result;
end;$$;
revoke all on function public.visit_template_list(),public.visit_template_command(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.visit_template_list(),public.visit_template_command(uuid,text,jsonb) to authenticated;

-- A fila nova usa um endpoint próprio: instalações antigas não podem ignorar as observações.
create or replace function public.sync_visit_workflow_operation(p_user uuid,p_operation uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;stored jsonb;incoming jsonb;
begin
 result:=public.sync_visit_operation(p_user,p_operation,p_payload);
 incoming:=p_payload->'visit'->'field_observations';
 if p_payload->>'kind'='visit' and coalesce(jsonb_array_length(incoming),0)>0 then
   select field_observations into stored from public.technical_visits where id=(result->>'visit_id')::uuid and author_id=auth.uid();
   if stored is null or jsonb_array_length(stored)<>jsonb_array_length(incoming) or exists(select 1 from jsonb_array_elements(incoming) x where not exists(select 1 from jsonb_array_elements(stored) y where y->>'id'=x->>'id')) then
     raise exception 'As observações não foram confirmadas. Execute novamente a etapa 41 antes de sincronizar.';
   end if;
 end if;
 return result;
end;$$;
revoke all on function public.sync_visit_workflow_operation(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.sync_visit_workflow_operation(uuid,uuid,jsonb) to authenticated;

commit;
