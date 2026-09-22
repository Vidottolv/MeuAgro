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
  getProductionCycleById,
} from '../../services/productionCycleService.js';

import {
  getProductionEventById,
} from '../../services/productionEventService.js';

import {
  listAgriculturalInputs,
} from '../../services/agriculturalInputService.js';

import {
  listInventoryLots,
} from '../../services/inventoryLotService.js';

import {
  createEventInput,
  getInputCurrentBalance,
} from '../../services/eventInputService.js';

import {
  showRestockConsultantModal,
} from '../../components/restockConsultantModal.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDatePtBr,
  formatNumberPtBr,
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
              input.brand
                ? ` • ${escapeHtml(
                    input.brand,
                  )}`
                : ''
            }
          </option>
        `,
      )
      .join('')}
  `;
}

function lotLabel(lot) {
  const batch =
    lot.batch_number
      ? `Lote ${lot.batch_number}`
      : `Compra de ${formatDatePtBr(
          lot.purchase_date,
        )}`;

  return `${batch} • ${formatNumberPtBr(
    lot.current_quantity,
  )} ${lot.unit} disponíveis`;
}

function lotOptions(
  lots,
  selected,
) {
  return `
    <option value="">
      ${
        lots.length
          ? 'Selecione'
          : 'Nenhum lote com saldo'
      }
    </option>

    ${lots
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
              lotLabel(lot),
            )}
          </option>
        `,
      )
      .join('')}
  `;
}

export async function renderEventInputFormPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let cycle = null;
  let event = null;
  let inputs = [];

  try {
    [
      cycle,
      event,
      inputs,
    ] =
      await Promise.all([
        getProductionCycleById(
          params.cycleId,
        ),
        getProductionEventById(
          params.eventId,
        ),
        listAgriculturalInputs({
          includeInactive: false,
        }),
      ]);
  } catch (error) {
    console.error(
      'Erro ao preparar uso de insumo:',
      error,
    );
  }

  if (
    !cycle ||
    cycle.deleted_at ||
    !event ||
    event.production_cycle_id !==
      cycle.id
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Uso de insumo',
        eyebrow: 'Linha do tempo',
        activeNav: 'plantings',
        content:
          emptyState({
            iconName: 'box',
            title:
              'Evento indisponível',
            description:
              'O consumo de insumo precisa estar ligado a um evento de um ciclo produtivo ativo.',
            actionLabel:
              'Voltar para plantios',
            actionHref:
              '/plantings',
          }),
      });

    return null;
  }

  const query =
    new URLSearchParams(
      window.location.search,
    );

  const requestedInput =
    query.get('input') || '';

  const selectedInput =
    inputs.some(
      (input) =>
        input.id ===
        requestedInput,
    )
      ? requestedInput
      : '';

  let lots = [];

  if (selectedInput) {
    try {
      lots =
        await listInventoryLots({
          inputId:
            selectedInput,
          includeEmpty: false,
        });
    } catch (error) {
      console.error(
        'Erro ao carregar lotes:',
        error,
      );
    }
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Usar insumo',
      eyebrow:
        event.title,
      activeNav: 'plantings',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/plantings/${cycle.id}#timeline"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Linha do tempo
            </a>

            <h2
              style="margin-top: 10px;"
            >
              Registrar insumo utilizado
            </h2>

            <p>
              A confirmação gera automaticamente uma saída de estoque associada ao ciclo e ao evento.
            </p>
          </div>
        </section>

        <section class="event-input-context">
          <span class="event-input-context__icon">
            ${icon('clipboard')}
          </span>

          <div>
            <strong>
              ${escapeHtml(
                event.title,
              )}
            </strong>

            <span>
              ${escapeHtml(
                cycle.crop?.name ||
                'Ciclo produtivo',
              )}
              •
              ${escapeHtml(
                cycle.area?.name ||
                'Área',
              )}
            </span>
          </div>
        </section>

        <div
          id="event-input-feedback"
          class="form-message"
          hidden
        ></div>

        ${
          inputs.length
            ? `
              <form
                id="event-input-form"
                class="property-form"
                novalidate
              >
                <section class="form-card">
                  <div class="form-section-title">
                    <h2>
                      Insumo e lote
                    </h2>

                    <p>
                      O lote define de qual compra o produto será baixado e qual custo será capturado.
                    </p>
                  </div>

                  <div class="field">
                    <label
                      for="event-input-product"
                    >
                      Insumo *
                    </label>

                    <select
                      id="event-input-product"
                      name="inputId"
                      required
                    >
                      ${inputOptions(
                        inputs,
                        selectedInput,
                      )}
                    </select>
                  </div>

                  <div class="field">
                    <label
                      for="event-input-lot"
                    >
                      Lote *
                    </label>

                    <select
                      id="event-input-lot"
                      name="lotId"
                      ${
                        selectedInput
                          ? ''
                          : 'disabled'
                      }
                      required
                    >
                      ${lotOptions(
                        lots,
                        '',
                      )}
                    </select>
                  </div>

                  <div
                    id="event-input-lot-info"
                    class="event-input-lot-info"
                    hidden
                  ></div>
                </section>

                <section class="form-card">
                  <div class="form-section-title">
                    <h2>
                      Quantidade utilizada
                    </h2>

                    <p>
                      O valor deve estar disponível no lote selecionado.
                    </p>
                  </div>

                  <div class="field">
                    <label
                      for="event-input-quantity"
                    >
                      Quantidade *
                    </label>

                    <input
                      id="event-input-quantity"
                      name="quantity"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      inputmode="decimal"
                      placeholder="Ex.: 3"
                      required
                    />

                    <small
                      id="event-input-quantity-hint"
                      class="field__hint"
                    ></small>
                  </div>

                  <div class="field">
                    <label
                      for="event-input-notes"
                    >
                      Observações
                    </label>

                    <textarea
                      id="event-input-notes"
                      name="notes"
                      maxlength="1000"
                      placeholder="Ex.: aplicação distribuída em cobertura."
                    ></textarea>
                  </div>
                </section>

                <div class="event-input-immutable-note">
                  ${icon('lock')}

                  <div>
                    <strong>
                      Registro auditável
                    </strong>

                    <span>
                      Depois de confirmado, o consumo não poderá ser editado ou excluído. Correções devem ser feitas por movimentação de ajuste e novo consumo.
                    </span>
                  </div>
                </div>

                <div class="property-form-actions">
                  <a
                    href="/plantings/${cycle.id}#timeline"
                    class="button button--secondary"
                    data-link
                  >
                    Cancelar
                  </a>

                  <button
                    id="event-input-submit"
                    class="button button--primary"
                    type="submit"
                  >
                    Registrar uso
                  </button>
                </div>
              </form>
            `
            : emptyState({
                iconName: 'box',
                title:
                  'Nenhum insumo ativo',
                description:
                  'Cadastre um insumo e um lote com saldo antes de registrar o uso em um evento.',
                actionLabel:
                  'Abrir Barracão',
                actionHref:
                  '/inventory',
              })
        }
      `,
    });

  if (!inputs.length) {
    return null;
  }

  const form =
    document.querySelector(
      '#event-input-form',
    );

  const feedback =
    document.querySelector(
      '#event-input-feedback',
    );

  const submit =
    document.querySelector(
      '#event-input-submit',
    );

  const inputSelect =
    document.querySelector(
      '#event-input-product',
    );

  const lotSelect =
    document.querySelector(
      '#event-input-lot',
    );

  const quantityInput =
    document.querySelector(
      '#event-input-quantity',
    );

  const quantityHint =
    document.querySelector(
      '#event-input-quantity-hint',
    );

  const lotInfo =
    document.querySelector(
      '#event-input-lot-info',
    );

  let currentLots =
    lots;

  function selectedLot() {
    return currentLots.find(
      (lot) =>
        lot.id ===
        lotSelect.value,
    );
  }

  function renderLotInfo() {
    const lot =
      selectedLot();

    if (!lot) {
      lotInfo.hidden =
        true;

      lotInfo.innerHTML =
        '';

      quantityHint.textContent =
        '';

      quantityInput.removeAttribute(
        'max',
      );

      return;
    }

    lotInfo.hidden =
      false;

    lotInfo.innerHTML = `
      <div>
        <span>Saldo disponível</span>
        <strong>
          ${formatNumberPtBr(
            lot.current_quantity,
          )}
          ${escapeHtml(
            lot.unit,
          )}
        </strong>
      </div>

      <div>
        <span>Custo unitário</span>
        <strong>
          ${
            lot.unit_price === null ||
            lot.unit_price === undefined
              ? 'Não informado'
              : formatCurrencyBRL(
                  lot.unit_price,
                )
          }
        </strong>
      </div>

      <div>
        <span>Lote</span>
        <strong>
          ${escapeHtml(
            lot.batch_number ||
            'Sem número',
          )}
        </strong>
      </div>
    `;

    quantityHint.textContent =
      `Disponível: ${formatNumberPtBr(
        lot.current_quantity,
      )} ${lot.unit}.`;

    quantityInput.max =
      String(
        lot.current_quantity,
      );
  }

  async function loadLots() {
    const inputId =
      inputSelect.value;

    lotSelect.disabled =
      true;

    lotSelect.innerHTML =
      lotOptions([], '');

    currentLots = [];

    renderLotInfo();

    if (!inputId) {
      return;
    }

    try {
      currentLots =
        await listInventoryLots({
          inputId,
          includeEmpty: false,
        });

      lotSelect.innerHTML =
        lotOptions(
          currentLots,
          '',
        );

      lotSelect.disabled =
        currentLots.length === 0;
    } catch (error) {
      console.error(
        'Erro ao carregar lotes:',
        error,
      );

      showToast(
        getDataErrorMessage(
          error,
        ),
        {
          type: 'error',
        },
      );
    }
  }

  const handleInputChange =
    () => {
      void loadLots();
    };

  const handleLotChange =
    () => {
      renderLotInfo();
    };

  const handleSubmit =
    async (submitEvent) => {
      submitEvent.preventDefault();

      setFormMessage(
        feedback,
        '',
      );

      const formData =
        new FormData(form);

      const data = {
        inputId:
          String(
            formData.get(
              'inputId',
            ) || '',
          ),
        lotId:
          String(
            formData.get(
              'lotId',
            ) || '',
          ),
        quantity:
          Number(
            formData.get(
              'quantity',
            ),
          ),
        notes:
          String(
            formData.get(
              'notes',
            ) || '',
          ).trim(),
      };

      const lot =
        selectedLot();

      if (!data.inputId) {
        setFormMessage(
          feedback,
          'Selecione o insumo.',
        );
        return;
      }

      if (!lot) {
        setFormMessage(
          feedback,
          'Selecione um lote com saldo.',
        );
        return;
      }

      if (
        !Number.isFinite(
          data.quantity,
        ) ||
        data.quantity <= 0
      ) {
        setFormMessage(
          feedback,
          'Informe uma quantidade maior que zero.',
        );
        return;
      }

      if (
        data.quantity >
        Number(
          lot.current_quantity,
        )
      ) {
        setFormMessage(
          feedback,
          `Saldo insuficiente no lote. Disponível: ${formatNumberPtBr(
            lot.current_quantity,
          )} ${lot.unit}.`,
        );
        return;
      }

      setButtonLoading(
        submit,
        true,
        'Registrando…',
      );

      try {
        const input =
          inputs.find(
            (item) =>
              item.id ===
              data.inputId,
          );

        await createEventInput(
          event.id,
          data,
        );

        const balance =
          await getInputCurrentBalance(
            data.inputId,
          );

        showToast(
          'Uso de insumo registrado e estoque atualizado.',
          {
            type: 'success',
          },
        );

        if (
          balance.current_quantity <=
          0
        ) {
          await showRestockConsultantModal({
            inputName:
              input?.name ||
              'Insumo',
          });
        }

        navigate(
          `/plantings/${cycle.id}#timeline`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao registrar uso:',
          error,
        );

        setFormMessage(
          feedback,
          getDataErrorMessage(
            error,
          ),
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
    handleInputChange,
  );

  lotSelect.addEventListener(
    'change',
    handleLotChange,
  );

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  renderLotInfo();

  return () => {
    inputSelect.removeEventListener(
      'change',
      handleInputChange,
    );

    lotSelect.removeEventListener(
      'change',
      handleLotChange,
    );

    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
