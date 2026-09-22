-- ============================================================
-- MEU AGRO - ETAPAS 16, 17 E 18
-- Uso de insumos em eventos + Consultores + WhatsApp
-- ============================================================
--
-- Execute uma única vez no SQL Editor do Supabase.
--
-- O WhatsApp não depende de função de banco:
-- o frontend apenas monta um deep link e exige clique do usuário.
--
-- Esta migration reforça:
-- 1. consumo de insumo sempre associado a evento/ciclo;
-- 2. lote e insumo pertencentes ao mesmo usuário;
-- 3. unidade e custo capturados do lote no banco;
-- 4. saída automática com a data do evento;
-- 5. INSERT manual de inventory_transactions restrito a ajustes;
-- 6. índices para consultores e consumos.
-- ============================================================

begin;

-- ============================================================
-- 1. USO DE INSUMOS EM EVENTOS
-- ============================================================

create or replace function public.handle_event_input_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle_id uuid;
  v_event_occurred_at timestamptz;
  v_cycle_deleted_at timestamptz;

  v_lot_user uuid;
  v_lot_input uuid;
  v_lot_unit text;
  v_lot_unit_price numeric;
  v_lot_deleted_at timestamptz;

  v_input_user uuid;
  v_input_active boolean;
  v_input_deleted_at timestamptz;

  v_transaction_id uuid;
begin
  -- Evento e ciclo precisam pertencer ao usuário do consumo.
  select
    e.production_cycle_id,
    e.occurred_at,
    c.deleted_at
    into
      v_cycle_id,
      v_event_occurred_at,
      v_cycle_deleted_at
  from public.production_events e
  join public.production_cycles c
    on c.id = e.production_cycle_id
  where e.id = new.production_event_id
    and e.user_id = new.user_id
    and c.user_id = new.user_id;

  if v_cycle_id is null then
    raise exception
      'Evento inválido para este usuário.';
  end if;

  if v_cycle_deleted_at is not null then
    raise exception
      'Não é possível registrar consumo em um ciclo arquivado.';
  end if;

  -- Insumo precisa estar ativo.
  select
    i.user_id,
    i.active,
    i.deleted_at
    into
      v_input_user,
      v_input_active,
      v_input_deleted_at
  from public.agricultural_inputs i
  where i.id = new.agricultural_input_id;

  if v_input_user is null
     or v_input_user <> new.user_id
     or v_input_deleted_at is not null
     or coalesce(v_input_active, false) = false then
    raise exception
      'Insumo inválido ou inativo para este usuário.';
  end if;

  -- O lote define unidade e custo. O frontend não é fonte de verdade.
  select
    l.user_id,
    l.agricultural_input_id,
    l.unit,
    l.unit_price,
    l.deleted_at
    into
      v_lot_user,
      v_lot_input,
      v_lot_unit,
      v_lot_unit_price,
      v_lot_deleted_at
  from public.inventory_lots l
  where l.id = new.inventory_lot_id;

  if v_lot_user is null
     or v_lot_user <> new.user_id
     or v_lot_deleted_at is not null
     or v_lot_input <> new.agricultural_input_id then
    raise exception
      'Lote inválido para o insumo informado.';
  end if;

  new.unit := v_lot_unit;
  new.unit_cost := v_lot_unit_price;

  if v_lot_unit_price is not null then
    new.total_cost :=
      round(
        (
          new.quantity
          * v_lot_unit_price
        )::numeric,
        2
      );
  else
    new.total_cost := null;
  end if;

  -- A própria transaction possui trigger que valida saldo.
  insert into public.inventory_transactions (
    user_id,
    agricultural_input_id,
    inventory_lot_id,
    production_cycle_id,
    production_event_id,
    transaction_type,
    quantity,
    unit,
    unit_cost,
    total_cost,
    occurred_at,
    notes
  )
  values (
    new.user_id,
    new.agricultural_input_id,
    new.inventory_lot_id,
    v_cycle_id,
    new.production_event_id,
    'usage',
    new.quantity,
    new.unit,
    new.unit_cost,
    new.total_cost,
    coalesce(
      v_event_occurred_at,
      now()
    ),
    coalesce(
      new.notes,
      'Saída automática por uso em evento produtivo.'
    )
  )
  returning
    id,
    unit_cost,
    total_cost
  into
    v_transaction_id,
    new.unit_cost,
    new.total_cost;

  new.inventory_transaction_id :=
    v_transaction_id;

  return new;
end;
$$;

drop trigger if exists
  trg_handle_event_input_inventory
on public.event_inputs;

create trigger
  trg_handle_event_input_inventory
before insert
on public.event_inputs
for each row
execute function
  public.handle_event_input_inventory();

create index if not exists
  idx_event_inputs_user_created
on public.event_inputs(
  user_id,
  created_at desc
);

create index if not exists
  idx_event_inputs_transaction
on public.event_inputs(
  inventory_transaction_id
);

-- ============================================================
-- 2. INVENTORY TRANSACTIONS:
--    ENTRY e USAGE não podem ser criados diretamente pelo cliente.
--
-- ENTRY é criada pelo trigger do lote.
-- USAGE é criada pelo trigger de event_inputs.
-- ============================================================

drop policy if exists
  inventory_transactions_insert_own
on public.inventory_transactions;

create policy
  inventory_transactions_insert_own
on public.inventory_transactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and transaction_type in (
    'positive_adjustment',
    'negative_adjustment',
    'loss',
    'expiration',
    'return'
  )
);

-- ============================================================
-- 3. CONSULTORES
-- ============================================================

create index if not exists
  idx_consultants_user_active
on public.consultants(
  user_id,
  active,
  name
)
where deleted_at is null;

create index if not exists
  idx_consultants_user_archived
on public.consultants(
  user_id,
  deleted_at desc
)
where deleted_at is not null;

commit;
