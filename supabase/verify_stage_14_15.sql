-- ============================================================
-- MEU AGRO - ETAPAS 14 E 15
-- Verificação de lotes e movimentações
-- Somente leitura.
-- ============================================================

-- 1. Lotes e saldo calculado por lote
select
  l.id,
  i.name as input_name,
  l.batch_number,
  l.supplier,
  l.purchased_quantity,
  l.unit,
  l.total_price,
  l.unit_price,
  l.purchase_date,
  l.expiration_date,
  lb.current_quantity
from public.inventory_lots l
join public.agricultural_inputs i
  on i.id = l.agricultural_input_id
left join public.inventory_lot_balances lb
  on lb.inventory_lot_id = l.id
where l.deleted_at is null
order by l.purchase_date desc, l.created_at desc;

-- 2. Movimentações
select
  t.id,
  i.name as input_name,
  l.batch_number,
  t.transaction_type,
  t.quantity,
  t.unit,
  t.unit_cost,
  t.total_cost,
  t.occurred_at,
  t.production_cycle_id,
  t.production_event_id,
  t.notes
from public.inventory_transactions t
join public.agricultural_inputs i
  on i.id = t.agricultural_input_id
left join public.inventory_lots l
  on l.id = t.inventory_lot_id
order by t.occurred_at desc, t.created_at desc;

-- 3. Saldo consolidado por insumo
select *
from public.inventory_balances
order by name;

-- 4. Triggers dos lotes
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'inventory_lots'
order by trigger_name, event_manipulation;

-- 5. Policies das movimentações
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'inventory_transactions'
order by policyname;

-- 6. Índices relevantes
select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'inventory_lots',
    'inventory_transactions'
  )
order by tablename, indexname;
