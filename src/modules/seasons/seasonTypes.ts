export interface SeasonProperty {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  deleted_at?: string | null;
}
export interface Season {
  id: string;
  property_id: string;
  property: SeasonProperty | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  status: string;
  deleted_at: string | null;
}
export interface SeasonFields {
  propertyId: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
}
