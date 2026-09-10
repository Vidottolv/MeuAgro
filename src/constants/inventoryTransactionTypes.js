export const INVENTORY_TRANSACTION_TYPES = [
  ['entry', 'Entrada'],
  ['usage', 'Saída por uso'],
  ['positive_adjustment', 'Ajuste positivo'],
  ['negative_adjustment', 'Ajuste negativo'],
  ['loss', 'Perda'],
  ['expiration', 'Vencimento'],
  ['return', 'Devolução'],
];

export const MANUAL_INVENTORY_TRANSACTION_TYPES = [
  ['positive_adjustment', 'Ajuste positivo'],
  ['negative_adjustment', 'Ajuste negativo'],
  ['loss', 'Perda'],
  ['expiration', 'Vencimento'],
  ['return', 'Devolução'],
];

export const POSITIVE_INVENTORY_TRANSACTION_TYPES = [
  'entry',
  'positive_adjustment',
  'return',
];

export function getInventoryTransactionTypeLabel(type) {
  return (
    INVENTORY_TRANSACTION_TYPES.find(
      ([value]) => value === type,
    )?.[1] ||
    type ||
    'Movimentação'
  );
}

export function getInventoryTransactionSign(type) {
  return POSITIVE_INVENTORY_TRANSACTION_TYPES.includes(type)
    ? 1
    : -1;
}

export function getInventoryTransactionClass(type) {
  return getInventoryTransactionSign(type) > 0
    ? 'stock-transaction--positive'
    : 'stock-transaction--negative';
}

export function getInventoryTransactionIcon(type) {
  switch (type) {
    case 'entry':
    case 'positive_adjustment':
    case 'return':
      return 'arrowUp';

    case 'usage':
    case 'negative_adjustment':
    case 'loss':
    case 'expiration':
      return 'arrowDown';

    default:
      return 'history';
  }
}
