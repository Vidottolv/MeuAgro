import {
  listProductionCycles,
  getProductionCycleById,
  createProductionCycle,
  updateProductionCycle,
  archiveProductionCycle,
  restoreProductionCycle,
  suggestHarvestDate,
} from '../../services/productionCycleService.js';
import { listActiveProperties, listArchivedProperties } from '../../services/propertyService.js';
import { listActiveCrops, getCropById } from '../../services/cropService.js';
import { listAreasByProperty } from '../../services/areaService.js';
import { listSeasons } from '../../services/seasonService.js';
import { listProductionEvents } from '../../services/productionEventService.js';
import { listHarvests } from '../../services/harvestService.js';
import { getCycleFinancialSummary } from '../../services/financeService.js';
import { isArchived, plantingPayload } from './plantingModel';
import type {
  Planting,
  PlantingFields,
  Choice,
  Links,
  PlantingEvent,
  Harvest,
} from './plantingTypes';
export interface Filters {
  property: string;
  crop: string;
  status: string;
  archived: boolean;
  open: boolean;
}
export async function fetchPlantings(f: Filters): Promise<Planting[]> {
  return (await listProductionCycles({
    propertyId: f.property || null,
    cropId: f.crop || null,
    status: f.status || null,
    openOnly: f.open,
    archived: f.archived,
  })) as unknown as Planting[];
}
export async function fetchPlanting(id: string): Promise<Planting | null> {
  return (await getProductionCycleById(id)) as unknown as Planting | null;
}
export async function fetchOptions(includeArchived = false) {
  const [properties, crops, archived] = await Promise.all([
    listActiveProperties(),
    listActiveCrops(),
    includeArchived ? listArchivedProperties() : Promise.resolve([]),
  ]);
  return { properties: [...properties, ...archived] as Choice[], crops: crops as Choice[] };
}
export async function fetchForm(id?: string) {
  const [item, options] = await Promise.all([
    id ? fetchPlanting(id) : Promise.resolve(null),
    fetchOptions(),
  ]);
  if (item?.crop_id && !options.crops.some((c) => c.id === item.crop_id)) {
    const crop = await getCropById(item.crop_id);
    if (crop) options.crops.push(crop as Choice);
  }
  return { item, ...options };
}
export async function fetchLinks(propertyId: string): Promise<Links> {
  if (!propertyId) return { areas: [], seasons: [] };
  const [areas, seasons] = await Promise.all([
    listAreasByProperty(propertyId),
    listSeasons({ propertyId }),
  ]);
  return { areas: areas as unknown as Choice[], seasons: seasons as unknown as Choice[] };
}
export async function savePlanting(id: string | undefined, fields: PlantingFields) {
  const payload = plantingPayload(fields);
  const saved = await (id ? updateProductionCycle(id, payload) : createProductionCycle(payload));
  if (
    !saved?.id ||
    (id && saved.id !== id) ||
    saved.property_id !== fields.propertyId ||
    saved.area_id !== fields.areaId
  )
    throw new Error(
      'Não foi possível confirmar a gravação. Confira os plantios antes de tentar novamente.',
    );
  return saved.id as string;
}
export async function changeArchive(id: string, archived: boolean): Promise<Planting> {
  const saved = (await (archived
    ? archiveProductionCycle(id)
    : restoreProductionCycle(id))) as unknown as Planting;
  if (!saved || saved.id !== id || isArchived(saved) !== archived)
    throw new Error('Não foi possível confirmar a alteração. Atualize a ficha para conferir.');
  return saved;
}
export const forecast = (crop: string, date: string) =>
  suggestHarvestDate(crop, date) as Promise<string | null>;
export const fetchEvents = async (id: string) =>
  (await listProductionEvents(id)) as unknown as PlantingEvent[];
export const fetchHarvests = async (id: string) =>
  (await listHarvests({ cycleId: id })) as unknown as Harvest[];
export const fetchFinance = (id: string) => getCycleFinancialSummary(id);
