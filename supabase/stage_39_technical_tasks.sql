-- Requer visitas (33) e gestão da equipe (32). Tarefas online, sem ampliar acesso às fichas.
begin;
create table if not exists public.technical_tasks (
 id uuid primary key,visit_id uuid not null references public.technical_visits(id),seller_id uuid references public.commerce_sellers(id),
 created_by uuid not null references auth.users(id),assigned_to uuid not null references auth.users(id),
 title text not null check(length(btrim(title)) between 2 and 160),description text not null default '' check(length(description)<=2000),
 due_date date not null check(isfinite(due_date)),priority text not null check(priority in ('low','medium','high','urgent')),
 status text not null default 'pending' check(status in ('pending','doing','done','cancelled')),
 outcome text not null default '' check(length(outcome)<=2000),version int not null default 1,
 site_name text not null,area_name text not null,producer_name text not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),completed_at timestamptz
);
create index if not exists technical_tasks_due on public.technical_tasks(assigned_to,due_date);
create index if not exists technical_tasks_visit on public.technical_tasks(visit_id);
create table if not exists public.technical_task_audit (
 id bigint generated always as identity primary key,task_id uuid not null references public.technical_tasks(id),actor_id uuid not null references auth.users(id),
 action text not null,snapshot jsonb not null,created_at timestamptz not null default now()
);
create table if not exists public.technical_task_operations (
 user_id uuid not null references auth.users(id),operation_id uuid not null,payload jsonb not null,result jsonb not null,primary key(user_id,operation_id)
);
alter table public.technical_tasks enable row level security;
alter table public.technical_task_audit enable row level security;
alter table public.technical_task_operations enable row level security;
revoke all on public.technical_tasks,public.technical_task_audit,public.technical_task_operations from public,anon,authenticated;

create or replace function public.technical_task_can_read(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.technical_tasks t where t.id=p_id and (
 (t.seller_id is null and t.created_by=auth.uid() and t.assigned_to=auth.uid()) or
 (t.seller_id is not null and public.trade_agent_active(t.seller_id,auth.uid()) and (t.created_by=auth.uid() or t.assigned_to=auth.uid() or public.commerce_can_manage(t.seller_id)))));
$$;

create or replace function public.technical_task_context(p_visit uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v public.technical_visits%rowtype;manage boolean;
begin
 if auth.uid() is null or not public.technical_visit_can_read(p_visit) then raise exception 'Visita indisponível para criar tarefas.' using errcode='42501';end if;
 select * into v from public.technical_visits where id=p_visit;
 manage:=v.seller_id is not null and public.commerce_can_manage(v.seller_id);
 return jsonb_build_object('can_create',v.author_id=auth.uid() or manage,'can_assign',manage,'next_visit',v.next_visit,'seller_id',v.seller_id,
 'people',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'name',coalesce(nullif(c.display_name,''),a.email,'Profissional')) order by a.id),'[]'::jsonb)
 from auth.users a left join public.commerce_accounts c on c.user_id=a.id where a.id=auth.uid() or (manage and public.trade_agent_active(v.seller_id,a.id))));
end;$$;

