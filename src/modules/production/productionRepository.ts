import {
  listCrops,
  getCropById,
  createCrop,
  updateCrop,
  setCropActive,
} from '../../services/cropService.js';
import {
  getProductionCycleById,
  countOpenCyclesByCrop,
} from '../../services/productionCycleService.js';
import {
  listProductionEvents,
  getProductionEventById,
  createProductionEvent,
  updateProductionEvent,
  deleteProductionEvent,
} from '../../services/productionEventService.js';
import { listAgriculturalInputs } from '../../services/agriculturalInputService.js';
import { listInventoryLots } from '../../services/inventoryLotService.js';
import { createEventInput, getInputCurrentBalance } from '../../services/eventInputService.js';
import {
  listCyclePhotos,
  deletePhoto,
  uploadCyclePhotoFile,
  createPhotoRecord,
  removePhotoFile,
} from '../../services/photoService.js';
import { listHarvestForecastCycles } from '../../services/harvestForecastService.js';
import { localDateTime, quantity } from './productionModel';
import type {
  Crop,
  CropFields,
  Planting,
  EventRecord,
  EventFields,
  Input,
  Lot,
  Photo,
  Forecast,
} from './productionTypes';
export const crops = async () => (await listCrops()) as Crop[];
export const crop = async (id: string) => (await getCropById(id)) as Crop | null;
export const cropCount = (id: string) => countOpenCyclesByCrop(id);
export async function saveCrop(id: string | undefined, fields: CropFields) {
  const result = await (id ? updateCrop(id, fields) : createCrop(fields));
  if (!result?.id || (id && result.id !== id))
    throw new Error('Confira as culturas antes de tentar salvar novamente.');
  return result.id as string;
}
export async function toggleCrop(item: Crop) {
  if (item.is_system) throw new Error('Culturas do sistema não podem ser alteradas.');
  const result = (await setCropActive(item.id, !item.active)) as Crop;
  if (!result || result.id !== item.id || result.active === item.active)
    throw new Error('Atualize a ficha para conferir a alteração.');
  return result;
}
export const cycle = async (id: string) =>
  (await getProductionCycleById(id)) as unknown as Planting | null;
export async function context(id: string, eventId?: string) {
  const [planting, event] = await Promise.all([
    cycle(id),
    eventId ? getProductionEventById(eventId) : Promise.resolve(null),
  ]);
  return { planting, event: event?.production_cycle_id === id ? (event as EventRecord) : null };
}
export const events = async (id: string) =>
  (await listProductionEvents(id)) as unknown as EventRecord[];
export async function saveEvent(cycleId: string, id: string | undefined, f: EventFields) {
  const payload = { ...f, occurredAt: localDateTime(f.occurredAt) };
  const result = await (id
    ? updateProductionEvent(id, cycleId, payload)
    : createProductionEvent(cycleId, payload));
  if (!result?.id || (id && result.id !== id) || result.production_cycle_id !== cycleId)
    throw new Error('Confira a linha do tempo antes de salvar novamente.');
  return result.id as string;
}
export const inputs = async () => (await listAgriculturalInputs()) as unknown as Input[];
export const lots = async (inputId: string) =>
  inputId ? ((await listInventoryLots({ inputId, includeEmpty: false })) as unknown as Lot[]) : [];
export async function saveUsage(
  eventId: string,
  inputId: string,
  lotId: string,
  raw: string,
  notes: string,
) {
  const saved = await createEventInput(eventId, { inputId, lotId, quantity: quantity(raw), notes });
  if (!saved?.id) throw new Error('Confira o uso de insumos antes de tentar novamente.');
  return saved;
}
export const balance = (inputId: string) => getInputCurrentBalance(inputId);
export const photos = async (id: string) => (await listCyclePhotos(id)) as unknown as Photo[];
export const removePhoto = (photo: Photo) => deletePhoto(photo);
export const forecasts = async (propertyId: string) =>
  (await listHarvestForecastCycles({ propertyId: propertyId || null })) as unknown as Forecast[];
export async function savePhoto(
  planting: Planting,
  file: File,
  eventId: string,
  description: string,
  capturedAt: string,
) {
  let path: string | null = null,
    autoId: string | null = null;
  try {
    path = await uploadCyclePhotoFile({ file, cycle: planting });
    if (eventId === '__auto__') {
      const event = await createProductionEvent(planting.id, {
        eventType: 'photo',
        title: 'Registro fotográfico',
        description: description || 'Foto adicionada à evolução visual do ciclo.',
        notes: '',
        occurredAt: localDateTime(capturedAt),
      });
      if (!event?.id) throw new Error('Não foi possível confirmar o evento fotográfico.');
      autoId = event.id;
    }
    const photo = await createPhotoRecord({
      cycle: planting,
      eventId: autoId || (eventId === '__auto__' ? null : eventId) || null,
      storagePath: path,
      description,
      capturedAt: localDateTime(capturedAt),
    });
    if (!photo?.id) throw new Error('Não foi possível confirmar o registro da foto.');
    return photo.id as string;
  } catch (error) {
    const cleanup = await Promise.allSettled([
      ...(path ? [removePhotoFile(path)] : []),
      ...(autoId ? [deleteProductionEvent(autoId)] : []),
    ]);
    if (cleanup.some((r) => r.status === 'rejected'))
      throw new Error(
        'O envio falhou e a limpeza não foi concluída. Confira a galeria e a linha do tempo antes de repetir.',
      );
    throw error;
  }
}
