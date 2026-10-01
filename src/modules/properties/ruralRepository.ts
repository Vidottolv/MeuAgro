import {
  listActiveProperties,
  listArchivedProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  archiveProperty,
  restoreProperty,
} from '../../services/propertyService.js';
import {
  listAreasByProperty,
  getAreaById,
  listAreaTypes,
  createAreaType,
  createArea,
  updateArea,
  archiveArea,
  restoreArea,
  countActiveAreas,
} from '../../services/areaService.js';
import { listRecentPropertySeasons, countOpenSeasons } from '../../services/seasonService.js';
import {
  listProductionCycles,
  countOpenProductionCycles,
} from '../../services/productionCycleService.js';
import { propertyPayload, areaPayload, isArchived } from './ruralModel';
import type {
  Property,
  Area,
  AreaType,
  PropertyFields,
  AreaFields,
  Season,
  Cycle,
} from './ruralTypes';
export async function fetchProperties(archived: boolean): Promise<Property[]> {
  return (await (archived ? listArchivedProperties() : listActiveProperties())) as Property[];
}
export async function fetchProperty(id: string): Promise<Property | null> {
  return (await getPropertyById(id)) as Property | null;
}
export async function fetchAreaContext(
  propertyId: string,
  areaId?: string,
): Promise<{ property: Property | null; area: Area | null }> {
  const [property, area] = await Promise.all([
    fetchProperty(propertyId),
    areaId ? getAreaById(areaId) : Promise.resolve(null),
  ]);
  if (areaId && (!area || area.property_id !== propertyId)) return { property, area: null };
  return { property, area: area as unknown as Area | null };
}
export async function fetchAreas(propertyId: string, archived = false): Promise<Area[]> {
  return (await listAreasByProperty(propertyId, { archived })) as unknown as Area[];
}
export async function fetchTypes(): Promise<AreaType[]> {
  return (await listAreaTypes()) as AreaType[];
}
export async function saveType(name: string, description: string): Promise<AreaType> {
  const result = await createAreaType({ name, description });
  if (!result?.id) throw new Error('Confira os tipos cadastrados antes de tentar novamente.');
  return result as AreaType;
}
export async function saveProperty(
  id: string | undefined,
  fields: PropertyFields,
): Promise<string> {
  const saved = await (id
    ? updateProperty(id, propertyPayload(fields))
    : createProperty(propertyPayload(fields)));
  if (!saved?.id || (id && saved.id !== id))
    throw new Error('Confira as propriedades antes de tentar novamente.');
  return saved.id;
}
export async function saveArea(
  propertyId: string,
  id: string | undefined,
  fields: AreaFields,
): Promise<string> {
  const saved = await (id
    ? updateArea(id, areaPayload(fields))
    : createArea(propertyId, areaPayload(fields)));
  if (!saved?.id || saved.property_id !== propertyId || (id && saved.id !== id))
    throw new Error('Confira as áreas antes de tentar novamente.');
  return saved.id;
}
export async function changeStatus(
  kind: 'property' | 'area',
  id: string,
  archived: boolean,
): Promise<Property | Area> {
  const saved = await (kind === 'property'
    ? archived
      ? archiveProperty(id)
      : restoreProperty(id)
    : archived
      ? archiveArea(id)
      : restoreArea(id));
  if (!saved || saved.id !== id || isArchived(saved) !== archived)
    throw new Error('Não foi possível confirmar a alteração. Atualize a página para conferir.');
  return saved as unknown as Property | Area;
}
export async function fetchPropertyAreas(id: string) {
  const [items, count] = await Promise.all([
    listAreasByProperty(id, { limit: 3 }),
    countActiveAreas(id),
  ]);
  return { items: items as unknown as Area[], count };
}
export async function fetchPropertySeasons(id: string) {
  const [items, count] = await Promise.all([
    listRecentPropertySeasons(id, 3),
    countOpenSeasons(id),
  ]);
  return { items: items as unknown as Season[], count };
}
export async function fetchAreaCycles(id: string) {
  const [items, count] = await Promise.all([
    listProductionCycles({ areaId: id, archived: false, limit: 3 }),
    countOpenProductionCycles({ areaId: id }),
  ]);
  return { items: items as unknown as Cycle[], count };
}
