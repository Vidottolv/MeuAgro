import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDatePtBr,
  formatNumberPtBr,
} from '../../js/html.js';

import {
  getPaymentMethodLabel,
} from '../../constants/paymentMethods.js';

export function saleCropTitle(
  sale,
) {
  const cycle =
    sale.harvest
      ?.production_cycle;

  const crop =
    cycle?.crop?.name ||
    'Colheita';

  const variety =
    cycle?.variety
      ? ` • ${cycle.variety}`
      : '';

  return `${crop}${variety}`;
}

export function saleLocationLabel(
  sale,
) {
  const cycle =
    sale.harvest
      ?.production_cycle;

  return [
    cycle?.property?.name,
    cycle?.area?.name,
  ]
    .filter(Boolean)
    .join(' • ') ||
    'Local não informado';
}

export function saleCard(
  sale,
) {
  return `
    <article class="sale-card">
      <a
        href="/more/sales/${sale.id}"
        class="sale-card__main"
        data-link
      >
        <div class="sale-card__top">
          <span class="sale-card__icon">
            ${icon('cart')}
          </span>

          <div class="sale-card__identity">
            <h3>
              ${escapeHtml(
                sale.buyer ||
                'Venda sem comprador informado',
              )}
            </h3>

            <p>
              ${escapeHtml(
                saleCropTitle(
                  sale,
                ),
              )}
              •
              ${escapeHtml(
                saleLocationLabel(
                  sale,
                ),
              )}
            </p>
          </div>

          ${icon('chevronRight')}
        </div>

        <div class="sale-card__metrics">
          <div>
            <span>Data</span>
            <strong>
              ${formatDatePtBr(
                sale.sale_date,
              )}
            </strong>
          </div>

          <div>
            <span>Quantidade</span>
            <strong>
              ${formatNumberPtBr(
                sale.quantity,
              )}
              ${escapeHtml(
                sale.unit,
              )}
            </strong>
          </div>

          <div>
            <span>Preço unitário</span>
            <strong>
              ${formatCurrencyBRL(
                sale.unit_price,
              )}
            </strong>
          </div>

          <div>
            <span>Total</span>
            <strong>
              ${formatCurrencyBRL(
                sale.total_value,
              )}
            </strong>
          </div>
        </div>

        ${
          sale.payment_method
            ? `
              <div class="sale-card__payment">
                ${icon('receipt')}
                ${escapeHtml(
                  getPaymentMethodLabel(
                    sale.payment_method,
                  ),
                )}
              </div>
            `
            : ''
        }
      </a>
    </article>
  `;
}
