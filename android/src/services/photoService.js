import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

const PHOTO_BUCKET =
  'meu-agro-photos';

const MAX_IMAGE_SIZE =
  8 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'O Supabase não foi inicializado.',
    );
  }

  return supabase;
}

function fileExtension(file) {
  const name =
    file?.name || '';

  const match =
    name.match(
      /\.([a-zA-Z0-9]+)$/,
    );

  const extension =
    match?.[1]
      ?.toLowerCase();

  if (
    extension &&
    [
      'jpg',
      'jpeg',
      'png',
      'webp',
    ].includes(extension)
  ) {
    return extension ===
      'jpeg'
      ? 'jpg'
      : extension;
  }

  if (
    file?.type ===
    'image/png'
  ) {
    return 'png';
  }

  if (
    file?.type ===
    'image/webp'
  ) {
    return 'webp';
  }

  return 'jpg';
}

function randomId() {
  if (
    globalThis.crypto
      ?.randomUUID
  ) {
    return globalThis
      .crypto
      .randomUUID();
  }

  return (
    `${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`
  );
}

export function validatePhotoFile(
  file,
) {
  if (!file) {
    return 'Selecione uma imagem.';
  }

  if (
    file.size >
    MAX_IMAGE_SIZE
  ) {
    return 'A imagem deve possuir no máximo 8 MB.';
  }

  if (
    file.type &&
    !SUPPORTED_IMAGE_TYPES.has(
      file.type,
    )
  ) {
    return 'Use uma imagem JPG, PNG ou WebP.';
  }

  if (
    !file.type &&
    !/\.(jpe?g|png|webp)$/i.test(
      file.name || '',
    )
  ) {
    return 'Use uma imagem JPG, PNG ou WebP.';
  }

  return null;
}

export async function uploadCyclePhotoFile({
  file,
  cycle,
}) {
  const validation =
    validatePhotoFile(file);

  if (validation) {
    throw new Error(
      validation,
    );
  }

  const client =
    requireSupabase();

  const user =
    await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  if (
    !cycle?.id ||
    !cycle?.property_id
  ) {
    throw new Error(
      'Ciclo produtivo inválido.',
    );
  }

  const path = [
    user.id,
    cycle.property_id,
    cycle.id,
    `${Date.now()}-${randomId()}.${fileExtension(
      file,
    )}`,
  ].join('/');

  const {
    error,
  } =
    await client
      .storage
      .from(PHOTO_BUCKET)
      .upload(
        path,
        file,
        {
          cacheControl: '3600',
          upsert: false,
          contentType:
            file.type ||
            undefined,
        },
      );

  if (error) {
    throw error;
  }

  return path;
}

export async function removePhotoFile(
  storagePath,
) {
  if (!storagePath) {
    return;
  }

  const client =
    requireSupabase();

  const {
    error,
  } =
    await client
      .storage
      .from(PHOTO_BUCKET)
      .remove([
        storagePath,
      ]);

  if (error) {
    throw error;
  }
}

export async function createPhotoRecord({
  cycle,
  eventId = null,
  storagePath,
  description,
  capturedAt,
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

  const {
    data,
    error,
  } =
    await client
      .from(
        'event_photos',
      )
      .insert({
        user_id:
          user.id,
        property_id:
          cycle.property_id,
        area_id:
          cycle.area_id,
        production_cycle_id:
          cycle.id,
        production_event_id:
          eventId || null,
        storage_path:
          storagePath,
        description:
          description?.trim() ||
          null,
        captured_at:
          capturedAt ||
          new Date()
            .toISOString(),
      })
      .select(`
        id,
        user_id,
        property_id,
        area_id,
        production_cycle_id,
        production_event_id,
        storage_path,
        description,
        captured_at,
        created_at,
        production_event:production_events (
          id,
          event_type,
          title,
          occurred_at
        )
      `)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listCyclePhotos(
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
        'event_photos',
      )
      .select(`
        id,
        user_id,
        property_id,
        area_id,
        production_cycle_id,
        production_event_id,
        storage_path,
        description,
        captured_at,
        created_at,
        production_event:production_events (
          id,
          event_type,
          title,
          occurred_at
        )
      `)
      .eq(
        'production_cycle_id',
        cycleId,
      )
      .order(
        'captured_at',
        {
          ascending: true,
        },
      );

  if (error) {
    throw error;
  }

  return signPhotos(
    data ?? [],
  );
}

export async function signPhotos(
  photos,
  expiresIn = 3600,
) {
  const client =
    requireSupabase();

  return Promise.all(
    (photos ?? []).map(
      async (photo) => {
        if (
          !photo?.storage_path
        ) {
          return {
            ...photo,
            signed_url: null,
          };
        }

        const {
          data,
          error,
        } =
          await client
            .storage
            .from(
              PHOTO_BUCKET,
            )
            .createSignedUrl(
              photo.storage_path,
              expiresIn,
            );

        if (error) {
          console.warn(
            'Não foi possível assinar a URL da foto:',
            error,
          );

          return {
            ...photo,
            signed_url: null,
          };
        }

        return {
          ...photo,
          signed_url:
            data?.signedUrl ||
            null,
        };
      },
    ),
  );
}

export async function deletePhoto(
  photo,
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
        'event_photos',
      )
      .delete()
      .eq(
        'id',
        photo.id,
      )
      .eq(
        'user_id',
        user.id,
      );

  if (error) {
    throw error;
  }

  try {
    await removePhotoFile(
      photo.storage_path,
    );
  } catch (storageError) {
    console.warn(
      'O registro da foto foi removido, mas o arquivo não pôde ser apagado do Storage:',
      storageError,
    );
  }
}
