import { INPUT_CATEGORIES } from '../../constants/inputCategories.js';
import { INPUT_UNITS } from '../../constants/inputUnits.js';

export interface InputDraft {
  name: string;
  brand: string;
  category: string;
  baseUnit: string;
  minimumStock: string;
  idealStock: string;
  description: string;
  notes: string;
}
export type InputErrors = Partial<Record<keyof InputDraft, string>>;
export interface InputRecord {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  base_unit: string;
  minimum_stock: number | string | null;
  ideal_stock: number | string | null;
  description: string | null;
  notes: string | null;
}

export function createInputDraft(input?: InputRecord): InputDraft {
  return {
    name: input?.name ?? '',
    brand: input?.brand ?? '',
    category: input?.category ?? '',
    baseUnit: input?.base_unit ?? '',
    minimumStock: String(input?.minimum_stock ?? 0),
    idealStock: input?.ideal_stock == null ? '' : String(input.ideal_stock),
    description: input?.description ?? '',
    notes: input?.notes ?? '',
  };
}

// A decimal separator is accepted in either notation; thousands separators are not.
export function parseStock(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) return NaN;
  return Number(text.replace(',', '.'));
}

export function validateInputDraft(draft: InputDraft): InputErrors {
  const errors: InputErrors = {};
  if (draft.name.trim().length < 2 || draft.name.trim().length > 160)
    errors.name = 'Informe um nome entre 2 e 160 caracteres.';
  if (draft.brand.trim().length > 160) errors.brand = 'Use até 160 caracteres na marca.';
  if (!INPUT_CATEGORIES.some(([value]) => value === draft.category))
    errors.category = 'Selecione a categoria.';
  if (!INPUT_UNITS.some(([value]) => value === draft.baseUnit))
    errors.baseUnit = 'Selecione a unidade principal.';
  const minimum = parseStock(draft.minimumStock);
  const ideal = parseStock(draft.idealStock);
  if (minimum !== null && (!Number.isFinite(minimum) || minimum < 0))
    errors.minimumStock = 'Informe um estoque mínimo válido, maior ou igual a zero.';
  if (ideal !== null && (!Number.isFinite(ideal) || ideal < 0))
    errors.idealStock = 'Informe um estoque ideal válido, maior ou igual a zero.';
  if (!errors.minimumStock && !errors.idealStock && ideal !== null && ideal < (minimum ?? 0))
    errors.idealStock = 'O estoque ideal não pode ser menor que o estoque mínimo.';
  if (draft.description.length > 1200)
    errors.description = 'Use até 1.200 caracteres na descrição.';
  if (draft.notes.length > 1600) errors.notes = 'Use até 1.600 caracteres nas observações.';
  return errors;
}

export function inputPayload(draft: InputDraft) {
  return {
    name: draft.name.trim(),
    brand: draft.brand.trim(),
    category: draft.category,
    baseUnit: draft.baseUnit,
    minimumStock: parseStock(draft.minimumStock) ?? 0,
    idealStock: parseStock(draft.idealStock) ?? '',
    description: draft.description.trim(),
    notes: draft.notes.trim(),
  };
}
