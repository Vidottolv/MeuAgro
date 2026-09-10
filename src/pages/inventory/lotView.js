import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDatePtBr,
  formatNumberPtBr,
} from '../../js/html.js';

function todayDateString() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(
      now.getMonth() + 1,
    ).padStart(2, '0'),
    String(
      now.getDate(),
    ).padStart(2, '0'),
  ].join('-');
}

export function getInventoryLotStatus(lot) {
  const current =
    Number(
      lot.current_quantity ?? 0,
    );

  if (current <= 0) {
    return {
      label: 'Sem saldo',
      className:
        'inventory-lot-status--empty',
    };
  }

  if (
    lot.expiration_date &&
    lot.expiration_date <
      todayDateString()
  ) {
    return {
      label: 'Vencido',
      className:
        'inventory-lot-status--expired',
    };
  }

  return {
    label: 'Disponível',
    className:
      'inventory-lot-status--available',
  };
}

export function lotReferenceLabel(lot) {
  if (lot.batch_number) {
    return `Lote ${lot.batch_number}`;
  }

  return `Compra de ${formatDatePtBr(
    lot.purchase_date,
  )}`;
}

export function inventoryLotCard(lot) {
  const status =
    getInventoryLotStatus(lot);

  return `
    <article class="inventory-lot-card">
      <a
        href="/inventory/${lot.agricultural_input_id}/lots/${lot.id}"
        class="inventory-lot-card__main"
        data-link
      >
        <div class="inventory-lot-card__top">
          <span class="inventory-lot-card__icon">
            ${icon('box')}
          </span>

          <div class="inventory-lot-card__identity">
            <h3>
              ${escapeHtml(
                lotReferenceLabel(lot),
              )}
            </h3>

            <p>
              ${escapeHtml(
                lot.supplier ||
                'Fornecedor não informado',
              )}
            </p>
          </div>

          ${icon('chevronRight')}
        </div>

        <div class="inventory-lot-card__meta">
          <span
            class="inventory-lot-status ${status.className}"
          >
            ${escapeHtml(
              status.label,
            )}
          </span>

          <span class="inventory-lot-card__balance">
            ${formatNumberPtBr(
              lot.current_quantity ?? 0,
            )}
            ${escapeHtml(lot.unit)}
          </span>
        </div>

        <div class="inventory-lot-card__details">
          <span>
            Compra:
            ${formatNumberPtBr(
              lot.purchased_quantity,
            )}
            ${escapeHtml(lot.unit)}
          </span>

          <span>
            ${formatCurrencyBRL(
              lot.total_price,
            )}
          </span>

          <span>
            ${formatDatePtBr(
              lot.purchase_date,
            )}
          </span>
        </div>
      </a>
    </article>
  `;
}
