-- Compartilhamento técnico somente online. Requer etapas comerciais e visitas (33).
begin;
create table if not exists public.property_shares (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id),
 owner_id uuid not null references auth.users(id), invite_email text not null check(invite_email=lower(btrim(invite_email)) and length(invite_email) between 3 and 254),
 consultant_id uuid references auth.users(id), status text not null default 'pending' check(status in ('pending','active','revoked','declined')),
 expires_at timestamptz not null default now()+interval '7 days', created_at timestamptz not null default now(), accepted_at timestamptz, ended_at timestamptz
);
create unique index if not exists property_share_open_email on public.property_shares(property_id,invite_email) where status in ('pending','active');
create index if not exists property_share_owner on public.property_shares(owner_id);
create index if not exists property_share_consultant on public.property_shares(consultant_id);
create table if not exists public.property_share_reports (
 share_id uuid not null references public.property_shares(id), visit_id uuid not null references public.technical_visits(id),
 shared_by uuid not null references auth.users(id), active boolean not null default true, shared_at timestamptz not null default now(), primary key(share_id,visit_id)
);
create table if not exists public.property_share_audit (
 id uuid primary key default gen_random_uuid(), share_id uuid not null references public.property_shares(id), actor_id uuid not null references auth.users(id),
 action text not null, visit_id uuid references public.technical_visits(id), created_at timestamptz not null default now()
);
alter table public.property_shares enable row level security;
alter table public.property_share_reports enable row level security;
alter table public.property_share_audit enable row level security;
revoke all on public.property_shares,public.property_share_reports,public.property_share_audit from public,anon,authenticated;

create or replace function public.property_share_command(p_action text,p_data jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); email text; target text; pid uuid; s public.property_shares%rowtype; vid uuid; changed boolean:=false;
begin
 if u is null then raise exception 'Entre na sua conta.' using errcode='42501'; end if;
 select lower(btrim(a.email)) into email from auth.users a where a.id=u and a.email_confirmed_at is not null;
 if email is null then raise exception 'Confirme o e-mail da conta.' using errcode='42501'; end if;
 if p_action='invite' then
   pid:=(p_data->>'property_id')::uuid; target:=lower(btrim(p_data->>'email'));
   if target is null or length(target)>254 or target !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or target=email then raise exception 'Informe o e-mail de outra pessoa.'; end if;
   perform 1 from public.properties where id=pid and user_id=u and deleted_at is null and coalesce(to_jsonb(properties)->>'status','active')<>'archived' for share;
   if not found then raise exception 'Somente o dono pode convidar para esta propriedade.' using errcode='42501'; end if;
   perform pg_advisory_xact_lock(hashtext(pid::text),hashtext(target));
   with expired as (update public.property_shares set status='revoked',ended_at=now() where property_id=pid and invite_email=target and status='pending' and expires_at<=now() returning id)
   insert into public.property_share_audit(share_id,actor_id,action) select id,u,'expire' from expired;
   select * into s from public.property_shares where property_id=pid and invite_email=target and status in ('pending','active');
   if found then
     if s.owner_id<>u then raise exception 'Revise os vínculos anteriores desta propriedade.'; end if;
     return jsonb_build_object('id',s.id,'status',s.status);
   end if;
   insert into public.property_shares(property_id,owner_id,invite_email) values(pid,u,target) returning * into s;
   changed:=true;
 else
   select * into s from public.property_shares where id=(p_data->>'id')::uuid for update;
   if not found or (s.owner_id<>u and s.consultant_id is distinct from u and s.invite_email<>email) then raise exception 'Convite indisponível.' using errcode='42501'; end if;
   if p_action='accept' then
     if s.invite_email<>email or s.owner_id=u then raise exception 'Este convite pertence a outra conta.' using errcode='42501'; end if;
     if s.status='active' and s.consultant_id=u then return jsonb_build_object('id',s.id,'status',s.status); end if;
     if s.status<>'pending' or s.expires_at<=now() then raise exception 'Convite encerrado ou expirado.'; end if;
     if not exists(select 1 from public.properties where id=s.property_id and user_id=s.owner_id and deleted_at is null and coalesce(to_jsonb(properties)->>'status','active')<>'archived') then raise exception 'Propriedade indisponível.'; end if;
     if not exists(select 1 from public.commerce_accounts a where a.user_id=u and a.enabled) or not (
       exists(select 1 from public.commerce_sellers where owner_id=u) or exists(select 1 from public.commerce_memberships where user_id=u and active)
     ) then raise exception 'Ative seu espaço de consultor antes de aceitar.'; end if;
     update public.property_shares set status='active',consultant_id=u,accepted_at=now() where id=s.id returning * into s; changed:=true;
   elsif p_action in ('revoke','decline') then
     if p_action='decline' and (s.invite_email<>email or s.status<>'pending') then raise exception 'Convite indisponível para recusa.'; end if;
     if p_action='revoke' and s.owner_id<>u and s.consultant_id is distinct from u then raise exception 'Você não pode revogar este vínculo.' using errcode='42501'; end if;
     if s.status in ('pending','active') then
       update public.property_shares set status=case when p_action='decline' then 'declined' else 'revoked' end,consultant_id=case when p_action='decline' then u else consultant_id end,ended_at=now() where id=s.id returning * into s; changed:=true;
     end if;
   elsif p_action in ('share_report','unshare_report') then
     if s.consultant_id is distinct from u or s.status<>'active' or not exists(select 1 from public.commerce_accounts where user_id=u and enabled) or not exists(select 1 from public.properties where id=s.property_id and user_id=s.owner_id and deleted_at is null and coalesce(to_jsonb(properties)->>'status','active')<>'archived') then raise exception 'Vínculo técnico indisponível.' using errcode='42501'; end if;
     vid:=(p_data->>'visit_id')::uuid;
     if not exists(select 1 from public.technical_visits where id=vid and author_id=u) or not public.technical_visit_can_read(vid) then raise exception 'Somente o autor com acesso pode compartilhar a ficha.' using errcode='42501'; end if;
     insert into public.property_share_reports(share_id,visit_id,shared_by,active) values(s.id,vid,u,p_action='share_report')
     on conflict(share_id,visit_id) do update set active=excluded.active,shared_at=now() where public.property_share_reports.active is distinct from excluded.active;
     changed:=found;
   else raise exception 'Ação de compartilhamento inválida.';
   end if;
 end if;
 if changed then insert into public.property_share_audit(share_id,actor_id,action,visit_id) values(s.id,u,p_action,vid); end if;
 return jsonb_build_object('id',s.id,'status',s.status);
