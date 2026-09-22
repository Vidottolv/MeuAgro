export const PAYMENT_METHODS = [
  ['cash', 'Dinheiro'],
  ['pix', 'Pix'],
  ['bank_transfer', 'Transferência bancária'],
  ['boleto', 'Boleto'],
  ['card', 'Cartão'],
  ['installments', 'Venda a prazo'],
  ['other', 'Outro'],
];

export function getPaymentMethodLabel(
  value,
) {
  return (
    PAYMENT_METHODS.find(
      ([key]) =>
        key === value,
    )?.[1] ||
    value ||
    'Não informado'
  );
}
