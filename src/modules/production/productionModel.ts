import { validDate } from '../seasons/seasonModel';
import { PRODUCTION_EVENT_TYPES } from '../../constants/productionEventTypes.js';
import type { CropFields, EventFields, Lot } from './productionTypes';
export function localDateTime(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ||
    !validDate(value.slice(0, 10)) ||
    Number(value.slice(11, 13)) > 23 ||
    Number(value.slice(14)) > 59
  )
    return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
export function validateCrop(f: CropFields) {
  if (f.name.trim().length < 2 || f.name.trim().length > 120)
    return 'Informe um nome entre 2 e 120 caracteres.';
  if (f.category.trim().length > 100) return 'A categoria deve ter até 100 caracteres.';
  if (f.notes.trim().length > 1500) return 'As observações devem ter até 1500 caracteres.';
  if (
    f.averageCycleDays.trim() &&
    (!/^\d+$/.test(f.averageCycleDays.trim()) ||
      !Number.isSafeInteger(Number(f.averageCycleDays)) ||
      Number(f.averageCycleDays) <= 0)
  )
    return 'Informe um ciclo médio inteiro maior que zero.';
  return '';
}
export function validateEvent(f: EventFields) {
  if (!PRODUCTION_EVENT_TYPES.some(([v]) => v === f.eventType))
    return 'Selecione um tipo de evento válido.';
  if (f.title.trim().length < 2 || f.title.trim().length > 180)
    return 'Informe um título entre 2 e 180 caracteres.';
  if (!localDateTime(f.occurredAt)) return 'Informe data e horário válidos.';
  if (f.description.trim().length > 1600 || f.notes.trim().length > 1600)
    return 'Descrição e observações devem ter até 1600 caracteres.';
  return '';
}
export function quantity(value: string) {
  const text = value.trim().replace(',', '.');
  return /^\d+(?:\.\d{1,4})?$/.test(text) && Number.isFinite(Number(text)) ? Number(text) : null;
}
export function validateUsage(inputId: string, lot: Lot | undefined, raw: string, notes: string) {
  if (!inputId) return 'Selecione o insumo.';
  if (!lot || lot.agricultural_input_id !== inputId || lot.deleted_at)
    return 'Selecione um lote válido deste insumo.';
  const amount = quantity(raw);
  if (amount === null || amount <= 0)
    return 'Informe uma quantidade maior que zero com até 4 casas decimais.';
  if (!Number.isFinite(Number(lot.current_quantity)) || amount > Number(lot.current_quantity))
    return 'Saldo insuficiente no lote selecionado.';
  if (notes.trim().length > 1000) return 'As observações devem ter até 1000 caracteres.';
  return '';
}
export function matches(text: string, query: string) {
  const norm = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  return norm(text).includes(norm(query.trim()));
}
