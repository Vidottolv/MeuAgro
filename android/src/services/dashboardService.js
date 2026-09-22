import {
  supabase,
} from '../js/supabase.js';

import {
  getProductionEventIconName,
} from '../constants/productionEventTypes.js';

const SUMMARY_DEFAULTS = {
  properties_count: 0,
  active_areas_count: 0,
  active_cycles_count: 0,
  near_harvest_count: 0,
  low_stock_count: 0,
  month_harvests_count: 0,
};

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'O Supabase não foi inicializado.',
    );
  }

  return supabase;
}

function localDateString(date) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1,
    ).padStart(2, '0'),
    String(
      date.getDate(),
    ).padStart(2, '0'),
  ].join('-');
}

function nearHarvestWindow() {
  const start = new Date();

  start.setHours(
    12,
    0,
    0,
    0,
  );

  const end =
    new Date(start);

  end.setDate(
    end.getDate() + 7,
  );

  return {
    start:
      localDateString(start),
    end:
      localDateString(end),
  };
}

function asNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

export async function getDashboardSummary() {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client.rpc(
      'dashboard_summary',
    );

  if (error) {
    throw error;
  }

  const row =
    Array.isArray(data)
      ? data[0]
      : data;

  return {
    properties_count:
      asNumber(
        row?.properties_count,
      ),
    active_areas_count:
      asNumber(
        row?.active_areas_count,
      ),
    active_cycles_count:
      asNumber(
        row?.active_cycles_count,
      ),
    near_harvest_count:
      asNumber(
        row?.near_harvest_count,
      ),
    low_stock_count:
      asNumber(
        row?.low_stock_count,
      ),
    month_harvests_count:
      asNumber(
        row?.month_harvests_count,
      ),
  };
}

export function emptyDashboardSummary() {
  return {
    ...SUMMARY_DEFAULTS,
  };
}

export async function listNearHarvestCycles(
  limit = 4,
) {
  const client =
    requireSupabase();

  const {
    start,
    end,
  } =
    nearHarvestWindow();

  const {
    data,
    error,
  } =
    await client
      .from(
        'production_cycles',
      )
      .select(`
        id,
        planting_date,
        current_harvest_forecast,
        status,
        variety,
        crop:crops (
          id,
          name,
          average_cycle_days
        ),
        area:areas (
          id,
          name
        ),
        property:properties (
          id,
          name
        )
      `)
      .is(
        'deleted_at',
        null,
      )
      .not(
        'status',
        'in',
        '(closed,cancelled,harvested)',
      )
      .gte(
        'current_harvest_forecast',
        start,
      )
      .lte(
        'current_harvest_forecast',
        end,
      )
      .order(
        'current_harvest_forecast',
        {
          ascending: true,
        },
      )
      .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listLowStockInputs(
  limit = 4,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from(
        'inventory_balances',
      )
      .select(`
        agricultural_input_id,
        name,
        brand,
        base_unit,
        minimum_stock,
        current_quantity,
        stock_status,
        active
      `)
      .eq(
        'active',
        true,
      )
      .in(
        'stock_status',
        [
          'low_stock',
          'out_of_stock',
        ],
      )
      .order(
        'current_quantity',
        {
          ascending: true,
        },
      )
      .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function listRecentCycleActivities(
  limit,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from(
        'production_cycles',
      )
      .select(`
        id,
        created_at,
        planting_date,
        status,
        variety,
        crop:crops (
          id,
          name
        ),
        area:areas (
          id,
          name
        ),
        property:properties (
          id,
          name
        )
      `)
      .is(
        'deleted_at',
        null,
      )
      .order(
        'created_at',
        {
          ascending: false,
        },
      )
      .limit(limit);

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ).map(
    (cycle) => ({
      id:
        `cycle-${cycle.id}`,
      occurredAt:
        cycle.created_at,
      type:
        'planting',
      iconName:
        'sprout',
      title:
        cycle.crop?.name
          ? `Plantio de ${cycle.crop.name}`
          : 'Plantio registrado',
      detail:
        [
          cycle.area?.name,
          cycle.property?.name,
        ]
          .filter(Boolean)
          .join(' • '),
      href:
        `/plantings/${cycle.id}`,
    }),
  );
}

async function listRecentEventActivities(
  limit,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from(
        'production_events',
      )
      .select(`
        id,
        event_type,
        title,
        description,
        occurred_at,
        production_cycle:production_cycles (
          id,
          crop:crops (
            id,
            name
          ),
          area:areas (
            id,
            name
          )
        )
      `)
      .order(
        'occurred_at',
        {
          ascending: false,
        },
      )
      .limit(limit);

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ).map(
    (event) => ({
      id:
        `event-${event.id}`,
      occurredAt:
        event.occurred_at,
      type:
        event.event_type ||
        'event',
      iconName:
        getProductionEventIconName(
          event.event_type,
        ),
      title:
        event.title ||
        'Atividade registrada',
      detail:
        [
          event.production_cycle
            ?.crop?.name,
          event.production_cycle
            ?.area?.name,
        ]
          .filter(Boolean)
          .join(' • '),
      href:
        event.production_cycle?.id
          ? `/plantings/${event.production_cycle.id}#timeline`
          : '/plantings',
    }),
  );
}

