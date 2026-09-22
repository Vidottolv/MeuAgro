import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

const LOT_FIELDS = `
  id,
  user_id,
  agricultural_input_id,
  supplier,
  purchased_quantity,
  unit,
  total_price,
  unit_price,
  purchase_date,
  expiration_date,
  batch_number,
  notes,
  deleted_at,
  created_at,
  updated_at,
  agricultural_input:agricultural_inputs (
    id,
    name,
    brand,
    base_unit,
    active,
    deleted_at
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

function normalizeNumber(value) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

async function getLotBalances({
  inputId = null,
} = {}) {
  const client = requireSupabase();

  let query =
    client
      .from('inventory_lot_balances')
      .select(`
        inventory_lot_id,
        agricultural_input_id,
        current_quantity,
        unit,
        unit_price,
        purchase_date,
        expiration_date,
        batch_number
      `);

  if (inputId) {
    query = query.eq(
      'agricultural_input_id',
      inputId,
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map(
      (item) => [
        item.inventory_lot_id,
        item,
      ],
    ),
  );
}

function withBalance(lot, balance) {
  return {
    ...lot,
    current_quantity:
      balance?.current_quantity ?? 0,
  };
}

export async function listInventoryLots({
  inputId = null,
  includeEmpty = true,
  limit = null,
} = {}) {
  const client = requireSupabase();

  let query =
    client
      .from('inventory_lots')
      .select(LOT_FIELDS)
      .is('deleted_at', null);

  if (inputId) {
    query = query.eq(
      'agricultural_input_id',
      inputId,
    );
  }

  query = query
    .order('purchase_date', {
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

  const [
    lotResult,
    balances,
  ] = await Promise.all([
    query,
    getLotBalances({
      inputId,
    }),
  ]);

  if (lotResult.error) {
    throw lotResult.error;
  }

  const lots =
    (lotResult.data ?? []).map(
      (lot) =>
        withBalance(
          lot,
          balances.get(lot.id),
        ),
    );

  return includeEmpty
    ? lots
    : lots.filter(
        (lot) =>
          Number(
            lot.current_quantity,
          ) > 0,
      );
}

export async function getInventoryLotById(
  lotId,
) {
  const client = requireSupabase();

  const [
    lotResult,
    balances,
  ] = await Promise.all([
    client
      .from('inventory_lots')
      .select(LOT_FIELDS)
      .eq('id', lotId)
      .maybeSingle(),
    getLotBalances(),
  ]);

  if (lotResult.error) {
    throw lotResult.error;
  }

  if (!lotResult.data) {
    return null;
  }

  return withBalance(
    lotResult.data,
    balances.get(lotId),
  );
}

export async function createInventoryLot(
  inputId,
  formData,
) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const {
    data: input,
    error: inputError,
  } = await client
    .from('agricultural_inputs')
    .select(`
      id,
      user_id,
      name,
      base_unit,
      active,
      deleted_at
    `)
    .eq('id', inputId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (inputError) {
    throw inputError;
  }

  if (
    !input ||
    input.deleted_at
  ) {
    throw new Error(
      'Insumo inválido para o lote.',
    );
  }

  if (!input.active) {
    throw new Error(
      'O insumo está inativo. Reative-o antes de cadastrar um novo lote.',
    );
  }

  const purchasedQuantity =
    normalizeNumber(
      formData.purchasedQuantity,
    );

  const totalPrice =
    normalizeNumber(
      formData.totalPrice,
    );

  const {
    data,
    error,
  } = await client
    .from('inventory_lots')
    .insert({
      user_id: user.id,
      agricultural_input_id:
        input.id,
      supplier:
        formData.supplier
          ?.trim() || null,
      purchased_quantity:
        purchasedQuantity,
      unit:
        input.base_unit,
      total_price:
        totalPrice,
      purchase_date:
        formData.purchaseDate,
      expiration_date:
        formData.expirationDate || null,
      batch_number:
        formData.batchNumber
          ?.trim() || null,
      notes:
        formData.notes
          ?.trim() || null,
    })
    .select(LOT_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateInventoryLotMetadata(
  lotId,
  formData,
) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const {
    data,
    error,
  } = await client
    .from('inventory_lots')
    .update({
      supplier:
        formData.supplier
          ?.trim() || null,
      expiration_date:
        formData.expirationDate || null,
      batch_number:
        formData.batchNumber
          ?.trim() || null,
      notes:
        formData.notes
          ?.trim() || null,
    })
    .eq('id', lotId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select(LOT_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
