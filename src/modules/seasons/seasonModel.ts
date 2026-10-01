import type { Season, SeasonFields, SeasonProperty } from './seasonTypes';
import { SEASON_STATUSES } from '../../constants/seasonStatus.js';
export const isArchived = (season: Pick<Season, 'deleted_at'>) => Boolean(season.deleted_at);
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return (
    Number(value.slice(0, 4)) >= 1 &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}
export function dateLabel(value: string | null): string {
  return value && validDate(value) ? value.split('-').reverse().join('/') : 'Não informada';
}
export function periodLabel(season: Pick<Season, 'start_date' | 'end_date'>): string {
  if (!season.start_date && !season.end_date) return 'Período não informado';
  if (!season.start_date) return 'Até ' + dateLabel(season.end_date);
  if (!season.end_date) return 'A partir de ' + dateLabel(season.start_date);
  return dateLabel(season.start_date) + ' — ' + dateLabel(season.end_date);
}
export function validateSeason(fields: SeasonFields, properties: SeasonProperty[]): string {
  if (!properties.some((p) => p.id === fields.propertyId && !p.deleted_at))
    return 'Selecione uma propriedade ativa.';
  if (fields.name.trim().length < 2 || fields.name.trim().length > 120)
    return 'Informe um nome entre 2 e 120 caracteres.';
  if (fields.description.trim().length > 800) return 'A descrição deve ter até 800 caracteres.';
  if (
    (fields.startDate && !validDate(fields.startDate)) ||
    (fields.endDate && !validDate(fields.endDate))
  )
    return 'Informe datas válidas.';
  if (fields.startDate && fields.endDate && fields.endDate < fields.startDate)
    return 'A data final não pode ser anterior à data inicial.';
  if (!SEASON_STATUSES.some(([value]) => value === fields.status))
    return 'Selecione um status válido.';
  return '';
}
export function seasonFields(item?: Season | null, propertyId = ''): SeasonFields {
  return {
    propertyId: item?.property_id || propertyId,
    name: item?.name || '',
    startDate: item?.start_date || '',
    endDate: item?.end_date || '',
    description: item?.description || '',
    status: item?.status || 'planned',
  };
}
export function searchSeasons(items: Season[], query: string): Season[] {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  const term = normalize(query.trim());
  return items.filter((s) =>
    normalize(
      [s.name, s.description, s.property?.name, s.property?.city, s.property?.state]
        .filter(Boolean)
        .join(' '),
    ).includes(term),
  );
}
