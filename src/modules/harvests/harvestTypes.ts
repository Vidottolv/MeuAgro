export interface Cycle {
  id: string;
  crop?: { name: string };
  property?: { name: string };
  area?: { name: string };
  property_id: string;
  planting_date: string;
  status: string;
  deleted_at: string | null;
  variety?: string;
}
export interface Sale {
  id: string;
  harvest_id: string;
  buyer: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_value: number;
  sale_date: string;
  payment_method: string | null;
  notes: string | null;
  harvest: Harvest;
}
export interface Harvest {
  id: string;
  production_cycle_id: string;
  harvest_date: string;
  quantity: number;
  unit: string;
  destination: string;
  quality_classification: string | null;
  notes: string | null;
  production_cycle: Cycle;
  sales: Sale[];
}
export interface HarvestFields {
  cycleId: string;
  harvestDate: string;
  quantity: string;
  unit: string;
  destination: string;
  qualityClassification: string;
  notes: string;
}
export interface SaleFields {
  harvestId: string;
  buyer: string;
  quantity: string;
  unitPrice: string;
  saleDate: string;
  paymentMethod: string;
  notes: string;
}
