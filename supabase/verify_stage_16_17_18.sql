-- ============================================================
-- MEU AGRO - ETAPAS 16, 17 E 18
-- Verificação - somente leitura
-- ============================================================

-- 1. Event inputs
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'event_inputs'
order by ordinal_position;

-- 2. Trigger de saída automática
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'event_inputs'
order by trigger_name;

-- 3. Função
select
  routine_name,
  routine_type,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name =
    'handle_event_input_inventory';

-- 4. Policies de movimentação.
-- A policy de INSERT deve aceitar apenas ajustes manuais.
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename =
    'inventory_transactions'
order by policyname;

-- 5. Consultants
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'consultants'
order by ordinal_position;

-- 6. RLS dos três conjuntos
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'event_inputs',
    'inventory_transactions',
    'consultants'
  )
order by tablename;

-- 7. Policies
select
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in (
    'event_inputs',
    'consultants'
  )
order by tablename, policyname;

-- 8. Índices
select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'event_inputs',
    'consultants'
  )
order by tablename, indexname;

-- 9. Consumos recentes com transação automática
select
  ei.id,
  pe.title as event_title,
  ai.name as input_name,
  il.batch_number,
  ei.quantity,
  ei.unit,
  ei.unit_cost,
  ei.total_cost,
  it.transaction_type,
  it.occurred_at
from public.event_inputs ei
join public.production_events pe
  on pe.id =
    ei.production_event_id
join public.agricultural_inputs ai
  on ai.id =
    ei.agricultural_input_id
join public.inventory_lots il
  on il.id =
    ei.inventory_lot_id
left join public.inventory_transactions it
  on it.id =
    ei.inventory_transaction_id
order by ei.created_at desc
limit 30;

-- 10. Consultores atuais
select
  id,
  name,
  company,
  phone,
  whatsapp,
  email,
  specialty,
  active,
  deleted_at
from public.consultants
order by name;
