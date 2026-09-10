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
  setButtonLoading,
  setFormMessage,
} from '../../components/formHelpers.js';

import {
  getAgriculturalInputById,
  listAgriculturalInputs,
} from '../../services/agriculturalInputService.js';

import {
  listInventoryLots,
} from '../../services/inventoryLotService.js';

import {
  createManualInventoryTransaction,
} from '../../services/inventoryTransactionService.js';

import {
  listProductionCycles,
} from '../../services/productionCycleService.js';

import {
  listProductionEvents,
} from '../../services/productionEventService.js';

import {
  MANUAL_INVENTORY_TRANSACTION_TYPES,
  getInventoryTransactionSign,
} from '../../constants/inventoryTransactionTypes.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatNumberPtBr,
  toDateTimeLocalValue,
  dateTimeLocalToIso,
} from '../../js/html.js';

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

function inputOptions(
  inputs,
  selected,
) {
  return `
    <option value="">
      Selecione
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
  return MANUAL_INVENTORY_TRANSACTION_TYPES
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
    .join('');
}

function cycleLabel(cycle) {
  const crop =
    cycle.crop?.name ||
    'Ciclo';

  return [
    crop,
    cycle.variety,
    cycle.area?.name,
    cycle.property?.name,
  ]
    .filter(Boolean)
    .join(' • ');
}

export async function renderInventoryTransactionFormPage({
  session,
}) {
  const app =
    document.querySelector('#app');

  let inputs = [];
  let cycles = [];

  try {
    [
      inputs,
      cycles,
    ] = await Promise.all([
      listAgriculturalInputs(),
      listProductionCycles({
        archived: false,
      }),
    ]);
  } catch (error) {
    console.error(
      'Erro ao preparar movimentação:',
      error,
    );
  }

  if (!inputs.length) {
    app.innerHTML =
      appShell({
        session,
        title: 'Movimentação',
        eyebrow: 'Barracão',
        activeNav: 'inventory',
        content:
          emptyState({
            iconName: 'box',
            title:
              'Cadastre um insumo primeiro',
            description:
              'É necessário possuir um insumo e um lote para registrar movimentações manuais.',
            actionLabel:
              'Cadastrar insumo',
            actionHref:
              '/inventory/new',
          }),
      });

    return null;
  }

  const query =
    new URLSearchParams(
      window.location.search,
    );

  let selectedInputId =
    query.get('input') ||
    '';

  let selectedLotId =
    query.get('lot') ||
    '';

  if (
    selectedInputId &&
    !inputs.some(
      (input) =>
        input.id ===
        selectedInputId,
    )
  ) {
    selectedInputId = '';
    selectedLotId = '';
  }

  let lots = [];

  if (selectedInputId) {
    try {
      lots =
        await listInventoryLots({
          inputId:
            selectedInputId,
        });
    } catch (error) {
      console.error(
        'Erro ao carregar lotes:',
        error,
      );
    }
  }

  if (
    selectedLotId &&
    !lots.some(
      (lot) =>
        lot.id === selectedLotId,
    )
  ) {
    selectedLotId = '';
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Nova movimentação',
      eyebrow: 'Barracão',
      activeNav: 'inventory',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                selectedInputId
                  ? `/inventory/${selectedInputId}/transactions`
                  : '/inventory/transactions'
              }"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Movimentações
            </a>

            <h2 style="margin-top: 10px;">
              Registrar movimentação
            </h2>

            <p>
              Ajustes e baixas alteram o saldo somente através deste histórico.
            </p>
          </div>
        </section>

        <div class="input-stage-note">
          ${icon('info')}
          <div>
            <strong>
              Entrada e saída por uso são automáticas
            </strong>
            <span>
              Entrada é criada ao cadastrar um lote. Saída por uso será criada na Etapa 16 quando um insumo for utilizado em um evento produtivo.
            </span>
          </div>
        </div>

        <div
          id="transaction-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="transaction-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>Movimentação</h2>
              <p>
                Selecione o insumo, lote e o tipo de alteração.
              </p>
            </div>

            <div class="field">
              <label
                for="transaction-input"
              >
                Insumo *
              </label>

              <select
                id="transaction-input"
                name="inputId"
                required
              >
                ${inputOptions(
                  inputs,
                  selectedInputId,
                )}
              </select>
            </div>

            <div class="field">
              <label
                for="transaction-lot"
              >
                Lote *
              </label>

              <select
                id="transaction-lot"
                name="lotId"
                required
                ${
                  selectedInputId
                    ? ''
                    : 'disabled'
                }
              ></select>

              <small
                id="transaction-lot-hint"
                class="field__hint"
              ></small>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="transaction-type"
                >
                  Tipo *
                </label>

                <select
                  id="transaction-type"
                  name="transactionType"
                  required
                >
                  ${typeOptions(
                    'negative_adjustment',
                  )}
                </select>
              </div>

              <div class="field">
                <label
                  for="transaction-quantity"
                >
                  Quantidade *
                </label>

                <input
                  id="transaction-quantity"
                  name="quantity"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 2.5"
                  required
                />
              </div>
            </div>

            <div class="stock-transaction-preview">
              <div>
                <span>
                  Efeito no saldo
                </span>
                <strong
                  id="transaction-effect-preview"
                >
                  -
                </strong>
              </div>

              <div>
                <span>
                  Custo estimado
                </span>
                <strong
                  id="transaction-cost-preview"
                >
                  -
                </strong>
              </div>
            </div>

            <div class="field">
              <label
                for="transaction-occurred-at"
              >
                Data e horário *
              </label>

              <input
                id="transaction-occurred-at"
                name="occurredAt"
                type="datetime-local"
                value="${toDateTimeLocalValue()}"
                required
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Relação com produção</h2>
              <p>
                Opcional. Vincule a movimentação a um ciclo e, se houver, a um evento específico.
              </p>
            </div>

            <div class="field">
              <label
                for="transaction-cycle"
              >
                Ciclo produtivo
              </label>

              <select
                id="transaction-cycle"
                name="productionCycleId"
              >
                <option value="">
                  Sem ciclo relacionado
                </option>

                ${cycles
                  .map(
                    (cycle) => `
                      <option
                        value="${cycle.id}"
                      >
                        ${escapeHtml(
                          cycleLabel(cycle),
                        )}
                      </option>
                    `,
                  )
                  .join('')}
              </select>
            </div>

            <div class="field">
              <label
                for="transaction-event"
              >
                Evento produtivo
              </label>

              <select
                id="transaction-event"
                name="productionEventId"
                disabled
              >
                <option value="">
                  Selecione um ciclo primeiro
                </option>
              </select>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Observações</h2>
              <p>
                Explique o motivo do ajuste, perda, vencimento ou devolução.
              </p>
            </div>

            <div class="field">
              <label
                for="transaction-notes"
              >
                Observações
              </label>

              <textarea
                id="transaction-notes"
                name="notes"
                maxlength="1500"
                placeholder="Ex.: ajuste após conferência física do barracão..."
              ></textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                selectedInputId
                  ? `/inventory/${selectedInputId}/transactions`
                  : '/inventory/transactions'
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="transaction-submit"
              class="button button--primary"
              type="submit"
            >
              Registrar movimentação
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#transaction-form',
    );

  const feedback =
    document.querySelector(
      '#transaction-form-feedback',
    );

  const submit =
    document.querySelector(
      '#transaction-submit',
    );

  const inputSelect =
    document.querySelector(
      '#transaction-input',
    );

  const lotSelect =
    document.querySelector(
      '#transaction-lot',
    );

  const lotHint =
    document.querySelector(
      '#transaction-lot-hint',
    );

  const typeSelect =
    document.querySelector(
      '#transaction-type',
    );

  const quantityInput =
    document.querySelector(
      '#transaction-quantity',
    );

  const effectPreview =
    document.querySelector(
      '#transaction-effect-preview',
    );

  const costPreview =
    document.querySelector(
      '#transaction-cost-preview',
    );

  const cycleSelect =
    document.querySelector(
      '#transaction-cycle',
    );

  const eventSelect =
    document.querySelector(
      '#transaction-event',
    );

  let currentLots = lots;

  function selectedLot() {
    return currentLots.find(
      (lot) =>
        lot.id === lotSelect.value,
    );
  }

  function renderLotOptions() {
    const selected =
      selectedLotId;

    lotSelect.innerHTML = `
      <option value="">
        ${
          currentLots.length
            ? 'Selecione'
            : 'Nenhum lote disponível'
        }
      </option>

      ${currentLots
        .map(
          (lot) => `
            <option
              value="${lot.id}"
              ${
                selected === lot.id
                  ? 'selected'
                  : ''
              }
            >
              ${escapeHtml(
                lot.batch_number
                  ? `Lote ${lot.batch_number}`
                  : `Compra ${lot.purchase_date}`,
              )}
              • saldo ${formatNumberPtBr(
                lot.current_quantity ?? 0,
              )} ${escapeHtml(lot.unit)}
            </option>
          `,
        )
        .join('')}
    `;

    lotSelect.disabled =
      !inputSelect.value;

    selectedLotId =
      lotSelect.value;

    refreshLotHint();
    refreshPreview();
  }

  function refreshLotHint() {
    const lot =
      selectedLot();

    if (!lot) {
      lotHint.textContent =
        inputSelect.value &&
        !currentLots.length
          ? 'Este insumo ainda não possui lotes. Cadastre uma compra antes de movimentar o estoque.'
          : '';
      return;
    }

    lotHint.textContent =
      `Saldo disponível: ${formatNumberPtBr(
        lot.current_quantity ?? 0,
      )} ${lot.unit}. Custo do lote: ${formatCurrencyBRL(
        lot.unit_price,
      )} / ${lot.unit}.`;
  }

  function refreshPreview() {
    const lot =
      selectedLot();

    const quantity =
      Number(
        quantityInput.value,
      );

    if (
      !lot ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      effectPreview.textContent =
        '-';
      costPreview.textContent =
        '-';
      return;
    }

    const sign =
      getInventoryTransactionSign(
        typeSelect.value,
      );

    effectPreview.textContent =
      `${sign > 0 ? '+' : '-'}${formatNumberPtBr(
        quantity,
      )} ${lot.unit}`;

    costPreview.textContent =
      lot.unit_price === null
        ? '-'
        : formatCurrencyBRL(
            quantity *
            Number(
              lot.unit_price,
            ),
          );
  }

  async function loadLotsForInput() {
    selectedInputId =
      inputSelect.value;

    selectedLotId = '';

    if (!selectedInputId) {
      currentLots = [];
      renderLotOptions();
      return;
    }

    try {
      currentLots =
        await listInventoryLots({
          inputId:
            selectedInputId,
        });

      renderLotOptions();
    } catch (error) {
      console.error(
        'Erro ao carregar lotes:',
        error,
      );

      showToast(
        getDataErrorMessage(error),
        {
          type: 'error',
        },
      );
    }
  }

  async function loadEventsForCycle() {
    const cycleId =
      cycleSelect.value;

    if (!cycleId) {
      eventSelect.disabled = true;
      eventSelect.innerHTML = `
        <option value="">
          Selecione um ciclo primeiro
        </option>
      `;
      return;
    }

    eventSelect.disabled = true;
    eventSelect.innerHTML = `
      <option value="">
        Carregando eventos...
      </option>
    `;

    try {
      const events =
        await listProductionEvents(
          cycleId,
        );

      eventSelect.innerHTML = `
        <option value="">
          Sem evento específico
        </option>

        ${events
          .map(
            (event) => `
              <option
                value="${event.id}"
              >
                ${escapeHtml(
                  event.title,
                )}
              </option>
            `,
          )
          .join('')}
      `;

      eventSelect.disabled = false;
    } catch (error) {
      console.error(
        'Erro ao carregar eventos:',
        error,
      );

      eventSelect.innerHTML = `
        <option value="">
          Não foi possível carregar
        </option>
      `;
    }
  }

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setFormMessage(
        feedback,
        '',
      );

      const formData =
        new FormData(form);

      const lot =
        selectedLot();

      const quantity =
        Number(
          formData.get(
            'quantity',
          ),
        );

      const transactionType =
        String(
          formData.get(
            'transactionType',
          ) || '',
        );

      if (!inputSelect.value) {
        setFormMessage(
          feedback,
          'Selecione o insumo.',
        );
        return;
      }

      if (!lot) {
        setFormMessage(
          feedback,
          'Selecione um lote.',
        );
        return;
      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        setFormMessage(
          feedback,
          'Informe uma quantidade maior que zero.',
        );
        return;
      }

      if (
        getInventoryTransactionSign(
          transactionType,
        ) < 0 &&
        quantity >
          Number(
            lot.current_quantity ?? 0,
          )
      ) {
        setFormMessage(
          feedback,
          `Saldo insuficiente no lote. Disponível: ${formatNumberPtBr(
            lot.current_quantity ?? 0,
          )} ${lot.unit}.`,
        );
        return;
      }

      const occurredAt =
        dateTimeLocalToIso(
          String(
            formData.get(
              'occurredAt',
            ) || '',
          ),
        );

      if (!occurredAt) {
        setFormMessage(
          feedback,
          'Informe uma data e horário válidos.',
        );
        return;
      }

      setButtonLoading(
        submit,
        true,
        'Registrando…',
      );

      try {
        const saved =
          await createManualInventoryTransaction({
            inputId:
              inputSelect.value,
            lotId:
              lot.id,
            transactionType,
            quantity,
            productionCycleId:
              String(
                formData.get(
                  'productionCycleId',
                ) || '',
              ),
            productionEventId:
              String(
                formData.get(
                  'productionEventId',
                ) || '',
              ),
            occurredAt,
            notes:
              String(
                formData.get(
                  'notes',
                ) || '',
              ).trim(),
          });

        showToast(
          'Movimentação registrada. O saldo foi recalculado.',
          {
            type: 'success',
          },
        );

        const updatedInput =
          await getAgriculturalInputById(
            inputSelect.value,
          );

        if (
          updatedInput &&
          Number(
            updatedInput.current_quantity,
          ) <= 0 &&
          getInventoryTransactionSign(
            transactionType,
          ) < 0
        ) {
          await showRestockConsultantModal({
            inputName:
              updatedInput.name,
          });
        }

        navigate(
          `/inventory/transactions/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao registrar movimentação:',
          error,
        );

        setFormMessage(
          feedback,
          getDataErrorMessage(error),
        );
      } finally {
        setButtonLoading(
          submit,
          false,
        );
      }
    };

  inputSelect.addEventListener(
    'change',
    loadLotsForInput,
  );

  lotSelect.addEventListener(
    'change',
    () => {
      selectedLotId =
        lotSelect.value;
      refreshLotHint();
      refreshPreview();
    },
  );

  typeSelect.addEventListener(
    'change',
    refreshPreview,
  );

  quantityInput.addEventListener(
    'input',
    refreshPreview,
  );

  cycleSelect.addEventListener(
    'change',
    loadEventsForCycle,
  );

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  renderLotOptions();

  return () => {
    inputSelect.removeEventListener(
      'change',
      loadLotsForInput,
    );

    typeSelect.removeEventListener(
      'change',
      refreshPreview,
    );

    quantityInput.removeEventListener(
      'input',
      refreshPreview,
    );

    cycleSelect.removeEventListener(
      'change',
      loadEventsForCycle,
    );

    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
