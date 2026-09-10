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
} from '../../services/agriculturalInputService.js';

import {
  createInventoryLot,
  getInventoryLotById,
  updateInventoryLotMetadata,
} from '../../services/inventoryLotService.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatNumberPtBr,
} from '../../js/html.js';

import {
  getInputUnitLabel,
} from '../../constants/inputUnits.js';

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
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function asNumber(value) {
  const normalized =
    String(value ?? '')
      .trim()
      .replace(',', '.');

  if (!normalized) {
    return null;
  }

  const number =
    Number(normalized);

  return Number.isFinite(number)
    ? number
    : null;
}

function validateLot(data, editing) {
  if (editing) {
    if (
      data.expirationDate &&
      data.expirationDate <
        data.purchaseDate
    ) {
      return 'A validade não pode ser anterior à data da compra.';
    }

    return null;
  }

  if (
    !Number.isFinite(
      data.purchasedQuantity,
    ) ||
    data.purchasedQuantity <= 0
  ) {
    return 'Informe uma quantidade comprada maior que zero.';
  }

  if (
    data.totalPrice !== null &&
    (
      !Number.isFinite(
        data.totalPrice,
      ) ||
      data.totalPrice < 0
    )
  ) {
    return 'Informe um preço total válido.';
  }

  if (!data.purchaseDate) {
    return 'Informe a data da compra.';
  }

  if (
    data.expirationDate &&
    data.expirationDate <
      data.purchaseDate
  ) {
    return 'A validade não pode ser anterior à data da compra.';
  }

  return null;
}

