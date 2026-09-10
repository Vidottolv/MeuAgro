import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

const INPUT_FIELDS = `
  id,
  user_id,
  name,
  brand,
  category,
  base_unit,
  description,
  notes,
  minimum_stock,
  ideal_stock,
  active,
  deleted_at,
  created_at,
  updated_at
`;

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'O Supabase não foi inicializado.',
    );
  }

  return supabase;
}

function normalizeNumber(
  value,
) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}

function normalizePayload(
  data,
) {
  return {
    name:
      data.name
        ?.trim() || '',
    brand:
      data.brand
        ?.trim() || null,
    category:
      data.category,
    base_unit:
      data.baseUnit,
    description:
      data.description
        ?.trim() || null,
    notes:
      data.notes
        ?.trim() || null,
    minimum_stock:
      normalizeNumber(
        data.minimumStock,
      ) ?? 0,
    ideal_stock:
      normalizeNumber(
        data.idealStock,
      ),
  };
}

async function getBalances() {
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
        current_quantity,
        stock_status,
        minimum_stock,
        ideal_stock,
        base_unit
      `);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map(
      (item) => [
        item.agricultural_input_id,
        item,
      ],
    ),
  );
}

function withBalance(
  input,
  balance,
) {
  return {
    ...input,
    current_quantity:
      balance?.current_quantity ??
      0,
    stock_status:
      balance?.stock_status ??
      'out_of_stock',
  };
}

export async function listAgriculturalInputs({
  includeInactive = true,
} = {}) {
  const client =
    requireSupabase();

  let query =
    client
      .from(
        'agricultural_inputs',
      )
      .select(
        INPUT_FIELDS,
      )
      .is(
        'deleted_at',
        null,
      );

  if (!includeInactive) {
    query =
      query.eq(
        'active',
        true,
      );
  }

  query =
    query.order(
      'name',
      {
        ascending: true,
      },
    );

  const [
    inputResult,
    balances,
  ] =
    await Promise.all([
      query,
      getBalances(),
    ]);

  if (
    inputResult.error
  ) {
    throw inputResult.error;
  }

  return (
    inputResult.data ?? []
  ).map(
    (input) =>
      withBalance(
        input,
        balances.get(
          input.id,
        ),
      ),
  );
}

export async function getAgriculturalInputById(
  id,
) {
  const client =
    requireSupabase();

  const [
    inputResult,
    balances,
  ] =
    await Promise.all([
      client
        .from(
          'agricultural_inputs',
        )
        .select(
          INPUT_FIELDS,
        )
        .eq('id', id)
        .maybeSingle(),
      getBalances(),
    ]);

  if (
    inputResult.error
  ) {
    throw inputResult.error;
  }

  if (!inputResult.data) {
    return null;
  }

  return withBalance(
    inputResult.data,
    balances.get(id),
  );
}

export async function createAgriculturalInput(
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
      .from(
        'agricultural_inputs',
      )
      .insert({
        ...normalizePayload(
          formData,
        ),
        user_id:
          user.id,
        active: true,
      })
      .select(
        INPUT_FIELDS,
      )
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAgriculturalInput(
  id,
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
      .from(
        'agricultural_inputs',
      )
      .update(
        normalizePayload(
          formData,
        ),
      )
      .eq('id', id)
      .eq(
        'user_id',
        user.id,
      )
      .is(
        'deleted_at',
        null,
      )
      .select(
        INPUT_FIELDS,
      )
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function setAgriculturalInputActive(
  id,
  active,
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
      .from(
        'agricultural_inputs',
      )
      .update({
        active:
          Boolean(active),
      })
      .eq('id', id)
      .eq(
        'user_id',
        user.id,
      )
      .is(
        'deleted_at',
        null,
      )
      .select(
        INPUT_FIELDS,
      )
      .single();

  if (error) {
    throw error;
  }

  return data;
}
