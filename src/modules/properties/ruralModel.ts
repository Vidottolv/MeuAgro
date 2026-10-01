import {
  BRAZIL_STATES,
  PROPERTY_AREA_UNITS,
  getAreaUnitLabel,
} from '../../constants/brazilStates.js';
import { AREA_UNITS, getAreaSizeUnitLabel } from '../../constants/areaUnits.js';
import { formatNumberPtBr } from '../../js/html.js';
import { decimal } from '../inventory/lots/lotModel';
import { normalizeSearch } from '../inventory/shared/text';
import type { Property, Area, AreaType, PropertyFields, AreaFields } from './ruralTypes';
export function isArchived(
  record: { status: string; deleted_at: string | null } | null | undefined,
): boolean {
  return Boolean(record && (record.status === 'archived' || record.deleted_at));
}
export function propertyLocation(item: Property): string {
  return [item.city, item.state].filter(Boolean).join(' - ') || 'Localização não informada';
}
export function sizeLabel(
  value: number | string | null,
  unit: string | null,
  property = false,
): string {
  return value == null
    ? 'Não informada'
    : `${formatNumberPtBr(value)}${unit ? ' • ' + (property ? getAreaUnitLabel(unit) : getAreaSizeUnitLabel(unit)) : ''}`;
}
function sizeError(value: string, unit: string, allowed: string[]): string {
  if (value.trim() && decimal(value) === null)
    return 'Informe um tamanho válido, maior ou igual a zero.';
  if ((value.trim().split(/[.,]/)[1]?.length ?? 0) > 4)
    return 'Use até quatro casas decimais no tamanho.';
  if (value.trim() && !unit) return 'Selecione a unidade do tamanho.';
  if (unit && !allowed.includes(unit)) return 'Selecione uma unidade válida.';
  return '';
}
function commonError(fields: { name: string; description: string; notes: string }): string {
  if (fields.name.trim().length < 2 || fields.name.trim().length > 120)
    return 'Informe um nome entre 2 e 120 caracteres.';
  if (fields.description.trim().length > 600) return 'Use até 600 caracteres na descrição.';
  if (fields.notes.trim().length > 1500) return 'Use até 1500 caracteres nas observações.';
  return '';
}
export function validateProperty(fields: PropertyFields): string {
  const common = commonError(fields);
  if (common) return common;
  if (fields.city.trim().length > 120) return 'Use até 120 caracteres na cidade.';
  if (fields.state && !BRAZIL_STATES.some(([uf]) => uf === fields.state))
    return 'Selecione um estado válido.';
  return sizeError(
    fields.totalArea,
    fields.areaUnit,
    PROPERTY_AREA_UNITS.map(([key]) => key),
  );
}
export function validateArea(fields: AreaFields, types: AreaType[]): string {
  const common = commonError(fields);
  if (common) return common;
  if (!types.some((item) => item.id === fields.areaTypeId))
    return 'Selecione um tipo de área válido.';
  if (fields.locationDescription.trim().length > 240)
    return 'Use até 240 caracteres na localização interna.';
  return sizeError(
    fields.size,
    fields.unit,
    AREA_UNITS.map(([key]) => key),
  );
}
export function validateAreaType(name: string, description: string): string {
  if (name.trim().length < 2 || name.trim().length > 80)
    return 'Informe um nome entre 2 e 80 caracteres.';
  if (description.trim().length > 300) return 'Use até 300 caracteres na descrição.';
  return '';
}
export function propertyPayload(fields: PropertyFields) {
  return { ...fields, name: fields.name.trim(), totalArea: decimal(fields.totalArea) };
}
export function areaPayload(fields: AreaFields) {
  return { ...fields, name: fields.name.trim(), size: decimal(fields.size) };
}
export function filterProperties(items: Property[], search: string, state: string): Property[] {
  const term = normalizeSearch(search);
  return items.filter(
    (item) =>
      (!state || item.state === state) &&
      (!term ||
        normalizeSearch(
          [item.name, item.city, item.state, item.description].filter(Boolean).join(' '),
        ).includes(term)),
  );
}
export function filterAreas(items: Area[], search: string, typeId: string): Area[] {
  const term = normalizeSearch(search);
  return items.filter(
    (item) =>
      (!typeId || item.area_type_id === typeId) &&
      (!term ||
        normalizeSearch(
          [item.name, item.area_type?.name, item.location_description, item.description]
            .filter(Boolean)
            .join(' '),
        ).includes(term)),
  );
}
