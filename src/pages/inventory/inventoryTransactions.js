import {
  appShell,
} from '../../components/appShell.js';

import {
  emptyState,
} from '../../components/emptyState.js';

import {
  loader,
} from '../../components/loader.js';

import {
  icon,
} from '../../components/icons.js';

import {
  listAgriculturalInputs,
  getAgriculturalInputById,
} from '../../services/agriculturalInputService.js';

import {
  listInventoryTransactions,
} from '../../services/inventoryTransactionService.js';

import {
  INVENTORY_TRANSACTION_TYPES,
} from '../../constants/inventoryTransactionTypes.js';

import {
  inventoryTransactionCard,
} from './inventoryTransactionView.js';

import {
  escapeHtml,
} from '../../js/html.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

function inputOptions(
  inputs,
  selected,
) {
  return `
    <option value="">
      Todos os insumos
    </option>

    ${inputs
      .map(
        (input) => `
          <option
            value="${input.id}"
            ${
              selected === input.id
                ? 'selected'
                : ''
            }
          >
            ${escapeHtml(
              input.name,
            )}${
              input.active
                ? ''
                : ' • inativo'
            }
          </option>
        `,
      )
      .join('')}
  `;
}

function typeOptions(selected) {
  return `
    <option value="">
      Todos os tipos
    </option>

    ${INVENTORY_TRANSACTION_TYPES
      .map(
        ([value, label]) => `
          <option
            value="${value}"
            ${
              selected === value
                ? 'selected'
                : ''
            }
          >
            ${label}
          </option>
        `,
      )
      .join('')}
  `;
}

