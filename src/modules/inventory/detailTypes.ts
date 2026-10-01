import type { AgriculturalInput } from './types';
export type Amount = number | string | null;
export interface InputDetail extends AgriculturalInput {
  minimum_stock: Amount;
  ideal_stock: Amount;
  description: string | null;
  notes: string | null;
  created_at: string;
}
export interface InventoryLot {
  id: string;
  agricultural_input_id: string;
  batch_number: string | null;
  supplier: string | null;
  current_quantity: Amount;
  purchased_quantity: Amount;
  unit: string;
  total_price: Amount;
  purchase_date: string;
  expiration_date: string | null;
}
export interface InventoryTransaction {
  id: string;
  transaction_type: string;
  quantity: Amount;
  unit: string;
  occurred_at: string;
  total_cost: Amount;
  agricultural_input?: { name: string } | null;
  inventory_lot?: { batch_number: string | null; purchase_date: string } | null;
}
export interface RestockConsultant {
  id: string;
  name: string;
  company: string | null;
  whatsapp: string;
}
