import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDateTimePtBr,
  formatNumberPtBr,
} from '../../js/html.js';

import {
  getInventoryTransactionClass,
  getInventoryTransactionIcon,
  getInventoryTransactionSign,
  getInventoryTransactionTypeLabel,
} from '../../constants/inventoryTransactionTypes.js';

export function transactionLotLabel(transaction) {
  const lot =
    transaction.inventory_lot;

  if (!lot) {
    return 'Sem lote';
  }

  if (lot.batch_number) {
    return `Lote ${lot.batch_number}`;
  }

  return `Compra ${lot.purchase_date || ''}`.trim();
}

export function transactionQuantityLabel(transaction) {
  const sign =
    getInventoryTransactionSign(
      transaction.transaction_type,
    );

  return `${
    sign > 0 ? '+' : '-'
  }${formatNumberPtBr(
    transaction.quantity,
  )} ${escapeHtml(
    transaction.unit || '',
  )}`.trim();
}

export function inventoryTransactionCard(transaction) {
  return `
    <article class="stock-transaction-card">
      <a
        href="/inventory/transactions/${transaction.id}"
        class="stock-transaction-card__main"
        data-link
      >
        <span
          class="stock-transaction-card__icon ${getInventoryTransactionClass(
            transaction.transaction_type,
          )}"
        >
          ${icon(
            getInventoryTransactionIcon(
              transaction.transaction_type,
            ),
          )}
        </span>

        <div class="stock-transaction-card__content">
          <div class="stock-transaction-card__title-row">
            <div>
              <h3>
                ${escapeHtml(
                  getInventoryTransactionTypeLabel(
                    transaction.transaction_type,
                  ),
                )}
              </h3>

              <p>
                ${escapeHtml(
                  transaction.agricultural_input?.name ||
                  'Insumo',
                )}
                •
                ${escapeHtml(
                  transactionLotLabel(
                    transaction,
                  ),
                )}
              </p>
            </div>

            <strong
              class="stock-transaction-card__quantity ${getInventoryTransactionClass(
                transaction.transaction_type,
              )}"
            >
              ${transactionQuantityLabel(
                transaction,
              )}
            </strong>
          </div>

          <div class="stock-transaction-card__meta">
            <span>
              ${formatDateTimePtBr(
                transaction.occurred_at,
              )}
            </span>

            ${
              transaction.total_cost !== null
                ? `
                  <span>
                    ${formatCurrencyBRL(
                      transaction.total_cost,
                    )}
                  </span>
                `
                : ''
            }
          </div>
        </div>

        ${icon('chevronRight')}
      </a>
    </article>
  `;
}