create or replace function public.technical_task_command(p_operation uuid,p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();t public.technical_tasks%rowtype;v public.technical_visits%rowtype;
 previous public.technical_task_operations%rowtype;target_id uuid;who uuid;manage boolean;editable boolean;payload jsonb;result jsonb;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_action is null or p_action not in ('create','update') or jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>16000 then raise exception 'Operação de tarefa inválida.';end if;
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
   target_id:=p_operation;
   insert into public.technical_tasks(id,visit_id,seller_id,created_by,assigned_to,title,description,due_date,priority,site_name,area_name,producer_name)
   values(target_id,v.id,v.seller_id,u,who,btrim(p_data->>'title'),coalesce(p_data->>'description',''),(p_data->>'due_date')::date,p_data->>'priority',v.site_name,v.area_name,v.producer_name) returning * into t;
 else
   target_id:=(p_data->>'id')::uuid;
   select * into t from public.technical_tasks where technical_tasks.id=target_id for update;
   if not found or not public.technical_task_can_read(target_id) then raise exception 'Tarefa indisponível.' using errcode='42501';end if;
   if (p_data->>'version')::int is distinct from t.version then raise exception 'Esta tarefa mudou. Atualize a lista antes de salvar.' using errcode='40001';end if;
   manage:=t.seller_id is not null and public.commerce_can_manage(t.seller_id);editable:=t.created_by=u or manage;
   if not editable and (p_data ? 'title' or p_data ? 'description' or p_data ? 'due_date' or p_data ? 'priority' or p_data ? 'assigned_to') then raise exception 'Você pode atualizar a situação, mas não editar os dados da tarefa.' using errcode='42501';end if;
   who:=case when p_data ? 'assigned_to' then (p_data->>'assigned_to')::uuid else t.assigned_to end;
   if who is null or (who is distinct from t.assigned_to and (not manage or not public.trade_agent_active(t.seller_id,who))) then raise exception 'Somente a gestão pode atribuir a tarefa a outro integrante ativo.' using errcode='42501';end if;
   if p_data ? 'status' and (p_data->>'status' is null or p_data->>'status' not in ('pending','doing','done','cancelled')) then raise exception 'Situação inválida.';end if;
   if coalesce(p_data->>'status',t.status) in ('done','cancelled') and length(btrim(coalesce(p_data->>'outcome',t.outcome)))<2 then raise exception 'Registre o resultado ou o motivo do encerramento.';end if;
   update public.technical_tasks set
    assigned_to=who,title=case when p_data ? 'title' then btrim(p_data->>'title') else t.title end,
    description=case when p_data ? 'description' then p_data->>'description' else t.description end,
    due_date=case when p_data ? 'due_date' then (p_data->>'due_date')::date else t.due_date end,
    priority=case when p_data ? 'priority' then p_data->>'priority' else t.priority end,
    status=coalesce(p_data->>'status',t.status),outcome=coalesce(p_data->>'outcome',t.outcome),
    completed_at=case when coalesce(p_data->>'status',t.status)='done' then coalesce(t.completed_at,now()) else null end,
    version=t.version+1,updated_at=now() where technical_tasks.id=target_id returning * into t;
 end if;
 insert into public.technical_task_audit(task_id,actor_id,action,snapshot) values(t.id,u,p_action,to_jsonb(t));
 result:=jsonb_build_object('id',t.id,'version',t.version);
 insert into public.technical_task_operations values(u,p_operation,payload,result);
 return result;
end;$$;

create or replace function public.technical_task_list(p_visit uuid default null) returns jsonb
language sql stable security definer set search_path='' as $$
 with limited as (select t.* from public.technical_tasks t where public.technical_task_can_read(t.id) and (p_visit is null or t.visit_id=p_visit) order by t.due_date,t.id limit 501),
 visible as (select * from limited order by due_date,id limit 500)
 select jsonb_build_object('truncated',(select count(*)>500 from limited),'items',coalesce((select jsonb_agg(to_jsonb(t)||jsonb_build_object(
 'company_name',s.name,'assigned_name',coalesce(nullif(c.display_name,''),a.email,'Profissional'),
 'can_edit',t.created_by=auth.uid() or (t.seller_id is not null and public.commerce_can_manage(t.seller_id)),
 'can_assign',t.seller_id is not null and public.commerce_can_manage(t.seller_id),
 'can_open_visit',public.technical_visit_can_read(t.visit_id)
 ) order by t.due_date,t.id) from visible t left join auth.users a on a.id=t.assigned_to left join public.commerce_accounts c on c.user_id=a.id left join public.commerce_sellers s on s.id=t.seller_id),'[]'::jsonb)) where auth.uid() is not null;
$$;

create or replace function public.technical_task_history(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.technical_task_can_read(p_id) then raise exception 'Tarefa indisponível.' using errcode='42501';end if;
 return (select coalesce(jsonb_agg(x order by x.id desc),'[]'::jsonb) from (select e.id,e.actor_id,e.action,e.snapshot,e.created_at,coalesce(nullif(c.display_name,''),a.email,'Profissional') actor_name,coalesce(nullif(ac.display_name,''),aa.email,'Profissional') assigned_name from public.technical_task_audit e left join auth.users a on a.id=e.actor_id left join public.commerce_accounts c on c.user_id=a.id left join auth.users aa on aa.id=(e.snapshot->>'assigned_to')::uuid left join public.commerce_accounts ac on ac.user_id=aa.id where e.task_id=p_id order by e.id desc limit 50) x);
end;$$;
revoke all on function public.technical_task_can_read(uuid),public.technical_task_context(uuid),public.technical_task_command(uuid,text,jsonb),public.technical_task_list(uuid),public.technical_task_history(uuid) from public,anon,authenticated;
grant execute on function public.technical_task_context(uuid),public.technical_task_command(uuid,text,jsonb),public.technical_task_list(uuid),public.technical_task_history(uuid) to authenticated;
commit;
