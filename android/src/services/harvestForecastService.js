import {
  supabase,
} from '../js/supabase.js';

import {
  differenceInCalendarDays,
} from '../js/cycleMetrics.js';

import {
  getHarvestForecastState,
} from '../constants/harvestForecast.js';

const TERMINAL_STATUSES = [
  'harvested',
  'closed',
  'cancelled',
];

const HARVEST_FIELDS = `
  id,
  property_id,
  area_id,
  season_id,
  crop_id,
  variety,
  planting_date,
  initial_harvest_forecast,
  current_harvest_forecast,
  final_harvest_date,
  status,
  deleted_at,
  crop:crops (
    id,
    name,
    category,
    average_cycle_days
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

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'O Supabase não foi inicializado.',
    );
  }

  return supabase;
}

function todayDateString() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(
      now.getMonth() + 1,
    ).padStart(2, '0'),
    String(
      now.getDate(),
    ).padStart(2, '0'),
  ].join('-');
}

export function enrichHarvestForecastCycle(
  cycle,
) {
  const today =
    todayDateString();

  const daysToHarvest =
    cycle.current_harvest_forecast
      ? differenceInCalendarDays(
          cycle.current_harvest_forecast,
          today,
        )
      : null;

  const forecastState =
    getHarvestForecastState(
      daysToHarvest,
    );

  return {
    ...cycle,
    days_to_harvest:
      daysToHarvest,
    forecast_state:
      forecastState,
  };
}

export async function listHarvestForecastCycles({
  propertyId = null,
  filter = 'all',
} = {}) {
  const client =
    requireSupabase();

  let query =
    client
      .from('production_cycles')
      .select(HARVEST_FIELDS)
      .is('deleted_at', null)
      .not(
        'status',
        'in',
        `(${TERMINAL_STATUSES.join(',')})`,
      )
      .not(
        'current_harvest_forecast',
        'is',
        null,
      )
      .order(
        'current_harvest_forecast',
        {
          ascending: true,
        },
      );

  if (propertyId) {
    query =
      query.eq(
        'property_id',
        propertyId,
      );
  }

  const {
    data,
    error,
  } =
    await query;

  if (error) {
    throw error;
  }

  const enriched =
    (data ?? []).map(
      enrichHarvestForecastCycle,
    );

  if (filter === 'all') {
    return enriched;
  }

  return enriched.filter(
    (cycle) =>
      cycle.forecast_state ===
      filter,
  );
}

export async function getHarvestForecastSummary() {
  const cycles =
    await listHarvestForecastCycles();

  const summary = {
    total: cycles.length,
    overdue: 0,
    today: 0,
    harvest_week: 0,
    upcoming: 0,
  };

  for (const cycle of cycles) {
    if (
      Object.hasOwn(
        summary,
        cycle.forecast_state,
      )
    ) {
      summary[
        cycle.forecast_state
      ] += 1;
    }
  }

  return summary;
}
