-- Requer etapa 39. Checklist e comentários privados, com versão e auditoria.
begin;
alter table public.technical_tasks add column if not exists checklist jsonb not null default '[]'::jsonb;
create table if not exists public.technical_task_comments (
 id uuid primary key,task_id uuid not null references public.technical_tasks(id),author_id uuid not null references auth.users(id),
 body text not null check(length(btrim(body)) between 1 and 2000),created_at timestamptz not null default now()
);
create index if not exists technical_task_comments_parent on public.technical_task_comments(task_id,created_at desc);
alter table public.technical_task_comments enable row level security;
revoke all on public.technical_task_comments from public,anon,authenticated;
create or replace function public.technical_task_checklist(p_items jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare item jsonb;seen uuid[]:=array[]::uuid[];key uuid;result jsonb:='[]'::jsonb;
begin
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>20 then raise exception 'Adicione até 20 itens ao checklist.';end if;
 for item in select value from jsonb_array_elements(p_items) loop
   if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'label') is distinct from 'string' or length(btrim(item->>'label')) not between 1 and 160 or jsonb_typeof(item->'done') is distinct from 'boolean' then raise exception 'Item de checklist inválido.';end if;
   key:=(item->>'id')::uuid;
   if key is null or key=any(seen) then raise exception 'Identificador duplicado ou inválido no checklist.';end if;
   seen:=array_append(seen,key);
   result:=result||jsonb_build_array(jsonb_build_object('id',key,'label',btrim(item->>'label'),'done',item->'done'));
 end loop;return result;
end;$$;
create or replace function public.technical_task_context(p_visit uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v public.technical_visits%rowtype;manage boolean;
begin
 if auth.uid() is null or not public.technical_visit_can_read(p_visit) then raise exception 'Visita indisponível para criar tarefas.' using errcode='42501';end if;
 select * into v from public.technical_visits where id=p_visit;
 manage:=v.seller_id is not null and public.commerce_can_manage(v.seller_id);
 return jsonb_build_object('collaboration_version',40,'can_create',v.author_id=auth.uid() or manage,'can_assign',manage,'next_visit',v.next_visit,'seller_id',v.seller_id,
 'people',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'name',coalesce(nullif(c.display_name,''),a.email,'Profissional')) order by a.id),'[]'::jsonb)
 from auth.users a left join public.commerce_accounts c on c.user_id=a.id where a.id=auth.uid() or (manage and public.trade_agent_active(v.seller_id,a.id))));
end;$$;

create or replace function public.technical_task_command(p_operation uuid,p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();t public.technical_tasks%rowtype;v public.technical_visits%rowtype;
 previous public.technical_task_operations%rowtype;target_id uuid;who uuid;manage boolean;editable boolean;payload jsonb;result jsonb;checks jsonb;item jsonb;found_item boolean;comment_body text;
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
   checks:=public.technical_task_checklist(coalesce(p_data->'checklist','[]'::jsonb));
   target_id:=p_operation;
   insert into public.technical_tasks(id,visit_id,seller_id,created_by,assigned_to,title,description,due_date,priority,site_name,area_name,producer_name,checklist)
   values(target_id,v.id,v.seller_id,u,who,btrim(p_data->>'title'),coalesce(p_data->>'description',''),(p_data->>'due_date')::date,p_data->>'priority',v.site_name,v.area_name,v.producer_name,checks) returning * into t;
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

create or replace function public.technical_task_comment_list(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.technical_task_can_read(p_id) then raise exception 'Tarefa indisponível.' using errcode='42501';end if;
 return (select coalesce(jsonb_agg(x order by x.created_at desc,x.id),'[]'::jsonb) from (
 select e.id,e.author_id,e.body,e.created_at,coalesce(nullif(c.display_name,''),a.email,'Profissional') author_name
 from public.technical_task_comments e left join auth.users a on a.id=e.author_id left join public.commerce_accounts c on c.user_id=a.id
 where e.task_id=p_id order by e.created_at desc,e.id limit 50) x);
end;$$;
revoke all on function public.technical_task_checklist(jsonb),public.technical_task_comment_list(uuid),public.technical_task_command(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.technical_task_comment_list(uuid),public.technical_task_command(uuid,text,jsonb) to authenticated;
commit;
