import type { Planting, PlantingFields, Choice, Links } from './plantingTypes';
import { validDate } from '../seasons/seasonModel';
import { PRODUCTION_CYCLE_STATUSES } from '../../constants/productionCycleStatus.js';
import { PLANTED_UNITS, getPlantedUnitLabel } from '../../constants/plantedUnits.js';
export const isArchived = (item: Pick<Planting, 'deleted_at'>) => Boolean(item.deleted_at);
export function title(item: Pick<Planting, 'crop' | 'variety'>) {
  return [item.crop?.name || 'Cultura', item.variety?.trim()].filter(Boolean).join(' • ');
}
export function quantityLabel(item: Pick<Planting, 'planted_quantity' | 'planted_unit'>) {
  return item.planted_quantity === null
    ? 'Não informada'
    : [
        new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(
          Number(item.planted_quantity),
        ),
        getPlantedUnitLabel(item.planted_unit),
      ]
        .filter(Boolean)
        .join(' • ');
}
export function fieldsFrom(item?: Planting | null): PlantingFields {
  const now = new Date();
  return {
    propertyId: item?.property_id || '',
    areaId: item?.area_id || '',
    seasonId: item?.season_id || '',
    cropId: item?.crop_id || '',
    variety: item?.variety || '',
    plantedQuantity: String(item?.planted_quantity ?? ''),
    plantedUnit: item?.planted_unit || '',
    plantingDate:
      item?.planting_date ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    initialHarvestForecast: item?.initial_harvest_forecast || '',
    currentHarvestForecast: item?.current_harvest_forecast || '',
    finalHarvestDate: item?.final_harvest_date || '',
    status: item?.status || 'planted',
    notes: item?.notes || '',
  };
}
export function validatePlanting(
  f: PlantingFields,
  properties: Choice[],
  crops: Choice[],
  links: Links,
  existingCropId?: string,
) {
  if (!properties.some((p) => p.id === f.propertyId && !p.deleted_at && p.status !== 'archived'))
    return 'Selecione uma propriedade ativa.';
  if (
    !links.areas.some(
      (a) =>
        a.id === f.areaId &&
        a.property_id === f.propertyId &&
        !a.deleted_at &&
        a.status !== 'archived',
    )
  )
    return 'Selecione uma área ativa desta propriedade.';
  if (
    f.seasonId &&
    !links.seasons.some(
      (s) => s.id === f.seasonId && s.property_id === f.propertyId && !s.deleted_at,
    )
  )
    return 'Selecione uma safra desta propriedade ou deixe sem safra.';
  if (!crops.some((c) => c.id === f.cropId && (c.active !== false || c.id === existingCropId)))
    return 'Selecione uma cultura válida.';
  if (!validDate(f.plantingDate)) return 'Informe uma data de plantio válida.';
  for (const [date, label] of [
    [f.initialHarvestForecast, 'A previsão inicial'],
    [f.currentHarvestForecast, 'A previsão atual'],
    [f.finalHarvestDate, 'A data real da colheita'],
  ]) {
    if (date && !validDate(date)) return `${label} deve ser uma data válida.`;
    if (date && date < f.plantingDate) return `${label} não pode ser anterior à data do plantio.`;
  }
  const quantity = f.plantedQuantity.trim().replace(',', '.');
  if (quantity && (!/^\d+(?:\.\d{1,4})?$/.test(quantity) || !Number.isFinite(Number(quantity))))
    return 'Informe uma quantidade não negativa com até 4 casas decimais.';
  if ((quantity || f.plantedUnit) && !PLANTED_UNITS.some(([v]) => v === f.plantedUnit))
    return 'Selecione a unidade da quantidade plantada.';
  if (!PRODUCTION_CYCLE_STATUSES.some(([v]) => v === f.status))
    return 'Selecione um status válido.';
  if (f.variety.trim().length > 160) return 'A variedade deve ter até 160 caracteres.';
  if (f.notes.trim().length > 2000) return 'As observações devem ter até 2000 caracteres.';
  return '';
}
export function plantingPayload(f: PlantingFields) {
  return {
    ...f,
    variety: f.variety.trim(),
    notes: f.notes.trim(),
    plantedQuantity:
      f.plantedQuantity.trim() === '' ? '' : Number(f.plantedQuantity.trim().replace(',', '.')),
  };
}
export function searchPlantings(items: Planting[], query: string) {
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  const q = norm(query.trim());
  return items.filter((i) =>
    norm(
      [title(i), i.property?.name, i.area?.name, i.season?.name, i.notes].filter(Boolean).join(' '),
    ).includes(q),
  );
}
export const canHarvest = (p: Pick<Planting, 'deleted_at' | 'status'>) =>
  !isArchived(p) && !['harvested', 'closed', 'cancelled'].includes(p.status);
