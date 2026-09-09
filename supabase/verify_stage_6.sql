-- ============================================================
-- MEU AGRO - ETAPA 6
-- Verificação de Areas e Area Types
-- Somente leitura.
-- ============================================================

-- 1. Tabela areas
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'areas'
order by ordinal_position;

-- 2. Tipos de área disponíveis no banco
select
  id,
  user_id,
  name,
  is_system
from public.area_types
order by is_system desc, name;

-- 3. RLS
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'areas',
    'area_types'
  )
order by tablename;

-- 4. Policies
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'areas',
    'area_types'
  )
order by tablename, policyname;

-- 5. Trigger de integridade
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'areas'
order by trigger_name;

-- 6. Índices
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'areas'
order by indexname;
