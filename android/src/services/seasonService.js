import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

const SEASON_FIELDS = `
  id,
  user_id,
  property_id,
  name,
  start_date,
  end_date,
  description,
  status,
  deleted_at,
  created_at,
  updated_at,
  property:properties (
    id,
    name,
    city,
    state,
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

function normalizePayload(data) {
  return {
    property_id:
      data.propertyId,
    name:
      data.name?.trim() || '',
    start_date:
      data.startDate || null,
    end_date:
      data.endDate || null,
    description:
      data.description?.trim() || null,
    status:
      data.status || 'planned',
  };
}

export async function listSeasons({
  propertyId = null,
  status = null,
  archived = false,
} = {}) {
  const client =
    requireSupabase();

  let query =
    client
      .from('seasons')
      .select(SEASON_FIELDS);

  if (archived) {
    query =
      query.not(
        'deleted_at',
        'is',
        null,
      );
  } else {
    query =
      query.is(
        'deleted_at',
        null,
      );
  }

  if (propertyId) {
    query =
      query.eq(
        'property_id',
        propertyId,
      );
  }

  if (status) {
    query =
      query.eq(
        'status',
        status,
      );
  }

  query =
    query
      .order(
        'start_date',
        {
          ascending: false,
          nullsFirst: false,
        },
      )
      .order(
        'created_at',
        {
          ascending: false,
        },
      );

  const {
    data,
    error,
  } =
    await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getSeasonById(id) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from('seasons')
      .select(SEASON_FIELDS)
      .eq('id', id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createSeason(
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
    );

  const {
    data,
    error,
  } =
    await client
      .from('seasons')
      .insert({
        ...payload,
        user_id: user.id,
      })
      .select(SEASON_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateSeason(
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

  const payload =
    normalizePayload(
      formData,
    );

  const {
    data,
    error,
  } =
    await client
      .from('seasons')
      .update(payload)
      .eq('id', id)
      .eq(
        'user_id',
        user.id,
      )
      .is(
        'deleted_at',
        null,
      )
      .select(SEASON_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveSeason(id) {
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
      .from('seasons')
      .update({
        deleted_at:
          new Date().toISOString(),
      })
      .eq('id', id)
      .eq(
        'user_id',
        user.id,
      )
      .select(SEASON_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function restoreSeason(id) {
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
      .from('seasons')
      .update({
        deleted_at: null,
      })
      .eq('id', id)
      .eq(
        'user_id',
        user.id,
      )
      .select(SEASON_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function countOpenSeasons(
  propertyId = null,
) {
  const client =
    requireSupabase();

  let query =
    client
      .from('seasons')
      .select(
        'id',
        {
          count: 'exact',
          head: true,
        },
      )
      .is(
        'deleted_at',
        null,
      )
      .in(
        'status',
        [
          'planned',
          'active',
        ],
      );

  if (propertyId) {
    query =
      query.eq(
        'property_id',
        propertyId,
      );
  }

  const {
    count,
    error,
  } =
    await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function listRecentPropertySeasons(
  propertyId,
  limit = 3,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from('seasons')
      .select(SEASON_FIELDS)
      .eq(
        'property_id',
        propertyId,
      )
      .is(
        'deleted_at',
        null,
      )
      .order(
        'start_date',
        {
          ascending: false,
          nullsFirst: false,
        },
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

  return data ?? [];
}
