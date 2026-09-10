-- ============================================================
-- MEU AGRO - ETAPAS 11, 12 E 13
-- Linha do tempo + Fotos + Insumos
-- ============================================================
--
-- Execute uma única vez no SQL Editor do Supabase.
--
-- As tabelas production_events, event_photos e agricultural_inputs,
-- bem como o bucket meu-agro-photos, já foram criados na Etapa 1.
-- Este script reforça a integridade e ativa os comportamentos usados
-- pelo frontend destas etapas.
-- ============================================================

begin;

-- ============================================================
-- ETAPA 11 - EVENTOS
-- ============================================================

-- O prompt diferencia "Adubação" de "Fertilização".
-- A estrutura inicial possuía apenas fertilization.
-- Adicionamos o código interno manuring para representar Adubação.

alter table public.production_events
  drop constraint if exists
    production_events_event_type_check;

alter table public.production_events
  add constraint
    production_events_event_type_check
  check (
    event_type in (
      'planting',
      'irrigation',
      'manuring',
      'fertilization',
      'spraying',
      'defensive_application',
      'weeding',
      'pruning',
      'pest',
      'disease',
      'analysis',
      'observation',
      'photo',
      'harvest',
      'other'
    )
  );

-- Garante que um evento pertença ao mesmo usuário do ciclo.
-- A validação é executada na criação ou quando a referência muda.
-- Edições comuns de um evento histórico permanecem possíveis mesmo
-- se o ciclo tiver sido arquivado posteriormente.

create or replace function public.validate_production_event_reference()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_validate boolean := false;
  v_cycle_user uuid;
begin
  if tg_op = 'INSERT' then
    v_validate := true;
  else
    v_validate :=
      new.user_id is distinct from old.user_id
      or new.production_cycle_id
        is distinct from old.production_cycle_id;
  end if;

  if v_validate then
    select pc.user_id
      into v_cycle_user
    from public.production_cycles pc
    where pc.id = new.production_cycle_id
      and pc.deleted_at is null;

    if v_cycle_user is null
       or v_cycle_user <> new.user_id then
      raise exception
        'Ciclo produtivo inválido para este evento.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_validate_production_event_reference
on public.production_events;

-- Todo ciclo deve possuir um evento inicial de plantio.
-- Primeiro fazemos o backfill dos ciclos já existentes, inclusive
-- ciclos arquivados, antes de ativar a validação para novos eventos.

insert into public.production_events (
  user_id,
  production_cycle_id,
  event_type,
  title,
  description,
  occurred_at
)
select
  pc.user_id,
  pc.id,
  'planting',
  'Plantio registrado',
  'Início do ciclo produtivo.',
  (
    pc.planting_date::timestamp
    + interval '12 hours'
  )::timestamptz
from public.production_cycles pc
where not exists (
  select 1
  from public.production_events pe
  where pe.production_cycle_id = pc.id
    and pe.event_type = 'planting'
);

create trigger
  trg_validate_production_event_reference
before insert or update of
  user_id,
  production_cycle_id
on public.production_events
for each row
execute function
  public.validate_production_event_reference();

-- Novos ciclos recebem o evento automaticamente.
-- Se a data de plantio for corrigida, o evento automático também
-- acompanha a nova data, desde que ainda possua o título padrão.

create or replace function public.sync_initial_planting_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  if tg_op = 'INSERT' then
    insert into public.production_events (
      user_id,
      production_cycle_id,
      event_type,
      title,
      description,
      occurred_at
    )
    values (
      new.user_id,
      new.id,
      'planting',
      'Plantio registrado',
      'Início do ciclo produtivo.',
      (
        new.planting_date::timestamp
        + interval '12 hours'
      )::timestamptz
    );

    return new;
  end if;

  if new.planting_date
       is distinct from old.planting_date then

    select pe.id
      into v_event_id
    from public.production_events pe
    where pe.production_cycle_id = new.id
      and pe.event_type = 'planting'
      and pe.title = 'Plantio registrado'
    order by pe.created_at
    limit 1;

    if v_event_id is not null then
      update public.production_events
      set
        occurred_at = (
          new.planting_date::timestamp
          + interval '12 hours'
        )::timestamptz,
        updated_at = now()
      where id = v_event_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_sync_initial_planting_event
