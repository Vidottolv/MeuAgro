-- Apoio textual na visita. Desativado até provisionamento explícito pelo administrador.
begin;
create table if not exists public.visit_ai_settings (
 id boolean primary key default true check(id),enabled boolean not null default false,
 model text not null default 'gpt-4.1-mini' check(length(model) between 1 and 100),
 requests_month int not null default 100 check(requests_month between 0 and 100000),
 tokens_month bigint not null default 2000000 check(tokens_month>=0)
);
insert into public.visit_ai_settings(id) values(true) on conflict do nothing;
create table if not exists public.visit_ai_entitlements (
 user_id uuid primary key references auth.users(id),enabled boolean not null default false,
 requests_month int not null default 20 check(requests_month between 0 and 10000),
 tokens_month bigint not null default 400000 check(tokens_month>=0)
);
create table if not exists public.visit_ai_jobs (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),visit_id uuid not null references public.technical_visits(id),
 source_hash text not null,model text not null,prompt_version text not null default 'visit-v1',
 month date not null default date_trunc('month',now() at time zone 'UTC')::date,
 status text not null default 'processing' check(status in ('processing','ready','failed')),
 lease uuid not null default gen_random_uuid(),reserved_tokens int not null default 20000,
 input_tokens int,output_tokens int,result jsonb,created_at timestamptz not null default now(),finished_at timestamptz,reviewed_at timestamptz,
 unique(user_id,visit_id,source_hash,model,prompt_version)
);
create index if not exists visit_ai_budget on public.visit_ai_jobs(month,user_id);
create index if not exists visit_ai_history on public.visit_ai_jobs(user_id,visit_id,created_at desc);
alter table public.visit_ai_settings enable row level security;
alter table public.visit_ai_entitlements enable row level security;
alter table public.visit_ai_jobs enable row level security;
revoke all on public.visit_ai_settings,public.visit_ai_entitlements,public.visit_ai_jobs from public,anon,authenticated;

