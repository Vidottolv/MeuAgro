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
  createHarvest,
  getHarvestById,
  listHarvestableCycles,
  updateHarvest,
} from '../../services/harvestService.js';

import {
  HARVEST_DESTINATIONS,
  harvestAllowsSales,
} from '../../constants/harvestDestinations.js';

import {
  HARVEST_UNITS,
} from '../../constants/harvestUnits.js';

import {
  escapeHtml,
  formatDatePtBr,
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

function cycleLabel(
  cycle,
) {
  const crop =
    cycle.crop?.name ||
    'Cultura';

  const variety =
    cycle.variety
      ? ` • ${cycle.variety}`
      : '';

  return `${crop}${variety} — ${
    cycle.property?.name ||
    'Propriedade'
  } • ${
    cycle.area?.name ||
    'Área'
  }`;
}

function cycleOptions(
  cycles,
  selected,
) {
  return `
    <option value="">
      Selecione o ciclo produtivo
    </option>

    ${cycles
      .map(
        (cycle) => `
          <option
            value="${cycle.id}"
            ${
              selected === cycle.id
                ? 'selected'
                : ''
            }
          >
            ${escapeHtml(
              cycleLabel(
                cycle,
              ),
            )}
          </option>
        `,
      )
      .join('')}
  `;
}

function destinationOptions(
  selected,
) {
  return HARVEST_DESTINATIONS
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

function unitOptions(
  selected,
) {
  return HARVEST_UNITS
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

function normalizeQuantity(
  raw,
) {
  const value =
    String(raw || '')
      .trim()
      .replace(',', '.');

  if (!value) {
    return NaN;
  }

  return Number(value);
}

function validateHarvest(
  data,
  cycle,
) {
  if (!cycle) {
    return 'Selecione o ciclo produtivo.';
  }

  if (!data.harvestDate) {
    return 'Informe a data da colheita.';
  }

  if (
    cycle.planting_date &&
    data.harvestDate <
      cycle.planting_date
  ) {
    return 'A colheita não pode ser anterior à data do plantio.';
  }

  if (
    !Number.isFinite(
      data.quantity,
    ) ||
    data.quantity <= 0
  ) {
    return 'Informe uma quantidade colhida maior que zero.';
  }

  if (!data.unit) {
    return 'Selecione a unidade da colheita.';
  }

  if (!data.destination) {
    return 'Selecione o destino da colheita.';
  }

  return null;
}

export async function renderHarvestFormPage({
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

  let harvest = null;
  let cycles = [];

  try {
    if (editing) {
      harvest =
        await getHarvestById(
          params.harvestId,
        );

      if (
        harvest?.production_cycle
      ) {
        cycles = [
          harvest.production_cycle,
        ];
      }
    } else {
      cycles =
        await listHarvestableCycles();
    }
  } catch (error) {
    console.error(
      'Erro ao preparar formulário de colheita:',
      error,
    );
  }

  if (
    editing &&
    !harvest
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Colheita',
        eyebrow: 'Produção',
        activeNav: 'more',
        content:
          emptyState({
            iconName:
              'harvest',
            title:
              'Colheita não encontrada',
            description:
              'Este registro não existe ou não pertence à sua conta.',
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
    !cycles.length
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Nova colheita',
        eyebrow: 'Produção',
        activeNav: 'more',
        content:
          emptyState({
            iconName:
              'harvest',
            title:
              'Nenhum ciclo disponível',
            description:
              'Para registrar uma colheita, mantenha um ciclo como plantado, em desenvolvimento, próximo ou pronto para colher.',
            actionLabel:
              'Abrir plantios',
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

  const requestedCycle =
    params.cycleId ||
    query.get('cycle') ||
    '';

  const selectedCycleId =
    editing
      ? harvest.production_cycle_id
      : (
          cycles.some(
            (cycle) =>
              cycle.id ===
              requestedCycle,
          )
            ? requestedCycle
            : ''
        );

  const selectedDestination =
    harvest?.destination ||
    'own_consumption';

  const selectedUnit =
    harvest?.unit ||
    'kg';

  app.innerHTML =
    appShell({
      session,
      title:
        editing
          ? 'Editar colheita'
          : 'Nova colheita',
      eyebrow: 'Produção',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                editing
                  ? `/more/harvests/${harvest.id}`
                  : (
                      requestedCycle
                        ? `/plantings/${requestedCycle}`
                        : '/more/harvests'
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
                  ? 'Editar colheita'
                  : 'Registrar colheita'
              }
            </h2>

            <p>
              Registre cada retirada separadamente. O mesmo ciclo pode ter várias colheitas.
            </p>
          </div>
        </section>

        <div
          id="harvest-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="harvest-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Ciclo produtivo
              </h2>

              <p>
                A colheita será vinculada permanentemente ao ciclo selecionado.
              </p>
            </div>

            ${
              editing
                ? `
                  <div class="harvest-cycle-readonly">
                    <span class="harvest-cycle-readonly__icon">
                      ${icon('sprout')}
                    </span>

                    <div>
                      <strong>
                        ${escapeHtml(
                          cycleLabel(
                            harvest.production_cycle,
                          ),
                        )}
                      </strong>

                      <span>
                        Plantio:
                        ${formatDatePtBr(
                          harvest.production_cycle
                            ?.planting_date,
                        )}
                      </span>
                    </div>
                  </div>
                `
                : `
                  <div class="field">
                    <label
                      for="harvest-cycle"
                    >
                      Ciclo *
                    </label>

                    <select
                      id="harvest-cycle"
                      name="cycleId"
                      required
                    >
                      ${cycleOptions(
                        cycles,
                        selectedCycleId,
                      )}
                    </select>

                    <small
                      id="harvest-cycle-hint"
                      class="field__hint"
                    ></small>
                  </div>
                `
            }
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Dados da colheita
              </h2>

              <p>
                Informe a data, quantidade e unidade efetivamente colhidas.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="harvest-date"
                >
                  Data *
                </label>

                <input
                  id="harvest-date"
                  name="harvestDate"
                  type="date"
                  value="${
                    harvest?.harvest_date ||
                    todayString()
                  }"
                  required
                />
              </div>

              <div class="field">
                <label
                  for="harvest-quality"
                >
                  Classificação / qualidade
                </label>

                <input
                  id="harvest-quality"
                  name="qualityClassification"
                  type="text"
                  maxlength="120"
                  placeholder="Ex.: Premium, primeira, comercial..."
                  value="${escapeHtml(
                    harvest?.quality_classification ||
                    '',
                  )}"
                />
              </div>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="harvest-quantity"
                >
                  Quantidade *
                </label>

                <input
                  id="harvest-quantity"
                  name="quantity"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 150"
                  value="${
                    harvest?.quantity ??
                    ''
                  }"
                  required
                />
              </div>

              <div class="field">
                <label
                  for="harvest-unit"
                >
                  Unidade *
                </label>

                <select
                  id="harvest-unit"
                  name="unit"
                  required
                >
                  ${unitOptions(
                    selectedUnit,
                  )}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Destino
              </h2>

              <p>
                O destino define se esta colheita poderá receber registros de venda.
              </p>
            </div>

            <div class="field">
              <label
                for="harvest-destination"
              >
                Destino *
              </label>

              <select
                id="harvest-destination"
                name="destination"
                required
              >
                ${destinationOptions(
                  selectedDestination,
                )}
              </select>
            </div>

            <div
              id="harvest-sale-hint"
              class="harvest-sale-hint"
              hidden
            >
              ${icon('cart')}

              <div>
                <strong>
                  Venda habilitada
                </strong>

                <span>
                  Depois de salvar, você poderá registrar uma ou várias vendas vinculadas a esta colheita.
                </span>
              </div>
            </div>

            <div class="field">
              <label
                for="harvest-notes"
              >
                Observações
              </label>

              <textarea
                id="harvest-notes"
                name="notes"
                maxlength="1800"
                placeholder="Ex.: colheita parcial, condições do produto, separação por qualidade..."
              >${escapeHtml(
                harvest?.notes ||
                '',
              )}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                editing
                  ? `/more/harvests/${harvest.id}`
                  : (
                      requestedCycle
                        ? `/plantings/${requestedCycle}`
                        : '/more/harvests'
                    )
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="harvest-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar alterações'
                  : 'Registrar colheita'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#harvest-form',
    );

  const feedback =
    document.querySelector(
      '#harvest-form-feedback',
    );

  const submit =
    document.querySelector(
      '#harvest-submit',
    );

  const cycleSelect =
    document.querySelector(
      '#harvest-cycle',
    );

  const cycleHint =
    document.querySelector(
      '#harvest-cycle-hint',
    );

  const harvestDate =
    document.querySelector(
      '#harvest-date',
    );

  const destinationSelect =
    document.querySelector(
      '#harvest-destination',
    );

  const saleHint =
    document.querySelector(
      '#harvest-sale-hint',
    );

  function currentCycle() {
    if (editing) {
      return harvest.production_cycle;
    }

    return cycles.find(
      (cycle) =>
        cycle.id ===
        cycleSelect.value,
    );
  }

  function renderCycleHint() {
    const cycle =
      currentCycle();

    if (
      !cycle ||
      !cycleHint
    ) {
      return;
    }

    cycleHint.textContent =
      `Plantio em ${formatDatePtBr(
        cycle.planting_date,
      )}${
        cycle.current_harvest_forecast
          ? ` • previsão atual ${formatDatePtBr(
              cycle.current_harvest_forecast,
            )}`
          : ''
      }`;

    harvestDate.min =
      cycle.planting_date ||
      '';
  }

  function renderDestinationHint() {
    saleHint.hidden =
      !harvestAllowsSales(
        destinationSelect.value,
      );
  }

  const handleCycle =
    () => {
      renderCycleHint();
    };

  const handleDestination =
    () => {
      renderDestinationHint();
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setFormMessage(
        feedback,
        '',
      );

      const formData =
        new FormData(form);

      const cycle =
        currentCycle();

      const data = {
        harvestDate:
          String(
            formData.get(
              'harvestDate',
            ) || '',
          ),
        quantity:
          normalizeQuantity(
            formData.get(
              'quantity',
            ),
          ),
        unit:
          String(
            formData.get(
              'unit',
            ) || '',
          ),
        qualityClassification:
          String(
            formData.get(
              'qualityClassification',
            ) || '',
          ).trim(),
        destination:
          String(
            formData.get(
              'destination',
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
        validateHarvest(
          data,
          cycle,
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
          : 'Registrando…',
      );

      try {
        const saved =
          editing
            ? await updateHarvest(
                harvest.id,
                data,
              )
            : await createHarvest(
                cycle.id,
                data,
              );

        showToast(
          editing
            ? 'Colheita atualizada.'
            : 'Colheita registrada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/more/harvests/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar colheita:',
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

  cycleSelect?.addEventListener(
    'change',
    handleCycle,
  );

  destinationSelect.addEventListener(
    'change',
    handleDestination,
  );

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  renderCycleHint();
  renderDestinationHint();

  return () => {
    cycleSelect?.removeEventListener(
      'change',
      handleCycle,
    );

    destinationSelect.removeEventListener(
      'change',
      handleDestination,
    );

    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
