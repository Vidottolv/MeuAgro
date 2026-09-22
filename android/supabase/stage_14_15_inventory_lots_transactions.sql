-- ============================================================
-- MEU AGRO - ETAPAS 14 E 15
-- Lotes de estoque + Movimentações de estoque
-- ============================================================
--
-- Execute uma única vez no SQL Editor do Supabase.
-- O script é idempotente e não apaga dados produtivos.
--
-- A estrutura base já existe desde a Etapa 1:
-- agricultural_inputs -> inventory_lots -> inventory_transactions.
--
-- Esta migration reforça:
-- 1. integridade entre lote e insumo;
-- 2. unidade do lote igual à unidade principal do insumo;
-- 3. entrada automática ao cadastrar lote;
-- 4. proteção dos dados originais da compra;
-- 5. proteção contra arquivar lote com saldo;
-- 6. índices para as telas das Etapas 14 e 15.
-- ============================================================

begin;

-- ============================================================
-- ETAPA 14 - INTEGRIDADE DOS LOTES
-- ============================================================

create or replace function public.validate_inventory_lot_reference()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_validate boolean := false;
  v_input_user uuid;
  v_input_unit text;
  v_input_active boolean;
  v_current_balance numeric;
begin
  if tg_op = 'INSERT' then
    v_validate := true;
  else
    v_validate :=
      new.user_id is distinct from old.user_id
      or new.agricultural_input_id
        is distinct from old.agricultural_input_id
      or new.unit is distinct from old.unit
      or (
        old.deleted_at is not null
        and new.deleted_at is null
      );

    -- Um lote com saldo não pode desaparecer da view de estoque.
    if old.deleted_at is null
       and new.deleted_at is not null then
      select coalesce(
        sum(
          public.inventory_transaction_sign(
            t.transaction_type
          ) * t.quantity
        ),
        0
      )
        into v_current_balance
      from public.inventory_transactions t
      where t.inventory_lot_id = old.id;

      if v_current_balance <> 0 then
        raise exception
          'O lote não pode ser arquivado enquanto possuir saldo. Saldo atual: % %.',
          v_current_balance,
          old.unit;
      end if;
    end if;
  end if;

  if v_validate then
    select
      i.user_id,
      i.base_unit,
      i.active
      into
        v_input_user,
        v_input_unit,
        v_input_active
    from public.agricultural_inputs i
    where i.id = new.agricultural_input_id
      and i.deleted_at is null;

    if v_input_user is null
       or v_input_user <> new.user_id then
      raise exception
        'Insumo inválido para este lote.';
    end if;

    if not v_input_active then
      raise exception
        'Insumo inativo. Reative o insumo antes de cadastrar ou restaurar um lote.';
    end if;

    if lower(v_input_unit) <> lower(new.unit) then
      raise exception
        'O lote deve usar a unidade principal do insumo (%).',
        v_input_unit;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_validate_inventory_lot_reference
on public.inventory_lots;

create trigger
  trg_validate_inventory_lot_reference
before insert or update of
  user_id,
  agricultural_input_id,
  unit,
  deleted_at
on public.inventory_lots
for each row
execute function
  public.validate_inventory_lot_reference();

-- Os dados que definem a compra original ficam imutáveis depois que a
-- entrada automática foi criada. Informações descritivas como fornecedor,
-- lote, validade e observações continuam editáveis.

create or replace function public.prevent_inventory_lot_purchase_edit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.purchased_quantity
       is distinct from old.purchased_quantity
     or new.agricultural_input_id
       is distinct from old.agricultural_input_id
     or lower(new.unit)
       is distinct from lower(old.unit)
     or new.total_price
       is distinct from old.total_price
     or new.unit_price
       is distinct from old.unit_price
     or new.purchase_date
       is distinct from old.purchase_date then
    raise exception
      'Quantidade, insumo, unidade, preço e data da compra não podem ser alterados após a criação do lote. Use movimentações para corrigir o saldo.';
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_prevent_inventory_lot_purchase_edit
on public.inventory_lots;

create trigger
  trg_prevent_inventory_lot_purchase_edit
before update
on public.inventory_lots
for each row
execute function
  public.prevent_inventory_lot_purchase_edit();

-- Recriamos a entrada automática usando meio-dia como horário da compra.
-- Isso evita que uma DATE seja exibida como o dia anterior em fusos UTC-3.

create or replace function public.create_initial_inventory_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory_transactions (
    user_id,
    agricultural_input_id,
    inventory_lot_id,
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
    new.id,
    'entry',
    new.purchased_quantity,
    new.unit,
    new.unit_price,
    new.total_price,
    (
      new.purchase_date::timestamp
      + interval '12 hours'
    )::timestamptz,
    'Entrada automática criada a partir do cadastro do lote.'
  );

  return new;
end;
$$;

drop trigger if exists
  trg_create_initial_inventory_entry
on public.inventory_lots;

create trigger
  trg_create_initial_inventory_entry
after insert
on public.inventory_lots
for each row
execute function
  public.create_initial_inventory_entry();

-- Caso exista algum lote antigo sem entrada, fazemos um backfill seguro.
insert into public.inventory_transactions (
  user_id,
  agricultural_input_id,
  inventory_lot_id,
  transaction_type,
  quantity,
  unit,
  unit_cost,
  total_cost,
  occurred_at,
  notes
)
select
  l.user_id,
  l.agricultural_input_id,
  l.id,
  'entry',
  l.purchased_quantity,
  l.unit,
  l.unit_price,
  l.total_price,
  (
    l.purchase_date::timestamp
    + interval '12 hours'
  )::timestamptz,
  'Entrada automática criada no backfill das Etapas 14 e 15.'
from public.inventory_lots l
where l.deleted_at is null
  and not exists (
    select 1
    from public.inventory_transactions t
    where t.inventory_lot_id = l.id
      and t.transaction_type = 'entry'
  );

create index if not exists
  idx_inventory_lots_user_input_purchase
on public.inventory_lots(
  user_id,
  agricultural_input_id,
  purchase_date desc
)
where deleted_at is null;

-- ============================================================
-- ETAPA 15 - MOVIMENTAÇÕES
-- ============================================================

-- O validate_inventory_transaction() da Etapa 1 continua responsável por:
-- - validar usuário/insumo/lote;
-- - exigir unidade igual à unidade do lote;
-- - copiar unit_cost do lote quando necessário;
-- - calcular total_cost;
-- - validar ciclo/evento;
-- - impedir saldo negativo em movimentos de saída.
--
-- As policies já existentes permitem INSERT e SELECT, mas bloqueiam
-- UPDATE/DELETE no frontend, preservando o histórico.

create index if not exists
  idx_inventory_transactions_user_occurred
on public.inventory_transactions(
  user_id,
  occurred_at desc
);

create index if not exists
  idx_inventory_transactions_user_type_occurred
on public.inventory_transactions(
  user_id,
  transaction_type,
  occurred_at desc
);

grant select
on public.inventory_lot_balances
to authenticated;

grant select
on public.inventory_balances
to authenticated;

commit;
