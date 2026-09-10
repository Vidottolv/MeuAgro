-- ============================================================
-- MEU AGRO - ETAPAS 21 E 22
-- Colheitas + Vendas
-- ============================================================
--
-- Execute uma única vez no SQL Editor do Supabase.
--
-- A Etapa 1 já criou harvests e harvest_sales.
-- Esta migration reforça a integridade e integra a colheita
-- à linha do tempo do ciclo.
-- ============================================================

begin;

-- ============================================================
-- 1. VÍNCULO ENTRE COLHEITA E EVENTO DA LINHA DO TEMPO
-- ============================================================

alter table public.harvests
  add column if not exists
    production_event_id uuid
    references public.production_events(id)
    on delete set null;

create unique index if not exists
  uq_harvests_production_event
on public.harvests(
  production_event_id
)
where production_event_id
  is not null;

-- ============================================================
-- 2. VALIDAÇÃO DA COLHEITA
-- ============================================================

create or replace function
  public.validate_harvest_record()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cycle_user uuid;
  v_cycle_deleted_at timestamptz;
  v_cycle_status text;
  v_planting_date date;
  v_sales_count bigint := 0;
  v_sold_quantity numeric :=
    0;
begin
  if tg_op = 'UPDATE' then
    if new.user_id
       is distinct from
       old.user_id then
      raise exception
        'O usuário da colheita não pode ser alterado.';
    end if;

    if new.production_cycle_id
       is distinct from
       old.production_cycle_id then
      raise exception
        'O ciclo produtivo da colheita não pode ser alterado.';
    end if;

    if
      old.production_event_id
        is not null
      and new.production_event_id
        is distinct from
        old.production_event_id
    then
      raise exception
        'O evento automático da colheita não pode ser alterado.';
    end if;
  end if;

  select
    pc.user_id,
    pc.deleted_at,
    pc.status,
    pc.planting_date
  into
    v_cycle_user,
    v_cycle_deleted_at,
    v_cycle_status,
    v_planting_date
  from public.production_cycles pc
  where pc.id =
    new.production_cycle_id;

  if v_cycle_user is null
     or v_cycle_user <>
       new.user_id then
    raise exception
      'Ciclo produtivo inválido para esta colheita.';
  end if;

  if tg_op = 'INSERT' then
    if v_cycle_deleted_at
       is not null then
      raise exception
        'Não é possível registrar colheita em um ciclo arquivado.';
    end if;

    if v_cycle_status in (
      'harvested',
      'closed',
      'cancelled'
    ) then
      raise exception
        'O ciclo produtivo já está encerrado para novas colheitas.';
    end if;
  end if;

  if new.harvest_date <
     v_planting_date then
    raise exception
      'A data da colheita não pode ser anterior à data do plantio.';
  end if;

  if new.quantity <= 0 then
    raise exception
      'A quantidade colhida deve ser maior que zero.';
  end if;

  new.unit :=
    nullif(
      trim(new.unit),
      ''
    );

  if new.unit is null then
    raise exception
      'A unidade da colheita é obrigatória.';
  end if;

  if tg_op = 'UPDATE' then
    select
      count(*),
      coalesce(
        sum(s.quantity),
        0
      )
    into
      v_sales_count,
      v_sold_quantity
    from public.harvest_sales s
    where s.harvest_id =
      new.id;

    if v_sales_count > 0 then
      if new.unit
         is distinct from
         old.unit then
        raise exception
          'A unidade da colheita não pode ser alterada depois que existem vendas.';
      end if;

      if new.quantity <
         v_sold_quantity then
        raise exception
          'A quantidade colhida não pode ser menor que a quantidade já vendida.';
      end if;

      if new.destination not in (
        'sale',
        'own_consumption_and_sale'
      ) then
        raise exception
          'Uma colheita com vendas registradas precisa manter um destino que permita venda.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_validate_harvest_record
on public.harvests;

create trigger
  trg_validate_harvest_record
before insert or update
on public.harvests
for each row
execute function
  public.validate_harvest_record();

-- ============================================================
-- 3. EVENTO AUTOMÁTICO DE COLHEITA
-- ============================================================

create or replace function
  public.sync_harvest_timeline_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_timezone text;
  v_destination_label text;
  v_occurred_at timestamptz;
