import { listAgriculturalInputs } from '../../services/agriculturalInputService.js';
import type { AgriculturalInput } from './types';

// Reuse the existing authenticated queries and database permissions.
export async function fetchInventory(): Promise<AgriculturalInput[]> {
  return (await listAgriculturalInputs()) as AgriculturalInput[];
}
