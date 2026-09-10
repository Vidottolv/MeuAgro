import {
  appShell,
} from '../../components/appShell.js';

import {
  emptyState,
} from '../../components/emptyState.js';

import {
  icon,
} from '../../components/icons.js';

import {
  getHarvestSaleById,
} from '../../services/harvestSaleService.js';

import {
  getHarvestDestinationLabel,
} from '../../constants/harvestDestinations.js';

import {
  getPaymentMethodLabel,
} from '../../constants/paymentMethods.js';

import {
  saleCropTitle,
  saleLocationLabel,
} from './saleView.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDatePtBr,
  formatNumberPtBr,
} from '../../js/html.js';

export async function renderSaleDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let sale = null;

  try {
    sale =
      await getHarvestSaleById(
        params.saleId,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar venda:',
      error,
    );
  }

  if (!sale) {
    app.innerHTML =
      appShell({
        session,
        title: 'Venda',
        eyebrow: 'Comercialização',
        activeNav: 'more',
        content:
          emptyState({
            iconName:
              'cart',
            title:
              'Venda não encontrada',
            description:
              'Este registro não existe ou não pertence à sua conta.',
            actionLabel:
              'Voltar para vendas',
            actionHref:
              '/more/sales',
          }),
      });

    return null;
  }

  const harvest =
    sale.harvest;

  app.innerHTML =
    appShell({
      session,
      title: 'Venda',
      eyebrow: 'Comercialização',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/more/sales"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Vendas
            </a>
          </div>
        </section>

        <section class="sale-detail-hero">
          <div class="sale-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${escapeHtml(
                  saleLocationLabel(
                    sale,
                  ),
                )}
              </p>

              <h2>
                ${escapeHtml(
                  sale.buyer ||
                  'Venda registrada',
                )}
              </h2>

              <p>
                ${escapeHtml(
                  saleCropTitle(
                    sale,
                  ),
                )}
              </p>
            </div>

            <strong class="sale-detail-hero__value">
              ${formatCurrencyBRL(
                sale.total_value,
              )}
            </strong>
          </div>

          <div class="property-detail-actions">
            <a
              href="/more/sales/${sale.id}/edit"
              class="button button--secondary"
              data-link
            >
              ${icon('edit')}
              Editar
            </a>
          </div>
        </section>

        <section class="sale-detail-summary">
          <article>
            <span>Quantidade</span>
            <strong>
              ${formatNumberPtBr(
                sale.quantity,
              )}
              ${escapeHtml(
                sale.unit,
              )}
            </strong>
          </article>

          <article>
            <span>Preço unitário</span>
            <strong>
              ${formatCurrencyBRL(
                sale.unit_price,
              )}
            </strong>
          </article>

          <article>
            <span>Total</span>
            <strong>
              ${formatCurrencyBRL(
                sale.total_value,
              )}
            </strong>
          </article>
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Data da venda
            </p>

            <p class="detail-card__value">
              ${formatDatePtBr(
                sale.sale_date,
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Comprador
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                sale.buyer ||
                'Não informado',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Forma de pagamento
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                getPaymentMethodLabel(
                  sale.payment_method,
                ),
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Destino da colheita
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                getHarvestDestinationLabel(
                  harvest.destination,
                ),
              )}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${escapeHtml(
              sale.notes ||
              'Nenhuma observação informada.',
            )}
          </p>
        </article>

        <section class="harvest-links-card">
          <a
            href="/more/harvests/${harvest.id}"
            class="harvest-link-row"
            data-link
          >
            <span>
              ${icon('harvest')}
              Abrir colheita
            </span>

            ${icon('chevronRight')}
          </a>

          <a
            href="/plantings/${harvest.production_cycle.id}"
            class="harvest-link-row"
            data-link
          >
            <span>
              ${icon('sprout')}
              Abrir ciclo produtivo
            </span>

            ${icon('chevronRight')}
          </a>
        </section>
      `,
    });

  return null;
}
