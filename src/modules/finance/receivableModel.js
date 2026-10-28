import { localDay } from '../visits/visitFollowup.js';
export const expenseCategories = {
  services: 'Serviços prestados',
  harvest: 'Vendas da produção',
  other: 'Outros recebimentos',
};
export function parseCents(value) {
  const s = String(value ?? '').trim();
  if (!/^\d{1,9}(?:[,.]\d{1,2})?$/.test(s))
    throw Error('Informe o valor sem separador de milhares, com até duas casas decimais.');
  const [whole, fraction = ''] = s.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents < 1 || cents > 99999999999)
    throw Error('O valor deve ser positivo e de até R$ 999.999.999,99.');
  return cents;
}
export const expenseMoney = (cents) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(cents || 0) / 100,
  );
export function validExpenseDate(day, future = true) {
  const d = new Date(day + 'T12:00:00');
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day || '') &&
    Number.isFinite(d.getTime()) &&
    localDay(d) === day &&
    day >= '1900-01-01' &&
    day <= '2100-12-31' &&
    (future || day <= localDay())
  );
}
export function expensePayload(form) {
  if (!form.property_id) throw Error('Selecione a propriedade.');
  if (!expenseCategories[form.category]) throw Error('Selecione a categoria.');
  const title = String(form.title || '').trim();
  if (title.length < 2 || title.length > 160)
    throw Error('Informe uma descrição de 2 a 160 caracteres.');
  if (!validExpenseDate(form.record_date, false) || !validExpenseDate(form.due_date))
    throw Error('Confira as datas; a ocorrência não pode ser futura.');
  if ((form.notes || '').length > 2000) throw Error('Use até 2000 caracteres nas observações.');
  return {
    property_id: form.property_id,
    season_id: form.season_id || null,
    title,
    category: form.category,
    amount_cents: parseCents(form.amount),
    record_date: form.record_date,
    due_date: form.due_date,
    notes: form.notes || '',
  };
}
export function expenseState(row, today = localDay()) {
  if (row.cancelled_at) return 'Cancelada';
  if (Number(row.balance_cents) === 0) return 'Recebida';
  if (row.due_date < today) return Number(row.paid_cents) > 0 ? 'Parcial • vencida' : 'Vencida';
  return Number(row.paid_cents) > 0 ? 'Parcial' : 'Em aberto';
}
export function expensesCsv(rows) {
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[\s\uFEFF]*[=+@-]/u.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return (
    '\uFEFF' +
    [
      [
        'ID',
        'Conta a receber',
        'Propriedade',
        'Safra',
        'Categoria',
        'Ocorrência',
        'Vencimento',
        'Valor (R$)',
        'Recebido líquido (R$)',
        'Saldo (R$)',
        'Situação',
      ],
      ...rows.map((r) => [
        r.id,
        r.title,
        r.property_name,
        r.season_name,
        expenseCategories[r.category],
        r.record_date,
        r.due_date,
        (r.amount_cents / 100).toFixed(2).replace('.', ','),
        (r.paid_cents / 100).toFixed(2).replace('.', ','),
        (r.balance_cents / 100).toFixed(2).replace('.', ','),
        expenseState(r),
      ]),
    ]
      .map((r) => r.map(cell).join(';'))
      .join('\r\n')
  );
}
