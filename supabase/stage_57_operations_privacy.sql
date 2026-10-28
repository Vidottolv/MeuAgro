-- Frente 9: diagnóstico somente leitura e atendimento manual de privacidade.
-- Requer etapas 49, 50 e 52. Satélite é incluído quando suas tabelas existem.
begin;
do $$ begin
 if to_regprocedure('public.app_is_platform_admin()') is null or to_regclass('public.workspace_operations') is null or to_regclass('public.app_checkouts') is null or to_regclass('public.app_billing_sync') is null or to_regclass('public.app_billing_diagnostics') is null then
 raise exception 'Instale as etapas 49, 50 e 52 antes da etapa 57.';
 end if;
end;$$;
create table if not exists public.app_privacy_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 kind text not null check(kind in ('export','delete')),
 status text not null default 'open' check(status in ('open','review','fulfilled','declined','withdrawn')),
 note text not null default '', version int not null default 1,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists app_privacy_one_open on public.app_privacy_requests(user_id,kind) where status in ('open','review');
create index if not exists app_privacy_recent on public.app_privacy_requests(created_at desc,id);
create index if not exists app_privacy_user_recent on public.app_privacy_requests(user_id,created_at desc,id);
create table if not exists public.app_privacy_audit (
 id bigint generated always as identity primary key,request_id uuid not null references public.app_privacy_requests(id),
 actor_id uuid not null references auth.users(id),old_status text,new_status text not null,note text not null default '',created_at timestamptz not null default now()
);
alter table public.app_privacy_requests enable row level security;
alter table public.app_privacy_audit enable row level security;
revoke all on public.app_privacy_requests,public.app_privacy_audit from public,anon,authenticated;

create or replace function public.app_operations_context() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid();sat jsonb:=null;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if to_regclass('public.satellite_images') is not null and to_regclass('public.satellite_searches') is not null then
 execute $q$select jsonb_build_object(
 'images_pending',(select count(*) from public.satellite_images where user_id=$1 and status='processing' and created_at<now()-interval '5 minutes'),
 'images_failed',(select count(*) from public.satellite_images where user_id=$1 and status='failed'),
 'searches_pending',(select count(*) from public.satellite_searches where user_id=$1 and status='processing' and created_at<now()-interval '5 minutes'),
 'searches_failed',(select count(*) from public.satellite_searches where user_id=$1 and status='failed'))$q$ into sat using u;
 end if;
 return jsonb_build_object('generated_at',now(),'is_admin',public.app_is_platform_admin(),
 'checkout_review',(select count(*) from public.app_checkouts where user_id=u and (status='review' or (status='provisioning' and lease_until<now()))),
 'billing_pending',exists(select 1 from public.app_billing_sync where user_id=u and finished_at is null and started_at<now()-interval '5 minutes'),
 'satellite',sat,
 'requests',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id) from(select id,kind,status,note,version,created_at,updated_at from public.app_privacy_requests where user_id=u order by created_at desc,id limit 30)x),'[]'::jsonb));
end;$$;

