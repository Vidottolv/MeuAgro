-- ============================================================
-- MEU AGRO - ETAPA 7
-- Verificação da estrutura de Safras
-- Somente leitura.
-- ============================================================

-- 1. Colunas
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'seasons'
order by ordinal_position;

-- 2. Constraints
select
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class rel
  on rel.oid = con.conrelid
join pg_namespace nsp
  on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'seasons'
order by con.conname;

-- 3. RLS
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'seasons';

-- 4. Policies
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
  and tablename = 'seasons'
order by policyname;

-- 5. Trigger da Etapa 7
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'seasons'
order by trigger_name;

-- 6. Índices
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'seasons'
order by indexname;
