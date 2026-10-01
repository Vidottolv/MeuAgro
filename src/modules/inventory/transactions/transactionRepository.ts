import { listAgriculturalInputs } from '../../../services/agriculturalInputService.js';
import {
  listInventoryTransactions,
  getInventoryTransactionById,
  createManualInventoryTransaction,
} from '../../../services/inventoryTransactionService.js';
import { listProductionCycles } from '../../../services/productionCycleService.js';
import { listProductionEvents } from '../../../services/productionEventService.js';
import { decimal } from '../lots/lotModel';
import type { AgriculturalInput } from '../types';
import type {
  Transaction,
  TransactionFields,
  ProductionCycle,
  ProductionEvent,
} from './transactionTypes';
export async function fetchInputs(): Promise<AgriculturalInput[]> {
  return (await listAgriculturalInputs()) as AgriculturalInput[];
}
export async function fetchHistory(
  inputId: string,
  lotId: string,
  type: string,
): Promise<Transaction[]> {
  return (await listInventoryTransactions({
    inputId: inputId || null,
    lotId: lotId || null,
    type: type || null,
  })) as unknown as Transaction[];
}
export async function fetchTransaction(id: string): Promise<Transaction | null> {
  return (await getInventoryTransactionById(id)) as unknown as Transaction | null;
}
export async function fetchCycles(): Promise<ProductionCycle[]> {
  return (await listProductionCycles({ archived: false })) as unknown as ProductionCycle[];
}
export async function fetchEvents(id: string): Promise<ProductionEvent[]> {
  return (await listProductionEvents(id)) as unknown as ProductionEvent[];
}
export async function saveTransaction(fields: TransactionFields): Promise<string> {
  const saved = await createManualInventoryTransaction({
    ...fields,
    quantity: decimal(fields.quantity),
    occurredAt: new Date(fields.occurredAt).toISOString(),
    notes: fields.notes.trim(),
  });
  if (
    !saved?.id ||
    saved.agricultural_input_id !== fields.inputId ||
    saved.inventory_lot_id !== fields.lotId
  )
    throw new Error(
      'Não foi possível confirmar o registro. Confira o histórico antes de tentar novamente.',
    );
  return saved.id;
}
