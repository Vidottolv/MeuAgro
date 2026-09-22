import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

const CONSULTANT_FIELDS = `
  id,
  user_id,
  name,
  company,
  phone,
  whatsapp,
  email,
  specialty,
  notes,
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

function normalizePayload(data) {
  return {
    name:
      data.name?.trim() || '',
    company:
      data.company?.trim() || null,
    phone:
      data.phone?.trim() || null,
    whatsapp:
      data.whatsapp?.trim() || null,
    email:
      data.email?.trim() || null,
    specialty:
      data.specialty?.trim() || null,
    notes:
      data.notes?.trim() || null,
  };
}

export async function listConsultants({
  active = null,
  archived = false,
} = {}) {
  const client =
    requireSupabase();

  let query =
    client
      .from('consultants')
      .select(CONSULTANT_FIELDS);

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

  if (
    typeof active === 'boolean' &&
    !archived
  ) {
    query =
      query.eq(
        'active',
        active,
      );
  }

  query =
    query.order(
      'name',
      {
        ascending: true,
      },
    );

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listActiveConsultantsWithWhatsApp() {
  const consultants =
    await listConsultants({
      active: true,
      archived: false,
    });

  return consultants.filter(
    (consultant) =>
      Boolean(
        consultant.whatsapp,
      ),
  );
}

export async function getConsultantById(
  consultantId,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from('consultants')
      .select(CONSULTANT_FIELDS)
      .eq('id', consultantId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createConsultant(
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
      .from('consultants')
      .insert({
        ...normalizePayload(
          formData,
        ),
        user_id: user.id,
        active: true,
      })
      .select(CONSULTANT_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateConsultant(
  consultantId,
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
      .from('consultants')
      .update(
        normalizePayload(
          formData,
        ),
      )
      .eq(
        'id',
        consultantId,
      )
      .eq(
        'user_id',
        user.id,
      )
      .is(
        'deleted_at',
        null,
      )
      .select(CONSULTANT_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function setConsultantActive(
  consultantId,
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
      .from('consultants')
      .update({
        active:
          Boolean(active),
      })
      .eq(
        'id',
        consultantId,
      )
      .eq(
        'user_id',
        user.id,
      )
      .is(
        'deleted_at',
        null,
      )
      .select(CONSULTANT_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveConsultant(
  consultantId,
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
      .from('consultants')
      .update({
        active: false,
        deleted_at:
          new Date()
            .toISOString(),
      })
      .eq(
        'id',
        consultantId,
      )
      .eq(
        'user_id',
        user.id,
      )
      .select(CONSULTANT_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function restoreConsultant(
  consultantId,
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
      .from('consultants')
      .update({
        active: true,
        deleted_at: null,
      })
      .eq(
        'id',
        consultantId,
      )
      .eq(
        'user_id',
        user.id,
      )
      .select(CONSULTANT_FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}
