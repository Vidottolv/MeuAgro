import { parseCents } from './expenseModel.js';
export function allocationPayload(items, total) {
  if (!Array.isArray(items) || items.length > 50) throw Error('Use até 50 plantios no rateio.');
  const seen = new Set();
  let sum = 0;
  const allocations = items.map((i) => {
    if (!i.cycle_id || seen.has(i.cycle_id)) throw Error('Selecione plantios distintos.');
    seen.add(i.cycle_id);
    const amount_cents = parseCents(i.amount);
    sum += amount_cents;
    return { cycle_id: i.cycle_id, amount_cents };
  });
  if (sum > Number(total)) throw Error('O rateio ultrapassa o valor da despesa.');
  return { allocations, total: sum, remaining: Number(total) - sum };
}
export const centsInput = (cents) => (Number(cents) / 100).toFixed(2).replace('.', ',');
export function equalAllocation(items, total) {
  if (!items.length || items.length > 50 || Number(total) < items.length)
    throw Error('Adicione plantios; cada um deve receber ao menos um centavo.');
  const base = Math.floor(Number(total) / items.length),
    remainder = Number(total) % items.length;
  return items.map((i, index) => ({
    ...i,
    amount: centsInput(base + (index < remainder ? 1 : 0)),
  }));
}
const cell = (value) => {
  let s = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/u.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
};
export function costsCsv(rows, grouped = false) {
  return (
    '\uFEFF' +
    [
      [
        'Propriedade',
        'Safra',
        grouped ? 'Plantios' : 'Talhão',
        ...(grouped ? [] : ['Cultura', 'Plantio (ID)', 'Arquivado']),
        'Insumos (R$)',
        'Despesas rateadas (R$)',
        'Receita de vendas (R$)',
        'Resultado estimado (R$)',
      ],
      ...rows.map((r) => [
        r.property_name,
        r.season_name,
        grouped ? r.cycles : r.area_name,
        ...(grouped ? [] : [r.crop_name, r.id, r.deleted_at ? 'Sim' : 'Não']),
        ...['input_cents', 'operating_cents', 'revenue_cents', 'result_cents'].map((k) =>
          centsInput(r[k]),
        ),
      ]),
    ]
      .map((row) => row.map(cell).join(';'))
      .join('\r\n')
  );
}
