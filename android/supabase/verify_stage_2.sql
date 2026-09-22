-- ============================================================
-- MEU AGRO - ETAPA 2
-- Verificação não destrutiva da configuração do Supabase
-- ============================================================

-- 1. Tabelas principais esperadas
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'properties',
    'area_types',
    'areas',
    'seasons',
    'crops',
    'production_cycles',
    'production_events',
    'event_inputs',
    'event_photos',
    'agricultural_inputs',
    'inventory_lots',
    'inventory_transactions',
    'consultants',
    'harvests',
    'harvest_sales',
    'notification_preferences',
    'notifications'
  )
order by table_name;

-- 2. Confirma que RLS está ativo nas tabelas do aplicativo
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'properties',
    'area_types',
    'areas',
    'seasons',
    'crops',
    'production_cycles',
    'production_events',
    'event_inputs',
    'event_photos',
    'agricultural_inputs',
    'inventory_lots',
    'inventory_transactions',
    'consultants',
    'harvests',
    'harvest_sales',
    'notification_preferences',
    'notifications'
  )
order by tablename;

-- 3. Policies existentes
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 4. Bucket de fotos
select
  id,
  name,
  public
from storage.buckets
where id = 'meu-agro-photos';

-- 5. Culturas padrão
select
  name,
  category,
  average_cycle_days
from public.crops
where is_system = true
order by name;

-- 6. Tipos de área padrão
select
  name,
  description
from public.area_types
where is_system = true
order by name;
