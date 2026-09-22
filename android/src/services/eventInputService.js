import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

import {
  getInventoryLotById,
} from './inventoryLotService.js';

const EVENT_INPUT_FIELDS = `
  id,
  user_id,
  production_event_id,
  agricultural_input_id,
  inventory_lot_id,
  quantity,
  unit,
  unit_cost,
  total_cost,
  inventory_transaction_id,
  notes,
  created_at,
  agricultural_input:agricultural_inputs (
    id,
    name,
    brand,
    category,
    base_unit,
    active,
    deleted_at
  ),
  inventory_lot:inventory_lots (
    id,
    supplier,
    batch_number,
    purchase_date,
    expiration_date,
    unit,
    unit_price
  ),
  inventory_transaction:inventory_transactions (
    id,
    transaction_type,
    occurred_at,
    quantity,
    unit,
    unit_cost,
    total_cost
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

export async function listEventInputs(
  eventId,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from('event_inputs')
      .select(EVENT_INPUT_FIELDS)
      .eq(
        'production_event_id',
        eventId,
      )
      .order(
        'created_at',
        {
          ascending: true,
        },
      );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getInputCurrentBalance(
  inputId,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from('inventory_balances')
      .select(`
        agricultural_input_id,
        current_quantity,
        base_unit,
        stock_status,
        minimum_stock,
        ideal_stock
      `)
      .eq(
        'agricultural_input_id',
        inputId,
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    agricultural_input_id:
      inputId,
    current_quantity:
      Number(
        data?.current_quantity ??
        0,
      ),
    base_unit:
      data?.base_unit || '',
    stock_status:
      data?.stock_status ||
      'out_of_stock',
    minimum_stock:
      Number(
        data?.minimum_stock ??
        0,
      ),
    ideal_stock:
      data?.ideal_stock === null ||
      data?.ideal_stock === undefined
        ? null
        : Number(
            data.ideal_stock,
          ),
  };
}

export async function createEventInput(
  eventId,
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

  const quantity =
    Number(
      formData.quantity,
    );

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      'Informe uma quantidade maior que zero.',
    );
  }

  const lot =
    await getInventoryLotById(
      formData.lotId,
    );

  if (
    !lot ||
    lot.deleted_at ||
    lot.agricultural_input_id !==
      formData.inputId
  ) {
    throw new Error(
      'Lote inválido para o insumo selecionado.',
    );
  }

  if (
    Number(
      lot.current_quantity,
    ) < quantity
  ) {
    throw new Error(
      `Saldo insuficiente no lote. Disponível: ${lot.current_quantity} ${lot.unit}.`,
    );
  }

  const {
    data,
    error,
  } =
    await client
      .from('event_inputs')
      .insert({
        user_id:
          user.id,
        production_event_id:
          eventId,
        agricultural_input_id:
          formData.inputId,
        inventory_lot_id:
          formData.lotId,
        quantity,
        unit:
          lot.unit,
        notes:
          formData.notes
            ?.trim() || null,
      })
      .select(EVENT_INPUT_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}
