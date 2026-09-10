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
  getAgriculturalInputById,
} from '../../services/agriculturalInputService.js';

import {
  getInventoryLotById,
} from '../../services/inventoryLotService.js';

import {
  listInventoryTransactions,
} from '../../services/inventoryTransactionService.js';

import {
  getInventoryLotStatus,
  lotReferenceLabel,
} from './lotView.js';

import {
  inventoryTransactionCard,
} from './inventoryTransactionView.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDatePtBr,
  formatNumberPtBr,
} from '../../js/html.js';

export async function renderInventoryLotDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector('#app');

  let input = null;
  let lot = null;
  let transactions = [];

  try {
    [
      input,
      lot,
    ] = await Promise.all([
      getAgriculturalInputById(
        params.inputId,
      ),
      getInventoryLotById(
        params.lotId,
      ),
    ]);

    if (
      lot &&
      lot.agricultural_input_id ===
        params.inputId
    ) {
      transactions =
        await listInventoryTransactions({
          lotId: lot.id,
          limit: 5,
        });
    }
  } catch (error) {
    console.error(
      'Erro ao carregar lote:',
      error,
    );
  }

  if (
    !input ||
    !lot ||
    lot.agricultural_input_id !==
      input.id
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Lote',
        eyebrow: 'Barracão',
        activeNav: 'inventory',
        content:
          emptyState({
            iconName: 'box',
            title:
              'Lote não encontrado',
            description:
              'Este lote não existe ou não pertence a este insumo.',
            actionLabel:
              'Voltar ao Barracão',
            actionHref:
              '/inventory',
          }),
      });

    return null;
  }

  const status =
    getInventoryLotStatus(lot);

  app.innerHTML =
    appShell({
      session,
      title: 'Lote de estoque',
      eyebrow: 'Barracão',
      activeNav: 'inventory',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/inventory/${input.id}/lots"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Lotes
            </a>
          </div>
        </section>

        <section class="inventory-lot-detail-hero">
          <div>
            <p class="hero-card__eyebrow">
              ${escapeHtml(input.name)}
            </p>

            <h2>
              ${escapeHtml(
                lotReferenceLabel(lot),
              )}
            </h2>

            <p>
              ${escapeHtml(
                lot.supplier ||
                'Fornecedor não informado',
              )}
            </p>
          </div>

          <span
            class="inventory-lot-status ${status.className}"
          >
            ${escapeHtml(status.label)}
          </span>

          <div class="property-detail-actions">
            <a
              href="/inventory/${input.id}/lots/${lot.id}/edit"
              class="button button--secondary"
              data-link
            >
              ${icon('edit')}
              Editar identificação
            </a>

            <a
              href="/inventory/transactions/new?input=${input.id}&lot=${lot.id}"
              class="button button--primary"
              data-link
            >
              ${icon('history')}
              Movimentar estoque
            </a>
          </div>
        </section>

        <section class="inventory-lot-summary-grid">
          <article>
            <span>Saldo do lote</span>
            <strong>
              ${formatNumberPtBr(
                lot.current_quantity ?? 0,
              )}
              ${escapeHtml(lot.unit)}
            </strong>
            <small>
              Calculado pelas movimentações
            </small>
          </article>

          <article>
            <span>Quantidade comprada</span>
            <strong>
              ${formatNumberPtBr(
                lot.purchased_quantity,
              )}
              ${escapeHtml(lot.unit)}
            </strong>
          </article>

          <article>
            <span>Preço total</span>
            <strong>
              ${formatCurrencyBRL(
                lot.total_price,
              )}
            </strong>
          </article>

          <article>
            <span>Preço unitário</span>
            <strong>
              ${formatCurrencyBRL(
                lot.unit_price,
              )}
            </strong>
            <small>
              por ${escapeHtml(lot.unit)}
            </small>
          </article>
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Data da compra
            </p>
            <p class="detail-card__value">
              ${formatDatePtBr(
                lot.purchase_date,
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Validade
            </p>
            <p class="detail-card__value">
              ${formatDatePtBr(
                lot.expiration_date,
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Número do lote
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                lot.batch_number || '-',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Fornecedor
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                lot.supplier || '-',
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
              lot.notes ||
              'Nenhuma observação informada.',
            )}
          </p>
        </article>

        <section class="inventory-related-section">
          <div class="inventory-related-section__header">
            <div>
              <h2>
                Movimentações do lote
              </h2>
              <p>
                O cadastro inicial do lote aparece como uma Entrada automática.
              </p>
            </div>

            <a
              href="/inventory/${input.id}/transactions?lot=${lot.id}"
              class="button button--secondary button--compact"
              data-link
            >
              Ver todas
            </a>
          </div>

          ${
            transactions.length
              ? `
                <div class="stock-transaction-list">
                  ${transactions
                    .map(
                      inventoryTransactionCard,
                    )
                    .join('')}
                </div>
              `
              : emptyState({
                  iconName: 'history',
                  title:
                    'Nenhuma movimentação encontrada',
                  description:
                    'Se este lote foi criado corretamente, a entrada automática deve aparecer após a migration das Etapas 14 e 15.',
                })
          }
        </section>
      `,
    });

  return null;
}
