import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

import {
  MANUAL_INVENTORY_TRANSACTION_TYPES,
} from '../constants/inventoryTransactionTypes.js';

const TRANSACTION_FIELDS = `
  id,
  user_id,
  agricultural_input_id,
  inventory_lot_id,
  production_cycle_id,
  production_event_id,
  transaction_type,
  quantity,
  unit,
  unit_cost,
  total_cost,
  occurred_at,
  notes,
  created_at,
  agricultural_input:agricultural_inputs (
    id,
    name,
    brand,
    base_unit,
    active
  ),
  inventory_lot:inventory_lots (
    id,
    supplier,
    batch_number,
    unit,
    unit_price,
    purchase_date,
    expiration_date
  ),
  production_cycle:production_cycles (
    id,
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
  ),
  production_event:production_events (
    id,
    title,
    event_type,
    occurred_at
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

function manualTypes() {
  return new Set(
    MANUAL_INVENTORY_TRANSACTION_TYPES.map(
      ([value]) => value,
    ),
  );
}

export async function listInventoryTransactions({
  inputId = null,
  lotId = null,
  type = null,
  limit = null,
} = {}) {
  const client = requireSupabase();

  let query =
    client
      .from('inventory_transactions')
      .select(TRANSACTION_FIELDS);

  if (inputId) {
    query = query.eq(
      'agricultural_input_id',
      inputId,
    );
  }

  if (lotId) {
    query = query.eq(
      'inventory_lot_id',
      lotId,
    );
  }

  if (type) {
    query = query.eq(
      'transaction_type',
      type,
    );
  }

  query = query
    .order('occurred_at', {
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

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getInventoryTransactionById(
  transactionId,
) {
  const client = requireSupabase();

  const {
    data,
    error,
  } = await client
    .from('inventory_transactions')
    .select(TRANSACTION_FIELDS)
    .eq('id', transactionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createManualInventoryTransaction(
  formData,
) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  if (
    !manualTypes().has(
      formData.transactionType,
    )
  ) {
    throw new Error(
      'Este tipo de movimentação não pode ser criado manualmente.',
    );
  }

  const {
    data: lot,
    error: lotError,
  } = await client
    .from('inventory_lots')
    .select(`
      id,
      user_id,
      agricultural_input_id,
      unit,
      unit_price,
      deleted_at
    `)
    .eq('id', formData.lotId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (lotError) {
    throw lotError;
  }

  if (
    !lot ||
    lot.deleted_at ||
    lot.agricultural_input_id !==
      formData.inputId
  ) {
    throw new Error(
      'Lote inválido para o insumo informado.',
    );
  }

  const quantity =
    Number(
      formData.quantity,
    );

  const {
    data,
    error,
  } = await client
    .from('inventory_transactions')
    .insert({
      user_id: user.id,
      agricultural_input_id:
        formData.inputId,
      inventory_lot_id:
        lot.id,
      production_cycle_id:
        formData.productionCycleId || null,
      production_event_id:
        formData.productionEventId || null,
      transaction_type:
        formData.transactionType,
      quantity,
      unit:
        lot.unit,
      unit_cost:
        lot.unit_price,
      occurred_at:
        formData.occurredAt ||
        new Date().toISOString(),
      notes:
        formData.notes
          ?.trim() || null,
    })
    .select(TRANSACTION_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
