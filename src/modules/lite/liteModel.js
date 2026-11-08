export const money = (cents) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(cents || 0) / 100,
  );
export const today = () =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export function decimal(value, places = 2) {
  const text = String(value).trim().replace(',', '.');
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${places}})?$`).test(text))
    throw Error(`Use números positivos com até ${places} casas decimais, sem separador de milhar.`);
  const [whole, fraction = ''] = text.split('.');
  const result = Number(whole) * 10 ** places + Number(fraction.padEnd(places, '0'));
  if (!Number.isSafeInteger(result)) throw Error('Valor muito alto.');
  return result;
}
export function schedule(first, count) {
  const [y, m, d] = first.split('-').map(Number);
  if (!y || !m || !d || !Number.isInteger(count) || count < 1 || count > 36)
    throw Error('Confira a primeira data e o número de parcelas (1 a 36).');
  return Array.from({ length: count }, (_, i) => {
    const end = new Date(Date.UTC(y, m + i, 0));
    return new Date(Date.UTC(y, m - 1 + i, Math.min(d, end.getUTCDate())))
      .toISOString()
      .slice(0, 10);
  });
}
export const dateLabel = (value) =>
  String(value || '')
    .slice(0, 10)
    .split('-')
    .reverse()
    .join('/');
export const monthLabel = (value) =>
  String(value || '')
    .slice(0, 7)
    .split('-')
    .reverse()
    .join('/');
export const paymentMethods = [
  ['pix', 'Pix'],
  ['cash', 'Dinheiro'],
  ['card', 'Cartão'],
  ['boleto', 'Boleto'],
  ['transfer', 'Transferência'],
  ['other', 'Outra'],
];