create or replace function public.visit_ai_source(p_user uuid,p_visit uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v public.technical_visits%rowtype;source jsonb;fields jsonb;observations jsonb;
begin
 select * into v from public.technical_visits where id=p_visit and author_id=p_user;
 if p_user is null or not found or (v.seller_id is not null and not public.trade_agent_active(v.seller_id,p_user)) then raise exception 'Visita indisponível para este assistente.' using errcode='42501';end if;
 select jsonb_object_agg(k,left(coalesce(v.anamnesis->>k,''),1200)) into fields from unnest(array['reason','producer_report','symptoms','history','previous_treatments','soil','weather','assessment','recommendations','followup']) k;
 select coalesce(jsonb_agg(jsonb_build_object('crop',left(coalesce(x->>'crop_name',''),120),'observation',left(coalesce(x->>'observation',''),600),'recommendation',left(coalesce(x->>'recommendation',''),600))),'[]') into observations from (select value x from jsonb_array_elements(coalesce(to_jsonb(v)->'field_observations','[]'::jsonb)) limit 5) r;
 source:=jsonb_build_object('crop',v.crop_name,'anamnesis',fields,'observations',observations);
 if octet_length(source::text)>14000 then raise exception 'Texto extenso demais para o piloto de IA. Revise os registros antes de consultar.';end if;
 return source;
end;$$;

create or replace function public.visit_ai_context(p_visit uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid();source jsonb;e public.visit_ai_entitlements%rowtype;s public.visit_ai_settings%rowtype;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 source:=public.visit_ai_source(u,p_visit);
 select * into e from public.visit_ai_entitlements where user_id=u;
 select * into s from public.visit_ai_settings where id;
 return jsonb_build_object('source',source,'source_hash',md5(source::text),'enabled',coalesce(s.enabled and e.enabled,false),'model',s.model,'requests_limit',coalesce(e.requests_month,0),
 'requests_used',(select count(*) from public.visit_ai_jobs where user_id=u and month=date_trunc('month',now() at time zone 'UTC')::date),
 'jobs',coalesce((select jsonb_agg(x order by created_at desc) from(select id,status,source_hash,model,result,created_at,finished_at,reviewed_at from public.visit_ai_jobs where user_id=u and visit_id=p_visit order by created_at desc limit 5)x),'[]'::jsonb));
end;$$;

create or replace function public.visit_ai_claim(p_user uuid,p_visit uuid,p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare source jsonb;s public.visit_ai_settings%rowtype;e public.visit_ai_entitlements%rowtype;j public.visit_ai_jobs%rowtype;m date:=date_trunc('month',now() at time zone 'UTC')::date;
begin
 source:=public.visit_ai_source(p_user,p_visit);
 if p_hash is distinct from md5(source::text) then raise exception 'Os dados da visita mudaram. Atualize e confira o texto novamente.';end if;
 perform pg_advisory_xact_lock(hashtext('visit-ai-budget'),0);
 select * into s from public.visit_ai_settings where id;
 select * into j from public.visit_ai_jobs where user_id=p_user and visit_id=p_visit and source_hash=p_hash and model=s.model and prompt_version='visit-v1';
 if found then return jsonb_build_object('claimed',false,'id',j.id,'status',j.status,'result',j.result);end if;
 select * into e from public.visit_ai_entitlements where user_id=p_user;
 if not coalesce(s.enabled and e.enabled,false) then raise exception 'Assistente de IA não habilitado para esta conta.';end if;
 if exists(select 1 from public.visit_ai_jobs where user_id=p_user and created_at>now()-interval '1 minute') then raise exception 'Aguarde um minuto entre novas análises.';end if;
 if (select count(*) from public.visit_ai_jobs where month=m)>=s.requests_month or (select coalesce(sum(greatest(reserved_tokens,coalesce(input_tokens,0)::bigint+coalesce(output_tokens,0))),0)+20000 from public.visit_ai_jobs where month=m)>s.tokens_month or
 (select count(*) from public.visit_ai_jobs where month=m and user_id=p_user)>=e.requests_month or (select coalesce(sum(greatest(reserved_tokens,coalesce(input_tokens,0)::bigint+coalesce(output_tokens,0))),0)+20000 from public.visit_ai_jobs where month=m and user_id=p_user)>e.tokens_month then raise exception 'Franquia mensal de IA atingida. Nenhuma nova chamada foi iniciada.';end if;
 insert into public.visit_ai_jobs(user_id,visit_id,source_hash,model) values(p_user,p_visit,p_hash,s.model) returning * into j;
 return jsonb_build_object('claimed',true,'id',j.id,'lease',j.lease,'source',source,'model',j.model);
end;$$;

create or replace function public.visit_ai_finish(p_id uuid,p_lease uuid,p_result jsonb,p_input int,p_output int) returns void
language plpgsql security definer set search_path='' as $$
declare j public.visit_ai_jobs%rowtype;
begin
 select * into j from public.visit_ai_jobs where id=p_id for update;
 if not found or j.lease is distinct from p_lease or j.status<>'processing' then raise exception 'Análise encerrada ou inválida.';end if;
 if (p_input is not null and p_input<0) or (p_output is not null and p_output<0) or (p_result is not null and (jsonb_typeof(p_result) is distinct from 'object' or octet_length(p_result::text)>12000)) then raise exception 'Resultado inválido.';end if;
 update public.visit_ai_jobs set status=case when p_result is null then 'failed' else 'ready' end,result=p_result,input_tokens=p_input,output_tokens=p_output,finished_at=now() where id=j.id;
 if coalesce(p_input,0)::bigint+coalesce(p_output,0)>j.reserved_tokens then
 perform pg_advisory_xact_lock(hashtext('visit-ai-budget'),0);
 update public.visit_ai_settings set enabled=false where id;
 end if;
end;$$;

create or replace function public.visit_ai_review(p_id uuid,p_confirm boolean) returns void
language plpgsql security definer set search_path='' as $$
declare j public.visit_ai_jobs%rowtype;source jsonb;
begin
 select * into j from public.visit_ai_jobs where id=p_id and user_id=auth.uid() for update;
 if not found or j.status<>'ready' or p_confirm is distinct from true then raise exception 'Confira a análise antes de registrar sua revisão.' using errcode='42501';end if;
 source:=public.visit_ai_source(auth.uid(),j.visit_id);
 if j.source_hash<>md5(source::text) then raise exception 'A visita mudou desde a análise. Gere e revise uma análise atualizada.';end if;
 update public.visit_ai_jobs set reviewed_at=coalesce(reviewed_at,now()) where id=j.id;
end;$$;
revoke all on function public.visit_ai_source(uuid,uuid),public.visit_ai_context(uuid),public.visit_ai_claim(uuid,uuid,text),public.visit_ai_finish(uuid,uuid,jsonb,int,int),public.visit_ai_review(uuid,boolean) from public,anon,authenticated;
grant execute on function public.visit_ai_context(uuid),public.visit_ai_review(uuid,boolean) to authenticated;
grant execute on function public.visit_ai_claim(uuid,uuid,text),public.visit_ai_finish(uuid,uuid,jsonb,int,int) to service_role;
commit;
