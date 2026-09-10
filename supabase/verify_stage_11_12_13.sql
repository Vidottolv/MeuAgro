-- ============================================================
-- MEU AGRO - ETAPAS 11, 12 E 13
-- Verificação - somente leitura
-- ============================================================

-- 1. Tipos de eventos permitidos / constraint
select
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class rel
  on rel.oid = con.conrelid
join pg_namespace nsp
  on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'production_events'
  and con.contype = 'c'
order by con.conname;

-- 2. Eventos e evento inicial de plantio
select
  pe.id,
  pe.production_cycle_id,
  pe.event_type,
  pe.title,
  pe.occurred_at
from public.production_events pe
order by pe.occurred_at desc
limit 50;

-- 3. Triggers
select
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in (
    'production_cycles',
    'production_events',
    'event_photos'
  )
order by
  event_object_table,
  trigger_name;

-- 4. Fotos
select
  ep.id,
  ep.user_id,
  ep.property_id,
  ep.area_id,
  ep.production_cycle_id,
  ep.production_event_id,
  ep.storage_path,
  ep.captured_at
from public.event_photos ep
order by ep.captured_at desc
limit 50;

-- 5. Bucket privado
select
  id,
  name,
  public
from storage.buckets
where id = 'meu-agro-photos';

-- 6. Policies de Storage
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'Meu Agro photos%'
order by policyname;

-- 7. Insumos
select
  i.id,
  i.name,
  i.brand,
  i.category,
  i.base_unit,
  i.minimum_stock,
  i.ideal_stock,
  i.active,
  i.deleted_at
from public.agricultural_inputs i
order by i.name;

-- 8. Saldos calculados
select
  agricultural_input_id,
  name,
  base_unit,
  minimum_stock,
  ideal_stock,
  current_quantity,
  stock_status,
  active
from public.inventory_balances
order by name;

-- 9. RLS
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'production_events',
    'event_photos',
    'agricultural_inputs'
  )
order by tablename;