export async function renderInventoryTransactionsPage({
  session,
  params = {},
}) {
  const app =
    document.querySelector('#app');

  const fixedInputId =
    params.inputId || null;

  let fixedInput = null;
  let inputs = [];

  try {
    inputs =
      await listAgriculturalInputs();

    if (fixedInputId) {
      fixedInput =
        await getAgriculturalInputById(
          fixedInputId,
        );
    }
  } catch (error) {
    console.error(
      'Erro ao preparar movimentações:',
      error,
    );
  }

  if (
    fixedInputId &&
    !fixedInput
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Movimentações',
        eyebrow: 'Barracão',
        activeNav: 'inventory',
        content:
          emptyState({
            iconName: 'history',
            title:
              'Insumo não encontrado',
            description:
              'Não foi possível localizar o insumo solicitado.',
            actionLabel:
              'Voltar ao Barracão',
            actionHref:
              '/inventory',
          }),
      });

    return null;
  }

  const query =
    new URLSearchParams(
      window.location.search,
    );

  let inputFilter =
    fixedInputId ||
    query.get('input') ||
    '';

  let typeFilter =
    query.get('type') ||
    '';

  const lotFilter =
    query.get('lot') ||
    '';

  app.innerHTML =
    appShell({
      session,
      title: 'Movimentações',
      eyebrow: 'Barracão',
      activeNav: 'inventory',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                fixedInput
                  ? `/inventory/${fixedInput.id}`
                  : '/inventory'
              }"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              ${
                fixedInput
                  ? escapeHtml(
                      fixedInput.name,
                    )
                  : 'Barracão'
              }
            </a>

            <h2 style="margin-top: 10px;">
              ${
                fixedInput
                  ? `Movimentações de ${escapeHtml(
                      fixedInput.name,
                    )}`
                  : 'Histórico de movimentações'
              }
            </h2>

            <p>
              Toda entrada, saída, ajuste, perda, vencimento ou devolução fica registrada no histórico.
            </p>
          </div>

          <a
            href="/inventory/transactions/new${
              inputFilter
                ? `?input=${encodeURIComponent(
                    inputFilter,
                  )}${
                    lotFilter
                      ? `&lot=${encodeURIComponent(
                          lotFilter,
                        )}`
                      : ''
                  }`
                : ''
            }"
            class="icon-button"
            aria-label="Nova movimentação"
            data-link
          >
            ${icon('plus')}
          </a>
        </section>

        <div class="input-stage-note">
          ${icon('lock')}
          <div>
            <strong>
              Histórico auditável
            </strong>
            <span>
              Movimentações não são editadas nem apagadas pelo frontend. Correções são feitas com uma nova movimentação de ajuste.
            </span>
          </div>
        </div>

        <section class="stock-transaction-filters">
          ${
            fixedInput
              ? ''
              : `
                <div class="field">
                  <label
                    for="transaction-input-filter"
                  >
                    Insumo
                  </label>

                  <select
                    id="transaction-input-filter"
                  >
                    ${inputOptions(
                      inputs,
                      inputFilter,
                    )}
                  </select>
                </div>
              `
          }

          <div class="field">
            <label
              for="transaction-type-filter"
            >
              Tipo
            </label>

            <select
              id="transaction-type-filter"
            >
              ${typeOptions(
                typeFilter,
              )}
            </select>
          </div>
        </section>

        <div class="season-list-actions">
          <a
            href="/inventory/transactions/new${
              inputFilter
                ? `?input=${encodeURIComponent(
                    inputFilter,
                  )}${
                    lotFilter
                      ? `&lot=${encodeURIComponent(
                          lotFilter,
                        )}`
                      : ''
                  }`
                : ''
            }"
            class="button button--primary button--compact"
            data-link
          >
            ${icon('plus')}
            Nova movimentação
          </a>
        </div>

        <div id="stock-transactions-content">
          ${loader({
            label:
              'Carregando movimentações…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#stock-transactions-content',
    );

  const inputSelect =
    document.querySelector(
      '#transaction-input-filter',
    );

  const typeSelect =
    document.querySelector(
      '#transaction-type-filter',
    );

  let disposed = false;

  function syncUrl() {
    const params =
      new URLSearchParams();

    if (
      inputFilter &&
      !fixedInput
    ) {
      params.set(
        'input',
        inputFilter,
      );
    }

    if (typeFilter) {
      params.set(
        'type',
        typeFilter,
      );
    }

    if (lotFilter) {
      params.set(
        'lot',
        lotFilter,
      );
    }

    const base =
      fixedInput
        ? `/inventory/${fixedInput.id}/transactions`
        : '/inventory/transactions';

    const value =
      params.toString();

    window.history.replaceState(
      {},
      '',
      value
        ? `${base}?${value}`
        : base,
    );
  }

  async function loadTransactions() {
    content.innerHTML =
      loader({
        label:
          'Carregando movimentações…',
      });

    try {
      const transactions =
        await listInventoryTransactions({
          inputId:
            inputFilter || null,
          lotId:
            lotFilter || null,
          type:
            typeFilter || null,
        });

      if (disposed) {
        return;
      }

      if (!transactions.length) {
        content.innerHTML =
          emptyState({
            iconName: 'history',
            title:
              'Nenhuma movimentação encontrada',
            description:
              lotFilter
                ? 'Este lote ainda não possui movimentações compatíveis com o filtro.'
                : 'Cadastre um lote para gerar uma entrada automática ou registre um ajuste, perda, vencimento ou devolução.',
            actionLabel:
              'Nova movimentação',
            actionHref:
              `/inventory/transactions/new${
                inputFilter
                  ? `?input=${encodeURIComponent(
                      inputFilter,
                    )}${
                      lotFilter
                        ? `&lot=${encodeURIComponent(
                            lotFilter,
                          )}`
                        : ''
                    }`
                  : ''
              }`,
          });
        return;
      }

      content.innerHTML = `
        <section class="stock-transaction-list">
          ${transactions
            .map(
              inventoryTransactionCard,
            )
            .join('')}
        </section>
      `;
    } catch (error) {
      console.error(
        'Erro ao listar movimentações:',
        error,
      );

      content.innerHTML =
        emptyState({
          iconName: 'history',
          title:
            'Não foi possível carregar as movimentações',
          description:
            'Verifique sua conexão e tente novamente.',
        });

      showToast(
        getDataErrorMessage(error),
        {
          type: 'error',
        },
      );
    }
  }

  const handleFilters =
    () => {
      if (inputSelect) {
        inputFilter =
          inputSelect.value;
      }

      typeFilter =
        typeSelect.value;

      syncUrl();
      void loadTransactions();
    };

  inputSelect?.addEventListener(
    'change',
    handleFilters,
  );

  typeSelect.addEventListener(
    'change',
    handleFilters,
  );

  await loadTransactions();

  return () => {
    disposed = true;

    inputSelect?.removeEventListener(
      'change',
      handleFilters,
    );

    typeSelect.removeEventListener(
      'change',
      handleFilters,
    );
  };
}
