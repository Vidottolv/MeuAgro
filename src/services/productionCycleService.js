import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

import {
  OPEN_PRODUCTION_CYCLE_STATUSES,
} from '../constants/productionCycleStatus.js';

import {
  queueHarvestNotificationSync,
} from './notificationService.js';

const CYCLE_FIELDS = `
  id,
  user_id,
  property_id,
  area_id,
  season_id,
  crop_id,
  variety,
  planted_quantity,
  planted_unit,
  planting_date,
  initial_harvest_forecast,
  current_harvest_forecast,
  final_harvest_date,
  status,
  notes,
  deleted_at,
  created_at,
  updated_at,
  property:properties (
    id,
    name,
    city,
    state,
    deleted_at
  ),
  area:areas (
    id,
    property_id,
    name,
    status,
    deleted_at,
    area_type:area_types (
      id,
      name
    )
  ),
  season:seasons (
    id,
    property_id,
    name,
    status,
    deleted_at
  ),
  crop:crops (
    id,
    name,
    category,
    average_cycle_days,
    is_system,
    active
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

function normalizePayload(data) {
  return {
    property_id: data.propertyId,
    area_id: data.areaId,
    season_id: data.seasonId || null,
    crop_id: data.cropId,
    variety: data.variety?.trim() || null,
    planted_quantity:
      data.plantedQuantity === '' ||
      data.plantedQuantity === null ||
      data.plantedQuantity === undefined
        ? null
        : Number(data.plantedQuantity),
    planted_unit:
      data.plantedUnit?.trim() || null,
    planting_date: data.plantingDate,
    initial_harvest_forecast:
      data.initialHarvestForecast || null,
    current_harvest_forecast:
      data.currentHarvestForecast || null,
    final_harvest_date:
      data.finalHarvestDate || null,
    status: data.status || 'planted',
    notes: data.notes?.trim() || null,
  };
}

export async function listProductionCycles({
  propertyId = null,
  areaId = null,
  seasonId = null,
  cropId = null,
  status = null,
  openOnly = false,
  archived = false,
  limit = null,
} = {}) {
  const client = requireSupabase();

  let query =
    client
      .from('production_cycles')
      .select(CYCLE_FIELDS);

  if (archived) {
    query =
      query.not('deleted_at', 'is', null);
  } else {
    query =
      query.is('deleted_at', null);
  }

  if (propertyId) {
    query =
      query.eq('property_id', propertyId);
  }
  if (areaId) {
    query =
      query.eq('area_id', areaId);
  }
  if (seasonId) {
    query =
      query.eq('season_id', seasonId);
  }
  if (cropId) {
    query =
      query.eq('crop_id', cropId);
  }

  if (openOnly && !archived) {
    query =
      query.in(
        'status',
        OPEN_PRODUCTION_CYCLE_STATUSES,
      );
  } else if (status && !archived) {
    query =
      query.eq('status', status);
  }

  query =
    query
      .order('planting_date', {
        ascending: false,
      })
      .order('created_at', {
        ascending: false,
      });

  if (
    Number.isInteger(limit) &&
    limit > 0
  ) {
    query = query.limit(limit);
  }

  const { data, error } =
    await query;

  if (error) throw error;
  return data ?? [];
}

export async function getProductionCycleById(id) {
  const client = requireSupabase();

  const { data, error } =
    await client
      .from('production_cycles')
      .select(CYCLE_FIELDS)
      .eq('id', id)
      .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createProductionCycle(
  formData,
) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const { data, error } =
    await client
      .from('production_cycles')
      .insert({
        ...normalizePayload(formData),
        user_id: user.id,
      })
      .select(CYCLE_FIELDS)
      .single();

  if (error) throw error;

  queueHarvestNotificationSync();

  return data;
}

export async function updateProductionCycle(
  id,
  formData,
) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const { data, error } =
    await client
      .from('production_cycles')
      .update(normalizePayload(formData))
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select(CYCLE_FIELDS)
      .single();

  if (error) throw error;

  queueHarvestNotificationSync();

  return data;
}

export async function archiveProductionCycle(id) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const { data, error } =
    await client
      .from('production_cycles')
      .update({
        deleted_at:
          new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(CYCLE_FIELDS)
      .single();

  if (error) throw error;

  queueHarvestNotificationSync();

  return data;
}

export async function restoreProductionCycle(id) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const { data, error } =
    await client
      .from('production_cycles')
      .update({
        deleted_at: null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(CYCLE_FIELDS)
      .single();

  if (error) throw error;

  queueHarvestNotificationSync();

  return data;
}

export async function suggestHarvestDate(
  cropId,
  plantingDate,
) {
  if (!cropId || !plantingDate) {
    return null;
  }

  const client = requireSupabase();

  const { data, error } =
    await client.rpc(
      'suggest_harvest_date',
      {
        p_crop_id: cropId,
        p_planting_date: plantingDate,
      },
    );

  if (error) throw error;
  return data || null;
}

export async function countOpenProductionCycles(
  filters = {},
) {
  const client = requireSupabase();

  let query =
    client
      .from('production_cycles')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .is('deleted_at', null)
      .in(
        'status',
        OPEN_PRODUCTION_CYCLE_STATUSES,
      );

  if (filters.propertyId) {
    query =
      query.eq(
        'property_id',
        filters.propertyId,
      );
  }
  if (filters.areaId) {
    query =
      query.eq(
        'area_id',
        filters.areaId,
      );
  }
  if (filters.seasonId) {
    query =
      query.eq(
        'season_id',
        filters.seasonId,
      );
  }
  if (filters.cropId) {
    query =
      query.eq(
        'crop_id',
        filters.cropId,
      );
  }

  const { count, error } =
    await query;

  if (error) throw error;
  return count ?? 0;
}

export async function countOpenCyclesByCrop(cropId) {
  return countOpenProductionCycles({
    cropId,
  });
}
