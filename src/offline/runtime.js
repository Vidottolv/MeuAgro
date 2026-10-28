import { uploadPendingFile } from './uploadRecovery.js';
import { createOfflineStore } from './store.js';
import { createOfflineEngine } from './engine.js';
import { createCachedFetch } from './readCache.js';

const backend = import.meta.env.VITE_SUPABASE_URL?.trim() || 'unconfigured';
const namespace = `meu-agro-offline:${backend}`;
export const offlineStore = createOfflineStore(namespace);
let snapshot = null,
  client = null,
  lastCachedRead = null,
  syncing = false;
let preparing = false;
export async function withFreshOfflineReads(work) {
  if (preparing) throw Error('O preparo já está em andamento neste dispositivo.');
  preparing = true;
  try {
    const result = await work();
    lastCachedRead = null;
    return result;
  } finally {
    preparing = false;
  }
}
const urls = new Map();
try {
  snapshot = JSON.parse(localStorage.getItem(namespace + ':session') || 'null');
} catch {
  /* Storage may be unavailable. */
}
export const isOnline = () => globalThis.navigator?.onLine !== false;
export const offlineUserId = () => snapshot?.user?.id || null;
export const getOfflineSession = () => snapshot;
function changed() {
  globalThis.dispatchEvent?.(new Event('meu-agro-offline-changed'));
}
export function rememberOfflineSession(session) {
  const previousUser = offlineUserId();
  // No access or refresh tokens are duplicated in this snapshot.
  snapshot = session?.user
    ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          user_metadata: { full_name: session.user.user_metadata?.full_name },
        },
        offline: true,
      }
    : null;
  try {
    if (snapshot) localStorage.setItem(namespace + ':session', JSON.stringify(snapshot));
    else localStorage.removeItem(namespace + ':session');
  } catch {
    /* Saving field records still requires IndexedDB to succeed. */
  }
  if (previousUser !== offlineUserId()) {
    for (const value of urls.values()) URL.revokeObjectURL(value);
    urls.clear();
    lastCachedRead = null;
  }
  changed();
}
export const cachedFetch = createCachedFetch({
  store: offlineStore,
  origin: backend === 'unconfigured' ? '' : new URL(backend).origin,
  currentUser: offlineUserId,
  online: isOnline,
  stale: (savedAt) => {
    lastCachedRead = savedAt;
    changed();
  },
  strict: () => preparing,
});
async function send(operation, active) {
  if (!client || !active()) throw Error('Entre na conta que criou os registros para sincronizar.');
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (data.user?.id !== operation.user || !active())
    throw Object.assign(
      Error('Entre novamente na conta que criou os registros para sincronizar.'),
      { code: 'SESSION_REQUIRED' },
    );
  const visitOperation = ['visit', 'visit_photo'].includes(operation.payload.kind);
  const uploads =
    operation.files ||
    (operation.file ? [{ photo: operation.payload.photo, file: operation.file }] : []);
  for (const { photo, file } of uploads) {
    if (!active()) throw Error('A conta mudou. Retome o envio na conta original.');
    const bucket = client.storage.from(
      visitOperation ? 'meu-agro-visit-photos' : 'meu-agro-photos',
    );
    await uploadPendingFile(bucket, photo, file, active);
  }
  if (!active()) throw Error('A conta mudou. Retome a sincronização na conta original.');
  const result = await client.rpc(
    visitOperation
      ? operation.payload.visit?.field_observations?.length
        ? 'sync_visit_workflow_operation'
        : 'sync_visit_operation'
      : 'sync_field_operation',
    {
      p_user: operation.user,
      p_operation: operation.id,
      p_payload: operation.payload,
    },
  );
  if (result.error) {
    if (['PGRST202', '42883'].includes(result.error.code))
      throw Object.assign(
        Error(
          visitOperation
            ? operation.payload.visit?.field_observations?.length
              ? 'Instale a etapa 41 no Supabase para enviar as observações. A ficha continua salva neste dispositivo.'
              : 'Instale a migração de visitas técnicas no Supabase para enviar a anamnese. Os dados continuam salvos neste dispositivo.'
            : 'Instale a migração offline no Supabase para enviar os registros. Eles continuam salvos neste dispositivo.',
        ),
        { code: 'SCHEMA_REQUIRED' },
      );
    throw result.error;
  }
  // Keep the last downloaded timeline. Confirmed local rows bridge it until the
  // next successful server read, including if the connection drops immediately.
}
export const offlineEngine = createOfflineEngine({
  store: offlineStore,
  send,
  currentUser: offlineUserId,
  online: isOnline,
  changed,
  // After a fallback, absence is not proof of revocation/deletion. Wait for a
  // fresh preparation or a new online cycle before pruning confirmed bridges.
  canReconcile: () => lastCachedRead === null,
});
export async function syncOffline(options = {}) {
  if (syncing || !isOnline()) return;
  syncing = true;
  changed();
  try {
    await offlineEngine.sync(options);
  } finally {
    syncing = false;
    changed();
  }
}
export async function offlineStatus() {
  const user = offlineUserId(),
    operations = await offlineEngine.operations();
  return {
    online: isOnline(),
    user,
    syncing,
    cachedAt: lastCachedRead,
    preparedAt: user ? await offlineStore.get(`${user}:prepared`) : null,
    pending: operations.length,
    queue: operations.map((o) => ({
      id: o.id,
      kind: o.payload.kind,
      createdAt: o.createdAt,
      attempts: o.attempts || 0,
      state: o.syncState || 'pending',
      error: o.error,
      lastAttemptAt: o.lastAttemptAt,
      nextAttemptAt: o.nextAttemptAt,
    })),
    errors: operations.filter((o) => o.error).map((o) => ({ id: o.id, message: o.error })),
  };
}
export function initializeOffline(clientInstance) {
  client = clientInstance;
  addEventListener('online', () => {
    client?.auth.startAutoRefresh();
    lastCachedRead = null;
    changed();
    void syncOffline().catch(() => {});
  });
  addEventListener('offline', () => {
    client?.auth.stopAutoRefresh();
    changed();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void syncOffline().catch(() => {});
  });
  // Retry transient failures even if the browser never emits another online event.
  setInterval(() => {
    if (!document.hidden) void syncOffline().catch(() => {});
  }, 30000);
}
function makeEvent(user, cycleId, fields, id = crypto.randomUUID()) {
  const now = new Date().toISOString();
  return {
    id,
    user_id: user,
    production_cycle_id: cycleId,
    ...fields,
    created_at: now,
    updated_at: now,
    event_photos: [],
    event_inputs: [],
  };
}
export async function queueFieldEvent(cycleId, fields) {
  const user = offlineUserId();
  if (!user) throw Error('Entre na sua conta antes de registrar no campo.');
  const event = makeEvent(user, cycleId, fields);
  await offlineEngine.enqueue(
    { id: event.id, user, createdAt: Date.now(), payload: { kind: 'event', event } },
    [{ table: 'production_events', row: event }],
  );
  void syncOffline().catch(() => {});
  return { ...event, offline_pending: true };
}
export async function queueFieldPhoto(cycle, file, eventId, description, capturedAt) {
  const user = offlineUserId();
  if (!user) throw Error('Entre na sua conta antes de registrar no campo.');
  const id = crypto.randomUUID(),
    extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const event =
    eventId === '__auto__'
      ? makeEvent(user, cycle.id, {
          event_type: 'photo',
          title: 'Registro fotográfico',
          description: description || null,
          notes: null,
          occurred_at: capturedAt,
        })
      : null;
  const photo = {
    id,
    user_id: user,
    property_id: cycle.property_id,
    area_id: cycle.area_id,
    production_cycle_id: cycle.id,
    production_event_id: event?.id || eventId || null,
    storage_path: `${user}/${cycle.property_id}/${cycle.id}/${id}.${extension}`,
    description: description?.trim() || null,
    captured_at: capturedAt,
    created_at: new Date().toISOString(),
    production_event: event || null,
  };
  await offlineEngine.enqueue(
    { id, user, createdAt: Date.now(), payload: { kind: 'photo', photo, event }, file },
    [
      { table: 'event_photos', row: photo },
      ...(event ? [{ table: 'production_events', row: { ...event, event_photos: [photo] } }] : []),
    ],
    [[`${user}:photo:${photo.storage_path}`, file]],
  );
  void syncOffline().catch(() => {});
  return id;
}
export async function localPhotoUrl(photo) {
  const user = offlineUserId();
  if (!user) return null;
  const key = `${user}:photo:${photo.storage_path}`;
  if (urls.has(key)) return urls.get(key);
  const op = (await offlineEngine.operations()).find((o) => o.payload.photo?.id === photo.id);
  const file = op?.file || (await offlineStore.get(key));
  if (!file || user !== offlineUserId()) return null;
  const url = URL.createObjectURL(file);
  urls.set(key, url);
  return url;
}
export async function cachePhoto(photo, signedUrl) {
  const user = offlineUserId();
  if (!user || !isOnline() || !signedUrl) return;
  const response = await fetch(signedUrl);
  if (!response.ok) throw Error('Não foi possível baixar a foto para uso offline.');
  const file = await response.blob();
  if (user === offlineUserId())
    await offlineStore.batch([[`${user}:photo:${photo.storage_path}`, file]]);
}