export async function renderInventoryLotFormPage({
  session,
  params,
  mode,
}) {
  const app =
    document.querySelector('#app');

  const editing =
    mode === 'edit';

  let input = null;
  let lot = null;

  try {
    input =
      await getAgriculturalInputById(
        params.inputId,
      );

    if (editing) {
      lot =
        await getInventoryLotById(
          params.lotId,
        );
    }
  } catch (error) {
    console.error(
      'Erro ao preparar lote:',
      error,
    );
  }

  if (
    !input ||
    (
      editing &&
      (
        !lot ||
        lot.agricultural_input_id !==
          input.id
      )
    )
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
              'Não foi possível localizar os dados solicitados.',
            actionLabel:
              'Voltar ao Barracão',
            actionHref:
              '/inventory',
          }),
      });

    return null;
  }

  if (
    !editing &&
    !input.active
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Novo lote',
        eyebrow: 'Barracão',
        activeNav: 'inventory',
        content:
          emptyState({
            iconName: 'box',
            title:
              'Insumo inativo',
            description:
              'Reative o insumo antes de cadastrar uma nova compra.',
            actionLabel:
              'Voltar ao insumo',
            actionHref:
              `/inventory/${input.id}`,
          }),
      });

    return null;
  }

  const purchaseDate =
    lot?.purchase_date ||
    todayString();

  app.innerHTML =
    appShell({
      session,
      title:
        editing
          ? 'Editar lote'
          : 'Novo lote',
      eyebrow: 'Barracão',
      activeNav: 'inventory',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                editing
                  ? `/inventory/${input.id}/lots/${lot.id}`
                  : `/inventory/${input.id}/lots`
              }"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Voltar
            </a>

            <h2 style="margin-top: 10px;">
              ${
                editing
                  ? 'Editar informações do lote'
                  : 'Registrar compra / lote'
              }
            </h2>

            <p>
              ${escapeHtml(input.name)} •
              ${escapeHtml(
                getInputUnitLabel(
                  input.base_unit,
                ),
              )}
            </p>
          </div>
        </section>

        ${
          editing
            ? `
              <div class="input-stage-note">
                ${icon('lock')}
                <div>
                  <strong>
                    Dados de estoque protegidos
                  </strong>
                  <span>
                    Quantidade comprada, unidade, preço e data da compra permanecem somente leitura. Correções de saldo devem ser feitas por movimentações.
                  </span>
                </div>
              </div>
            `
            : `
              <div class="input-stage-note">
                ${icon('info')}
                <div>
                  <strong>
                    Entrada automática
                  </strong>
                  <span>
                    Ao salvar este lote, o PostgreSQL criará automaticamente uma movimentação de entrada com a quantidade comprada.
                  </span>
                </div>
              </div>
            `
        }

        <div
          id="lot-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="lot-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>Compra</h2>
              <p>
                Informações financeiras e quantidade original do lote.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="lot-quantity">
                  Quantidade comprada *
                </label>

                <input
                  id="lot-quantity"
                  name="purchasedQuantity"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  inputmode="decimal"
                  value="${
                    lot?.purchased_quantity ??
                    ''
                  }"
                  ${editing ? 'readonly' : 'required'}
                />
              </div>

              <div class="field">
                <label>
                  Unidade
                </label>

                <input
                  type="text"
                  value="${escapeHtml(
                    getInputUnitLabel(
                      input.base_unit,
                    ),
                  )}"
                  readonly
                />
              </div>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="lot-total-price">
                  Preço total
                </label>

                <input
                  id="lot-total-price"
                  name="totalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  inputmode="decimal"
                  placeholder="Ex.: 250.00"
                  value="${
                    lot?.total_price ??
                    ''
                  }"
                  ${editing ? 'readonly' : ''}
                />
              </div>

              <div class="field">
                <label>
                  Preço unitário
                </label>

                <div
                  id="lot-unit-price-preview"
                  class="stock-readonly-value"
                >
                  ${
                    editing
                      ? formatCurrencyBRL(
                          lot.unit_price,
                        )
                      : '-'
                  }
                </div>

                <small class="field__hint">
                  Calculado automaticamente.
                </small>
              </div>
            </div>

            <div class="field">
              <label for="lot-purchase-date">
                Data da compra *
              </label>

              <input
                id="lot-purchase-date"
                name="purchaseDate"
                type="date"
                value="${purchaseDate}"
                ${editing ? 'readonly' : 'required'}
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Identificação do lote</h2>
              <p>
                Dados que ajudam a localizar fisicamente o produto no barracão.
              </p>
            </div>

            <div class="field">
              <label for="lot-supplier">
                Fornecedor
              </label>

              <input
                id="lot-supplier"
                name="supplier"
                type="text"
                maxlength="180"
                placeholder="Ex.: Agropecuária Central"
                value="${escapeHtml(
                  lot?.supplier || '',
                )}"
              />
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="lot-batch-number">
                  Número do lote
                </label>

                <input
                  id="lot-batch-number"
                  name="batchNumber"
                  type="text"
                  maxlength="120"
                  placeholder="Ex.: LT-2026-09"
                  value="${escapeHtml(
                    lot?.batch_number || '',
                  )}"
                />
              </div>

              <div class="field">
                <label for="lot-expiration-date">
                  Validade
                </label>

                <input
                  id="lot-expiration-date"
                  name="expirationDate"
                  type="date"
                  value="${
                    lot?.expiration_date ||
                    ''
                  }"
                />
              </div>
            </div>

            <div class="field">
              <label for="lot-notes">
                Observações
              </label>

              <textarea
                id="lot-notes"
                name="notes"
                maxlength="1500"
                placeholder="Ex.: armazenado na prateleira 2..."
              >${escapeHtml(
                lot?.notes || '',
              )}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                editing
                  ? `/inventory/${input.id}/lots/${lot.id}`
                  : `/inventory/${input.id}/lots`
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="lot-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar informações'
                  : 'Cadastrar lote'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#lot-form',
    );

  const feedback =
    document.querySelector(
      '#lot-form-feedback',
    );

  const submit =
    document.querySelector(
      '#lot-submit',
    );

  const quantityInput =
    document.querySelector(
      '#lot-quantity',
    );

  const totalPriceInput =
    document.querySelector(
      '#lot-total-price',
    );

  const unitPricePreview =
    document.querySelector(
      '#lot-unit-price-preview',
    );

  function refreshUnitPrice() {
    if (editing) {
      return;
    }

    const quantity =
      asNumber(
        quantityInput.value,
      );

    const totalPrice =
      asNumber(
        totalPriceInput.value,
      );

    if (
      !quantity ||
      quantity <= 0 ||
      totalPrice === null
    ) {
      unitPricePreview.textContent =
        '-';
      return;
    }

    unitPricePreview.textContent =
      `${formatCurrencyBRL(
        totalPrice / quantity,
      )} / ${input.base_unit}`;
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

      const data = {
        purchasedQuantity:
          editing
            ? Number(
                lot.purchased_quantity,
              )
            : asNumber(
                formData.get(
                  'purchasedQuantity',
                ),
              ),
        totalPrice:
          editing
            ? (
                lot.total_price === null
                  ? null
                  : Number(
                      lot.total_price,
                    )
              )
            : asNumber(
                formData.get(
                  'totalPrice',
                ),
              ),
        purchaseDate:
          editing
            ? lot.purchase_date
            : String(
                formData.get(
                  'purchaseDate',
                ) || '',
              ),
        supplier:
          String(
            formData.get(
              'supplier',
            ) || '',
          ).trim(),
        batchNumber:
          String(
            formData.get(
              'batchNumber',
            ) || '',
          ).trim(),
        expirationDate:
          String(
            formData.get(
              'expirationDate',
            ) || '',
          ),
        notes:
          String(
            formData.get(
              'notes',
            ) || '',
          ).trim(),
      };

      const validationError =
        validateLot(
          data,
          editing,
        );

      if (validationError) {
        setFormMessage(
          feedback,
          validationError,
        );
        return;
      }

      setButtonLoading(
        submit,
        true,
        editing
          ? 'Salvando…'
          : 'Registrando compra…',
      );

      try {
        const saved =
          editing
            ? await updateInventoryLotMetadata(
                lot.id,
                data,
              )
            : await createInventoryLot(
                input.id,
                data,
              );

        showToast(
          editing
            ? 'Informações do lote atualizadas.'
            : 'Lote cadastrado e entrada de estoque gerada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/inventory/${input.id}/lots/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar lote:',
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

  if (!editing) {
    quantityInput.addEventListener(
      'input',
      refreshUnitPrice,
    );

    totalPriceInput.addEventListener(
      'input',
      refreshUnitPrice,
    );

    refreshUnitPrice();
  }

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  return () => {
    if (!editing) {
      quantityInput.removeEventListener(
        'input',
        refreshUnitPrice,
      );

      totalPriceInput.removeEventListener(
        'input',
        refreshUnitPrice,
      );
    }

    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
