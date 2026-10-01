import {
  getFinancialOverview,
  listCycleFinancialSummaries,
  getCycleFinancialDetail,
} from '../../services/financeService.js';
import type { Cycle, Harvest, Sale } from '../harvests/harvestTypes';
export interface Summary {
  input_cost: number;
  sales_revenue: number;
  estimated_result: number;
  gross_margin_percent: number | null;
  result_state: string;
  usage_transactions_count: number;
  harvests_count: number;
  sales_count: number;
}
export interface FinancialCycle extends Cycle {
  finance: Summary;
}
export interface Detail {
  cycle: Cycle;
  summary: Summary;
  inputCosts: {
    agricultural_input_id: string;
    input_name: string;
    brand: string;
    unit: string;
    quantity_used: number;
    usage_count: number;
    total_cost: number;
  }[];
  production: {
    unit: string;
    harvested_quantity: number;
    sold_quantity: number;
    remaining_quantity: number;
    gross_revenue: number;
  }[];
  harvests: Harvest[];
  sales: Sale[];
}
export const overview = getFinancialOverview;
export const cycles = async () =>
  (await listCycleFinancialSummaries()) as unknown as FinancialCycle[];
export const detail = async (id: string) =>
  (await getCycleFinancialDetail(id)) as unknown as Detail | null;