end; $$;

create or replace function public.property_share_list() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(x order by x->>'created_at' desc),'[]'::jsonb) from (
   select jsonb_build_object('id',s.id,'property_id',s.property_id,'property_name',p.name,'owner_id',s.owner_id,
     'owner_name',coalesce((select display_name from public.commerce_accounts where user_id=s.owner_id),'Produtor'),
     'invite_email',s.invite_email,'consultant_id',s.consultant_id,'status',s.status,'expires_at',s.expires_at,'created_at',s.created_at,
     'audit',(select coalesce(jsonb_agg(a),'[]'::jsonb) from (select action,created_at from public.property_share_audit where share_id=s.id order by created_at desc,id limit 10) a)) x
   from public.property_shares s join public.properties p on p.id=s.property_id
   where auth.uid() is not null and (s.owner_id=auth.uid() or s.consultant_id=auth.uid() or
     (s.status='pending' and s.consultant_id is null and s.invite_email=(select lower(btrim(email)) from auth.users where id=auth.uid() and email_confirmed_at is not null)))
   order by s.created_at desc limit 200
 ) rows;
$$;

create or replace function public.property_share_detail(p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.property_shares%rowtype; result jsonb;
begin
 select * into s from public.property_shares where id=p_id;
 if not found or auth.uid() is null or s.status<>'active' or (s.owner_id<>auth.uid() and s.consultant_id is distinct from auth.uid()) then raise exception 'Acesso técnico indisponível ou revogado.' using errcode='42501'; end if;
 if s.consultant_id=auth.uid() and not exists(select 1 from public.commerce_accounts where user_id=auth.uid() and enabled) then raise exception 'Seu espaço de consultor não está ativo.' using errcode='42501'; end if;
 if not exists(select 1 from public.properties where id=s.property_id and user_id=s.owner_id and deleted_at is null and coalesce(to_jsonb(properties)->>'status','active')<>'archived') then raise exception 'Propriedade indisponível.' using errcode='42501'; end if;
 select jsonb_build_object('id',p.id,'name',p.name,'city',to_jsonb(p)->>'city','state',to_jsonb(p)->>'state','total_area',to_jsonb(p)->>'total_area','area_unit',to_jsonb(p)->>'area_unit') into result from public.properties p where p.id=s.property_id;
 return jsonb_build_object('property',result,
 'areas',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select jsonb_build_object('id',a.id,'name',to_jsonb(a)->>'name') x from public.areas a where a.property_id=s.property_id and a.user_id=s.owner_id and a.deleted_at is null order by a.id limit 200) r),
 'cycles',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select jsonb_build_object('id',c.id,'area_id',c.area_id,'crop',to_jsonb(crop)->>'name','variety',to_jsonb(c)->>'variety','planting_date',to_jsonb(c)->>'planting_date','status',to_jsonb(c)->>'status') x from public.production_cycles c left join public.crops crop on crop.id=c.crop_id where c.property_id=s.property_id and c.user_id=s.owner_id and c.deleted_at is null order by c.id limit 200) r),
 'events',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select jsonb_build_object('id',e.id,'cycle_id',e.production_cycle_id,'title',e.title,'description',e.description,'occurred_at',e.occurred_at) x from public.production_events e join public.production_cycles c on c.id=e.production_cycle_id where c.property_id=s.property_id and c.user_id=s.owner_id and e.user_id=s.owner_id and c.deleted_at is null order by e.occurred_at desc,e.id limit 200) r),
 'reports',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select jsonb_build_object('id',v.id,'producer_name',v.producer_name,'site_name',v.site_name,'area_name',v.area_name,'crop_name',v.crop_name,'technician_name',v.technician_name,'visited_at',v.visited_at,'priority',v.priority,'next_visit',v.next_visit,'anamnesis',v.anamnesis,'seller_id',v.seller_id) x from public.property_share_reports r join public.technical_visits v on v.id=r.visit_id where r.share_id=s.id and r.active and v.author_id=s.consultant_id and (v.seller_id is null or public.trade_agent_active(v.seller_id,v.author_id)) order by v.visited_at desc limit 200) r),
 'audit',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (select jsonb_build_object('action',action,'created_at',created_at,'actor_id',actor_id,'visit_id',visit_id) x from public.property_share_audit where share_id=s.id order by created_at desc,id limit 50) r));
end; $$;
revoke all on function public.property_share_command(text,jsonb),public.property_share_list(),public.property_share_detail(uuid) from public,anon;
grant execute on function public.property_share_command(text,jsonb),public.property_share_list(),public.property_share_detail(uuid) to authenticated;
commit;
