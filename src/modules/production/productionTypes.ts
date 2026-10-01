import type { Planting } from '../plantings/plantingTypes';
export type { Planting };
export interface Crop {
  id: string;
  name: string;
  category: string | null;
  average_cycle_days: number | null;
  notes: string | null;
  is_system: boolean;
  active: boolean;
}
export interface CropFields {
  name: string;
  category: string;
  averageCycleDays: string;
  notes: string;
}
export interface EventRecord {
  id: string;
  production_cycle_id: string;
  event_type: string;
  title: string;
  occurred_at: string;
  description: string | null;
  notes: string | null;
}
export interface EventFields {
  eventType: string;
  title: string;
  occurredAt: string;
  description: string;
  notes: string;
}
export interface Input {
  id: string;
  name: string;
  base_unit: string;
  active: boolean;
  deleted_at: string | null;
}
export interface Lot {
  id: string;
  agricultural_input_id: string;
  batch_number: string | null;
  supplier: string | null;
  current_quantity: number | string;
  unit: string;
  unit_price: number | string | null;
  expiration_date: string | null;
  deleted_at: string | null;
}
export interface Photo {
  id: string;
  production_cycle_id: string;
  storage_path: string;
  description: string | null;
  captured_at: string;
  signed_url: string | null;
  production_event: { id: string; title: string } | null;
}
export interface Forecast extends Planting {
  days_to_harvest: number | null;
  forecast_state: string;
}