async function listRecentHarvestActivities(
  limit,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from('harvests')
      .select(`
        id,
        harvest_date,
        quantity,
        unit,
        created_at,
        production_cycle:production_cycles (
          id,
          crop:crops (
            id,
            name
          ),
          area:areas (
            id,
            name
          )
        )
      `)
      .order(
        'created_at',
        {
          ascending: false,
        },
      )
      .limit(limit);

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ).map(
    (harvest) => ({
      id:
        `harvest-${harvest.id}`,
      occurredAt:
        harvest.created_at,
      type:
        'harvest',
      iconName:
        'harvest',
      title:
        harvest.production_cycle
          ?.crop?.name
          ? `Colheita de ${harvest.production_cycle.crop.name}`
          : 'Colheita registrada',
      detail:
        harvest.production_cycle
          ?.area?.name ||
        '',
      href:
        `/more/harvests/${harvest.id}`,
    }),
  );
}


async function listRecentSaleActivities(
  limit,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from(
        'harvest_sales',
      )
      .select(`
        id,
        buyer,
        total_value,
        sale_date,
        created_at,
        harvest:harvests (
          id,
          production_cycle:production_cycles (
            id,
            crop:crops (
              id,
              name
            ),
            area:areas (
              id,
              name
            )
          )
        )
      `)
      .order(
        'created_at',
        {
          ascending: false,
        },
      )
      .limit(limit);

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ).map(
    (sale) => ({
      id:
        `sale-${sale.id}`,
      occurredAt:
        sale.created_at,
      type:
        'sale',
      iconName:
        'cart',
      title:
        sale.harvest
          ?.production_cycle
          ?.crop?.name
          ? `Venda de ${sale.harvest.production_cycle.crop.name}`
          : 'Venda registrada',
      detail:
        [
          sale.buyer,
          sale.harvest
            ?.production_cycle
            ?.area?.name,
        ]
          .filter(Boolean)
          .join(' • '),
      href:
        `/more/sales/${sale.id}`,
    }),
  );
}

export async function listRecentActivities(
  limit = 6,
) {
  const perSource =
    Math.max(
      4,
      limit,
    );

  const results =
    await Promise.allSettled([
      listRecentEventActivities(
        perSource,
      ),
      listRecentSaleActivities(
        perSource,
      ),
    ]);

  const activities = [];

  for (const result of results) {
    if (
      result.status ===
      'fulfilled'
    ) {
      activities.push(
        ...result.value,
      );
    } else {
      console.warn(
        'Uma fonte de atividades recentes não pôde ser carregada:',
        result.reason,
      );
    }
  }

  return activities
    .filter(
      (activity) =>
        activity.occurredAt,
    )
    .sort(
      (a, b) =>
        new Date(
          b.occurredAt,
        ).getTime() -
        new Date(
          a.occurredAt,
        ).getTime(),
    )
    .slice(0, limit);
}
