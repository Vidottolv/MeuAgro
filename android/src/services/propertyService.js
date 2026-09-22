import { supabase } from '../js/supabase.js';
import {
  getCurrentUser,
} from './authService.js';

const PROPERTY_FIELDS = `
  id,
  user_id,
  name,
  description,
  city,
  state,
  total_area,
  area_unit,
  notes,
  image_url,
  status,
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

function normalizePayload(data) {
  return {
    name:
      data.name?.trim() || '',
    description:
      data.description?.trim() || null,
    city:
      data.city?.trim() || null,
    state:
      data.state?.trim()?.toUpperCase() || null,
    total_area:
      data.totalArea === '' ||
      data.totalArea === null ||
      data.totalArea === undefined
        ? null
        : Number(data.totalArea),
    area_unit:
      data.areaUnit?.trim() || null,
    notes:
      data.notes?.trim() || null,
  };
}

export async function listActiveProperties() {
  const client = requireSupabase();

  const { data, error } =
    await client
      .from('properties')
      .select(PROPERTY_FIELDS)
      .is('deleted_at', null)
      .neq('status', 'archived')
      .order('name', {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listArchivedProperties() {
  const client = requireSupabase();

  const { data, error } =
    await client
      .from('properties')
      .select(PROPERTY_FIELDS)
      .eq('status', 'archived')
      .order('updated_at', {
        ascending: false,
      });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getPropertyById(id) {
  const client = requireSupabase();

  const { data, error } =
    await client
      .from('properties')
      .select(PROPERTY_FIELDS)
      .eq('id', id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createProperty(formData) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const payload =
    normalizePayload(formData);

  const { data, error } =
    await client
      .from('properties')
      .insert({
        ...payload,
        user_id: user.id,
        status: 'active',
      })
      .select(PROPERTY_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProperty(
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

  const payload =
    normalizePayload(formData);

  const { data, error } =
    await client
      .from('properties')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select(PROPERTY_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveProperty(id) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const now =
    new Date().toISOString();

  const { data, error } =
    await client
      .from('properties')
      .update({
        status: 'archived',
        deleted_at: now,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(PROPERTY_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function restoreProperty(id) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const { data, error } =
    await client
      .from('properties')
      .update({
        status: 'active',
        deleted_at: null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(PROPERTY_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function countActiveProperties() {
  const client = requireSupabase();

  const {
    count,
    error,
  } =
    await client
      .from('properties')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .is('deleted_at', null)
      .neq('status', 'archived');

  if (error) {
    throw error;
  }

  return count ?? 0;
}