on public.production_cycles;

create trigger
  trg_sync_initial_planting_event
after insert or update of planting_date
on public.production_cycles
for each row
execute function
  public.sync_initial_planting_event();

create index if not exists
  idx_production_events_user_occurred_at
on public.production_events(
  user_id,
  occurred_at desc
);

-- ============================================================
-- ETAPA 12 - FOTOS E EVOLUÇÃO VISUAL
-- ============================================================

-- A foto deve refletir a mesma propriedade e área do ciclo.
-- Quando houver evento relacionado, ele precisa pertencer ao ciclo.

create or replace function public.validate_event_photo_references()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_validate boolean := false;

  v_cycle_user uuid;
  v_cycle_property uuid;
  v_cycle_area uuid;

  v_event_user uuid;
  v_event_cycle uuid;
begin
  if tg_op = 'INSERT' then
    v_validate := true;
  else
    v_validate :=
      new.user_id is distinct from old.user_id
      or new.property_id is distinct from old.property_id
      or new.area_id is distinct from old.area_id
      or new.production_cycle_id
        is distinct from old.production_cycle_id
      or new.production_event_id
        is distinct from old.production_event_id
      or new.storage_path
        is distinct from old.storage_path;
  end if;

  if v_validate then
    select
      pc.user_id,
      pc.property_id,
      pc.area_id
      into
        v_cycle_user,
        v_cycle_property,
        v_cycle_area
    from public.production_cycles pc
    join public.properties p
      on p.id = pc.property_id
      and p.deleted_at is null
    join public.areas a
      on a.id = pc.area_id
      and a.deleted_at is null
    where pc.id = new.production_cycle_id
      and pc.deleted_at is null;

    if v_cycle_user is null
       or v_cycle_user <> new.user_id then
      raise exception
        'Ciclo produtivo inválido para a fotografia.';
    end if;

    if v_cycle_property <> new.property_id then
      raise exception
        'A propriedade da fotografia não corresponde ao ciclo.';
    end if;

    if v_cycle_area <> new.area_id then
      raise exception
        'A área da fotografia não corresponde ao ciclo.';
    end if;

    if new.production_event_id is not null then
      select
        pe.user_id,
        pe.production_cycle_id
        into
          v_event_user,
          v_event_cycle
      from public.production_events pe
      where pe.id = new.production_event_id;

      if v_event_user is null
         or v_event_user <> new.user_id
         or v_event_cycle <> new.production_cycle_id then
        raise exception
          'O evento informado não pertence ao ciclo da fotografia.';
      end if;
    end if;

    if new.storage_path not like
       new.user_id::text || '/%' then
      raise exception
        'Caminho de Storage inválido para este usuário.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_validate_event_photo_references
on public.event_photos;

create trigger
  trg_validate_event_photo_references
before insert or update of
  user_id,
  property_id,
  area_id,
  production_cycle_id,
  production_event_id,
  storage_path
on public.event_photos
for each row
execute function
  public.validate_event_photo_references();

create index if not exists
  idx_event_photos_user_captured_at
on public.event_photos(
  user_id,
  captured_at desc
);

-- Reforça o bucket privado e as políticas por pasta do usuário.
-- Caminho utilizado pelo frontend:
-- <user>/<property>/<cycle>/<arquivo>

insert into storage.buckets (
  id,
  name,
  public
)
values (
  'meu-agro-photos',
  'meu-agro-photos',
  false
)
on conflict (id)
do update
set public = false;

drop policy if exists
  "Meu Agro photos select own"
on storage.objects;

