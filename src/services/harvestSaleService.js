import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

import {
  getHarvestSalesSummary,
  listHarvests,
} from './harvestService.js';

const SALE_FIELDS = `
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
  updated_at,
  harvest:harvests (
    id,
    user_id,
    production_cycle_id,
    harvest_date,
    quantity,
    unit,
    quality_classification,
    destination,
    notes,
    production_cycle:production_cycles (
      id,
      property_id,
      area_id,
      variety,
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
      )
    )
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

function normalizePayload(
  data,
  harvest,
) {
  return {
    harvest_id:
      harvest.id,
    buyer:
      data.buyer?.trim() ||
      null,
    quantity:
      Number(
        data.quantity,
      ),
    unit:
      harvest.unit,
    unit_price:
      Number(
        data.unitPrice,
      ),
    sale_date:
      data.saleDate,
    payment_method:
      data.paymentMethod ||
      null,
    notes:
      data.notes?.trim() ||
      null,
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

export async function listHarvestSales({
  harvestId = null,
  propertyId = null,
  month = null,
  limit = null,
} = {}) {
  const client =
    requireSupabase();

  let query =
    client
      .from('harvest_sales')
      .select(SALE_FIELDS)
      .order(
        'sale_date',
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

  if (harvestId) {
    query =
      query.eq(
        'harvest_id',
        harvestId,
      );
  }

  const bounds =
    monthBounds(month);

  if (bounds) {
    query =
      query
        .gte(
          'sale_date',
          bounds.start,
        )
        .lt(
          'sale_date',
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
    (sale) =>
      sale.harvest
        ?.production_cycle
        ?.property_id ===
      propertyId,
  );
}

export async function getHarvestSaleById(
  saleId,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from('harvest_sales')
      .select(SALE_FIELDS)
      .eq(
        'id',
        saleId,
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function listSaleEligibleHarvests() {
  const harvests =
    await listHarvests();

  return harvests.filter(
    (harvest) => {
      const summary =
        getHarvestSalesSummary(
          harvest,
        );

      return (
        !harvest.production_cycle
          ?.deleted_at &&
        summary.allowsSales &&
        summary.remainingQuantity >
          0
      );
    },
  );
}

export function getRemainingQuantityForSale(
  harvest,
  {
    currentSaleId = null,
  } = {},
) {
  const sales =
    harvest?.sales ?? [];

  const soldByOthers =
    sales
      .filter(
        (sale) =>
          sale.id !==
          currentSaleId,
      )
      .reduce(
        (sum, sale) =>
          sum +
          Number(
            sale.quantity ||
            0,
          ),
        0,
      );

  return Math.max(
    0,
    Number(
      harvest?.quantity ||
      0,
    ) -
      soldByOthers,
  );
}

export async function createHarvestSale(
  harvest,
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
      .from('harvest_sales')
      .insert({
        ...normalizePayload(
          formData,
          harvest,
        ),
        user_id:
          user.id,
      })
      .select(SALE_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateHarvestSale(
  saleId,
  harvest,
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

  const payload =
    normalizePayload(
      formData,
      harvest,
    );

  delete payload.harvest_id;

  const {
    data,
    error,
  } =
    await client
      .from('harvest_sales')
      .update(payload)
      .eq(
        'id',
        saleId,
      )
      .eq(
        'user_id',
        user.id,
      )
      .select(SALE_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}
