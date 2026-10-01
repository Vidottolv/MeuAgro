export const when = (v) => new Date(v).toLocaleString('pt-BR');
export const packaging = (i) =>
  `${i.package_name} • ${Number(i.package_size).toLocaleString('pt-BR')} ${i.base_unit}`;
export const availability = {
  available: 'Disponível',
  on_request: 'Sob consulta',
  unavailable: 'Indisponível',
};
export const deliveryStates = {
  confirmed: 'Aguardando entrega',
  awaiting_receipt: 'Aguardando confirmação do produtor',
  delivery_issue: 'Problema na entrega',
  received: 'Recebido e adicionado ao barracão',
};
export const terminal = ['ordered', 'declined', 'cancelled', 'rejected'];
export const stockUnit = (u) => ({ kg: 'kg', L: 'l', un: 'unit' })[u];
export const field = (name, label, value = '', extra = {}) => ({ name, label, value, ...extra });
export const text = (name, label, value = '', max = 2000) =>
  field(name, label, value, { type: 'textarea', maxlength: max });
export const select = (name, label, options, value = '') =>
  field(name, label, value, {
    type: 'select',
    options: options.map(([value, label]) => ({ value, label })),
  });
export const number = (name, label, value = '', extra = {}) =>
  field(name, label, value, { type: 'number', min: 0, max: 1000000000, step: 0.01, ...extra });
export function commandPayload(action, values) {
  const data = { ...values };
  const prefix =
    action === 'create_request'
      ? 'qty_'
      : action === 'send_quote'
        ? 'price_'
        : action === 'confirm_receipt'
          ? 'input_'
          : null;
  if (prefix) {
    data.items = Object.entries(data)
      .filter(([k, v]) => k.startsWith(prefix) && (action !== 'create_request' || Number(v) > 0))
      .map(([k, v]) =>
        action === 'create_request'
          ? { product_id: k.slice(4), quantity: Number(v) }
          : action === 'send_quote'
            ? { product_id: k.slice(6), unit_price: Number(v) }
            : { product_id: k.slice(6), input_id: v },
      );
    for (const k of Object.keys(data)) if (k.startsWith(prefix)) delete data[k];
    if (action === 'create_request' && !data.items.length)
      throw Error('Escolha ao menos um produto com quantidade maior que zero.');
  }
  if (action === 'send_quote') {
    const date = new Date(data.valid_until);
    if (!Number.isFinite(date.getTime())) throw Error('Informe uma validade válida.');
    data.valid_until = date.toISOString();
  }
  if (data.token) data.token = data.token.trim();
  return data;
}
