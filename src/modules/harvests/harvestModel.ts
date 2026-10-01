import type { Cycle, Harvest, HarvestFields, SaleFields } from './harvestTypes';
import { validDate } from '../seasons/seasonModel';
import { HARVEST_UNITS } from '../../constants/harvestUnits.js';
import { HARVEST_DESTINATIONS, harvestAllowsSales } from '../../constants/harvestDestinations.js';
import { PAYMENT_METHODS } from '../../constants/paymentMethods.js';
import { quantity } from '../production/productionModel';
export { quantity };
export const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
};
export const cycleLabel = (c?: Cycle) =>
  c
    ? [c.crop?.name, c.variety, c.property?.name, c.area?.name].filter(Boolean).join(' • ')
    : 'Plantio indisponível';
export const money = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const amount = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 4 });
export function remaining(h: Harvest, id?: string) {
  return Math.max(
    0,
    Number(h.quantity) -
      (h.sales || []).filter((s) => s.id !== id).reduce((a, s) => a + Number(s.quantity), 0),
  );
}
export function validateHarvest(f: HarvestFields, c?: Cycle, h?: Harvest | null) {
  if (!c || c.deleted_at) return 'Selecione um plantio ativo.';
  if (!h && !['planted', 'developing', 'near_harvest', 'ready_to_harvest'].includes(c.status))
    return 'Este plantio não permite novas colheitas.';
  if (!validDate(f.harvestDate) || f.harvestDate < c.planting_date)
    return 'Informe uma data válida, a partir do plantio.';
  const q = quantity(f.quantity);
  if (q === null || q <= 0) return 'Informe uma quantidade maior que zero.';
  if (!HARVEST_UNITS.some(([v]) => v === f.unit)) return 'Selecione uma unidade válida.';
  if (!HARVEST_DESTINATIONS.some(([v]) => v === f.destination))
    return 'Selecione um destino válido.';
  if (
    h?.sales?.length &&
    (f.unit !== h.unit ||
      !harvestAllowsSales(f.destination) ||
      q < h.sales.reduce((a, s) => a + Number(s.quantity), 0))
  )
    return 'Preserve a unidade, o destino de venda e a quantidade já vendida.';
  if (f.qualityClassification.trim().length > 120 || f.notes.trim().length > 1800)
    return 'Revise o tamanho da classificação e das observações.';
  return '';
}
export function validateSale(f: SaleFields, h?: Harvest | null, id?: string) {
  if (!h || h.production_cycle?.deleted_at || !harvestAllowsSales(h.destination))
    return 'Selecione uma colheita disponível para venda.';
  const q = quantity(f.quantity),
    price = quantity(f.unitPrice);
  if (q === null || q <= 0 || q > remaining(h, id))
    return 'A quantidade deve ser maior que zero e respeitar o saldo da colheita.';
  if (price === null || !Number.isFinite(q * price)) return 'Informe um preço unitário válido.';
  if (!validDate(f.saleDate) || f.saleDate < h.harvest_date)
    return 'Informe uma data válida, a partir da colheita.';
  if (f.paymentMethod && !PAYMENT_METHODS.some(([v]) => v === f.paymentMethod))
    return 'Selecione uma forma de pagamento válida.';
  if (f.buyer.trim().length > 180 || f.notes.trim().length > 1600)
    return 'Revise o tamanho do comprador e das observações.';
  return '';
}
