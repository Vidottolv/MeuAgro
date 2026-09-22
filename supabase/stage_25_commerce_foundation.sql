-- Meu Agro 0.18.0 | Consultor 1/5. Execute no SQL Editor como postgres.
-- Aditiva e transacional. Não altera os contatos privados de consultants.
begin;

create table if not exists public.commerce_accounts (
  user_id uuid primary key references auth.users(id),
  display_name text not null check (length(btrim(display_name)) between 2 and 120),
  enabled boolean not null default true,
  active_seller_id uuid,
  created_at timestamptz not null default now()
);
create table if not exists public.commerce_sellers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  kind text not null check (kind in ('personal','company')),
  name text not null check (length(btrim(name)) between 2 and 120),
  email text not null default '' check (length(email) <= 254),
  phone text not null default '' check (length(phone) <= 40),
  created_at timestamptz not null default now()
);
create unique index if not exists commerce_one_personal_seller on public.commerce_sellers(owner_id) where kind='personal';
create table if not exists public.commerce_memberships (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.commerce_sellers(id),
  user_id uuid not null references auth.users(id),
  representative_name text not null,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  unique(seller_id,user_id)
);
create table if not exists public.commerce_invitations (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.commerce_sellers(id),
  email text not null check (email=lower(btrim(email)) and length(email) between 3 and 254),
  token uuid not null unique default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  expires_at timestamptz not null default now()+interval '7 days',
  accepted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create unique index if not exists commerce_one_pending_invite on public.commerce_invitations(seller_id,email) where status='pending';
create table if not exists public.commerce_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  seller_id uuid references public.commerce_sellers(id),
  action text not null,
  subject_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists commerce_member_user on public.commerce_memberships(user_id);
create index if not exists commerce_seller_owner on public.commerce_sellers(owner_id);
create index if not exists commerce_audit_seller on public.commerce_audit(seller_id,created_at desc);

-- Helpers não consultam as tabelas por RLS: evitam recursão nas policies.
create or replace function public.commerce_is_owner(p_seller uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.commerce_sellers where id=p_seller and owner_id=auth.uid());
$$;
create or replace function public.commerce_can_read(p_seller uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.commerce_is_owner(p_seller) or exists(
    select 1 from public.commerce_memberships where seller_id=p_seller and user_id=auth.uid());
$$;
create or replace function public.commerce_can_act(p_seller uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.commerce_is_owner(p_seller) or exists(
    select 1 from public.commerce_memberships where seller_id=p_seller and user_id=auth.uid() and active);
$$;

alter table public.commerce_accounts enable row level security;
alter table public.commerce_sellers enable row level security;
alter table public.commerce_memberships enable row level security;
alter table public.commerce_invitations enable row level security;
alter table public.commerce_audit enable row level security;
drop policy if exists commerce_account_read on public.commerce_accounts;
create policy commerce_account_read on public.commerce_accounts for select to authenticated using(user_id=auth.uid());
drop policy if exists commerce_seller_read on public.commerce_sellers;
create policy commerce_seller_read on public.commerce_sellers for select to authenticated using(public.commerce_can_read(id));
drop policy if exists commerce_member_read on public.commerce_memberships;
create policy commerce_member_read on public.commerce_memberships for select to authenticated using(user_id=auth.uid() or public.commerce_is_owner(seller_id));
drop policy if exists commerce_invite_read on public.commerce_invitations;
create policy commerce_invite_read on public.commerce_invitations for select to authenticated using(public.commerce_is_owner(seller_id));
drop policy if exists commerce_audit_read on public.commerce_audit;
create policy commerce_audit_read on public.commerce_audit for select to authenticated using(actor_id=auth.uid() or public.commerce_is_owner(seller_id));
revoke all on public.commerce_accounts,public.commerce_sellers,public.commerce_memberships,public.commerce_invitations,public.commerce_audit from anon,authenticated;
grant select on public.commerce_accounts,public.commerce_sellers,public.commerce_memberships,public.commerce_invitations,public.commerce_audit to authenticated;

-- Única entrada de escrita; proprietário e usuário derivam da sessão, nunca do cliente.
create or replace function public.commerce_command(p_action text,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_seller uuid; v_subject uuid;
  v_name text := btrim(coalesce(p_data->>'name',''));
  v_email text := lower(btrim(coalesce(p_data->>'email','')));
  v_phone text := btrim(coalesce(p_data->>'phone',''));
  v_inv public.commerce_invitations%rowtype;
  v_member public.commerce_memberships%rowtype;
  v_result jsonb := '{}'::jsonb;
begin
  if v_user is null then raise exception 'Entre na sua conta para continuar.' using errcode='42501'; end if;
  -- Serializa comandos da mesma conta; operações sobre convites também usam row lock.
  perform 1 from auth.users where id=v_user for update;
  if p_action='enable' then
    if length(v_name) not between 2 and 120 then raise exception 'Informe um nome entre 2 e 120 caracteres.'; end if;
    insert into public.commerce_accounts(user_id,display_name) values(v_user,v_name)
      on conflict(user_id) do update set display_name=excluded.display_name,enabled=true;
    insert into public.commerce_sellers(owner_id,kind,name) values(v_user,'personal',v_name)
      on conflict(owner_id) where kind='personal' do update set name=excluded.name
      returning id into v_seller;
  else
    if not exists(select 1 from public.commerce_accounts where user_id=v_user and enabled) then
      raise exception 'Ative seu perfil de consultor primeiro.' using errcode='42501';
    end if;
    if p_action in ('create_company','update_seller') then
      if length(v_name) not between 2 and 120 or length(v_email)>254 or length(v_phone)>40 then raise exception 'Revise nome e dados de contato.'; end if;
      if v_email<>'' and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'Informe um e-mail válido.'; end if;
      if p_action='create_company' then
        insert into public.commerce_sellers(owner_id,kind,name,email,phone) values(v_user,'company',v_name,v_email,v_phone) returning id into v_seller;
      else
        v_seller := (p_data->>'seller_id')::uuid;
        if not public.commerce_is_owner(v_seller) then raise exception 'Somente o responsável pode editar este cadastro.' using errcode='42501'; end if;
        update public.commerce_sellers set name=v_name,email=v_email,phone=v_phone where id=v_seller;
        if exists(select 1 from public.commerce_sellers where id=v_seller and kind='personal') then
          update public.commerce_accounts set display_name=v_name where user_id=v_user;
          update public.commerce_memberships set representative_name=v_name where user_id=v_user;
        end if;
      end if;
    elsif p_action='select_seller' then
      v_seller := (p_data->>'seller_id')::uuid;
      if not public.commerce_can_act(v_seller) then raise exception 'Você não possui um vínculo ativo com este vendedor.' using errcode='42501'; end if;
      update public.commerce_accounts set active_seller_id=v_seller where user_id=v_user;
    elsif p_action='invite' then
      v_seller := (p_data->>'seller_id')::uuid;
      if not public.commerce_is_owner(v_seller) or not exists(select 1 from public.commerce_sellers where id=v_seller and kind='company') then raise exception 'Somente o responsável pela empresa pode convidar.' using errcode='42501'; end if;
      if length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'Informe o e-mail do representante.'; end if;
      if exists(select 1 from auth.users where id=v_user and lower(email)=v_email) then raise exception 'Você já é responsável por esta empresa.'; end if;
      update public.commerce_invitations set status='revoked' where seller_id=v_seller and email=v_email and status='pending' and expires_at<=now();
      if exists(select 1 from public.commerce_invitations where seller_id=v_seller and email=v_email and status='pending') then raise exception 'Já existe um convite pendente para este e-mail.'; end if;
      insert into public.commerce_invitations(seller_id,email) values(v_seller,v_email) returning id into v_subject;
      v_result := jsonb_build_object('invitation_id',v_subject);
    elsif p_action='accept_invite' then
      select * into v_inv from public.commerce_invitations where token=(p_data->>'token')::uuid for update;
      if not found or v_inv.status<>'pending' or v_inv.expires_at<=now() then raise exception 'Convite inválido, expirado ou já utilizado.'; end if;
      if not exists(select 1 from auth.users where id=v_user and lower(email)=v_inv.email and email_confirmed_at is not null) then
        raise exception 'Entre com o e-mail confirmado ao qual o convite foi destinado.' using errcode='42501';
      end if;
      v_seller := v_inv.seller_id;
      if public.commerce_is_owner(v_seller) then raise exception 'Você já é responsável por esta empresa.'; end if;
      select display_name into v_name from public.commerce_accounts where user_id=v_user;
      insert into public.commerce_memberships(seller_id,user_id,representative_name) values(v_seller,v_user,v_name)
        on conflict(seller_id,user_id) do update set active=true,ended_at=null,joined_at=now(),representative_name=excluded.representative_name returning id into v_subject;
      update public.commerce_invitations set status='accepted',accepted_by=v_user where id=v_inv.id;
    elsif p_action='revoke_invite' then
      select * into v_inv from public.commerce_invitations where id=(p_data->>'invitation_id')::uuid for update;
      if not found or not public.commerce_is_owner(v_inv.seller_id) then raise exception 'Você não pode cancelar este convite.' using errcode='42501'; end if;
      if v_inv.status<>'pending' then raise exception 'Este convite não está pendente.'; end if;
      v_seller := v_inv.seller_id; v_subject := v_inv.id;
      update public.commerce_invitations set status='revoked' where id=v_inv.id;
    elsif p_action='end_membership' then
      select * into v_member from public.commerce_memberships where id=(p_data->>'membership_id')::uuid for update;
      if not found or not (public.commerce_is_owner(v_member.seller_id) or v_member.user_id=v_user) then raise exception 'Você não pode encerrar este vínculo.' using errcode='42501'; end if;
      if not v_member.active then raise exception 'Este vínculo já foi encerrado.'; end if;
      v_seller := v_member.seller_id; v_subject := v_member.id;
      update public.commerce_memberships set active=false,ended_at=now() where id=v_member.id;
      update public.commerce_accounts set active_seller_id=null where user_id=v_member.user_id and active_seller_id=v_seller;
    else raise exception 'Operação comercial desconhecida.';
    end if;
  end if;
  insert into public.commerce_audit(actor_id,seller_id,action,subject_id) values(v_user,v_seller,p_action,v_subject);
  return v_result || jsonb_build_object('seller_id',v_seller);
end;
$$;

revoke all on function public.commerce_is_owner(uuid),public.commerce_can_read(uuid),public.commerce_can_act(uuid),public.commerce_command(text,jsonb) from public,anon;
grant execute on function public.commerce_is_owner(uuid),public.commerce_can_read(uuid),public.commerce_can_act(uuid),public.commerce_command(text,jsonb) to authenticated;
comment on table public.commerce_sellers is 'Identidades comerciais; cadastro não equivale a verificação documental da empresa.';
commit;
