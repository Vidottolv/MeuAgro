export interface Property {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  total_area: number | string | null;
  area_unit: string | null;
  description: string | null;
  notes: string | null;
  status: string;
  deleted_at: string | null;
  created_at: string;
}
export interface AreaType {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
}
export interface Area {
  id: string;
  property_id: string;
  area_type_id: string | null;
  area_type: AreaType | null;
  name: string;
  size: number | string | null;
  unit: string | null;
  description: string | null;
  location_description: string | null;
  notes: string | null;
  status: string;
  deleted_at: string | null;
  created_at: string;
}
export interface PropertyFields {
  name: string;
  description: string;
  city: string;
  state: string;
  totalArea: string;
  areaUnit: string;
  notes: string;
}
export interface AreaFields {
  name: string;
  areaTypeId: string;
  description: string;
  size: string;
  unit: string;
  locationDescription: string;
  notes: string;
}
export interface Season {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
}
export interface Cycle {
  id: string;
  variety: string | null;
  status: string;
  crop: { name: string } | null;
}
