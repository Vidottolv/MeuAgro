import { normalizeSearch } from '../shared/text';
import {
  MANUAL_INVENTORY_TRANSACTION_TYPES,
  getInventoryTransactionSign,
} from '../../../constants/inventoryTransactionTypes.js';
import { decimal, validDate, type LotDetail } from '../lots/lotModel';
import type {
  TransactionFields,
  Transaction,
  HistoryFilters,
  ProductionCycle,
  ProductionEvent,
} from './transactionTypes';
export function localDay(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function filterHistory(items: Transaction[], filters: HistoryFilters): Transaction[] {
  const search = normalizeSearch(filters.search);
  return items.filter((item) => {
    const day = localDay(item.occurred_at);
    return (
      (!filters.from || day >= filters.from) &&
      (!filters.to || day <= filters.to) &&
      (!search ||
        normalizeSearch(
          [
            item.agricultural_input?.name,
            item.inventory_lot?.batch_number,
            item.notes,
            item.production_event?.title,
          ]
            .filter(Boolean)
            .join(' '),
        ).includes(search))
    );
  });
}
export function periodError(from: string, to: string): string {
  if ((from && !validDate(from)) || (to && !validDate(to)))
    return 'Informe datas válidas para o período.';
  return from && to && from > to ? 'A data inicial não pode ser posterior à final.' : '';
}
export function projectedBalance(
  lot: LotDetail | undefined,
  quantity: string,
  type: string,
): number | null {
  const value = decimal(quantity);
  if (!lot || value === null || value <= 0) return null;
  return Number(
    (Number(lot.current_quantity ?? 0) + getInventoryTransactionSign(type) * value).toFixed(4),
  );
}
export function validateTransaction(
  fields: TransactionFields,
  lot: LotDetail | undefined,
  cycles: ProductionCycle[],
  events: ProductionEvent[],
): string {
  if (!fields.inputId) return 'Selecione o insumo.';
  if (!lot || lot.id !== fields.lotId || lot.agricultural_input_id !== fields.inputId)
    return 'Selecione um lote deste insumo.';
  if (!MANUAL_INVENTORY_TRANSACTION_TYPES.some(([type]) => type === fields.transactionType))
    return 'Selecione um tipo de movimentação manual válido.';
  const value = decimal(fields.quantity);
  if (value === null || value <= 0) return 'Informe uma quantidade maior que zero.';
  if ((fields.quantity.trim().split(/[.,]/)[1]?.length ?? 0) > 4)
    return 'Use até quatro casas decimais na quantidade.';
  if (
    getInventoryTransactionSign(fields.transactionType) < 0 &&
    value > Number(lot.current_quantity ?? 0)
  )
    return 'Saldo insuficiente no lote. Confira o saldo disponível.';
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fields.occurredAt) ||
    !validDate(fields.occurredAt.slice(0, 10)) ||
    Number(fields.occurredAt.slice(11, 13)) > 23 ||
    Number(fields.occurredAt.slice(14, 16)) > 59 ||
    !Number.isFinite(new Date(fields.occurredAt).getTime())
  )
    return 'Informe uma data e horário válidos.';
  if (fields.productionCycleId && !cycles.some((cycle) => cycle.id === fields.productionCycleId))
    return 'Selecione um ciclo produtivo válido.';
  if (
    fields.productionEventId &&
    !events.some(
      (event) =>
        event.id === fields.productionEventId &&
        event.production_cycle_id === fields.productionCycleId,
    )
  )
    return 'Selecione um evento do ciclo informado.';
  if (fields.notes.trim().length > 1500) return 'Use até 1500 caracteres nas observações.';
  return '';
}
export function cycleLabel(cycle: ProductionCycle) {
  return (
    [cycle.crop?.name, cycle.variety, cycle.area?.name, cycle.property?.name]
      .filter(Boolean)
      .join(' • ') || 'Ciclo produtivo'
  );
}