begin
  v_timezone :=
    coalesce(
      (
        select
          np.timezone
        from
          public.notification_preferences np
        where
          np.user_id =
            new.user_id
      ),
      'America/Sao_Paulo'
    );

  begin
    v_occurred_at :=
      (
        new.harvest_date
        + time '12:00'
      )
      at time zone
        v_timezone;
  exception
    when invalid_parameter_value then
      v_occurred_at :=
        (
          new.harvest_date
          + time '12:00'
        )
        at time zone
          'America/Sao_Paulo';
  end;

  v_destination_label :=
    case new.destination
      when 'own_consumption'
        then 'Consumo próprio'
      when 'sale'
        then 'Venda'
      when 'own_consumption_and_sale'
        then 'Consumo próprio e venda'
      when 'donation'
        then 'Doação'
      when 'loss'
        then 'Perda'
      else 'Outro'
    end;

  if new.production_event_id
     is null then
    insert into
      public.production_events (
        user_id,
        production_cycle_id,
        event_type,
        title,
        description,
        notes,
        occurred_at
      )
    values (
      new.user_id,
      new.production_cycle_id,
      'harvest',
      'Colheita registrada',
      format(
        '%s %s colhidos. Destino: %s.',
        new.quantity,
        new.unit,
        v_destination_label
      ),
      new.notes,
      v_occurred_at
    )
    returning id
      into v_event_id;

    update
      public.harvests
    set
      production_event_id =
        v_event_id
    where
      id = new.id
      and production_event_id
        is null;

    return new;
  end if;

  update
    public.production_events
  set
    production_cycle_id =
      new.production_cycle_id,
    event_type =
      'harvest',
    title =
      'Colheita registrada',
    description =
      format(
        '%s %s colhidos. Destino: %s.',
        new.quantity,
        new.unit,
        v_destination_label
      ),
    notes =
      new.notes,
    occurred_at =
      v_occurred_at
  where
    id =
      new.production_event_id
    and user_id =
      new.user_id;

  return new;
end;
$$;

-- Antes de ligar o trigger, cria eventos para colheitas antigas.
do $$
declare
  v_harvest record;
  v_event_id uuid;
  v_timezone text;
  v_occurred_at timestamptz;
  v_destination_label text;
begin
  for v_harvest in
    select
      src_h.*
    from
      public.harvests src_h
    where
      src_h.production_event_id
        is null
  loop
    v_timezone :=
      coalesce(
        (
          select
            np.timezone
          from
            public.notification_preferences np
          where
            np.user_id =
              v_harvest.user_id
        ),
        'America/Sao_Paulo'
      );

    begin
      v_occurred_at :=
        (
          v_harvest.harvest_date
          + time '12:00'
        )
        at time zone
          v_timezone;
    exception
      when invalid_parameter_value then
        v_occurred_at :=
          (
            v_harvest.harvest_date
            + time '12:00'
          )
          at time zone
            'America/Sao_Paulo';
    end;

    v_destination_label :=
      case v_harvest.destination
        when 'own_consumption'
          then 'Consumo próprio'
        when 'sale'
          then 'Venda'
        when 'own_consumption_and_sale'
          then 'Consumo próprio e venda'
        when 'donation'
          then 'Doação'
        when 'loss'
          then 'Perda'
        else 'Outro'
      end;

    insert into
      public.production_events (
        user_id,
        production_cycle_id,
        event_type,
        title,
        description,
        notes,
        occurred_at
      )
    values (
      v_harvest.user_id,
      v_harvest.production_cycle_id,
      'harvest',
      'Colheita registrada',
      format(
        '%s %s colhidos. Destino: %s.',
        v_harvest.quantity,
        v_harvest.unit,
        v_destination_label
      ),
      v_harvest.notes,
      v_occurred_at
    )
    returning id
      into v_event_id;

    update
      public.harvests
    set
      production_event_id =
        v_event_id
    where
      id = v_harvest.id;
  end loop;
end
$$;

drop trigger if exists
  trg_sync_harvest_timeline_event
on public.harvests;

create trigger
  trg_sync_harvest_timeline_event
after insert or update of
  harvest_date,
  quantity,
  unit,
  destination,
  notes,
  production_event_id
on public.harvests
for each row
execute function
  public.sync_harvest_timeline_event();

-- ============================================================
-- 4. VALIDAÇÃO DAS VENDAS
-- ============================================================

create or replace function
  public.validate_harvest_sale()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_harvest_user uuid;
  v_harvest_quantity numeric;
  v_harvest_unit text;
  v_harvest_destination text;
  v_harvest_date date;
  v_other_sales_quantity numeric :=
    0;
