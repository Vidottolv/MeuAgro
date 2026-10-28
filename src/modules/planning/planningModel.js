import { parseCents, validExpenseDate } from '../finance/expenseModel.js';
export const budgetCategories = {
  input: 'Insumo',
  labor: 'Mão de obra',
  services: 'Serviços',
  fuel: 'Combustível',
  freight: 'Frete',
  energy: 'Energia',
  maintenance: 'Manutenção',
  other: 'Outros',
};
export function quantity(value) {
  const s = String(value).trim().replace(',', '.');
  if (!/^\d{1,7}(?:\.\d{1,4})?$/.test(s) || Number(s) <= 0)
    throw Error('Quantidade positiva com até quatro casas decimais.');
  return s;
}
export function plannedLine(item) {
  const q = quantity(item.quantity),
    price = /^0(?:[,.]0{1,2})?$/.test(String(item.price).trim()) ? 0 : parseCents(item.price);
  const [whole, frac = ''] = q.split('.');
  const scaled = BigInt(whole) * 10000n + BigInt(frac.padEnd(4, '0'));
  const total = Number((scaled * BigInt(price) + 5000n) / 10000n);
  if (total > 99999999999) throw Error('Custo da operação acima do limite.');
  return { quantity: q, unit_cents: price, total_cents: total };
}
export function budgetPayload(form) {
  if (!form.cycle_id || form.name.trim().length < 2 || form.name.length > 120)
    throw Error('Selecione o plantio e dê um nome ao orçamento.');
  if (form.items.length > 100) throw Error('Use até 100 operações.');
  return {
    cycle_id: form.cycle_id,
    name: form.name.trim(),
    items: form.items.map((i) => {
      const line = plannedLine(i);
      if (
        i.label.trim().length < 2 ||
        i.label.length > 160 ||
        !budgetCategories[i.category] ||
        !i.unit?.trim() ||
        !validExpenseDate(i.due_date) ||
        (i.category === 'input' && !i.input_id)
      )
        throw Error('Confira descrição, insumo, unidade e data das operações.');
      return {
        id: i.id,
        label: i.label.trim(),
        category: i.category,
        input_id: i.input_id || null,
        unit: i.unit.trim(),
        due_date: i.due_date,
        completed: !!i.completed,
        quantity: line.quantity,
        unit_cents: line.unit_cents,
      };
    }),
  };
}
export function simpleCsv(columns, rows) {
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[\s\uFEFF]*[=+@-]/u.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [columns, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
}
