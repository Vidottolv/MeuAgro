import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

const AREA_FIELDS = `
  id,
  user_id,
  property_id,
  area_type_id,
  name,
  size,
  unit,
  description,
  location_description,
  notes,
  image_url,
  status,
  deleted_at,
  created_at,
  updated_at,
  area_type:area_types (
    id,
    name,
    description,
    is_system,
    user_id
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

function normalizeAreaPayload(
  data,
) {
  return {
    area_type_id:
      data.areaTypeId || null,
    name:
      data.name?.trim() || '',
    size:
      data.size === '' ||
      data.size === null ||
      data.size === undefined
        ? null
        : Number(data.size),
    unit:
      data.unit?.trim() || null,
    description:
      data.description?.trim() || null,
    location_description:
      data.locationDescription?.trim() ||
      null,
    notes:
      data.notes?.trim() || null,
  };
}

export async function listAreaTypes() {
  const client =
    requireSupabase();

  const { data, error } =
    await client
      .from('area_types')
      .select(
        `
          id,
          user_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        `,
      )
      .order('is_system', {
        ascending: false,
      })
      .order('name', {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createAreaType({
  name,
  description,
}) {
  const client =
    requireSupabase();

  const user =
    await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const { data, error } =
    await client
      .from('area_types')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description:
          description?.trim() || null,
        is_system: false,
      })
      .select(
        `
          id,
          user_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        `,
      )
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listAreasByProperty(
  propertyId,
  {
    archived = false,
    limit = null,
  } = {},
) {
  const client =
    requireSupabase();

  let query =
    client
      .from('areas')
      .select(AREA_FIELDS)
      .eq(
        'property_id',
        propertyId,
      );

  if (archived) {
    query =
      query.eq(
        'status',
        'archived',
      );
  } else {
    query =
      query
        .is(
          'deleted_at',
          null,
        )
        .neq(
          'status',
          'archived',
        );
  }

  query =
    query.order(
      'name',
      {
        ascending: true,
      },
    );

  if (
    Number.isInteger(limit) &&
    limit > 0
  ) {
    query =
      query.limit(limit);
  }

  const { data, error } =
    await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function countActiveAreas(
  propertyId = null,
) {
  const client =
    requireSupabase();

  let query =
    client
      .from('areas')
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
      .neq(
        'status',
        'archived',
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

export async function getAreaById(
  id,
) {
  const client =
    requireSupabase();

  const { data, error } =
    await client
      .from('areas')
      .select(AREA_FIELDS)
      .eq('id', id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createArea(
  propertyId,
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
    normalizeAreaPayload(
      formData,
    );

  const { data, error } =
    await client
      .from('areas')
      .insert({
        ...payload,
        user_id: user.id,
        property_id: propertyId,
        status: 'active',
      })
      .select(AREA_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateArea(
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
    normalizeAreaPayload(
      formData,
    );

  const { data, error } =
    await client
      .from('areas')
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
      .select(AREA_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveArea(
  id,
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

  const { data, error } =
    await client
      .from('areas')
      .update({
        status: 'archived',
        deleted_at:
          new Date().toISOString(),
      })
      .eq('id', id)
      .eq(
        'user_id',
        user.id,
      )
      .select(AREA_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function restoreArea(
  id,
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

  const { data, error } =
    await client
      .from('areas')
      .update({
        status: 'active',
        deleted_at: null,
      })
      .eq('id', id)
      .eq(
        'user_id',
        user.id,
      )
      .select(AREA_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}
