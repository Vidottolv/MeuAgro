-- ============================================================
-- MEU AGRO - ETAPA 5
-- Verificação da estrutura de propriedades.
-- Somente leitura: não altera dados.
-- ============================================================

-- 1. Colunas da tabela
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'properties'
order by ordinal_position;

-- 2. RLS
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'properties';

-- 3. Policies
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
  and tablename = 'properties'
order by policyname;

-- 4. Índices
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'properties'
order by indexname;
