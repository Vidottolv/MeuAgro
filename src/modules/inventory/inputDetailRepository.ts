import {
  getAgriculturalInputById,
  setAgriculturalInputActive,
} from '../../services/agriculturalInputService.js';
import { listInventoryLots } from '../../services/inventoryLotService.js';
import { listInventoryTransactions } from '../../services/inventoryTransactionService.js';
import type { InputDetail, InventoryLot, InventoryTransaction } from './detailTypes';

export async function fetchInputDetail(id: string): Promise<InputDetail | null> {
  return (await getAgriculturalInputById(id)) as InputDetail | null;
}
export async function fetchRecentLots(id: string): Promise<InventoryLot[]> {
  return (await listInventoryLots({ inputId: id, limit: 3 })) as InventoryLot[];
}
export async function fetchRecentTransactions(id: string): Promise<InventoryTransaction[]> {
  return (await listInventoryTransactions({
    inputId: id,
    limit: 4,
  })) as unknown as InventoryTransaction[];
}
export async function changeInputActive(id: string, active: boolean): Promise<boolean> {
  const saved = await setAgriculturalInputActive(id, active);
  if (saved?.id !== id || typeof saved.active !== 'boolean')
    throw new Error('Não foi possível confirmar a situação do insumo. Atualize a ficha.');
  return saved.active;
}
