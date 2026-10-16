import { supabase } from '../js/supabase.js';
import {
  offlineEngine,
  offlineStore,
  offlineUserId,
  isOnline,
  syncOffline,
  localPhotoUrl,
  cachePhoto,
} from '../offline/runtime.js';
import { validatePhotoFile } from './photoService.js';
import { visitPayload } from '../modules/visits/visitModel.js';
import { getOfflineSession } from '../offline/runtime.js';
const fields =
  'id,author_id,technician_name,seller_id,property_id,area_id,crop_id,production_cycle_id,producer_name,site_name,area_name,crop_name,visited_at,next_visit,priority,anamnesis,created_at';
const photoFields = 'id,visit_id,author_id,storage_path,description,created_at';
export function visitError(error) {
  return ['42P01', 'PGRST205', 'PGRST202', '42883'].includes(error?.code)
    ? 'As visitas técnicas precisam ser instaladas no Supabase. Execute a migração da etapa 33.'
    : error?.message || 'Não foi possível carregar as visitas.';
}
export async function listTechnicalVisits(team = false) {
  const user = offlineUserId();
  if (!user || !supabase) throw Error('Entre na sua conta para consultar visitas.');
  if (team && !isOnline()) throw Error('Conecte-se para consultar as visitas da equipe.');
  let query = supabase
    .from('technical_visits')
    .select(fields)
    .order('visited_at', { ascending: false })
    .limit(200);
  if (!team) query = query.eq('author_id', user);
  let { data, error } = await query;
  if (error) {
    if (isOnline() || !(await offlineEngine.localRows('technical_visits')).length)
      throw Error(visitError(error));
    data = [];
  }
  return (
    await offlineEngine.merge(
      'technical_visits',
      data || [],
      (row) => team || row.author_id === user,
      isOnline(),
    )
  ).sort((a, b) => b.visited_at.localeCompare(a.visited_at));
}
function makePhoto(user, visitId, attachment) {
  const error = validatePhotoFile(attachment.file);
  if (error) throw Error(error);
  if ((attachment.description || '').length > 1600)
    throw Error('A legenda deve ter até 1.600 caracteres.');
  const id = crypto.randomUUID(),
    extension =
      attachment.file.type === 'image/png'
        ? 'png'
        : attachment.file.type === 'image/webp'
          ? 'webp'
          : 'jpg';
  return {
    id,
    visit_id: visitId,
    author_id: user,
    storage_path: `${user}/${visitId}/${id}.${extension}`,
    description: (attachment.description || '').trim(),
    created_at: new Date().toISOString(),
  };
}
export async function saveTechnicalVisit(form, attachments = []) {
  const user = offlineUserId();
  if (!user) throw Error('Entre na sua conta antes de registrar a visita.');
  if (attachments.length > 5) throw Error('Adicione até cinco fotos por visita.');
  const payload = visitPayload(form),
    id = crypto.randomUUID();
  const actor = getOfflineSession()?.user;
  const visit = {
    id,
    author_id: user,
    technician_name: actor?.user_metadata?.full_name || actor?.email || 'Profissional',
    ...payload,
    created_at: new Date().toISOString(),
  };
  const photos = attachments.map((item) => makePhoto(user, id, item));
  await offlineEngine.enqueue(
    {
      id,
      user,
      createdAt: Date.now(),
      payload: { kind: 'visit', visit, photos },
      files: photos.map((photo, i) => ({ photo, file: attachments[i].file })),
    },
    [
      { table: 'technical_visits', row: visit },
      ...photos.map((row) => ({ table: 'technical_visit_photos', row })),
    ],
    photos.map((photo, i) => [`${user}:photo:${photo.storage_path}`, attachments[i].file]),
  );
  void syncOffline().catch(() => {});
  return id;
}
export async function addTechnicalVisitPhoto(visit, attachment) {
  const user = offlineUserId();
  if (!user || visit.author_id !== user)
    throw Error('Somente o autor pode adicionar fotos à visita.');
  const photo = makePhoto(user, visit.id, attachment);
  await offlineEngine.enqueue(
    {
      id: photo.id,
      user,
      createdAt: Date.now(),
      payload: { kind: 'visit_photo', photo },
      files: [{ photo, file: attachment.file }],
    },
    [{ table: 'technical_visit_photos', row: photo }],
    [[`${user}:photo:${photo.storage_path}`, attachment.file]],
  );
  void syncOffline().catch(() => {});
  return photo.id;
}
export async function listTechnicalVisitPhotos(visit, strict = false) {
  const user = offlineUserId();
  let query = supabase
    .from('technical_visit_photos')
    .select(photoFields)
    .eq('visit_id', visit.id)
    .order('created_at')
    .limit(200);
  if (visit.author_id === user) query = query.eq('author_id', user);
  let { data, error } = await query;
  if (error) {
    if (
      isOnline() ||
      !(await offlineEngine.localRows('technical_visit_photos')).some(
        (row) => row.visit_id === visit.id,
      )
    )
      throw Error(visitError(error));
    data = [];
  }
  const photos = await offlineEngine.merge(
    'technical_visit_photos',
    data || [],
    (row) => row.visit_id === visit.id,
    isOnline(),
  );
  return Promise.all(
    photos.map(async (photo) => {
      const local = await localPhotoUrl(photo);
      if (local) return { ...photo, signed_url: local };
      if (!isOnline()) return { ...photo, signed_url: null };
      const result = await supabase.storage
        .from('meu-agro-visit-photos')
        .createSignedUrl(photo.storage_path, 3600);
      if (result.error) {
        if (strict) throw Error('Uma foto de visita não foi preparada. Tente novamente.');
        return { ...photo, signed_url: null };
      }
      if (visit.author_id === user) {
        try {
          await cachePhoto(photo, result.data.signedUrl);
        } catch (error) {
          if (strict) throw error;
        }
      }
      return { ...photo, signed_url: result.data.signedUrl };
    }),
  );
}
export async function technicalVisitCompanies() {
  const user = offlineUserId();
  if (!user) return [];
  if (!isOnline()) return (await offlineStore.get(`${user}:visit-companies`)) || [];
  const { loadCommerce } = await import('./commerceService.js');
  const data = await loadCommerce();
  const companies = data.sellers
    .filter(
      (s) =>
        s.kind === 'company' &&
        (s.owner_id === user ||
          data.memberships.some((m) => m.seller_id === s.id && m.user_id === user && m.active)),
    )
    .map((s) => ({ id: s.id, name: s.name }));
  await offlineStore.batch([[`${user}:visit-companies`, companies]]);
  return companies;
}
export async function prepareTechnicalVisits() {
  const visits = await listTechnicalVisits();
  if (visits.length >= 200)
    throw Error(
      'Há 200 ou mais visitas. O preparo completo deste histórico ainda não está disponível.',
    );
  await technicalVisitCompanies();
  for (const visit of visits) {
    const photos = await listTechnicalVisitPhotos(visit, true);
    if (photos.length >= 200)
      throw Error('Há fotos demais em uma visita para preparar o histórico completo nesta versão.');
  }
}
