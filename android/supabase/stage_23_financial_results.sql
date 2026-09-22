-- ============================================================
-- MEU AGRO - ETAPA 23
-- Custos e resultados básicos
-- ============================================================
--
-- Execute uma única vez no SQL Editor do Supabase.
--
-- Escopo financeiro desta etapa:
--
-- Receita:
--   harvest_sales.total_value
--
-- Custos:
--   inventory_transactions.total_cost
--   onde transaction_type = 'usage'
--
-- Resultado estimado:
--   receita de vendas - custo dos insumos consumidos
--
-- Não entram nesta etapa:
--   mão de obra, combustível, máquinas, energia, frete,
--   impostos, despesas administrativas ou outros custos.
-- ============================================================

begin;

-- ============================================================
-- 1. RESUMO FINANCEIRO POR CICLO
-- ============================================================
--
-- Mantém as cinco primeiras colunas da view criada na Etapa 1
-- e adiciona métricas auxiliares ao final.
-- ============================================================

create or replace view
  public.production_cycle_financial_summary
with (
  security_invoker = true
)
as
select
  pc.id as production_cycle_id,

  pc.user_id,

  coalesce(
    costs.input_cost,
    0
  )::numeric(14,2)
    as input_cost,

  coalesce(
    revenue.sales_revenue,
    0
  )::numeric(14,2)
    as sales_revenue,

  (
    coalesce(
      revenue.sales_revenue,
      0
    )
    -
    coalesce(
      costs.input_cost,
      0
    )
  )::numeric(14,2)
    as estimated_result,

  coalesce(
    costs.usage_transactions_count,
    0
  )::bigint
    as usage_transactions_count,

  coalesce(
    harvest_stats.harvests_count,
    0
  )::bigint
    as harvests_count,

  coalesce(
    revenue.sales_count,
    0
  )::bigint
    as sales_count,

  case
    when
      coalesce(
        revenue.sales_revenue,
        0
      ) > 0
    then
      round(
        (
          (
            coalesce(
              revenue.sales_revenue,
              0
            )
            -
            coalesce(
              costs.input_cost,
              0
            )
          )
          /
          revenue.sales_revenue
          * 100
        )::numeric,
        2
      )
    else
      null
  end::numeric(8,2)
    as gross_margin_percent

from
  public.production_cycles pc

left join lateral (
  select
    sum(
      coalesce(
        t.total_cost,
        0
      )
    ) as input_cost,

    count(*)::bigint
      as usage_transactions_count

  from
    public.inventory_transactions t

  where
    t.production_cycle_id =
      pc.id

    and t.transaction_type =
      'usage'
) costs
  on true

left join lateral (
  select
    sum(
      s.total_value
    ) as sales_revenue,

    count(
      s.id
    )::bigint
      as sales_count

  from
    public.harvests h

  join
    public.harvest_sales s
      on s.harvest_id =
        h.id

  where
    h.production_cycle_id =
      pc.id
) revenue
  on true

left join lateral (
  select
    count(
      h.id
    )::bigint
      as harvests_count

  from
    public.harvests h

  where
    h.production_cycle_id =
      pc.id
) harvest_stats
  on true

where
  pc.deleted_at
    is null;

-- ============================================================
-- 2. CUSTO DE INSUMOS AGRUPADO POR PRODUTO
-- ============================================================

create or replace view
  public.production_cycle_input_cost_summary
with (
  security_invoker = true
)
as
select
  t.production_cycle_id,

  t.user_id,

  t.agricultural_input_id,

  i.name
    as input_name,

  i.brand,

  t.unit,

  sum(
    t.quantity
  )::numeric(14,4)
    as quantity_used,

  count(*)::bigint
    as usage_count,

  sum(
    coalesce(
      t.total_cost,
      0
    )
  )::numeric(14,2)
    as total_cost

from
  public.inventory_transactions t

join
  public.agricultural_inputs i
    on i.id =
      t.agricultural_input_id

join
  public.production_cycles pc
    on pc.id =
      t.production_cycle_id

where
  t.transaction_type =
    'usage'

  and t.production_cycle_id
    is not null

  and pc.deleted_at
    is null

