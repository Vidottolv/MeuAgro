import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

const CROP_FIELDS = `
  id,
  user_id,
  name,
  category,
  average_cycle_days,
  notes,
  is_system,
  active,
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
    name: data.name?.trim() || '',
    category: data.category?.trim() || null,
    average_cycle_days:
      data.averageCycleDays === '' ||
      data.averageCycleDays === null ||
      data.averageCycleDays === undefined
        ? null
        : Number(data.averageCycleDays),
    notes: data.notes?.trim() || null,
  };
}

export async function listCrops({
  activeOnly = false,
} = {}) {
  const client = requireSupabase();

  let query =
    client
      .from('crops')
      .select(CROP_FIELDS);

  if (activeOnly) {
    query = query.eq('active', true);
  }

  query =
    query
      .order('is_system', {
        ascending: false,
      })
      .order('name', {
        ascending: true,
      });

  const { data, error } =
    await query;

  if (error) throw error;
  return data ?? [];
}

export async function listActiveCrops() {
  return listCrops({
    activeOnly: true,
  });
}

export async function getCropById(id) {
  const client = requireSupabase();

  const { data, error } =
    await client
      .from('crops')
      .select(CROP_FIELDS)
      .eq('id', id)
      .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createCrop(formData) {
  const client = requireSupabase();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const { data, error } =
    await client
      .from('crops')
      .insert({
        ...normalizePayload(formData),
        user_id: user.id,
        is_system: false,
        active: true,
      })
      .select(CROP_FIELDS)
      .single();

  if (error) throw error;
  return data;
}

export async function updateCrop(
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
      .from('crops')
      .update(normalizePayload(formData))
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_system', false)
      .select(CROP_FIELDS)
      .single();

  if (error) throw error;
  return data;
}

export async function setCropActive(
  id,
  active,
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
      .from('crops')
      .update({
        active: Boolean(active),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_system', false)
      .select(CROP_FIELDS)
      .single();

  if (error) throw error;
  return data;
}