drop policy if exists
  "Meu Agro photos insert own"
on storage.objects;

drop policy if exists
  "Meu Agro photos update own"
on storage.objects;

drop policy if exists
  "Meu Agro photos delete own"
on storage.objects;

create policy
  "Meu Agro photos select own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'meu-agro-photos'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

create policy
  "Meu Agro photos insert own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'meu-agro-photos'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

create policy
  "Meu Agro photos update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'meu-agro-photos'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
)
with check (
  bucket_id = 'meu-agro-photos'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

create policy
  "Meu Agro photos delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'meu-agro-photos'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

-- ============================================================
-- ETAPA 13 - INSUMOS
-- ============================================================

-- A tabela e o RLS já existem desde a Etapa 1.
-- Mantemos o saldo fora do cadastro: estoque continua derivado de
-- inventory_transactions / inventory_balances.

create index if not exists
  idx_inputs_user_active_name
on public.agricultural_inputs(
  user_id,
  active,
  name
)
where deleted_at is null;

-- A view passa a informar se o insumo está ativo. O campo é adicionado
-- ao final para manter compatibilidade com as colunas já existentes.

create or replace view public.inventory_balances
with (security_invoker = true)
as
select
  i.id as agricultural_input_id,
  i.user_id,
  i.name,
  i.brand,
  i.base_unit,
  i.minimum_stock,
  i.ideal_stock,
  coalesce(
    sum(
      public.inventory_transaction_sign(t.transaction_type)
      * t.quantity
    ),
    0
  )::numeric(14,4) as current_quantity,
  case
    when coalesce(
      sum(
        public.inventory_transaction_sign(t.transaction_type)
        * t.quantity
      ),
      0
    ) <= 0 then 'out_of_stock'
    when coalesce(
      sum(
        public.inventory_transaction_sign(t.transaction_type)
        * t.quantity
      ),
      0
    ) <= i.minimum_stock then 'low_stock'
    else 'normal'
  end as stock_status,
  i.active as active
from public.agricultural_inputs i
left join public.inventory_transactions t
  on t.agricultural_input_id = i.id
where i.deleted_at is null
group by
  i.id,
  i.user_id,
  i.name,
  i.brand,
  i.base_unit,
  i.minimum_stock,
  i.ideal_stock,
  i.active;

-- O indicador do Dashboard ignora produtos desativados.

create or replace function public.dashboard_summary()
returns table (
  properties_count bigint,
  active_areas_count bigint,
  active_cycles_count bigint,
  near_harvest_count bigint,
  low_stock_count bigint,
  month_harvests_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (
      select count(*)
      from public.properties p
      where p.user_id = auth.uid()
        and p.deleted_at is null
        and p.status = 'active'
    ),
    (
      select count(*)
      from public.areas a
      where a.user_id = auth.uid()
        and a.deleted_at is null
        and a.status = 'active'
    ),
    (
      select count(*)
      from public.production_cycles pc
      where pc.user_id = auth.uid()
        and pc.deleted_at is null
        and pc.status in (
          'planned',
          'planted',
          'developing',
          'near_harvest',
          'ready_to_harvest'
        )
    ),
    (
      select count(*)
      from public.production_cycles pc
      where pc.user_id = auth.uid()
        and pc.deleted_at is null
        and pc.status not in (
          'closed',
          'cancelled',
          'harvested'
        )
        and pc.current_harvest_forecast
          between current_date
          and current_date + 7
    ),
    (
      select count(*)
      from public.inventory_balances ib
      where ib.user_id = auth.uid()
        and ib.active = true
        and ib.stock_status in (
          'low_stock',
          'out_of_stock'
        )
    ),
    (
      select count(*)
      from public.harvests h
      where h.user_id = auth.uid()
        and date_trunc(
          'month',
          h.harvest_date::timestamp
        ) = date_trunc(
          'month',
          current_date::timestamp
        )
    );
$$;

commit;