group by
  t.production_cycle_id,
  t.user_id,
  t.agricultural_input_id,
  i.name,
  i.brand,
  t.unit;

-- ============================================================
-- 3. PRODUÇÃO / VENDA AGRUPADA POR UNIDADE
-- ============================================================
--
-- Não somamos kg + caixas + sacas.
-- Cada unidade aparece separadamente.
-- ============================================================

create or replace view
  public.production_cycle_harvest_quantity_summary
with (
  security_invoker = true
)
as
with harvest_totals as (
  select
    h.production_cycle_id,

    h.user_id,

    h.unit,

    sum(
      h.quantity
    )::numeric(14,4)
      as harvested_quantity,

    count(
      h.id
    )::bigint
      as harvests_count

  from
    public.harvests h

  join
    public.production_cycles pc
      on pc.id =
        h.production_cycle_id

  where
    pc.deleted_at
      is null

  group by
    h.production_cycle_id,
    h.user_id,
    h.unit
),

sales_totals as (
  select
    h.production_cycle_id,

    h.user_id,

    h.unit,

    sum(
      s.quantity
    )::numeric(14,4)
      as sold_quantity,

    sum(
      s.total_value
    )::numeric(14,2)
      as gross_revenue,

    count(
      s.id
    )::bigint
      as sales_count

  from
    public.harvests h

  join
    public.harvest_sales s
      on s.harvest_id =
        h.id

  join
    public.production_cycles pc
      on pc.id =
        h.production_cycle_id

  where
    pc.deleted_at
      is null

  group by
    h.production_cycle_id,
    h.user_id,
    h.unit
)

select
  ht.production_cycle_id,

  ht.user_id,

  ht.unit,

  ht.harvested_quantity,

  coalesce(
    st.sold_quantity,
    0
  )::numeric(14,4)
    as sold_quantity,

  greatest(
    ht.harvested_quantity
    -
    coalesce(
      st.sold_quantity,
      0
    ),
    0
  )::numeric(14,4)
    as remaining_quantity,

  coalesce(
    st.gross_revenue,
    0
  )::numeric(14,2)
    as gross_revenue,

  ht.harvests_count,

  coalesce(
    st.sales_count,
    0
  )::bigint
    as sales_count

from
  harvest_totals ht

left join
  sales_totals st
    on st.production_cycle_id =
      ht.production_cycle_id
    and st.user_id =
      ht.user_id
    and st.unit =
      ht.unit;

-- ============================================================
-- 4. VISÃO GERAL DO USUÁRIO
-- ============================================================

create or replace function
  public.financial_overview()
returns table (
  cycles_count bigint,
  cycles_with_activity_count bigint,
  positive_result_count bigint,
  negative_result_count bigint,
  break_even_count bigint,
  input_cost numeric(14,2),
  sales_revenue numeric(14,2),
  estimated_result numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::bigint
      as cycles_count,

    count(*) filter (
      where
        f.input_cost <> 0
        or f.sales_revenue <> 0
    )::bigint
      as cycles_with_activity_count,

    count(*) filter (
      where
        f.estimated_result > 0
    )::bigint
      as positive_result_count,

    count(*) filter (
      where
        f.estimated_result < 0
    )::bigint
      as negative_result_count,

    count(*) filter (
      where
        f.estimated_result = 0
        and (
          f.input_cost <> 0
          or f.sales_revenue <> 0
        )
    )::bigint
      as break_even_count,

    coalesce(
      sum(
        f.input_cost
      ),
      0
    )::numeric(14,2)
      as input_cost,

    coalesce(
      sum(
        f.sales_revenue
      ),
      0
    )::numeric(14,2)
      as sales_revenue,

    coalesce(
      sum(
        f.estimated_result
      ),
      0
    )::numeric(14,2)
      as estimated_result

  from
    public.production_cycle_financial_summary f

  where
    f.user_id =
      auth.uid();
$$;

revoke all
on function
  public.financial_overview()
from public;

grant execute
on function
  public.financial_overview()
to authenticated;

grant select
on
  public.production_cycle_financial_summary,
  public.production_cycle_input_cost_summary,
  public.production_cycle_harvest_quantity_summary
to authenticated;

commit;
