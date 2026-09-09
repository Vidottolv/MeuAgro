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
  listActiveProperties,
} from '../../services/propertyService.js';

import {
  listAreasByProperty,
} from '../../services/areaService.js';

import {
  listSeasons,
} from '../../services/seasonService.js';

import {
  getCropById,
  listActiveCrops,
} from '../../services/cropService.js';

import {
  createProductionCycle,
  getProductionCycleById,
  suggestHarvestDate,
  updateProductionCycle,
} from '../../services/productionCycleService.js';

import {
  PRODUCTION_CYCLE_STATUSES,
} from '../../constants/productionCycleStatus.js';

import {
  PLANTED_UNITS,
} from '../../constants/plantedUnits.js';

import {
  escapeHtml,
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
  const now = new Date();

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

function options(
  items,
  {
    selected = '',
    emptyLabel = 'Selecione',
    label,
  } = {},
) {
  return `
    <option value="">
      ${emptyLabel}
    </option>

    ${items
      .filter(Boolean)
      .map(
        (item) => `
          <option
            value="${item.id}"
            ${
              item.id === selected
                ? 'selected'
                : ''
            }
          >
            ${escapeHtml(
              label
                ? label(item)
                : item.name,
            )}
          </option>
        `,
      )
      .join('')}
  `;
}

function unitOptions(selected) {
  return `
    <option value="">
      Selecione
    </option>

    ${PLANTED_UNITS
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

function statusOptions(selected) {
  return PRODUCTION_CYCLE_STATUSES
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

function normalizeQuantity(raw) {
  const value =
    String(raw || '')
      .trim()
      .replace(',', '.');

  if (!value) return '';
  return Number(value);
}

function validateCycle(data) {
  if (!data.propertyId) {
    return 'Selecione a propriedade.';
  }

  if (!data.areaId) {
    return 'Selecione a área.';
  }

  if (!data.cropId) {
    return 'Selecione a cultura.';
  }

  if (!data.plantingDate) {
    return 'Informe a data do plantio.';
  }

  if (
    data.plantedQuantity !== '' &&
    (
      !Number.isFinite(
        data.plantedQuantity,
      ) ||
      data.plantedQuantity < 0
    )
  ) {
    return 'Informe uma quantidade plantada válida.';
  }

  if (
    data.plantedQuantity !== '' &&
    !data.plantedUnit
  ) {
    return 'Selecione a unidade da quantidade plantada.';
  }

  const dates = [
    [
      data.initialHarvestForecast,
      'A previsão inicial',
    ],
    [
      data.currentHarvestForecast,
      'A previsão atual',
    ],
    [
      data.finalHarvestDate,
      'A data real da colheita',
    ],
  ];

  for (const [date, label] of dates) {
    if (
      date &&
      date < data.plantingDate
    ) {
      return `${label} não pode ser anterior à data do plantio.`;
    }
  }

  return null;
}

export async function renderProductionCycleFormPage({
  session,
  params,
  mode,
}) {
  const app =
    document.querySelector('#app');

  const editing =
    mode === 'edit';

  let properties = [];
  let crops = [];
  let cycle = null;

  try {
    [
      properties,
      crops,
    ] =
      await Promise.all([
        listActiveProperties(),
        listActiveCrops(),
      ]);

    if (editing) {
      cycle =
        await getProductionCycleById(
          params.cycleId,
        );
    }
  } catch (error) {
    console.error(
      'Erro ao preparar formulário:',
      error,
    );
  }

  if (!properties.length) {
    app.innerHTML =
      appShell({
        session,
        title: 'Plantio',
        eyebrow: 'Ciclos produtivos',
        activeNav: 'plantings',
        content:
          emptyState({
            iconName: 'map',
            title:
              'Cadastre uma propriedade primeiro',
            description:
              'O plantio precisa estar ligado a uma propriedade e uma área.',
            actionLabel:
              'Cadastrar propriedade',
            actionHref:
              '/properties/new',
          }),
      });

    return null;
  }

  if (
    editing &&
    (
      !cycle ||
      cycle.deleted_at
    )
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Plantio',
        eyebrow: 'Ciclos produtivos',
        activeNav: 'plantings',
        content:
          emptyState({
            iconName: 'sprout',
            title:
              'Plantio não encontrado',
            description:
              'O ciclo pode ter sido arquivado ou não pertencer à sua conta.',
            actionLabel:
              'Voltar para plantios',
            actionHref:
              '/plantings',
          }),
      });

    return null;
  }

  if (
    editing &&
    cycle?.crop &&
    !crops.some(
      (crop) =>
        crop.id === cycle.crop.id,
    )
  ) {
    const existingCrop =
      await getCropById(
        cycle.crop.id,
      );

    if (existingCrop) {
      crops.push(existingCrop);
    }
  }

  const query =
    new URLSearchParams(
      window.location.search,
    );

  const requestedProperty =
    query.get('property');

  const requestedArea =
    query.get('area');

  const requestedSeason =
    query.get('season');

  let selectedProperty =
    cycle?.property_id ||
    (
      properties.some(
        (property) =>
          property.id ===
          requestedProperty,
      )
        ? requestedProperty
        : ''
    );

  let selectedArea =
    cycle?.area_id ||
    requestedArea ||
    '';

  let selectedSeason =
    cycle?.season_id ||
    requestedSeason ||
    '';

  let areas = [];
  let seasons = [];

  async function loadDependencies(
    propertyId,
  ) {
    if (!propertyId) {
      return {
        areas: [],
        seasons: [],
      };
    }

    const [
      loadedAreas,
      loadedSeasons,
    ] =
      await Promise.all([
        listAreasByProperty(
          propertyId,
        ),
        listSeasons({
          propertyId,
          archived: false,
        }),
      ]);

    return {
      areas: loadedAreas,
      seasons: loadedSeasons,
    };
  }

  try {
    const dependencies =
      await loadDependencies(
        selectedProperty,
      );

    areas =
      dependencies.areas;

    seasons =
      dependencies.seasons;

    if (
      !areas.some(
        (area) =>
          area.id === selectedArea,
      )
    ) {
      selectedArea = '';
    }

    if (
      !seasons.some(
        (season) =>
          season.id === selectedSeason,
      )
    ) {
      selectedSeason = '';
    }
  } catch (error) {
    console.error(
      'Erro ao carregar áreas/safras:',
      error,
    );
  }

  app.innerHTML =
    appShell({
      session,
      title:
        editing
          ? 'Editar plantio'
          : 'Novo plantio',
      eyebrow: 'Ciclos produtivos',
      activeNav: 'plantings',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                editing
                  ? `/plantings/${cycle.id}`
                  : '/plantings'
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
                  ? 'Editar ciclo produtivo'
                  : 'Registrar novo plantio'
              }
            </h2>

            <p>
              O plantio permanece como um ciclo independente para que o histórico da área nunca seja perdido.
            </p>
          </div>
        </section>

        <div
          id="cycle-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="cycle-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Local e safra
              </h2>

              <p>
                A área é obrigatória. A safra é opcional e precisa pertencer à mesma propriedade.
              </p>
            </div>

            <div class="field">
              <label
                for="cycle-property"
              >
                Propriedade *
              </label>

              <select
                id="cycle-property"
                name="propertyId"
                required
              >
                ${options(
                  properties,
                  {
                    selected:
                      selectedProperty,
                  },
                )}
              </select>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="cycle-area"
                >
                  Área *
                </label>

                <select
                  id="cycle-area"
                  name="areaId"
                  required
                  ${
                    selectedProperty
                      ? ''
                      : 'disabled'
                  }
                >
                  ${options(
                    areas,
                    {
                      selected:
                        selectedArea,
                      emptyLabel:
                        areas.length
                          ? 'Selecione'
                          : 'Nenhuma área disponível',
                      label:
                        (area) =>
                          `${area.name}${
                            area.area_type?.name
                              ? ` • ${area.area_type.name}`
                              : ''
                          }`,
                    },
                  )}
                </select>
              </div>

              <div class="field">
                <label
                  for="cycle-season"
                >
                  Safra
                </label>

                <select
                  id="cycle-season"
                  name="seasonId"
                  ${
                    selectedProperty
                      ? ''
                      : 'disabled'
                  }
                >
                  ${options(
                    seasons,
                    {
                      selected:
                        selectedSeason,
                      emptyLabel:
                        'Sem safra',
                    },
                  )}
                </select>
              </div>
            </div>

            <div
              id="cycle-no-area-warning"
              class="form-message form-message--info"
              ${
                selectedProperty &&
                !areas.length
                  ? ''
                  : 'hidden'
              }
            >
              Esta propriedade ainda não possui áreas ativas.
              <a
                id="cycle-create-area-link"
                href="${
                  selectedProperty
                    ? `/properties/${selectedProperty}/areas/new`
                    : '#'
                }"
                class="link link--strong"
                data-link
              >
                Cadastrar área
              </a>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Cultura</h2>
              <p>
                Escolha uma cultura padrão ou personalizada e, se necessário, informe a variedade.
              </p>
            </div>

            <div class="field">
              <label
                for="cycle-crop"
              >
                Cultura *
              </label>

              <select
                id="cycle-crop"
                name="cropId"
                required
              >
                ${options(
                  crops,
                  {
                    selected:
                      cycle?.crop_id || '',
                    label:
                      (crop) =>
                        `${crop.name}${
                          crop.is_system
                            ? ''
                            : ' • personalizada'
                        }${
                          crop.active
                            ? ''
                            : ' • inativa'
                        }`,
                  },
                )}
              </select>

              <small
                id="cycle-crop-hint"
                class="field__hint"
              ></small>
            </div>

            <div class="field">
              <label
                for="cycle-variety"
              >
                Variedade
              </label>

              <input
                id="cycle-variety"
                name="variety"
                type="text"
                maxlength="160"
                placeholder="Ex.: Milho AG 8700"
                value="${escapeHtml(
                  cycle?.variety || '',
                )}"
              />
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="cycle-quantity"
                >
                  Quantidade plantada
                </label>

                <input
                  id="cycle-quantity"
                  name="plantedQuantity"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 5"
                  value="${
                    cycle?.planted_quantity ??
                    ''
                  }"
                />
              </div>

              <div class="field">
                <label
                  for="cycle-unit"
                >
                  Unidade
                </label>

                <select
                  id="cycle-unit"
                  name="plantedUnit"
                >
                  ${unitOptions(
                    cycle?.planted_unit ||
                    '',
                  )}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Datas e previsão
              </h2>

              <p>
                A previsão sugerida usa a data do plantio + ciclo médio da cultura e continua editável.
              </p>
            </div>

            <div class="field">
              <label
                for="cycle-planting-date"
              >
                Data do plantio *
              </label>

              <input
                id="cycle-planting-date"
                name="plantingDate"
                type="date"
                value="${
                  cycle?.planting_date ||
                  todayString()
                }"
                required
              />
            </div>

            <div class="cycle-forecast-grid">
              <div class="field">
                <label
                  for="cycle-initial-forecast"
                >
                  Previsão inicial
                </label>

                <input
                  id="cycle-initial-forecast"
                  name="initialHarvestForecast"
                  type="date"
                  value="${
                    cycle?.initial_harvest_forecast ||
                    ''
                  }"
                />
              </div>

              <div class="field">
                <div class="field__label-row">
                  <label
                    for="cycle-current-forecast"
                  >
                    Previsão atual
                  </label>

                  <button
                    id="cycle-recalculate-forecast"
                    class="inline-link-button"
                    type="button"
                  >
                    Recalcular
                  </button>
                </div>

                <input
                  id="cycle-current-forecast"
                  name="currentHarvestForecast"
                  type="date"
                  value="${
                    cycle?.current_harvest_forecast ||
                    ''
                  }"
                />
              </div>
            </div>

            <div class="field">
              <label
                for="cycle-final-harvest-date"
              >
                Data real da colheita
              </label>

              <input
                id="cycle-final-harvest-date"
                name="finalHarvestDate"
                type="date"
                value="${
                  cycle?.final_harvest_date ||
                  ''
                }"
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Situação</h2>
              <p>
                O status poderá evoluir ao longo do ciclo sem apagar os registros anteriores.
              </p>
            </div>

            <div class="field">
              <label
                for="cycle-status"
              >
                Status *
              </label>

              <select
                id="cycle-status"
                name="status"
                required
              >
                ${statusOptions(
                  cycle?.status ||
                  'planted',
                )}
              </select>
            </div>

            <div class="field">
              <label
                for="cycle-notes"
              >
                Observações
              </label>

              <textarea
                id="cycle-notes"
                name="notes"
                maxlength="2000"
                placeholder="Ex.: plantio realizado após preparo do solo..."
              >${escapeHtml(
                cycle?.notes || '',
              )}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                editing
                  ? `/plantings/${cycle.id}`
                  : '/plantings'
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="cycle-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar alterações'
                  : 'Registrar plantio'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#cycle-form',
    );

  const feedback =
    document.querySelector(
      '#cycle-form-feedback',
    );

  const submit =
    document.querySelector(
      '#cycle-submit',
    );

  const propertySelect =
    document.querySelector(
      '#cycle-property',
    );

  const areaSelect =
    document.querySelector(
      '#cycle-area',
    );

  const seasonSelect =
    document.querySelector(
      '#cycle-season',
    );

  const cropSelect =
    document.querySelector(
      '#cycle-crop',
    );

  const cropHint =
    document.querySelector(
      '#cycle-crop-hint',
    );

  const plantingDateInput =
    document.querySelector(
      '#cycle-planting-date',
    );

  const initialForecastInput =
    document.querySelector(
      '#cycle-initial-forecast',
    );

  const currentForecastInput =
    document.querySelector(
      '#cycle-current-forecast',
    );

  const recalculateButton =
    document.querySelector(
      '#cycle-recalculate-forecast',
    );

  const noAreaWarning =
    document.querySelector(
      '#cycle-no-area-warning',
    );

  function renderCropHint() {
    const selected =
      crops.find(
        (crop) =>
          crop.id ===
          cropSelect.value,
      );

    if (!selected) {
      cropHint.textContent = '';
      return;
    }

    cropHint.textContent =
      selected.average_cycle_days
        ? `Ciclo médio cadastrado: ${selected.average_cycle_days} dias.`
        : 'Esta cultura não possui ciclo médio cadastrado.';
  }

  async function recalculateForecast({
    fillInitial = false,
    silent = false,
  } = {}) {
    if (
      !cropSelect.value ||
      !plantingDateInput.value
    ) {
      if (!silent) {
        showToast(
          'Selecione a cultura e informe a data do plantio.',
          {
            type: 'error',
          },
        );
      }
      return;
    }

    recalculateButton.disabled =
      true;

    try {
      const suggested =
        await suggestHarvestDate(
          cropSelect.value,
          plantingDateInput.value,
        );

      if (!suggested) {
        if (!silent) {
          showToast(
            'A cultura selecionada não possui ciclo médio para sugerir a colheita.',
          );
        }
        return;
      }

      if (
        fillInitial &&
        !initialForecastInput.value
      ) {
        initialForecastInput.value =
          suggested;
      }

      currentForecastInput.value =
        suggested;

      if (!silent) {
        showToast(
          'Previsão recalculada pelo ciclo médio da cultura.',
          {
            type: 'success',
          },
        );
      }
    } catch (error) {
      console.error(
        'Erro ao sugerir colheita:',
        error,
      );

      if (!silent) {
        showToast(
          getDataErrorMessage(error),
          {
            type: 'error',
          },
        );
      }
    } finally {
      recalculateButton.disabled =
        false;
    }
  }

  async function refreshPropertyDependencies() {
    selectedProperty =
      propertySelect.value;

    areaSelect.disabled =
      !selectedProperty;

    seasonSelect.disabled =
      !selectedProperty;

    if (!selectedProperty) {
      areas = [];
      seasons = [];

      areaSelect.innerHTML =
        options([], {
          emptyLabel:
            'Selecione a propriedade',
        });

      seasonSelect.innerHTML =
        options([], {
          emptyLabel:
            'Sem safra',
        });

      noAreaWarning.hidden =
        true;

      return;
    }

    try {
      const dependencies =
        await loadDependencies(
          selectedProperty,
        );

      areas =
        dependencies.areas;

      seasons =
        dependencies.seasons;

      areaSelect.innerHTML =
        options(
          areas,
          {
            emptyLabel:
              areas.length
                ? 'Selecione'
                : 'Nenhuma área disponível',
            label:
              (area) =>
                `${area.name}${
                  area.area_type?.name
                    ? ` • ${area.area_type.name}`
                    : ''
                }`,
          },
        );

      seasonSelect.innerHTML =
        options(
          seasons,
          {
            emptyLabel:
              'Sem safra',
          },
        );

      noAreaWarning.hidden =
        areas.length > 0;

      const createAreaLink =
        document.querySelector(
          '#cycle-create-area-link',
        );

      if (createAreaLink) {
        createAreaLink.href =
          `/properties/${selectedProperty}/areas/new`;
      }
    } catch (error) {
      console.error(
        'Erro ao carregar dependências:',
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

  const handleCropChange =
    async () => {
      renderCropHint();

      if (!editing) {
        initialForecastInput.value = '';
        currentForecastInput.value = '';

        await recalculateForecast({
          fillInitial: true,
          silent: true,
        });
      }
    };

  const handlePlantingDateChange =
    async () => {
      if (!editing) {
        initialForecastInput.value = '';
        currentForecastInput.value = '';

        await recalculateForecast({
          fillInitial: true,
          silent: true,
        });
      }
    };

  const handleRecalculate =
    () =>
      recalculateForecast({
        fillInitial: true,
      });

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
        propertyId:
          String(
            formData.get(
              'propertyId',
            ) || '',
          ),
        areaId:
          String(
            formData.get(
              'areaId',
            ) || '',
          ),
        seasonId:
          String(
            formData.get(
              'seasonId',
            ) || '',
          ),
        cropId:
          String(
            formData.get(
              'cropId',
            ) || '',
          ),
        variety:
          String(
            formData.get(
              'variety',
            ) || '',
          ).trim(),
        plantedQuantity:
          normalizeQuantity(
            formData.get(
              'plantedQuantity',
            ),
          ),
        plantedUnit:
          String(
            formData.get(
              'plantedUnit',
            ) || '',
          ),
        plantingDate:
          String(
            formData.get(
              'plantingDate',
            ) || '',
          ),
        initialHarvestForecast:
          String(
            formData.get(
              'initialHarvestForecast',
            ) || '',
          ),
        currentHarvestForecast:
          String(
            formData.get(
              'currentHarvestForecast',
            ) || '',
          ),
        finalHarvestDate:
          String(
            formData.get(
              'finalHarvestDate',
            ) || '',
          ),
        status:
          String(
            formData.get(
              'status',
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
        validateCycle(data);

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
            ? await updateProductionCycle(
                cycle.id,
                data,
              )
            : await createProductionCycle(
                data,
              );

        showToast(
          editing
            ? 'Plantio atualizado.'
            : 'Plantio registrado.',
          {
            type: 'success',
          },
        );

        navigate(
          `/plantings/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar plantio:',
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

  renderCropHint();

  propertySelect.addEventListener(
    'change',
    refreshPropertyDependencies,
  );

  cropSelect.addEventListener(
    'change',
    handleCropChange,
  );

  plantingDateInput.addEventListener(
    'change',
    handlePlantingDateChange,
  );

  recalculateButton.addEventListener(
    'click',
    handleRecalculate,
  );

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  if (
    !editing &&
    cropSelect.value &&
    plantingDateInput.value &&
    !currentForecastInput.value
  ) {
    await recalculateForecast({
      fillInitial: true,
      silent: true,
    });
  }

  return () => {
    propertySelect.removeEventListener(
      'change',
      refreshPropertyDependencies,
    );

    cropSelect.removeEventListener(
      'change',
      handleCropChange,
    );

    plantingDateInput.removeEventListener(
      'change',
      handlePlantingDateChange,
    );

    recalculateButton.removeEventListener(
      'click',
      handleRecalculate,
    );

    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
