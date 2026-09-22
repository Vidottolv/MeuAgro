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
  listActiveProperties,
} from '../../services/propertyService.js';

import {
  listActiveCrops,
} from '../../services/cropService.js';

import {
  listProductionCycles,
  restoreProductionCycle,
} from '../../services/productionCycleService.js';

import {
  productionCycleCard,
} from './productionCycleView.js';

import {
  PRODUCTION_CYCLE_STATUSES,
} from '../../constants/productionCycleStatus.js';

import {
  escapeHtml,
} from '../../js/html.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  showConfirmModal,
} from '../../components/confirmModal.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

function options(
  items,
  {
    selected = '',
    emptyLabel,
  },
) {
  return `
    <option value="">
      ${emptyLabel}
    </option>

    ${items
      .map(
        (item) => `
          <option
            value="${item.id}"
            ${
              selected === item.id
                ? 'selected'
                : ''
            }
          >
            ${escapeHtml(
              item.name,
            )}
          </option>
        `,
      )
      .join('')}
  `;
}

export async function renderPlantingsPage({
  session,
}) {
  const app =
    document.querySelector('#app');

  let properties = [];
  let crops = [];

  try {
    [
      properties,
      crops,
    ] =
      await Promise.all([
        listActiveProperties(),
        listActiveCrops(),
      ]);
  } catch (error) {
    console.error(
      'Erro ao carregar filtros:',
      error,
    );
  }

  const query =
    new URLSearchParams(
      window.location.search,
    );

  let propertyFilter =
    query.get('property') ||
    '';

  let cropFilter =
    query.get('crop') ||
    '';

  let statusFilter =
    query.get('status') ||
    '';

  let openOnly =
    query.get('open') === '1';

  let archived =
    query.get('archived') === '1';

  app.innerHTML =
    appShell({
      session,
      title: 'Plantios',
      eyebrow: 'Ciclos produtivos',
      activeNav: 'plantings',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Plantios
            </p>

            <h2>
              Histórico de ciclos produtivos
            </h2>

            <p>
              Cada plantio é um ciclo independente, preservando o histórico da área ao longo do tempo.
            </p>
          </div>

          <a
            href="/plantings/new${
              propertyFilter
                ? `?property=${encodeURIComponent(
                    propertyFilter,
                  )}`
                : ''
            }"
            class="icon-button"
            aria-label="Registrar plantio"
            data-link
          >
            ${icon('plus')}
          </a>
        </section>

        ${
          !properties.length
            ? emptyState({
                iconName: 'map',
                title:
                  'Cadastre uma propriedade primeiro',
                description:
                  'Para registrar um plantio você precisa de uma propriedade e pelo menos uma área.',
                actionLabel:
                  'Cadastrar propriedade',
                actionHref:
                  '/properties/new',
              })
            : `
              <section class="cycle-filters">
                <div class="field cycle-filter-field">
                  <label
                    for="cycle-property-filter"
                  >
                    Propriedade
                  </label>

                  <select
                    id="cycle-property-filter"
                  >
                    ${options(
                      properties,
                      {
                        selected:
                          propertyFilter,
                        emptyLabel:
                          'Todas as propriedades',
                      },
                    )}
                  </select>
                </div>

                <div class="field cycle-filter-field">
                  <label
                    for="cycle-crop-filter"
                  >
                    Cultura
                  </label>

                  <select
                    id="cycle-crop-filter"
                  >
                    ${options(
                      crops,
                      {
                        selected:
                          cropFilter,
                        emptyLabel:
                          'Todas as culturas',
                      },
                    )}
                  </select>
                </div>

                <div class="field cycle-filter-field">
                  <label
                    for="cycle-status-filter"
                  >
                    Status
                  </label>

                  <select
                    id="cycle-status-filter"
                    ${
                      archived ||
                      openOnly
                        ? 'disabled'
                        : ''
                    }
                  >
                    <option value="">
                      Todos os status
                    </option>

                    ${PRODUCTION_CYCLE_STATUSES
                      .map(
                        ([value, label]) => `
                          <option
                            value="${value}"
                            ${
                              statusFilter ===
                                value
                                ? 'selected'
                                : ''
                            }
                          >
                            ${label}
                          </option>
                        `,
                      )
                      .join('')}
                  </select>
                </div>
              </section>

              <section class="cycle-filter-toggles">
                <label>
                  <input
                    id="cycle-open-filter"
                    type="checkbox"
                    ${
                      openOnly
                        ? 'checked'
                        : ''
                    }
                    ${
                      archived
                        ? 'disabled'
                        : ''
                    }
                  />
                  <span>
                    Somente em aberto
                  </span>
                </label>

                <label>
                  <input
                    id="cycle-archived-filter"
                    type="checkbox"
                    ${
                      archived
                        ? 'checked'
                        : ''
                    }
                  />
                  <span>
                    Mostrar arquivados
                  </span>
                </label>

                <a
                  href="/plantings/new${
                    propertyFilter
                      ? `?property=${encodeURIComponent(
                          propertyFilter,
                        )}`
                      : ''
                  }"
                  class="button button--primary button--compact"
                  data-link
                >
                  ${icon('plus')}
                  Novo plantio
                </a>
              </section>

              <div id="cycles-content">
                ${loader({
                  label:
                    'Carregando plantios…',
                })}
              </div>
            `
        }
      `,
    });

  if (!properties.length) {
    return null;
  }

  const content =
    document.querySelector(
      '#cycles-content',
    );

  const propertySelect =
    document.querySelector(
      '#cycle-property-filter',
    );

  const cropSelect =
    document.querySelector(
      '#cycle-crop-filter',
    );

  const statusSelect =
    document.querySelector(
      '#cycle-status-filter',
    );

  const openCheckbox =
    document.querySelector(
      '#cycle-open-filter',
    );

  const archivedCheckbox =
    document.querySelector(
      '#cycle-archived-filter',
    );

  let disposed = false;

  function syncUrl() {
    const params =
      new URLSearchParams();

    if (propertyFilter) {
      params.set(
        'property',
        propertyFilter,
      );
    }

    if (cropFilter) {
      params.set(
        'crop',
        cropFilter,
      );
    }

    if (
      statusFilter &&
      !openOnly &&
      !archived
    ) {
      params.set(
        'status',
        statusFilter,
      );
    }

    if (
      openOnly &&
      !archived
    ) {
      params.set(
        'open',
        '1',
      );
    }

    if (archived) {
      params.set(
        'archived',
        '1',
      );
    }

    const value =
      params.toString();

    window.history.replaceState(
      {},
      '',
      value
        ? `/plantings?${value}`
        : '/plantings',
    );
  }

  async function loadCycles() {
    content.innerHTML =
      loader({
        label:
          archived
            ? 'Carregando plantios arquivados…'
            : 'Carregando plantios…',
      });

    try {
      const cycles =
        await listProductionCycles({
          propertyId:
            propertyFilter || null,
          cropId:
            cropFilter || null,
          status:
            statusFilter || null,
          openOnly,
          archived,
        });

      if (disposed) return;

      if (!cycles.length) {
        content.innerHTML =
          archived
            ? emptyState({
                iconName: 'archive',
                title:
                  'Nenhum plantio arquivado',
                description:
                  'Ciclos arquivados permanecerão preservados e aparecerão aqui.',
              })
            : emptyState({
                iconName: 'sprout',
                title:
                  'Nenhum plantio encontrado',
                description:
                  'Registre um novo ciclo produtivo ou altere os filtros.',
                actionLabel:
                  'Registrar plantio',
                actionHref:
                  `/plantings/new${
                    propertyFilter
                      ? `?property=${encodeURIComponent(
                          propertyFilter,
                        )}`
                      : ''
                  }`,
              });

        return;
      }

      content.innerHTML = `
        <section class="cycle-list">
          ${cycles
            .map(
              (cycle) =>
                productionCycleCard(
                  cycle,
                  {
                    archived,
                  },
                ),
            )
            .join('')}
        </section>
      `;
    } catch (error) {
      console.error(
        'Erro ao listar plantios:',
        error,
      );

      content.innerHTML =
        emptyState({
          iconName: 'sprout',
          title:
            'Não foi possível carregar',
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
      propertyFilter =
        propertySelect.value;

      cropFilter =
        cropSelect.value;

      statusFilter =
        statusSelect.value;

      openOnly =
        openCheckbox.checked;

      archived =
        archivedCheckbox.checked;

      if (archived) {
        openOnly = false;
        openCheckbox.checked =
          false;
      }

      statusSelect.disabled =
        archived || openOnly;

      openCheckbox.disabled =
        archived;

      syncUrl();
      void loadCycles();
    };

  const handleRestore =
    async (event) => {
      const button =
        event.target.closest(
          '[data-action="restore-cycle"]',
        );

      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const confirmed =
        await showConfirmModal({
          title:
            'Restaurar plantio?',
          message:
            'O ciclo voltará ao histórico normal. As referências atuais de propriedade, área, safra e cultura serão validadas novamente.',
          confirmLabel:
            'Restaurar',
        });

      if (!confirmed) return;

      button.disabled = true;

      try {
        await restoreProductionCycle(
          button.dataset.cycleId,
        );

        showToast(
          'Plantio restaurado.',
          {
            type: 'success',
          },
        );

        await loadCycles();
      } catch (error) {
        console.error(
          'Erro ao restaurar ciclo:',
          error,
        );

        showToast(
          getDataErrorMessage(error),
          {
            type: 'error',
          },
        );

        button.disabled = false;
      }
    };

  [
    propertySelect,
    cropSelect,
    statusSelect,
    openCheckbox,
    archivedCheckbox,
  ].forEach(
    (element) => {
      element.addEventListener(
        'change',
        handleFilters,
      );
    },
  );

  document.addEventListener(
    'click',
    handleRestore,
  );

  await loadCycles();

  return () => {
    disposed = true;

    [
      propertySelect,
      cropSelect,
      statusSelect,
      openCheckbox,
      archivedCheckbox,
    ].forEach(
      (element) => {
        element.removeEventListener(
          'change',
          handleFilters,
        );
      },
    );

    document.removeEventListener(
      'click',
      handleRestore,
    );
  };
}
