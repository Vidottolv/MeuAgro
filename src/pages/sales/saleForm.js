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
  getHarvestById,
} from '../../services/harvestService.js';

import {
  createHarvestSale,
  getHarvestSaleById,
  getRemainingQuantityForSale,
  listSaleEligibleHarvests,
  updateHarvestSale,
} from '../../services/harvestSaleService.js';

import {
  PAYMENT_METHODS,
} from '../../constants/paymentMethods.js';

import {
  harvestAllowsSales,
} from '../../constants/harvestDestinations.js';

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

function todayString() {
  const now =
    new Date();

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

function harvestLabel(
  harvest,
) {
  const cycle =
    harvest.production_cycle;

  const crop =
    cycle?.crop?.name ||
    'Colheita';

  const variety =
    cycle?.variety
      ? ` • ${cycle.variety}`
      : '';

  return `${crop}${variety} — ${formatDatePtBr(
    harvest.harvest_date,
  )} — ${formatNumberPtBr(
    harvest.quantity,
  )} ${harvest.unit}`;
}

function harvestOptions(
  harvests,
  selected,
) {
  return `
    <option value="">
      Selecione a colheita
    </option>

    ${harvests
      .map(
        (harvest) => `
          <option
            value="${harvest.id}"
            ${
              selected === harvest.id
                ? 'selected'
                : ''
            }
          >
            ${escapeHtml(
              harvestLabel(
                harvest,
              ),
            )}
          </option>
        `,
      )
      .join('')}
  `;
}

function paymentOptions(
  selected,
) {
  return `
    <option value="">
      Não informado
    </option>

    ${PAYMENT_METHODS
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

function normalizeNumber(
  raw,
) {
  const value =
    String(raw || '')
      .trim()
      .replace(',', '.');

  return Number(value);
}

export async function renderSaleFormPage({
  session,
  params = {},
  mode,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  const editing =
    mode === 'edit';

  let sale = null;
  let harvests = [];
  let selectedHarvest = null;

  try {
    if (editing) {
      sale =
        await getHarvestSaleById(
          params.saleId,
        );

      if (sale?.harvest) {
        selectedHarvest =
          await getHarvestById(
            sale.harvest.id,
          );

        harvests = [
          selectedHarvest,
        ];
      }
    } else if (params.harvestId) {
      selectedHarvest =
        await getHarvestById(
          params.harvestId,
        );

      if (selectedHarvest) {
        harvests = [
          selectedHarvest,
        ];
      }
    } else {
      harvests =
        await listSaleEligibleHarvests();

      const query =
        new URLSearchParams(
          window.location.search,
        );

      const requested =
        query.get('harvest');

      selectedHarvest =
        harvests.find(
          (harvest) =>
            harvest.id ===
            requested,
        ) ||
        null;
    }
  } catch (error) {
    console.error(
      'Erro ao preparar venda:',
      error,
    );
  }

  if (
    editing &&
    !sale
  ) {
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

  if (
    !editing &&
    params.harvestId &&
    (
      !selectedHarvest ||
      !harvestAllowsSales(
        selectedHarvest.destination,
      ) ||
      getRemainingQuantityForSale(
        selectedHarvest,
      ) <= 0
    )
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Nova venda',
        eyebrow: 'Comercialização',
        activeNav: 'more',
        content:
          emptyState({
            iconName:
              'cart',
            title:
              'Colheita não disponível para venda',
            description:
              selectedHarvest &&
              harvestAllowsSales(
                selectedHarvest.destination,
              )
                ? 'Toda a quantidade desta colheita já está comprometida em vendas.'
                : 'O destino precisa ser Venda ou Consumo próprio e venda.',
            actionLabel:
              'Voltar para colheitas',
            actionHref:
              '/more/harvests',
          }),
      });

    return null;
  }

  if (
    !editing &&
    !params.harvestId &&
    !harvests.length
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Nova venda',
        eyebrow: 'Comercialização',
        activeNav: 'more',
        content:
          emptyState({
            iconName:
              'cart',
            title:
              'Nenhuma colheita disponível',
            description:
              'Registre uma colheita com destino de venda e quantidade ainda disponível.',
            actionLabel:
              'Abrir colheitas',
            actionHref:
              '/more/harvests',
          }),
      });

    return null;
  }

  const fixedHarvest =
    editing ||
    Boolean(
      params.harvestId,
    );

  const selectedHarvestId =
    selectedHarvest?.id ||
    '';

  app.innerHTML =
    appShell({
      session,
      title:
        editing
          ? 'Editar venda'
          : 'Nova venda',
      eyebrow: 'Comercialização',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                editing
                  ? `/more/sales/${sale.id}`
                  : (
                      selectedHarvest
                        ? `/more/harvests/${selectedHarvest.id}`
                        : '/more/sales'
                    )
              }"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Voltar
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${
                editing
                  ? 'Editar venda'
                  : 'Registrar venda'
              }
            </h2>

            <p>
              A quantidade vendida nunca pode ultrapassar o volume disponível da colheita.
            </p>
          </div>
        </section>

        <div
          id="sale-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="sale-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Colheita
              </h2>

              <p>
                A unidade da venda é sempre a mesma unidade da colheita.
              </p>
            </div>

            ${
              fixedHarvest
                ? `
                  <div
                    id="sale-harvest-readonly"
                    class="harvest-cycle-readonly"
                  ></div>
                `
                : `
                  <div class="field">
                    <label
                      for="sale-harvest"
                    >
                      Colheita *
                    </label>

                    <select
                      id="sale-harvest"
                      name="harvestId"
                      required
                    >
                      ${harvestOptions(
                        harvests,
                        selectedHarvestId,
                      )}
                    </select>
                  </div>
                `
            }

            <div
              id="sale-harvest-info"
              class="sale-harvest-info"
              hidden
            ></div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Dados comerciais
              </h2>

              <p>
                O valor total será calculado como quantidade × preço unitário.
              </p>
            </div>

            <div class="field">
              <label
                for="sale-buyer"
              >
                Comprador
              </label>

              <input
                id="sale-buyer"
                name="buyer"
                type="text"
                maxlength="180"
                placeholder="Ex.: Cooperativa São José"
                value="${escapeHtml(
                  sale?.buyer ||
                  '',
                )}"
              />
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="sale-quantity"
                >
                  Quantidade *
                </label>

                <input
                  id="sale-quantity"
                  name="quantity"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  inputmode="decimal"
                  value="${
                    sale?.quantity ??
                    ''
                  }"
                  required
                />

                <small
                  id="sale-quantity-hint"
                  class="field__hint"
                ></small>
              </div>

              <div class="field">
                <label
                  for="sale-unit-price"
                >
                  Preço unitário *
                </label>

                <input
                  id="sale-unit-price"
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="0.000001"
                  inputmode="decimal"
                  placeholder="Ex.: 4.50"
                  value="${
                    sale?.unit_price ??
                    ''
                  }"
                  required
                />
              </div>
            </div>

            <div class="sale-total-preview">
              <span>
                Valor total estimado
              </span>

              <strong
                id="sale-total-value"
              >
                ${formatCurrencyBRL(
                  sale?.total_value ||
                  0,
                )}
              </strong>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="sale-date"
                >
                  Data da venda *
                </label>

                <input
                  id="sale-date"
                  name="saleDate"
                  type="date"
                  value="${
                    sale?.sale_date ||
                    todayString()
                  }"
                  required
                />
              </div>

              <div class="field">
                <label
                  for="sale-payment-method"
                >
                  Forma de pagamento
                </label>

                <select
                  id="sale-payment-method"
                  name="paymentMethod"
                >
                  ${paymentOptions(
                    sale?.payment_method ||
                    '',
                  )}
                </select>
              </div>
            </div>

            <div class="field">
              <label
                for="sale-notes"
              >
                Observações
              </label>

              <textarea
                id="sale-notes"
                name="notes"
                maxlength="1600"
                placeholder="Ex.: pagamento em duas parcelas, retirada pelo comprador..."
              >${escapeHtml(
                sale?.notes ||
                '',
              )}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                editing
                  ? `/more/sales/${sale.id}`
                  : (
                      selectedHarvest
                        ? `/more/harvests/${selectedHarvest.id}`
                        : '/more/sales'
                    )
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="sale-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar alterações'
                  : 'Registrar venda'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#sale-form',
    );

  const feedback =
    document.querySelector(
      '#sale-form-feedback',
    );

  const submit =
    document.querySelector(
      '#sale-submit',
    );

  const harvestSelect =
    document.querySelector(
      '#sale-harvest',
    );

  const readonlyHarvest =
    document.querySelector(
      '#sale-harvest-readonly',
    );

  const harvestInfo =
    document.querySelector(
      '#sale-harvest-info',
    );

  const quantityInput =
    document.querySelector(
      '#sale-quantity',
    );

  const quantityHint =
    document.querySelector(
      '#sale-quantity-hint',
    );

  const priceInput =
    document.querySelector(
      '#sale-unit-price',
    );

  const totalOutput =
    document.querySelector(
      '#sale-total-value',
    );

  const saleDateInput =
    document.querySelector(
      '#sale-date',
    );

  function currentHarvest() {
    if (
      fixedHarvest
    ) {
      return selectedHarvest;
    }

    return harvests.find(
      (harvest) =>
        harvest.id ===
        harvestSelect.value,
    ) ||
    null;
  }

  function renderHarvestInfo() {
    const harvest =
      currentHarvest();

    if (!harvest) {
      harvestInfo.hidden =
        true;

      harvestInfo.innerHTML =
        '';

      if (readonlyHarvest) {
        readonlyHarvest.innerHTML =
          '';
      }

      quantityHint.textContent =
        '';

      quantityInput.removeAttribute(
        'max',
      );

      return;
    }

    const remaining =
      getRemainingQuantityForSale(
        harvest,
        {
          currentSaleId:
            sale?.id ||
            null,
        },
      );

    const title =
      harvestLabel(
        harvest,
      );

    if (readonlyHarvest) {
      readonlyHarvest.innerHTML = `
        <span class="harvest-cycle-readonly__icon">
          ${icon('harvest')}
        </span>

        <div>
          <strong>
            ${escapeHtml(
              title,
            )}
          </strong>

          <span>
            Colheita fixa desta venda
          </span>
        </div>
      `;
    }

    harvestInfo.hidden =
      false;

    harvestInfo.innerHTML = `
      <div>
        <span>
          Quantidade colhida
        </span>

        <strong>
          ${formatNumberPtBr(
            harvest.quantity,
          )}
          ${escapeHtml(
            harvest.unit,
          )}
        </strong>
      </div>

      <div>
        <span>
          Disponível para esta venda
        </span>

        <strong>
          ${formatNumberPtBr(
            remaining,
          )}
          ${escapeHtml(
            harvest.unit,
          )}
        </strong>
      </div>

      <div>
        <span>
          Data da colheita
        </span>

        <strong>
          ${formatDatePtBr(
            harvest.harvest_date,
          )}
        </strong>
      </div>
    `;

    quantityHint.textContent =
      `Máximo disponível: ${formatNumberPtBr(
        remaining,
      )} ${harvest.unit}.`;

    quantityInput.max =
      String(remaining);

    saleDateInput.min =
      harvest.harvest_date;
  }

  function renderTotal() {
    const quantity =
      normalizeNumber(
        quantityInput.value,
      );

    const price =
      normalizeNumber(
        priceInput.value,
      );

    const total =
      (
        Number.isFinite(
          quantity,
        ) &&
        Number.isFinite(price)
      )
        ? quantity *
          price
        : 0;

    totalOutput.textContent =
      formatCurrencyBRL(
        total,
      );
  }

  const handleHarvest =
    () => {
      selectedHarvest =
        currentHarvest();

      renderHarvestInfo();
    };

  const handleTotal =
    () => {
      renderTotal();
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setFormMessage(
        feedback,
        '',
      );

      const harvest =
        currentHarvest();

      if (!harvest) {
        setFormMessage(
          feedback,
          'Selecione uma colheita.',
        );
        return;
      }

      const formData =
        new FormData(form);

      const data = {
        buyer:
          String(
            formData.get(
              'buyer',
            ) || '',
          ).trim(),
        quantity:
          normalizeNumber(
            formData.get(
              'quantity',
            ),
          ),
        unitPrice:
          normalizeNumber(
            formData.get(
              'unitPrice',
            ),
          ),
        saleDate:
          String(
            formData.get(
              'saleDate',
            ) || '',
          ),
        paymentMethod:
          String(
            formData.get(
              'paymentMethod',
            ) || '',
          ),
        notes:
          String(
            formData.get(
              'notes',
            ) || '',
          ).trim(),
      };

      const remaining =
        getRemainingQuantityForSale(
          harvest,
          {
            currentSaleId:
              sale?.id ||
              null,
          },
        );

      if (
        !Number.isFinite(
          data.quantity,
        ) ||
        data.quantity <= 0
      ) {
        setFormMessage(
          feedback,
          'Informe uma quantidade vendida maior que zero.',
        );
        return;
      }

      if (
        data.quantity >
        remaining
      ) {
        setFormMessage(
          feedback,
          `A quantidade vendida não pode ultrapassar ${formatNumberPtBr(
            remaining,
          )} ${harvest.unit}.`,
        );
        return;
      }

      if (
        !Number.isFinite(
          data.unitPrice,
        ) ||
        data.unitPrice < 0
      ) {
        setFormMessage(
          feedback,
          'Informe um preço unitário válido.',
        );
        return;
      }

      if (!data.saleDate) {
        setFormMessage(
          feedback,
          'Informe a data da venda.',
        );
        return;
      }

      if (
        data.saleDate <
        harvest.harvest_date
      ) {
        setFormMessage(
          feedback,
          'A data da venda não pode ser anterior à colheita.',
        );
        return;
      }

      setButtonLoading(
        submit,
        true,
        editing
          ? 'Salvando…'
          : 'Registrando…',
      );

      try {
        const saved =
          editing
            ? await updateHarvestSale(
                sale.id,
                harvest,
                data,
              )
            : await createHarvestSale(
                harvest,
                data,
              );

        showToast(
          editing
            ? 'Venda atualizada.'
            : 'Venda registrada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/more/sales/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar venda:',
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

  harvestSelect?.addEventListener(
    'change',
    handleHarvest,
  );

  quantityInput.addEventListener(
    'input',
    handleTotal,
  );

  priceInput.addEventListener(
    'input',
    handleTotal,
  );

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  renderHarvestInfo();
  renderTotal();

  return () => {
    harvestSelect?.removeEventListener(
      'change',
      handleHarvest,
    );

    quantityInput.removeEventListener(
      'input',
      handleTotal,
    );

    priceInput.removeEventListener(
      'input',
      handleTotal,
    );

    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
