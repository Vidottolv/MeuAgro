import * as harvestService from '../../services/harvestService.js';
import * as saleService from '../../services/harvestSaleService.js';
import type { Harvest, Sale, Cycle, HarvestFields, SaleFields } from './harvestTypes';
import { quantity, validateHarvest, validateSale } from './harvestModel';
export const listHarvests = async () =>
  (await harvestService.listHarvests()) as unknown as Harvest[];
export const getHarvest = async (id: string) =>
  (await harvestService.getHarvestById(id)) as unknown as Harvest | null;
export const listCycles = async () =>
  (await harvestService.listHarvestableCycles()) as unknown as Cycle[];
export const listSales = async () => (await saleService.listHarvestSales()) as unknown as Sale[];
export const getSale = async (id: string) =>
  (await saleService.getHarvestSaleById(id)) as unknown as Sale | null;
export const eligibleHarvests = async () =>
  (await saleService.listSaleEligibleHarvests()) as unknown as Harvest[];
export const finalize = harvestService.finalizeCycleFromHarvest;
export async function saveHarvest(id: string | undefined, f: HarvestFields) {
  const current = id ? await getHarvest(id) : null;
  if (id && !current) throw Error('Colheita não encontrada.');
  const cycle = current?.production_cycle || (await listCycles()).find((c) => c.id === f.cycleId);
  const error = validateHarvest(f, cycle, current);
  if (error) throw Error(error);
  const payload = { ...f, quantity: quantity(f.quantity) };
  const saved = id
    ? await harvestService.updateHarvest(id, payload)
    : await harvestService.createHarvest(f.cycleId, payload);
  if (!saved?.id) throw Error('Não foi possível confirmar a gravação da colheita.');
  return String(saved.id);
}
export async function saveSale(id: string | undefined, f: SaleFields) {
  const current = id ? await getSale(id) : null;
  if (id && (!current || current.harvest_id !== f.harvestId))
    throw Error('Venda não encontrada para esta colheita.');
  const harvest = await getHarvest(f.harvestId);
  const error = validateSale(f, harvest, id);
  if (error) throw Error(error);
  const payload = { ...f, quantity: quantity(f.quantity), unitPrice: quantity(f.unitPrice) };
  const saved = id
    ? await saleService.updateHarvestSale(id, harvest, payload)
    : await saleService.createHarvestSale(harvest, payload);
  if (!saved?.id) throw Error('Não foi possível confirmar a gravação da venda.');
  return String(saved.id);
}
