-- ============================================================
-- MEU AGRO - ETAPA 23
-- Verificação - somente leitura
-- ============================================================

-- 1. Colunas do resumo financeiro
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name =
    'production_cycle_financial_summary'
order by ordinal_position;

-- 2. Resumo por ciclo
select
  *
from
  public.production_cycle_financial_summary
order by
  sales_revenue desc,
  input_cost desc;

-- 3. Custos agrupados por insumo
select
  *
from
  public.production_cycle_input_cost_summary
order by
  production_cycle_id,
  total_cost desc;

-- 4. Quantidade colhida/vendida por unidade
select
  *
from
  public.production_cycle_harvest_quantity_summary
order by
  production_cycle_id,
  unit;

-- 5. Função da visão geral
select
  routine_name,
  routine_type,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name =
    'financial_overview';

-- 6. Exemplo detalhado por ciclo
select
  pc.id,
  p.name as property_name,
  a.name as area_name,
  c.name as crop_name,
  pc.variety,
  pc.status,
  f.input_cost,
  f.sales_revenue,
  f.estimated_result,
  f.gross_margin_percent,
  f.usage_transactions_count,
  f.harvests_count,
  f.sales_count
from
  public.production_cycles pc
join
  public.properties p
    on p.id =
      pc.property_id
join
  public.areas a
    on a.id =
      pc.area_id
join
  public.crops c
    on c.id =
      pc.crop_id
join
  public.production_cycle_financial_summary f
    on f.production_cycle_id =
      pc.id
where
  pc.deleted_at
    is null
order by
  f.estimated_result desc;