create or replace function public.app_privacy_submit(p_operation uuid,p_kind text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();op public.workspace_operations%rowtype;payload jsonb;result jsonb;r public.app_privacy_requests%rowtype;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_operation is null or p_kind is null or p_kind not in ('export','delete') then raise exception 'Solicitação inválida.';end if;
 perform pg_advisory_xact_lock(hashtext('app-privacy-user'),hashtext(u::text));
 payload:=jsonb_build_object('action','privacy-submit','kind',p_kind);
 select * into op from public.workspace_operations where user_id=u and operation_id=p_operation;
 if found then if op.payload is distinct from payload then raise exception 'Operação já utilizada.';end if;return op.result;end if;
 if exists(select 1 from public.app_privacy_requests where user_id=u and kind=p_kind and (status in ('open','review') or created_at>now()-interval '1 day')) then raise exception 'Já há uma solicitação deste tipo aberta ou criada nas últimas 24 horas.';end if;
 insert into public.app_privacy_requests(user_id,kind) values(u,p_kind) returning * into r;
 insert into public.app_privacy_audit(request_id,actor_id,new_status) values(r.id,u,'open');
 result:=jsonb_build_object('id',r.id,'status',r.status);
 insert into public.workspace_operations(user_id,operation_id,payload,result) values(u,p_operation,payload,result);
 return result;
end;$$;

create or replace function public.app_privacy_withdraw(p_operation uuid,p_id uuid,p_version int) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();op public.workspace_operations%rowtype;payload jsonb;result jsonb;r public.app_privacy_requests%rowtype;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_operation is null or p_id is null or p_version is null then raise exception 'Solicitação inválida.';end if;
 perform pg_advisory_xact_lock(hashtext('app-privacy-user'),hashtext(u::text));
 payload:=jsonb_build_object('action','privacy-withdraw','id',p_id,'version',p_version);
 select * into op from public.workspace_operations where user_id=u and operation_id=p_operation;
 if found then if op.payload is distinct from payload then raise exception 'Operação já utilizada.';end if;return op.result;end if;
 select * into r from public.app_privacy_requests where id=p_id and user_id=u for update;
 if not found then raise exception 'Solicitação indisponível.' using errcode='42501';end if;
 if r.version<>p_version or r.status<>'open' then raise exception 'Solicitação mudou ou já está em atendimento. Atualize a tela.';end if;
 update public.app_privacy_requests set status='withdrawn',version=version+1,updated_at=now() where id=r.id;
 insert into public.app_privacy_audit(request_id,actor_id,old_status,new_status) values(r.id,u,r.status,'withdrawn');
 result:=jsonb_build_object('ok',true);
 insert into public.workspace_operations(user_id,operation_id,payload,result) values(u,p_operation,payload,result);return result;
end;$$;

create or replace function public.app_operations_admin(p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.app_is_platform_admin() then raise exception 'Acesso exclusivo da administração do MeuAgro.' using errcode='42501';end if;
 if p_offset is null or p_offset<0 or p_offset>100000 then raise exception 'Página inválida.';end if;
 return jsonb_build_object('generated_at',now(),
 'billing_errors_24h',(select count(*) from public.app_billing_diagnostics where updated_at>now()-interval '24 hours' and outcome in ('provider_failed','database_failed','unlinked','environment_mismatch')),
 'checkout_review',(select count(*) from public.app_checkouts where status='review' or (status='provisioning' and lease_until<now())),
 'privacy_open',(select count(*) from public.app_privacy_requests where status in ('open','review')),
 'count',(select count(*) from public.app_privacy_requests),
 'requests',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id) from(select id,user_id,kind,status,note,version,created_at,updated_at from public.app_privacy_requests order by created_at desc,id offset p_offset limit 30)x),'[]'::jsonb));
end;$$;

create or replace function public.app_privacy_review(p_operation uuid,p_id uuid,p_version int,p_status text,p_note text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();op public.workspace_operations%rowtype;payload jsonb;result jsonb;r public.app_privacy_requests%rowtype;n text:=btrim(p_note);
begin
 if not public.app_is_platform_admin() then raise exception 'Acesso exclusivo da administração do MeuAgro.' using errcode='42501';end if;
 if p_operation is null or p_id is null or p_version is null or p_status is null or p_status not in ('review','fulfilled','declined') or coalesce(length(n),0) not between 10 and 500 then raise exception 'Informe situação e resposta de 10 a 500 caracteres.';end if;
 perform pg_advisory_xact_lock(hashtext('app-privacy-user'),hashtext(u::text));
 payload:=jsonb_build_object('action','privacy-review','id',p_id,'version',p_version,'status',p_status,'note',n);
 select * into op from public.workspace_operations where user_id=u and operation_id=p_operation;
 if found then if op.payload is distinct from payload then raise exception 'Operação já utilizada.';end if;return op.result;end if;
 select * into r from public.app_privacy_requests where id=p_id for update;
 if not found then raise exception 'Solicitação indisponível.';end if;
 if r.version<>p_version or not ((r.status='open' and p_status in ('review','declined')) or (r.status='review' and p_status in ('fulfilled','declined'))) then raise exception 'Solicitação mudou ou transição inválida. Atualize a tela.';end if;
 update public.app_privacy_requests set status=p_status,note=n,version=version+1,updated_at=now() where id=r.id;
 insert into public.app_privacy_audit(request_id,actor_id,old_status,new_status,note) values(r.id,u,r.status,p_status,n);
 result:=jsonb_build_object('ok',true);
 insert into public.workspace_operations(user_id,operation_id,payload,result) values(u,p_operation,payload,result);return result;
end;$$;

revoke all on function public.app_operations_context(),public.app_operations_admin(int),public.app_privacy_submit(uuid,text),public.app_privacy_withdraw(uuid,uuid,int),public.app_privacy_review(uuid,uuid,int,text,text) from public,anon,authenticated;
grant execute on function public.app_operations_context(),public.app_operations_admin(int),public.app_privacy_submit(uuid,text),public.app_privacy_withdraw(uuid,uuid,int),public.app_privacy_review(uuid,uuid,int,text,text) to authenticated;
commit;
