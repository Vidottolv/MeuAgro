-- ============================================================
-- MEU AGRO - ETAPAS 21 E 22
-- Verificação - somente leitura
-- ============================================================

-- 1. Estrutura das colheitas
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'harvests'
order by ordinal_position;

-- 2. Estrutura das vendas
select
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_generated
from information_schema.columns
where table_schema = 'public'
  and table_name = 'harvest_sales'
order by ordinal_position;

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
    'harvests',
    'harvest_sales'
  )
order by
  event_object_table,
  trigger_name;

-- 4. RLS
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'harvests',
    'harvest_sales'
  )
order by tablename;

-- 5. Policies
select
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'harvests',
    'harvest_sales'
  )
order by
  tablename,
  policyname;

-- 6. Colheitas e evento da linha do tempo
select
  h.id,
  h.harvest_date,
  h.quantity,
  h.unit,
  h.destination,
  h.production_event_id,
  pe.event_type,
  pe.title,
  pe.occurred_at
from public.harvests h
left join public.production_events pe
  on pe.id =
    h.production_event_id
order by
  h.harvest_date desc;

-- 7. Vendas e total gerado
select
  s.id,
  s.harvest_id,
  s.buyer,
  s.quantity,
  s.unit,
  s.unit_price,
  s.total_value,
  s.sale_date,
  s.payment_method
from public.harvest_sales s
order by
  s.sale_date desc;

-- 8. Quantidade vendida x quantidade colhida
select
  h.id as harvest_id,
  h.quantity as harvested_quantity,
  h.unit,
  coalesce(
    sum(s.quantity),
    0
  ) as sold_quantity,
  (
    h.quantity
    - coalesce(
        sum(s.quantity),
        0
      )
  ) as remaining_quantity,
  coalesce(
    sum(s.total_value),
    0
  ) as gross_revenue
from public.harvests h
left join public.harvest_sales s
  on s.harvest_id =
    h.id
group by
  h.id,
  h.quantity,
  h.unit
order by
  h.harvest_date desc;

-- 9. Resumo financeiro por ciclo já preparado para a Etapa 23
select
  *
from
  public.production_cycle_financial_summary
order by
  sales_revenue desc;
