export interface Choice {
  id: string;
  name: string;
  deleted_at?: string | null;
  status?: string;
  property_id?: string;
  active?: boolean;
  average_cycle_days?: number | null;
}
export interface Planting {
  id: string;
  property_id: string;
  area_id: string;
  season_id: string | null;
  crop_id: string;
  property: Choice | null;
  area: Choice | null;
  season: Choice | null;
  crop: Choice | null;
  variety: string | null;
  planted_quantity: number | string | null;
  planted_unit: string | null;
  planting_date: string;
  initial_harvest_forecast: string | null;
  current_harvest_forecast: string | null;
  final_harvest_date: string | null;
  status: string;
  notes: string | null;
  deleted_at: string | null;
}
export interface PlantingFields {
  propertyId: string;
  areaId: string;
  seasonId: string;
  cropId: string;
  variety: string;
  plantedQuantity: string;
  plantedUnit: string;
  plantingDate: string;
  initialHarvestForecast: string;
  currentHarvestForecast: string;
  finalHarvestDate: string;
  status: string;
  notes: string;
}
export interface Links {
  areas: Choice[];
  seasons: Choice[];
}
export interface PlantingEvent {
  id: string;
  title: string;
  event_type: string;
  occurred_at: string;
  description: string | null;
  notes: string | null;
  event_photos: { id: string; signed_url?: string; description?: string }[];
  event_inputs: {
    id: string;
    quantity: number | string;
    unit: string;
    total_cost: number | string | null;
    agricultural_input: { name: string } | null;
    inventory_lot: { batch_number: string } | null;
  }[];
}
export interface Harvest {
  id: string;
  harvest_date: string;
  quantity: number | string;
  unit: string;
  destination: string;
  sales: { quantity: number | string; total_value: number | string }[];
}
