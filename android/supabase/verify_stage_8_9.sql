-- ============================================================
-- MEU AGRO - ETAPAS 8 E 9
-- Verificação de Culturas e Ciclos Produtivos
-- Somente leitura.
-- ============================================================

-- 1. Culturas disponíveis
select
  id,
  user_id,
  name,
  category,
  average_cycle_days,
  is_system,
  active
from public.crops
order by is_system desc, name;

-- 2. Colunas de production_cycles
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'production_cycles'
order by ordinal_position;

-- 3. Constraints
select
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class rel
  on rel.oid = con.conrelid
join pg_namespace nsp
  on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'production_cycles'
order by con.conname;

-- 4. RLS
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'crops',
    'production_cycles'
  )
order by tablename;

-- 5. Policies
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'crops',
    'production_cycles'
  )
order by tablename, policyname;

-- 6. Trigger do ciclo
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'production_cycles'
order by trigger_name;

-- 7. Função de previsão
select
  routine_name,
  routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'suggest_harvest_date';

-- 8. Ciclos atuais
select
  pc.id,
  p.name as property_name,
  a.name as area_name,
  c.name as crop_name,
  s.name as season_name,
  pc.variety,
  pc.planted_quantity,
  pc.planted_unit,
  pc.planting_date,
  pc.initial_harvest_forecast,
  pc.current_harvest_forecast,
  pc.final_harvest_date,
  pc.status,
  pc.deleted_at
from public.production_cycles pc
join public.properties p
  on p.id = pc.property_id
join public.areas a
  on a.id = pc.area_id
join public.crops c
  on c.id = pc.crop_id
left join public.seasons s
  on s.id = pc.season_id
order by pc.planting_date desc;
