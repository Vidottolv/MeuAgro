import { visitSatelliteReference } from './visitSatellite.js';
import { visitObservations } from './visitObservations.js';
export const anamnesisFields = [
  ['reason', 'Motivo da visita / queixa principal'],
  ['producer_report', 'Relato do produtor'],
  ['symptoms', 'Sintomas e sinais observados'],
  ['history', 'Histórico da área e manejo anterior'],
  ['previous_treatments', 'Tratamentos e aplicações anteriores'],
  ['soil', 'Condições do solo e irrigação'],
  ['weather', 'Condições climáticas'],
  ['assessment', 'Avaliação técnica / hipótese'],
  ['recommendations', 'Recomendações e ações combinadas'],
  ['followup', 'Pontos a verificar no retorno'],
];
export const priorities = { low: 'Baixa', medium: 'Moderada', high: 'Alta', urgent: 'Urgente' };
export function visitPayload(fields) {
  const date = new Date(fields.visited_at),
    next = fields.next_visit || '';
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fields.visited_at || '') ||
    !Number.isFinite(date.getTime()) ||
    date.getFullYear() !== Number(fields.visited_at.slice(0, 4)) ||
    date.getMonth() + 1 !== Number(fields.visited_at.slice(5, 7)) ||
    date.getDate() !== Number(fields.visited_at.slice(8, 10)) ||
    date.getHours() !== Number(fields.visited_at.slice(11, 13)) ||
    date.getMinutes() !== Number(fields.visited_at.slice(14, 16))
  )
    throw Error('Informe a data e o horário da visita.');
  for (const [key, label, max] of [
    ['producer_name', 'Nome do produtor', 120],
    ['site_name', 'Nome da propriedade', 160],
  ]) {
    if (fields[key]?.trim().length < 2 || !fields[key]?.trim() || fields[key].trim().length > max)
      throw Error(`${label}: informe de 2 a ${max} caracteres.`);
  }
  if (!fields.anamnesis?.reason?.trim()) throw Error('Informe o motivo da visita.');
  for (const [key] of anamnesisFields)
    if (String(fields.anamnesis?.[key] || '').length > 4000)
      throw Error('Cada campo da anamnese deve ter até 4.000 caracteres.');
  if (!Object.hasOwn(priorities, fields.priority)) throw Error('Selecione uma prioridade válida.');
  if (next) {
    const parsed = new Date(next + 'T12:00:00');
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(next) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.getFullYear() !== Number(next.slice(0, 4)) ||
      parsed.getMonth() + 1 !== Number(next.slice(5, 7)) ||
      parsed.getDate() !== Number(next.slice(8, 10)) ||
      next < fields.visited_at.slice(0, 10)
    )
      throw Error('O retorno deve ser uma data válida igual ou posterior à visita.');
  }
  return {
    ...(fields.field_observations !== undefined
      ? {
          field_observations: visitObservations(
            fields.field_observations,
            fields.property_id,
            fields.visited_at.slice(0, 10),
          ),
        }
      : {}),
    ...(fields.satellite_reference
      ? {
          satellite_reference: visitSatelliteReference(
            fields.satellite_reference,
            fields.property_id,
            fields.area_id,
          ),
        }
      : {}),
    producer_name: fields.producer_name.trim(),
    site_name: fields.site_name.trim(),
    area_name: (fields.area_name || '').trim().slice(0, 160),
    crop_name: (fields.crop_name || '').trim().slice(0, 120),
    property_id: fields.property_id || null,
    area_id: fields.area_id || null,
    crop_id: fields.crop_id || null,
    production_cycle_id: fields.production_cycle_id || null,
    seller_id: fields.seller_id || null,
    visited_at: date.toISOString(),
    next_visit: next || null,
    priority: fields.priority,
    anamnesis: Object.fromEntries(
      anamnesisFields.map(([key]) => [key, (fields.anamnesis?.[key] || '').trim()]),
    ),
  };
}
