import type { InventoryLot, Amount } from '../detailTypes';

export interface LotDetail extends InventoryLot {
  unit_price: Amount;
  notes: string | null;
  deleted_at?: string | null;
}
export interface LotFields {
  purchasedQuantity: string;
  totalPrice: string;
  purchaseDate: string;
  supplier: string;
  batchNumber: string;
  expirationDate: string;
  notes: string;
}
export function decimal(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized || !/^\d+(\.\d+)?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateLot(fields: LotFields, original: LotDetail | null): string {
  if (!original) {
    const quantity = decimal(fields.purchasedQuantity);
    if (quantity === null || quantity <= 0)
      return 'Informe uma quantidade comprada maior que zero.';
    if ((fields.purchasedQuantity.trim().split(/[.,]/)[1]?.length ?? 0) > 4)
      return 'Use até quatro casas decimais na quantidade.';
    if (fields.totalPrice.trim() && decimal(fields.totalPrice) === null)
      return 'Informe um preço total válido, maior ou igual a zero.';
    if ((fields.totalPrice.trim().split(/[.,]/)[1]?.length ?? 0) > 2)
      return 'Use até duas casas decimais no preço total.';
    if (!validDate(fields.purchaseDate)) return 'Informe uma data da compra válida.';
  }
  if (fields.expirationDate && !validDate(fields.expirationDate))
    return 'Informe uma validade válida.';
  if (
    fields.expirationDate &&
    fields.expirationDate < (original?.purchase_date ?? fields.purchaseDate)
  )
    return 'A validade não pode ser anterior à data da compra.';
  if (
    fields.supplier.trim().length > 180 ||
    fields.batchNumber.trim().length > 120 ||
    fields.notes.trim().length > 1500
  )
    return 'Respeite os limites de tamanho dos campos.';
  return '';
}
export function metadata(fields: LotFields) {
  return {
    supplier: fields.supplier.trim(),
    batchNumber: fields.batchNumber.trim(),
    expirationDate: fields.expirationDate,
    notes: fields.notes.trim(),
  };
}
export function purchase(fields: LotFields) {
  return {
    ...metadata(fields),
    purchasedQuantity: decimal(fields.purchasedQuantity),
    totalPrice: decimal(fields.totalPrice),
    purchaseDate: fields.purchaseDate,
  };
}
