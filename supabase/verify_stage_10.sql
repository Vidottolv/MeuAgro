-- ============================================================
-- MEU AGRO - ETAPA 10
-- Verificação do Dashboard
-- Somente leitura.
-- ============================================================

-- 1. Função principal
select
  routine_name,
  routine_type,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'dashboard_summary';

-- 2. Resultado para o usuário autenticado no app
-- Execute pelo frontend/RPC para obter auth.uid().
-- No SQL Editor, auth.uid() pode ser NULL.
select *
from public.dashboard_summary();

-- 3. Índices usados pelas atividades recentes
select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_cycles_user_created_at',
    'idx_production_events_user_occurred_at',
    'idx_harvests_user_date',
    'idx_cycles_harvest_forecast'
  )
order by tablename, indexname;

-- 4. Visão de estoque utilizada pelo dashboard
select
  table_schema,
  table_name,
  view_definition
from information_schema.views
where table_schema = 'public'
  and table_name = 'inventory_balances';

-- 5. Políticas das tabelas consultadas
select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'properties',
    'areas',
    'production_cycles',
    'production_events',
    'agricultural_inputs',
    'inventory_transactions',
    'harvests'
  )
order by tablename, policyname;
