import type { InventoryTransaction, Amount } from '../detailTypes';
export interface ProductionCycle {
  id: string;
  variety?: string | null;
  crop?: { name: string } | null;
  area?: { name: string } | null;
  property?: { name: string } | null;
}
export interface ProductionEvent {
  id: string;
  title: string;
  production_cycle_id: string;
}
export interface Transaction extends InventoryTransaction {
  agricultural_input_id: string;
  inventory_lot_id: string | null;
  production_cycle_id: string | null;
  production_event_id: string | null;
  unit_cost: Amount;
  notes: string | null;
  created_at: string;
  production_cycle?: ProductionCycle | null;
  production_event?: ProductionEvent | null;
}
export interface TransactionFields {
  inputId: string;
  lotId: string;
  transactionType: string;
  quantity: string;
  occurredAt: string;
  productionCycleId: string;
  productionEventId: string;
  notes: string;
}
export interface HistoryFilters {
  search: string;
  from: string;
  to: string;
}
