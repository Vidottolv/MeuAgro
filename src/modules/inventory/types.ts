export type StockStatus = 'normal' | 'low_stock' | 'out_of_stock';
export type ActivityFilter = 'active' | 'inactive' | 'all';
export interface AgriculturalInput {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  base_unit: string;
  active: boolean;
  current_quantity: number | string;
  stock_status: StockStatus;
}
