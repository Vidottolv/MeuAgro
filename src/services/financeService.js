import {
  supabase,
} from '../js/supabase.js';

import {
  getFinancialResultState,
} from '../constants/financialResult.js';

const CYCLE_FIELDS = `
  id,
  user_id,
  property_id,
  area_id,
  season_id,
  crop_id,
  variety,
  planting_date,
  final_harvest_date,
  status,
  deleted_at,
  crop:crops (
    id,
    name,
    category
  ),
  area:areas (
    id,
    name,
    area_type:area_types (
      id,
      name
    )
  ),
  property:properties (
    id,
    name
  ),
  season:seasons (
    id,
    name
  )
`;

const SUMMARY_FIELDS = `
  production_cycle_id,
  user_id,
  input_cost,
  sales_revenue,
  estimated_result,
  usage_transactions_count,
  harvests_count,
  sales_count,
  gross_margin_percent
`;

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'O Supabase não foi inicializado.',
    );
  }

  return supabase;
}

function asNumber(
  value,
) {
  const number =
    Number(value);

  return Number.isFinite(
    number,
  )
    ? number
    : 0;
}

function normalizeSummary(
  summary,
) {
  const normalized = {
    production_cycle_id:
      summary.production_cycle_id,
    user_id:
      summary.user_id,
    input_cost:
      asNumber(
        summary.input_cost,
      ),
    sales_revenue:
      asNumber(
        summary.sales_revenue,
      ),
    estimated_result:
      asNumber(
        summary.estimated_result,
      ),
    usage_transactions_count:
      asNumber(
        summary.usage_transactions_count,
      ),
    harvests_count:
      asNumber(
        summary.harvests_count,
      ),
    sales_count:
      asNumber(
        summary.sales_count,
      ),
    gross_margin_percent:
      summary.gross_margin_percent ===
        null ||
      summary.gross_margin_percent ===
        undefined
        ? null
        : asNumber(
            summary.gross_margin_percent,
          ),
  };

  return {
    ...normalized,
    result_state:
      getFinancialResultState(
        normalized,
      ),
  };
}

export async function getFinancialOverview() {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client.rpc(
      'financial_overview',
    );

  if (error) {
    throw error;
  }

  const row =
    Array.isArray(data)
      ? data[0]
      : data;

  return {
    cycles_count:
      asNumber(
        row?.cycles_count,
      ),
    cycles_with_activity_count:
      asNumber(
        row?.cycles_with_activity_count,
      ),
    positive_result_count:
      asNumber(
        row?.positive_result_count,
      ),
    negative_result_count:
      asNumber(
        row?.negative_result_count,
      ),
    break_even_count:
      asNumber(
        row?.break_even_count,
      ),
    input_cost:
      asNumber(
        row?.input_cost,
      ),
    sales_revenue:
      asNumber(
        row?.sales_revenue,
      ),
    estimated_result:
      asNumber(
        row?.estimated_result,
      ),
  };
}

export async function listCycleFinancialSummaries() {
  const client =
    requireSupabase();

  const [
    summaryResult,
    cycleResult,
  ] =
    await Promise.all([
      client
        .from(
          'production_cycle_financial_summary',
        )
        .select(
          SUMMARY_FIELDS,
        ),
      client
        .from(
          'production_cycles',
        )
        .select(
          CYCLE_FIELDS,
        )
        .is(
          'deleted_at',
          null,
        )
        .order(
          'planting_date',
          {
            ascending: false,
          },
        ),
    ]);

  if (summaryResult.error) {
    throw summaryResult.error;
  }

  if (cycleResult.error) {
    throw cycleResult.error;
  }

  const summaryByCycle =
    new Map(
      (
        summaryResult.data ??
        []
      ).map(
        (summary) => [
          summary
            .production_cycle_id,
          normalizeSummary(
            summary,
          ),
        ],
      ),
    );

  return (
    cycleResult.data ?? []
  ).map(
    (cycle) => {
      const summary =
        summaryByCycle.get(
          cycle.id,
        ) ||
        normalizeSummary({
          production_cycle_id:
            cycle.id,
          user_id:
            cycle.user_id,
          input_cost: 0,
          sales_revenue: 0,
          estimated_result: 0,
          usage_transactions_count:
            0,
          harvests_count: 0,
          sales_count: 0,
          gross_margin_percent:
            null,
        });

      return {
        ...cycle,
        finance:
          summary,
      };
    },
  );
}

