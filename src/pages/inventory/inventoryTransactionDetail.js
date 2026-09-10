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
  getInventoryTransactionById,
} from '../../services/inventoryTransactionService.js';

import {
  getInventoryTransactionClass,
  getInventoryTransactionIcon,
  getInventoryTransactionTypeLabel,
} from '../../constants/inventoryTransactionTypes.js';

import {
  transactionLotLabel,
  transactionQuantityLabel,
} from './inventoryTransactionView.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDateTimePtBr,
} from '../../js/html.js';

export async function renderInventoryTransactionDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector('#app');

  let transaction = null;

  try {
    transaction =
      await getInventoryTransactionById(
        params.transactionId,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar movimentação:',
      error,
    );
  }

  if (!transaction) {
    app.innerHTML =
      appShell({
        session,
        title: 'Movimentação',
        eyebrow: 'Barracão',
        activeNav: 'inventory',
        content:
          emptyState({
            iconName: 'history',
            title:
              'Movimentação não encontrada',
            description:
              'Este registro não existe ou não pertence à sua conta.',
            actionLabel:
              'Voltar às movimentações',
            actionHref:
              '/inventory/transactions',
          }),
      });

    return null;
  }

  const cycle =
    transaction.production_cycle;

  app.innerHTML =
    appShell({
      session,
      title: 'Movimentação',
      eyebrow: 'Barracão',
      activeNav: 'inventory',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/inventory/${transaction.agricultural_input_id}/transactions"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Movimentações
            </a>
          </div>
        </section>

        <section class="stock-transaction-detail-hero">
          <span
            class="stock-transaction-detail-hero__icon ${getInventoryTransactionClass(
              transaction.transaction_type,
            )}"
          >
            ${icon(
              getInventoryTransactionIcon(
                transaction.transaction_type,
              ),
            )}
          </span>

          <div>
            <p class="hero-card__eyebrow">
              ${escapeHtml(
                transaction.agricultural_input?.name ||
                'Insumo',
              )}
            </p>

            <h2>
              ${escapeHtml(
                getInventoryTransactionTypeLabel(
                  transaction.transaction_type,
                ),
              )}
            </h2>

            <p>
              ${formatDateTimePtBr(
                transaction.occurred_at,
              )}
            </p>
          </div>

          <strong
            class="stock-transaction-detail-hero__quantity ${getInventoryTransactionClass(
              transaction.transaction_type,
            )}"
          >
            ${transactionQuantityLabel(
              transaction,
            )}
          </strong>
        </section>

        <div class="input-stage-note">
          ${icon('lock')}
          <div>
            <strong>
              Registro imutável
            </strong>
            <span>
              Esta movimentação não possui ações de editar ou excluir. Se houver divergência, registre uma nova movimentação de ajuste.
            </span>
          </div>
        </div>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Insumo
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                transaction.agricultural_input?.name ||
                '-',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Lote
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                transactionLotLabel(
                  transaction,
                ),
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Custo unitário
            </p>
            <p class="detail-card__value">
              ${formatCurrencyBRL(
                transaction.unit_cost,
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Custo total
            </p>
            <p class="detail-card__value">
              ${formatCurrencyBRL(
                transaction.total_cost,
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Ciclo produtivo
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                cycle
                  ? [
                      cycle.crop?.name,
                      cycle.variety,
                      cycle.area?.name,
                    ]
                      .filter(Boolean)
                      .join(' • ')
                  : 'Sem ciclo relacionado',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Evento produtivo
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                transaction.production_event?.title ||
                'Sem evento relacionado',
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
              transaction.notes ||
              'Nenhuma observação informada.',
            )}
          </p>
        </article>

        <div class="inventory-transaction-detail-actions">
          <a
            href="/inventory/${transaction.agricultural_input_id}"
            class="button button--secondary"
            data-link
          >
            Ver insumo
          </a>

          ${
            transaction.inventory_lot_id
              ? `
                <a
                  href="/inventory/${transaction.agricultural_input_id}/lots/${transaction.inventory_lot_id}"
                  class="button button--secondary"
                  data-link
                >
                  Ver lote
                </a>
              `
              : ''
          }
        </div>
      `,
    });

  return null;
}