begin
  if tg_op = 'UPDATE' then
    if new.user_id
       is distinct from
       old.user_id then
      raise exception
        'O usuário da venda não pode ser alterado.';
    end if;

    if new.harvest_id
       is distinct from
       old.harvest_id then
      raise exception
        'A colheita vinculada à venda não pode ser alterada.';
    end if;
  end if;

  select
    h.user_id,
    h.quantity,
    h.unit,
    h.destination,
    h.harvest_date
  into
    v_harvest_user,
    v_harvest_quantity,
    v_harvest_unit,
    v_harvest_destination,
    v_harvest_date
  from public.harvests h
  where h.id =
    new.harvest_id;

  if v_harvest_user is null
     or v_harvest_user <>
       new.user_id then
    raise exception
      'Colheita inválida para esta venda.';
  end if;

  if v_harvest_destination not in (
    'sale',
    'own_consumption_and_sale'
  ) then
    raise exception
      'O destino desta colheita não permite registrar vendas.';
  end if;

  if new.quantity <= 0 then
    raise exception
      'A quantidade vendida deve ser maior que zero.';
  end if;

  if new.unit_price < 0 then
    raise exception
      'O preço unitário não pode ser negativo.';
  end if;

  if new.sale_date <
     v_harvest_date then
    raise exception
      'A data da venda não pode ser anterior à data da colheita.';
  end if;

  -- A unidade da venda sempre acompanha a unidade da colheita.
  new.unit :=
    v_harvest_unit;

  select
    coalesce(
      sum(s.quantity),
      0
    )
  into
    v_other_sales_quantity
  from
    public.harvest_sales s
  where
    s.harvest_id =
      new.harvest_id
    and (
      tg_op = 'INSERT'
      or s.id <> new.id
    );

  if
    v_other_sales_quantity
    + new.quantity
    > v_harvest_quantity
  then
    raise exception
      'A quantidade total vendida não pode ultrapassar a quantidade colhida.';
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_validate_harvest_sale
on public.harvest_sales;

create trigger
  trg_validate_harvest_sale
before insert or update
on public.harvest_sales
for each row
execute function
  public.validate_harvest_sale();

-- Corrige unidade de registros antigos para acompanhar a colheita.
update
  public.harvest_sales s
set
  unit =
    h.unit
from
  public.harvests h
where
  h.id =
    s.harvest_id
  and s.unit
    is distinct from
    h.unit;

-- ============================================================
-- 5. MARCAR O CICLO COMO COLHIDO
-- ============================================================

create or replace function
  public.finalize_cycle_from_harvest(
    p_harvest_id uuid
  )
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid :=
    auth.uid();

  v_cycle_id uuid;
  v_harvest_date date;
  v_cycle_status text;
begin
  if v_user_id is null then
    raise exception
      'Usuário não autenticado.';
  end if;

  select
    h.production_cycle_id,
    h.harvest_date,
    pc.status
  into
    v_cycle_id,
    v_harvest_date,
    v_cycle_status
  from
    public.harvests h
  join
    public.production_cycles pc
    on pc.id =
      h.production_cycle_id
  where
    h.id =
      p_harvest_id
    and h.user_id =
      v_user_id
    and pc.user_id =
      v_user_id;

  if v_cycle_id is null then
    raise exception
      'Colheita não encontrada para este usuário.';
  end if;

  if v_cycle_status in (
    'closed',
    'cancelled'
  ) then
    raise exception
      'Este ciclo não pode ser marcado como colhido a partir da situação atual.';
  end if;

  update
    public.production_cycles
  set
    status =
      'harvested',
    final_harvest_date =
      v_harvest_date
  where
    id =
      v_cycle_id
    and user_id =
      v_user_id;

  return v_cycle_id;
end;
$$;

revoke all
on function
  public.finalize_cycle_from_harvest(
    uuid
  )
from public;

grant execute
on function
  public.finalize_cycle_from_harvest(
    uuid
  )
to authenticated;

-- ============================================================
-- 6. RLS / ÍNDICES
-- ============================================================

alter table
  public.harvests
enable row level security;

alter table
  public.harvest_sales
enable row level security;

drop policy if exists
  harvests_all_own
on public.harvests;

drop policy if exists
  harvests_select_own
on public.harvests;

drop policy if exists
  harvests_insert_own
on public.harvests;

drop policy if exists
  harvests_update_own
on public.harvests;

create policy
  harvests_select_own
on public.harvests
for select
to authenticated
using (
  user_id = auth.uid()
);

create policy
  harvests_insert_own
on public.harvests
for insert
to authenticated
with check (
  user_id = auth.uid()
);

create policy
  harvests_update_own
on public.harvests
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

-- Sem policy de DELETE:
-- colheitas permanecem no histórico.

drop policy if exists
  harvest_sales_all_own
on public.harvest_sales;

drop policy if exists
  harvest_sales_select_own
on public.harvest_sales;

drop policy if exists
  harvest_sales_insert_own
on public.harvest_sales;

drop policy if exists
  harvest_sales_update_own
on public.harvest_sales;

create policy
  harvest_sales_select_own
on public.harvest_sales
for select
to authenticated
using (
  user_id = auth.uid()
);

create policy
  harvest_sales_insert_own
on public.harvest_sales
for insert
to authenticated
with check (
  user_id = auth.uid()
);

create policy
  harvest_sales_update_own
on public.harvest_sales
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

-- Sem policy de DELETE:
-- vendas permanecem no histórico.

create index if not exists
  idx_harvests_user_cycle_date
on public.harvests(
  user_id,
  production_cycle_id,
  harvest_date desc
);

create index if not exists
  idx_harvest_sales_user_harvest_date
on public.harvest_sales(
  user_id,
  harvest_id,
  sale_date desc
);

commit;
