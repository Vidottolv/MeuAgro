begin;
-- Guidance preferences are not authorization roles or commercial entitlements.
create table if not exists public.app_onboarding_preferences (
 user_id uuid primary key references auth.users(id),
 profile text not null check(profile in ('producer','independent','representative','manager','company')),
 version integer not null default 1 check(version>0),reviewed_at timestamptz,updated_at timestamptz not null default now()
);
alter table public.app_onboarding_preferences enable row level security;
revoke all on public.app_onboarding_preferences from public,anon,authenticated;
create or replace function public.app_onboarding_context() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid();companies jsonb;counts jsonb;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'role',
   case when s.owner_id=u then 'owner' else m.management_role end) order by s.name,s.id),'[]'::jsonb)
 into companies from public.commerce_sellers s
 left join public.commerce_memberships m on m.seller_id=s.id and m.user_id=u and m.active
 where s.kind='company' and (s.owner_id=u or m.user_id=u);
 counts:=jsonb_build_object(
  'properties',(select count(*) from public.properties p where p.user_id=u and p.deleted_at is null and coalesce(to_jsonb(p)->>'status','active')<>'archived'),
  'seasons',(select count(*) from public.seasons s where s.user_id=u and s.deleted_at is null),
  'cycles',(select count(*) from public.production_cycles c where c.user_id=u and c.deleted_at is null),
  'inputs',(select count(*) from public.agricultural_inputs i where i.user_id=u and i.deleted_at is null and i.active),
  'personal_visits',(select count(*) from public.technical_visits v where v.author_id=u and v.seller_id is null and coalesce(to_jsonb(v)->>'deleted_at','')=''),
  'company_visits',(select count(*) from public.technical_visits v where v.author_id=u and coalesce(to_jsonb(v)->>'deleted_at','')='' and exists(select 1 from public.commerce_sellers s where s.id=v.seller_id and (s.owner_id=u or exists(select 1 from public.commerce_memberships m where m.seller_id=s.id and m.user_id=u and m.active)))),
  'shared_properties',(select count(*) from public.property_shares sh join public.properties p on p.id=sh.property_id where sh.consultant_id=u and sh.status='active' and p.deleted_at is null and coalesce(to_jsonb(p)->>'status','active')<>'archived'),
  'active_colleagues',(select count(distinct m.user_id) from public.commerce_memberships m join public.commerce_sellers s on s.id=m.seller_id where s.owner_id=u and s.kind='company' and m.active and m.user_id<>u),
  'commercial_account',exists(select 1 from public.commerce_accounts a where a.user_id=u and a.enabled));
 return jsonb_build_object('preference',(select jsonb_build_object('profile',profile,'version',version,'reviewed_at',reviewed_at) from public.app_onboarding_preferences where user_id=u),
 'companies',companies,'counts',counts);
end;$$;
create or replace function public.app_onboarding_save(p_operation uuid,p_profile text,p_version integer,p_reviewed boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();request jsonb;op public.workspace_operations%rowtype;old public.app_onboarding_preferences%rowtype;result jsonb;
begin
 if u is null or p_operation is null then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_profile is null or p_profile not in ('producer','independent','representative','manager','company') or p_version is null or p_version<0 or p_reviewed is null then raise exception 'Revise o roteiro escolhido.';end if;
 perform pg_advisory_xact_lock(hashtext('profile-onboarding'),hashtext(u::text));
 request:=jsonb_build_object('kind','onboarding-profile','profile',p_profile,'version',p_version,'reviewed',p_reviewed);
 select * into op from public.workspace_operations where user_id=u and operation_id=p_operation;
 if found then
  if op.payload is distinct from request then raise exception 'Operação já utilizada.';end if;
  return op.result;
 end if;
 select * into old from public.app_onboarding_preferences where user_id=u;
 if coalesce(old.version,0)<>p_version then raise exception 'O roteiro mudou em outro dispositivo. Atualize antes de salvar.';end if;
 insert into public.app_onboarding_preferences(user_id,profile,reviewed_at)
 values(u,p_profile,case when p_reviewed then now() end)
 on conflict(user_id) do update set profile=p_profile,version=app_onboarding_preferences.version+1,
 reviewed_at=case when p_reviewed then coalesce(case when app_onboarding_preferences.profile=p_profile then app_onboarding_preferences.reviewed_at end,now()) end,updated_at=now();
 select jsonb_build_object('ok',true,'version',version) into result from public.app_onboarding_preferences where user_id=u;
 insert into public.workspace_operations(user_id,operation_id,payload,result) values(u,p_operation,request,result);
 return result;
end;$$;
revoke all on function public.app_onboarding_context(),public.app_onboarding_save(uuid,text,integer,boolean) from public,anon,authenticated;
grant execute on function public.app_onboarding_context(),public.app_onboarding_save(uuid,text,integer,boolean) to authenticated;
commit;
