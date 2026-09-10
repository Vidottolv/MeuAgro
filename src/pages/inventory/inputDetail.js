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
  setAgriculturalInputActive,
} from '../../services/agriculturalInputService.js';

import {
  listInventoryLots,
} from '../../services/inventoryLotService.js';

import {
  listInventoryTransactions,
} from '../../services/inventoryTransactionService.js';

import {
  getInputCategoryLabel,
} from '../../constants/inputCategories.js';

import {
  getInputUnitLabel,
} from '../../constants/inputUnits.js';

import {
  currentStockLabel,
  getStockStatusClass,
  getStockStatusLabel,
} from './inputView.js';

import {
  inventoryLotCard,
} from './lotView.js';

import {
  inventoryTransactionCard,
} from './inventoryTransactionView.js';

import {
  escapeHtml,
  formatDatePtBr,
  formatNumberPtBr,
} from '../../js/html.js';

import {
  showConfirmModal,
} from '../../components/confirmModal.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

import {
  navigate,
} from '../../js/router.js';

import {
  showRestockConsultantModal,
} from '../../components/restockConsultantModal.js';

export async function renderInputDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector('#app');

  let input = null;
  let lots = [];
  let transactions = [];

  try {
    input =
      await getAgriculturalInputById(
        params.inputId,
      );

    if (input) {
      [
        lots,
        transactions,
      ] = await Promise.all([
        listInventoryLots({
          inputId: input.id,
          limit: 3,
        }),
        listInventoryTransactions({
          inputId: input.id,
          limit: 4,
        }),
      ]);
    }
  } catch (error) {
    console.error(
      'Erro ao carregar insumo:',
      error,
    );
  }

  if (!input) {
    app.innerHTML =
      appShell({
        session,
        title: 'Insumo',
        eyebrow: 'Barracão',
        activeNav: 'inventory',
        content:
          emptyState({
            iconName: 'box',
            title:
              'Insumo não encontrado',
            description:
              'Este registro não existe ou não pertence à sua conta.',
            actionLabel:
              'Voltar para o Barracão',
            actionHref:
              '/inventory',
          }),
      });

    return null;
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Insumo',
      eyebrow: 'Barracão',
      activeNav: 'inventory',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/inventory"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Barracão
            </a>
          </div>
        </section>

        <section class="input-detail-hero">
          <div class="input-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${escapeHtml(
                  getInputCategoryLabel(
                    input.category,
                  ),
                )}
              </p>

              <h2>
                ${escapeHtml(input.name)}
              </h2>

              <p>
                ${escapeHtml(
                  input.brand ||
                  'Sem marca informada',
                )}
              </p>
            </div>

            <span
              class="input-stock ${getStockStatusClass(
                input.stock_status,
              )}"
            >
              ${escapeHtml(
                getStockStatusLabel(
                  input.stock_status,
                ),
              )}
            </span>
          </div>

          <div class="property-detail-actions">
            <a
              href="/inventory/${input.id}/edit"
              class="button button--secondary"
              data-link
            >
              ${icon('edit')}
              Editar
            </a>

            <button
              id="toggle-input-active"
              class="button ${
                input.active
                  ? 'button--danger'
                  : 'button--secondary'
              }"
              type="button"
            >
              ${
                input.active
                  ? icon('archive')
                  : icon('refresh')
              }
              ${
                input.active
                  ? 'Desativar'
                  : 'Reativar'
              }
            </button>
          </div>
        </section>

        <section class="input-stock-summary">
          <div class="input-stock-summary__main">
            <span>Saldo atual</span>
            <strong>
              ${escapeHtml(
                currentStockLabel(input),
              )}
            </strong>
            <small>
              Calculado pelas movimentações
            </small>
          </div>

          <div>
            <span>Estoque mínimo</span>
            <strong>
              ${formatNumberPtBr(
                input.minimum_stock,
              )}
            </strong>
            <small>
              ${escapeHtml(
                input.base_unit,
              )}
            </small>
          </div>

          <div>
            <span>Estoque ideal</span>
            <strong>
              ${
                input.ideal_stock === null
                  ? '-'
                  : formatNumberPtBr(
                      input.ideal_stock,
                    )
              }
            </strong>
            <small>
              ${escapeHtml(
                input.base_unit,
              )}
            </small>
          </div>
        </section>

        ${
          input.active &&
          Number(
            input.current_quantity,
          ) <= 0 &&
          transactions.length > 0
            ? `
              <section class="stock-restock-alert">
                <div class="stock-restock-alert__content">
                  ${icon('alertTriangle')}

                  <div>
                    <strong>
                      Seu estoque de ${escapeHtml(
                        input.name,
                      )} acabou.
                    </strong>

                    <p>
                      Você pode abrir o WhatsApp de um consultor para solicitar preço e disponibilidade.
                    </p>
                  </div>
                </div>

                <button
                  id="request-restock"
                  class="button button--whatsapp"
                  type="button"
                >
                  ${icon('messageCircle')}
                  Solicitar reposição
                </button>
              </section>
            `
            : ''
        }

        <section class="inventory-hub-actions">
          <a
            href="/inventory/${input.id}/lots"
            class="inventory-hub-action"
            data-link
          >
            <span class="inventory-hub-action__icon">
              ${icon('box')}
            </span>
            <span class="inventory-hub-action__content">
              <strong>
                Lotes de estoque
              </strong>
              <span>
                ${lots.length} ${
                  lots.length === 1
                    ? 'lote recente carregado'
                    : 'lotes recentes carregados'
                }
              </span>
            </span>
            ${icon('chevronRight')}
          </a>

          <a
            href="/inventory/${input.id}/transactions"
            class="inventory-hub-action"
            data-link
          >
            <span class="inventory-hub-action__icon">
              ${icon('history')}
            </span>
            <span class="inventory-hub-action__content">
              <strong>
                Movimentações
              </strong>
              <span>
                Entradas, ajustes, perdas, vencimentos e devoluções
              </span>
            </span>
            ${icon('chevronRight')}
          </a>
        </section>

        <div class="property-detail-actions" style="margin-bottom: 14px;">
          ${
            input.active
              ? `
                <a
                  href="/inventory/${input.id}/lots/new"
                  class="button button--primary"
                  data-link
                >
                  ${icon('plus')}
                  Novo lote
                </a>
              `
              : ''
          }

          <a
            href="/inventory/transactions/new?input=${input.id}"
            class="button button--secondary"
            data-link
          >
            ${icon('history')}
            Nova movimentação
          </a>
        </div>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Categoria
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                getInputCategoryLabel(
                  input.category,
                ),
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Unidade principal
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                getInputUnitLabel(
                  input.base_unit,
                ),
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Situação
            </p>
            <p class="detail-card__value">
              ${
                input.active
                  ? 'Ativo'
                  : 'Inativo'
              }
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Cadastrado em
            </p>
            <p class="detail-card__value">
              ${formatDatePtBr(
                input.created_at,
              )}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Descrição
          </p>
          <p class="detail-card__value detail-card__value--soft">
            ${escapeHtml(
              input.description ||
              'Nenhuma descrição informada.',
            )}
          </p>
        </article>

        <article class="detail-card" style="margin-top: 12px;">
          <p class="detail-card__label">
            Observações
          </p>
          <p class="detail-card__value detail-card__value--soft">
            ${escapeHtml(
              input.notes ||
              'Nenhuma observação informada.',
            )}
          </p>
        </article>

        <section class="inventory-related-section">
          <div class="inventory-related-section__header">
            <div>
              <h2>Lotes recentes</h2>
              <p>
                Compras separadas com saldo e custo próprios.
              </p>
            </div>

            <a
              href="/inventory/${input.id}/lots"
              class="button button--secondary button--compact"
              data-link
            >
              Ver todos
            </a>
          </div>

          ${
            lots.length
              ? `
                <div class="inventory-lot-list">
                  ${lots
                    .map(inventoryLotCard)
                    .join('')}
                </div>
              `
              : emptyState({
                  iconName: 'box',
                  title:
                    'Nenhum lote cadastrado',
                  description:
                    'Cadastre uma compra para gerar a primeira entrada automática de estoque.',
                  actionLabel:
                    input.active
                      ? 'Cadastrar lote'
                      : null,
                  actionHref:
                    input.active
                      ? `/inventory/${input.id}/lots/new`
                      : null,
                })
          }
        </section>

        <section class="inventory-related-section">
          <div class="inventory-related-section__header">
            <div>
              <h2>
                Movimentações recentes
              </h2>
              <p>
                Histórico que compõe o saldo atual.
              </p>
            </div>

            <a
              href="/inventory/${input.id}/transactions"
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
                    'Nenhuma movimentação',
                  description:
                    'O cadastro de um lote criará automaticamente a primeira entrada.',
                })
          }
        </section>
      `,
    });

  const toggleButton =
    document.querySelector(
      '#toggle-input-active',
    );

  const restockButton =
    document.querySelector(
      '#request-restock',
    );

  const handleRestock =
    async () => {
      await showRestockConsultantModal({
        inputName:
          input.name,
      });
    };

  const handleToggle =
    async () => {
      const nextActive =
        !input.active;

      const confirmed =
        await showConfirmModal({
          title:
            nextActive
              ? 'Reativar insumo?'
              : 'Desativar insumo?',
          message:
            nextActive
              ? 'O insumo voltará a aceitar novos lotes.'
              : 'O histórico, lotes e movimentações serão preservados. Novos lotes ficarão bloqueados até a reativação.',
          confirmLabel:
            nextActive
              ? 'Reativar'
              : 'Desativar',
          danger:
            !nextActive,
        });

      if (!confirmed) {
        return;
      }

      toggleButton.disabled = true;

      try {
        await setAgriculturalInputActive(
          input.id,
          nextActive,
        );

        showToast(
          nextActive
            ? 'Insumo reativado.'
            : 'Insumo desativado.',
          {
            type: 'success',
          },
        );

        navigate(
          `/inventory/${input.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao alterar insumo:',
          error,
        );

        showToast(
          getDataErrorMessage(error),
          {
            type: 'error',
          },
        );

        toggleButton.disabled = false;
      }
    };

  toggleButton?.addEventListener(
    'click',
    handleToggle,
  );

  restockButton?.addEventListener(
    'click',
    handleRestock,
  );

  if (
    restockButton &&
    Number(
      input.current_quantity,
    ) <= 0
  ) {
    const storageKey =
      `meu-agro-restock-shown:${input.id}`;

    if (
      !sessionStorage.getItem(
        storageKey,
      )
    ) {
      sessionStorage.setItem(
        storageKey,
        '1',
      );

      window.setTimeout(
        () => {
          void handleRestock();
        },
        250,
      );
    }
  }

  return () => {
    toggleButton?.removeEventListener(
      'click',
      handleToggle,
    );

    restockButton?.removeEventListener(
      'click',
      handleRestock,
    );
  };
}
