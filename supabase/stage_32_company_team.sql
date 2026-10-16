-- Gerentes e representantes. Requer upgrade_0_25_management.sql.
begin;
alter table public.commerce_invitations add column if not exists management_role text not null default 'representative' check (management_role in ('representative','manager'));
alter table public.commerce_invitations add column if not exists can_view_finance boolean not null default false;
alter table public.commerce_invitations add column if not exists invited_by uuid references auth.users(id);

create or replace function public.commerce_revoke_team_invitations() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.management_role='manager' and (not new.active or new.management_role<>'manager') then
    update public.commerce_invitations set status='revoked'
      where seller_id=new.seller_id and invited_by=new.user_id and status='pending';
  end if;
  return new;
end;
$$;
revoke all on function public.commerce_revoke_team_invitations() from public,anon,authenticated;
drop trigger if exists commerce_revoke_team_invitations on public.commerce_memberships;
create trigger commerce_revoke_team_invitations after update on public.commerce_memberships
  for each row execute function public.commerce_revoke_team_invitations();

create or replace function public.management_team(p_seller uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare own boolean := public.commerce_is_owner(p_seller);
begin
  if not public.commerce_can_manage(p_seller) then raise exception 'Equipe indisponível para sua conta.' using errcode='42501'; end if;
  return jsonb_build_object(
    'seller_id',p_seller,'owner',own,'finance',public.commerce_manage_finance(p_seller),
    'members',coalesce((select jsonb_agg(jsonb_build_object(
      'id',m.id,'user_id',m.user_id,'name',m.representative_name,'active',m.active,
      'role',m.management_role,'finance',case when own then m.can_view_finance else null end,
      'joined_at',m.joined_at,'ended_at',m.ended_at,
      'customers',(select count(*) from public.trade_connections c where c.seller_id=p_seller and c.agent_id=m.user_id and c.active)
    ) order by m.active desc,m.representative_name,m.id) from public.commerce_memberships m where m.seller_id=p_seller),'[]'::jsonb),
    'invitations',coalesce((select jsonb_agg(jsonb_build_object(
      'id',i.id,'email',i.email,'token',case when i.status='pending' and i.expires_at>now() then i.token else null end,
      'role',i.management_role,'finance',case when own then i.can_view_finance else null end,
      'status',i.status,'expires_at',i.expires_at,'created_at',i.created_at
    ) order by i.created_at desc,i.id) from public.commerce_invitations i where i.seller_id=p_seller and (own or i.management_role='representative')),'[]'::jsonb)
  );
end;
$$;

create or replace function public.management_team_command(p_action text,p_data jsonb,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare
  u uuid := auth.uid(); sid uuid := (p_data->>'seller_id')::uuid; own boolean;
  fingerprint text := md5('team:'||p_action||p_data::text); old_hash text; res jsonb;
  email text := lower(btrim(coalesce(p_data->>'email','')));
  wanted_role text := coalesce(p_data->>'role','representative');
  finance boolean := coalesce((p_data->>'finance')::boolean,false);
  member public.commerce_memberships%rowtype; invitation public.commerce_invitations%rowtype;
  subject uuid;
begin
  if u is null or p_operation_id is null then raise exception 'Entre na sua conta para administrar a equipe.' using errcode='42501'; end if;
  perform 1 from auth.users where id=u for update;
  -- Serialize invitations and membership changes within the company.
  perform 1 from public.commerce_sellers where id=sid and kind='company' for update;
  perform 1 from public.commerce_memberships where seller_id=sid and user_id=u for update;
  if not public.commerce_can_manage(sid) then raise exception 'Você não pode administrar esta equipe.' using errcode='42501'; end if;
  own := public.commerce_is_owner(sid);
  select o.fingerprint,o.result into old_hash,res from public.trade_operations o where o.user_id=u and o.operation_id=p_operation_id;
  if found then
    if old_hash is distinct from fingerprint then raise exception 'Operação já utilizada com outros dados.'; end if;
    return res;
  end if;
  if p_action='invite' then
    if wanted_role not in ('representative','manager') or (wanted_role<>'manager' and finance) then raise exception 'Revise o papel e a permissão financeira.'; end if;
    if not own and (wanted_role<>'representative' or finance) then raise exception 'Somente o dono pode convidar gerentes e autorizar dados financeiros.' using errcode='42501'; end if;
    if length(email)>254 or email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'Informe um e-mail válido.'; end if;
    if exists(select 1 from public.commerce_sellers s join auth.users a on a.id=s.owner_id where s.id=sid and lower(a.email)=email) then raise exception 'Esta pessoa já é responsável pela empresa.'; end if;
    if exists(select 1 from public.commerce_memberships m join auth.users a on a.id=m.user_id where m.seller_id=sid and m.active and lower(a.email)=email) then raise exception 'Esta pessoa já possui um vínculo ativo. Altere suas permissões na equipe.'; end if;
    -- Managers cannot replace even expired manager invitations.
    if not own and exists(select 1 from public.commerce_invitations where seller_id=sid and commerce_invitations.email=email and status='pending' and management_role='manager') then raise exception 'Somente o dono pode alterar o convite deste gerente.' using errcode='42501'; end if;
    update public.commerce_invitations set status='revoked' where seller_id=sid and commerce_invitations.email=email and status='pending' and expires_at<=now();
    if exists(select 1 from public.commerce_invitations where seller_id=sid and commerce_invitations.email=email and status='pending') then raise exception 'Já existe um convite pendente para este e-mail.'; end if;
    insert into public.commerce_invitations(seller_id,email,management_role,can_view_finance,invited_by)
      values(sid,email,wanted_role,finance,u) returning id into subject;
  elsif p_action='revoke_invite' then
    select * into invitation from public.commerce_invitations where id=(p_data->>'invitation_id')::uuid and seller_id=sid for update;
    if not found or invitation.status<>'pending' then raise exception 'Convite indisponível. Atualize a equipe.'; end if;
    if not own and invitation.management_role='manager' then raise exception 'Somente o dono pode cancelar convites de gerentes.' using errcode='42501'; end if;
    update public.commerce_invitations set status='revoked' where id=invitation.id;
    subject := invitation.id;
  elsif p_action in ('set_role','remove_member') then
    if p_action='set_role' and not own then raise exception 'Somente o dono pode alterar permissões.' using errcode='42501'; end if;
    select * into member from public.commerce_memberships where id=(p_data->>'membership_id')::uuid and seller_id=sid and active
      and (own or management_role='representative') for update;
    if not found then raise exception 'Vínculo indisponível ou sem permissão para alterá-lo.' using errcode='42501'; end if;
    if member.management_role is distinct from p_data->>'expected_role'
      or (own and member.can_view_finance is distinct from (p_data->>'expected_finance')::boolean)
      then raise exception 'As permissões mudaram. Atualize a equipe antes de continuar.'; end if;
    subject := member.id;
    if p_action='set_role' then
      if wanted_role not in ('representative','manager') or (wanted_role<>'manager' and finance) then raise exception 'Revise o papel e a permissão financeira.'; end if;
      update public.commerce_memberships set management_role=wanted_role,can_view_finance=finance where id=member.id;
    else
      update public.commerce_memberships set active=false,ended_at=now() where id=member.id;
      update public.commerce_accounts set active_seller_id=null where user_id=member.user_id and active_seller_id=sid;
      -- Outstanding invitations cannot reactivate a just-removed member.
      update public.commerce_invitations set status='revoked' where seller_id=sid and status='pending' and commerce_invitations.email=(select lower(a.email) from auth.users a where a.id=member.user_id);
    end if;
  else raise exception 'Operação de equipe desconhecida.';
  end if;
  res := jsonb_build_object('id',subject,'seller_id',sid);
  insert into public.management_audit(seller_id,actor_id,action,details) values(sid,u,'team_'||p_action,
    jsonb_build_object('subject_id',subject,'role',case when p_action in ('invite','set_role') then wanted_role else null end,
      'finance',case when p_action in ('invite','set_role') then finance else null end));
  insert into public.trade_operations(user_id,operation_id,fingerprint,result) values(u,p_operation_id,fingerprint,res);
  return res;
end;
$$;

-- Keep legacy commercial commands and validate role grants when an invitation is accepted.
do $$ begin
  if to_regprocedure('public.commerce_command_before_team(text,jsonb)') is null then
    alter function public.commerce_command(text,jsonb) rename to commerce_command_before_team;
  end if;
end $$;
revoke all on function public.commerce_command_before_team(text,jsonb) from public,anon,authenticated;
create or replace function public.commerce_command(p_action text,p_data jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare invitation public.commerce_invitations%rowtype; sid uuid; res jsonb;
begin
  if p_action<>'accept_invite' then return public.commerce_command_before_team(p_action,p_data); end if;
  if auth.uid() is null then raise exception 'Entre na sua conta para continuar.' using errcode='42501'; end if;
  perform 1 from auth.users where id=auth.uid() for update;
  select seller_id into sid from public.commerce_invitations where token::text=btrim(p_data->>'token');
  perform 1 from public.commerce_sellers where id=sid for update;
  select * into invitation from public.commerce_invitations where token::text=btrim(p_data->>'token') for update;
  if invitation.invited_by is not null then
    perform 1 from public.commerce_memberships where seller_id=sid and user_id=invitation.invited_by for share;
    if not public.trade_agent_active(sid,invitation.invited_by)
      or not exists(select 1 from public.commerce_sellers s where s.id=sid and
        (s.owner_id=invitation.invited_by or (invitation.management_role='representative' and not invitation.can_view_finance and exists(
          select 1 from public.commerce_memberships m where m.seller_id=sid and m.user_id=invitation.invited_by and m.active and m.management_role='manager'))))
    then raise exception 'O responsável pelo convite não pode mais administrar esta empresa. Solicite um novo convite.' using errcode='42501'; end if;
  end if;
  res := public.commerce_command_before_team(p_action,p_data);
  update public.commerce_memberships set management_role=invitation.management_role,
    can_view_finance=(invitation.management_role='manager' and invitation.can_view_finance)
    where seller_id=invitation.seller_id and user_id=auth.uid() and active;
  insert into public.management_audit(seller_id,actor_id,action,details) values(invitation.seller_id,auth.uid(),'team_accept_invite',
    jsonb_build_object('invitation_id',invitation.id,'role',invitation.management_role));
  return res;
end;
$$;
revoke all on function public.management_team(uuid),public.management_team_command(text,jsonb,uuid),public.commerce_command(text,jsonb) from public,anon;
grant execute on function public.management_team(uuid),public.management_team_command(text,jsonb,uuid),public.commerce_command(text,jsonb) to authenticated;
commit;
