import { getAgriculturalInputById } from '../../../services/agriculturalInputService.js';
import {
  listInventoryLots,
  getInventoryLotById,
  createInventoryLot,
  updateInventoryLotMetadata,
} from '../../../services/inventoryLotService.js';
import { listInventoryTransactions } from '../../../services/inventoryTransactionService.js';
import type { InputDetail, InventoryTransaction } from '../detailTypes';
import type { LotDetail, LotFields } from './lotModel';
import { metadata, purchase } from './lotModel';

export async function loadInput(id: string): Promise<InputDetail | null> {
  return (await getAgriculturalInputById(id)) as InputDetail | null;
}
export async function loadLot(id: string): Promise<LotDetail | null> {
  const lot = (await getInventoryLotById(id)) as LotDetail | null;
  return lot?.deleted_at ? null : lot;
}
export async function loadLots(inputId: string): Promise<LotDetail[]> {
  return (await listInventoryLots({ inputId })) as LotDetail[];
}
export async function loadHistory(lotId: string): Promise<InventoryTransaction[]> {
  return (await listInventoryTransactions({
    lotId,
    limit: 5,
  })) as unknown as InventoryTransaction[];
}
export async function saveLot(
  inputId: string,
  original: LotDetail | null,
  fields: LotFields,
): Promise<string> {
  const saved = original
    ? await updateInventoryLotMetadata(original.id, metadata(fields))
    : await createInventoryLot(inputId, purchase(fields));
  if (
    !saved?.id ||
    saved.agricultural_input_id !== inputId ||
    (original && saved.id !== original.id)
  )
    throw new Error(
      'Não foi possível confirmar o lote salvo. Confira os lotes antes de tentar novamente.',
    );
  return saved.id;
}
