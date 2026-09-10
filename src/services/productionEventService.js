import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

import {
  signPhotos,
} from './photoService.js';

const EVENT_FIELDS = `
  id,
  user_id,
  production_cycle_id,
  event_type,
  title,
  description,
  notes,
  occurred_at,
  created_at,
  updated_at,
  event_photos (
    id,
    user_id,
    property_id,
    area_id,
    production_cycle_id,
    production_event_id,
    storage_path,
    description,
    captured_at,
    created_at
  ),
  event_inputs (
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
      base_unit
    ),
    inventory_lot:inventory_lots (
      id,
      batch_number,
      supplier,
      unit,
      unit_price,
      purchase_date
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
  formData,
) {
  return {
    event_type:
      formData.eventType,
    title:
      formData.title
        ?.trim() || '',
    description:
      formData.description
        ?.trim() || null,
    notes:
      formData.notes
        ?.trim() || null,
    occurred_at:
      formData.occurredAt ||
      new Date()
        .toISOString(),
  };
}

async function signEventPhotos(
  events,
) {
  const allPhotos =
    events.flatMap(
      (event) =>
        event.event_photos ||
        [],
    );

  const signed =
    await signPhotos(
      allPhotos,
    );

  const byId =
    new Map(
      signed.map(
        (photo) => [
          photo.id,
          photo,
        ],
      ),
    );

  return events.map(
    (event) => ({
      ...event,
      event_photos:
        (
          event.event_photos ||
          []
        ).map(
          (photo) =>
            byId.get(
              photo.id,
            ) ||
            photo,
        ),
    }),
  );
}

export async function listProductionEvents(
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
        'production_events',
      )
      .select(
        EVENT_FIELDS,
      )
      .eq(
        'production_cycle_id',
        cycleId,
      )
      .order(
        'occurred_at',
        {
          ascending: false,
        },
      );

  if (error) {
    throw error;
  }

  return signEventPhotos(
    data ?? [],
  );
}

export async function getProductionEventById(
  eventId,
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
      .select(
        EVENT_FIELDS,
      )
      .eq(
        'id',
        eventId,
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [
    signed,
  ] =
    await signEventPhotos([
      data,
    ]);

  return signed;
}

export async function createProductionEvent(
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
      .from(
        'production_events',
      )
      .insert({
        ...normalizePayload(
          formData,
        ),
        user_id:
          user.id,
        production_cycle_id:
          cycleId,
      })
      .select(
        EVENT_FIELDS,
      )
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProductionEvent(
  eventId,
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
      .from(
        'production_events',
      )
      .update(
        normalizePayload(
          formData,
        ),
      )
      .eq(
        'id',
        eventId,
      )
      .eq(
        'production_cycle_id',
        cycleId,
      )
      .eq(
        'user_id',
        user.id,
      )
      .select(
        EVENT_FIELDS,
      )
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteProductionEvent(
  eventId,
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
    error,
  } =
    await client
      .from(
        'production_events',
      )
      .delete()
      .eq(
        'id',
        eventId,
      )
      .eq(
        'user_id',
        user.id,
      );

  if (error) {
    throw error;
  }
}
