import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

import {
  queueHarvestNotificationSync,
} from './notificationService.js';

import {
  harvestAllowsSales,
} from '../constants/harvestDestinations.js';

const HARVEST_FIELDS = `
  id,
  user_id,
  production_cycle_id,
  production_event_id,
  harvest_date,
  quantity,
  unit,
  quality_classification,
  destination,
  notes,
  created_at,
  updated_at,
  production_cycle:production_cycles (
    id,
    user_id,
    property_id,
    area_id,
    season_id,
    crop_id,
    variety,
    planting_date,
    current_harvest_forecast,
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
  ),
  sales:harvest_sales (
    id,
    user_id,
    harvest_id,
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
`;

const HARVESTABLE_CYCLE_FIELDS = `
  id,
  user_id,
  property_id,
  area_id,
  season_id,
  crop_id,
  variety,
  planting_date,
  current_harvest_forecast,
  status,
  deleted_at,
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
  ),
  season:seasons (
    id,
    name
  )
`;

const HARVESTABLE_STATUSES = [
  'planted',
  'developing',
  'near_harvest',
  'ready_to_harvest',
];

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'O Supabase não foi inicializado.',
    );
  }

  return supabase;
}

function normalizePayload(data) {
  return {
    harvest_date:
      data.harvestDate,
    quantity:
      Number(
        data.quantity,
      ),
    unit:
      data.unit?.trim() || '',
    quality_classification:
      data.qualityClassification
        ?.trim() || null,
    destination:
      data.destination,
    notes:
      data.notes?.trim() || null,
  };
}

function monthBounds(
  month,
) {
  if (
    !month ||
    !/^\d{4}-\d{2}$/.test(
      month,
    )
  ) {
    return null;
  }

  const [
    year,
    monthNumber,
  ] =
    month
      .split('-')
      .map(Number);

  const start =
    `${year}-${String(
      monthNumber,
    ).padStart(2, '0')}-01`;

  const next =
    new Date(
      year,
      monthNumber,
      1,
      12,
      0,
      0,
      0,
    );

  const end = [
    next.getFullYear(),
    String(
      next.getMonth() + 1,
    ).padStart(2, '0'),
    '01',
  ].join('-');

  return {
    start,
    end,
  };
}

export function getHarvestSalesSummary(
  harvest,
) {
  const sales =
    harvest?.sales ?? [];

  const soldQuantity =
    sales.reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.quantity || 0,
        ),
      0,
    );

  const grossRevenue =
    sales.reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.total_value || 0,
        ),
      0,
    );

  const harvestedQuantity =
    Number(
      harvest?.quantity || 0,
    );

  return {
    salesCount:
      sales.length,
    soldQuantity,
    grossRevenue,
    remainingQuantity:
      Math.max(
        0,
        harvestedQuantity -
        soldQuantity,
      ),
    allowsSales:
      harvestAllowsSales(
        harvest?.destination,
      ),
  };
}

export async function listHarvests({
  cycleId = null,
  propertyId = null,
  destination = null,
  month = null,
  limit = null,
} = {}) {
  const client =
    requireSupabase();

  let query =
    client
      .from('harvests')
      .select(HARVEST_FIELDS)
      .order(
        'harvest_date',
        {
          ascending: false,
        },
      )
      .order(
        'created_at',
        {
          ascending: false,
        },
      );

  if (cycleId) {
    query =
      query.eq(
        'production_cycle_id',
        cycleId,
      );
  }

  if (destination) {
    query =
      query.eq(
        'destination',
        destination,
      );
  }

  const bounds =
    monthBounds(month);

  if (bounds) {
    query =
      query
        .gte(
          'harvest_date',
          bounds.start,
        )
        .lt(
          'harvest_date',
          bounds.end,
        );
  }

  if (
    Number.isInteger(limit) &&
    limit > 0
  ) {
    query =
      query.limit(limit);
  }

  const {
    data,
    error,
  } =
    await query;

  if (error) {
    throw error;
  }

  const rows =
    data ?? [];

  if (!propertyId) {
    return rows;
  }

  return rows.filter(
    (harvest) =>
      harvest.production_cycle
        ?.property_id ===
      propertyId,
  );
}

export async function getHarvestById(
  harvestId,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from('harvests')
      .select(HARVEST_FIELDS)
      .eq(
        'id',
        harvestId,
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function listHarvestableCycles() {
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
      .select(
        HARVESTABLE_CYCLE_FIELDS,
      )
      .is(
        'deleted_at',
        null,
      )
      .in(
        'status',
        HARVESTABLE_STATUSES,
      )
      .order(
        'current_harvest_forecast',
        {
          ascending: true,
          nullsFirst: false,
        },
      )
      .order(
        'planting_date',
        {
          ascending: false,
        },
      );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createHarvest(
  cycleId,
  formData,
) {
  const client =
    requireSupabase();

  const user =
    await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const {
    data,
    error,
  } =
    await client
      .from('harvests')
      .insert({
        ...normalizePayload(
          formData,
        ),
        user_id:
          user.id,
        production_cycle_id:
          cycleId,
      })
      .select(HARVEST_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateHarvest(
  harvestId,
  formData,
) {
  const client =
    requireSupabase();

  const user =
    await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const {
    data,
    error,
  } =
    await client
      .from('harvests')
      .update(
        normalizePayload(
          formData,
        ),
      )
      .eq(
        'id',
        harvestId,
      )
      .eq(
        'user_id',
        user.id,
      )
      .select(HARVEST_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function finalizeCycleFromHarvest(
  harvestId,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client.rpc(
      'finalize_cycle_from_harvest',
      {
        p_harvest_id:
          harvestId,
      },
    );

  if (error) {
    throw error;
  }

  queueHarvestNotificationSync();

  return data;
}
