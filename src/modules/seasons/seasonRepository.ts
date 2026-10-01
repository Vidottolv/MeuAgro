import {
  listSeasons,
  getSeasonById,
  createSeason,
  updateSeason,
  archiveSeason,
  restoreSeason,
} from '../../services/seasonService.js';
import { listActiveProperties, listArchivedProperties } from '../../services/propertyService.js';
import {
  listProductionCycles,
  countOpenProductionCycles,
} from '../../services/productionCycleService.js';
import { isArchived } from './seasonModel';
import type { Season, SeasonFields, SeasonProperty } from './seasonTypes';
import type { Cycle } from '../properties/ruralTypes';
export async function fetchSeasons(
  propertyId: string,
  status: string,
  archived: boolean,
): Promise<Season[]> {
  return (await listSeasons({
    propertyId: propertyId || null,
    status: status || null,
    archived,
  })) as unknown as Season[];
}
export async function fetchSeason(id: string): Promise<Season | null> {
  return (await getSeasonById(id)) as unknown as Season | null;
}
export async function fetchActiveProperties(): Promise<SeasonProperty[]> {
  return (await listActiveProperties()) as SeasonProperty[];
}
export async function fetchFilterProperties(): Promise<SeasonProperty[]> {
  const [active, archived] = await Promise.all([listActiveProperties(), listArchivedProperties()]);
  return [...active, ...archived] as SeasonProperty[];
}
export async function saveSeason(id: string | undefined, fields: SeasonFields): Promise<string> {
  const saved = await (id ? updateSeason(id, fields) : createSeason(fields));
  if (!saved?.id || (id && saved.id !== id) || saved.property_id !== fields.propertyId)
    throw new Error(
      'Não foi possível confirmar a gravação. Confira as safras antes de tentar novamente.',
    );
  return saved.id;
}
export async function changeSeasonArchive(id: string, archived: boolean): Promise<Season> {
  const saved = (await (archived ? archiveSeason(id) : restoreSeason(id))) as unknown as Season;
  if (!saved || saved.id !== id || isArchived(saved) !== archived)
    throw new Error('Não foi possível confirmar a alteração. Atualize a ficha para conferir.');
  return saved;
}
export async function fetchSeasonCycles(id: string) {
  const [items, count] = await Promise.all([
    listProductionCycles({ seasonId: id, archived: false, limit: 3 }),
    countOpenProductionCycles({ seasonId: id }),
  ]);
  return { items: items as unknown as Cycle[], count };
}