export async function getCycleFinancialSummary(
  cycleId,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from(
        'production_cycle_financial_summary',
      )
      .select(
        SUMMARY_FIELDS,
      )
      .eq(
        'production_cycle_id',
        cycleId,
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return normalizeSummary(
    data,
  );
}

export async function getCycleFinancialDetail(
  cycleId,
) {
  const client =
    requireSupabase();

  const [
    cycleResult,
    summaryResult,
    costsResult,
    productionResult,
    harvestResult,
  ] =
    await Promise.all([
      client
        .from(
          'production_cycles',
        )
        .select(
          CYCLE_FIELDS,
        )
        .eq(
          'id',
          cycleId,
        )
        .maybeSingle(),

      client
        .from(
          'production_cycle_financial_summary',
        )
        .select(
          SUMMARY_FIELDS,
        )
        .eq(
          'production_cycle_id',
          cycleId,
        )
        .maybeSingle(),

      client
        .from(
          'production_cycle_input_cost_summary',
        )
        .select(`
          production_cycle_id,
          agricultural_input_id,
          input_name,
          brand,
          unit,
          quantity_used,
          usage_count,
          total_cost
        `)
        .eq(
          'production_cycle_id',
          cycleId,
        )
        .order(
          'total_cost',
          {
            ascending: false,
          },
        ),

      client
        .from(
          'production_cycle_harvest_quantity_summary',
        )
        .select(`
          production_cycle_id,
          unit,
          harvested_quantity,
          sold_quantity,
          remaining_quantity,
          gross_revenue,
          harvests_count,
          sales_count
        `)
        .eq(
          'production_cycle_id',
          cycleId,
        )
        .order(
          'unit',
          {
            ascending: true,
          },
        ),

      client
        .from('harvests')
        .select(`
          id,
          production_cycle_id,
          harvest_date,
          quantity,
          unit,
          destination,
          sales:harvest_sales (
            id,
            buyer,
            quantity,
            unit,
            unit_price,
            total_value,
            sale_date,
            payment_method,
            notes,
            created_at,
            updated_at
          )
        `)
        .eq(
          'production_cycle_id',
          cycleId,
        )
        .order(
          'harvest_date',
          {
            ascending: false,
          },
        ),
    ]);

  for (const result of [
    cycleResult,
    summaryResult,
    costsResult,
    productionResult,
    harvestResult,
  ]) {
    if (result.error) {
      throw result.error;
    }
  }

  if (!cycleResult.data) {
    return null;
  }

  const summary =
    summaryResult.data
      ? normalizeSummary(
          summaryResult.data,
        )
      : normalizeSummary({
          production_cycle_id:
            cycleId,
          user_id:
            cycleResult.data
              .user_id,
          input_cost: 0,
          sales_revenue: 0,
          estimated_result: 0,
          usage_transactions_count:
            0,
          harvests_count: 0,
          sales_count: 0,
          gross_margin_percent:
            null,
        });

  const sales =
    (
      harvestResult.data ??
      []
    )
      .flatMap(
        (harvest) =>
          (
            harvest.sales ??
            []
          ).map(
            (sale) => ({
              ...sale,
              harvest: {
                ...harvest,
                production_cycle:
                  cycleResult.data,
              },
            }),
          ),
      )
      .sort(
        (a, b) =>
          String(
            b.sale_date,
          ).localeCompare(
            String(
              a.sale_date,
            ),
          ),
      );

  return {
    cycle:
      cycleResult.data,
    summary,
    inputCosts:
      (
        costsResult.data ??
        []
      ).map(
        (row) => ({
          ...row,
          quantity_used:
            asNumber(
              row.quantity_used,
            ),
          usage_count:
            asNumber(
              row.usage_count,
            ),
          total_cost:
            asNumber(
              row.total_cost,
            ),
        }),
      ),
    production:
      (
        productionResult.data ??
        []
      ).map(
        (row) => ({
          ...row,
          harvested_quantity:
            asNumber(
              row.harvested_quantity,
            ),
          sold_quantity:
            asNumber(
              row.sold_quantity,
            ),
          remaining_quantity:
            asNumber(
              row.remaining_quantity,
            ),
          gross_revenue:
            asNumber(
              row.gross_revenue,
            ),
          harvests_count:
            asNumber(
              row.harvests_count,
            ),
          sales_count:
            asNumber(
              row.sales_count,
            ),
        }),
      ),
    harvests:
      harvestResult.data ??
      [],
    sales,
  };
}
