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
  getHarvestForecastSummary,
  listHarvestForecastCycles,
} from '../../services/harvestForecastService.js';

import {
  HARVEST_FORECAST_FILTERS,
} from '../../constants/harvestForecast.js';

import {
  harvestForecastCard,
} from './harvestForecastView.js';

import {
  escapeHtml,
} from '../../js/html.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

function propertyOptions(
  properties,
  selected,
) {
  return `
    <option value="">
      Todas as propriedades
    </option>

    ${properties
      .map(
        (property) => `
          <option
            value="${property.id}"
            ${
              property.id ===
              selected
                ? 'selected'
                : ''
            }
          >
            ${escapeHtml(
              property.name,
            )}
          </option>
        `,
      )
      .join('')}
  `;
}

export async function renderHarvestForecastPage({
  session,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let properties = [];
  let summary = {
    total: 0,
    overdue: 0,
    today: 0,
    harvest_week: 0,
    upcoming: 0,
  };

  try {
    [
      properties,
      summary,
    ] =
      await Promise.all([
        listActiveProperties(),
        getHarvestForecastSummary(),
      ]);
  } catch (error) {
    console.error(
      'Erro ao preparar previsão de colheita:',
      error,
    );
  }

  const query =
    new URLSearchParams(
      window.location.search,
    );

  let filter =
    query.get('filter') ||
    'all';

  let propertyId =
    query.get('property') ||
    '';

  if (
    !HARVEST_FORECAST_FILTERS
      .some(
        ([value]) =>
          value === filter,
      )
  ) {
    filter = 'all';
  }

  app.innerHTML =
    appShell({
      session,
      title:
        'Previsão de colheita',
      eyebrow: 'Produção',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Previsão de colheita
            </p>

            <h2>
              Acompanhe o que está próximo de colher
            </h2>

            <p>
              A previsão atual do ciclo é comparada com a data de hoje para destacar atrasos, colheitas do dia e a semana de colheita.
            </p>
          </div>

          <a
            href="/more/settings"
            class="icon-button"
            aria-label="Configurar lembretes"
            data-link
          >
            ${icon('bell')}
          </a>
        </section>

        <section class="harvest-summary-grid">
          <article class="harvest-summary-card harvest-summary-card--danger">
            <span>Atrasadas</span>
            <strong>
              ${summary.overdue}
            </strong>
          </article>

          <article class="harvest-summary-card harvest-summary-card--today">
            <span>Hoje</span>
            <strong>
              ${summary.today}
            </strong>
          </article>

          <article class="harvest-summary-card harvest-summary-card--week">
            <span>Próximos 7 dias</span>
            <strong>
              ${summary.harvest_week}
            </strong>
          </article>

          <article class="harvest-summary-card">
            <span>Com previsão</span>
            <strong>
              ${summary.total}
            </strong>
          </article>
        </section>

        <section class="harvest-forecast-toolbar">
          <div
            class="segmented-control harvest-forecast-tabs"
            role="tablist"
            aria-label="Filtro de previsão"
          >
            ${HARVEST_FORECAST_FILTERS
              .map(
                ([value, label]) => `
                  <button
                    type="button"
                    class="
                      segmented-control__button
                      ${
                        value === filter
                          ? 'segmented-control__button--active'
                          : ''
                      }
                    "
                    data-harvest-filter="${value}"
                    aria-selected="${
                      value === filter
                    }"
                  >
                    ${label}
                  </button>
                `,
              )
              .join('')}
          </div>

          <div class="field harvest-forecast-property-filter">
            <label
              for="harvest-property"
            >
              Propriedade
            </label>

            <select
              id="harvest-property"
            >
              ${propertyOptions(
                properties,
                propertyId,
              )}
            </select>
          </div>
        </section>

        <div
          id="harvest-forecast-content"
        >
          ${loader({
            label:
              'Carregando previsões…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#harvest-forecast-content',
    );

  const propertySelect =
    document.querySelector(
      '#harvest-property',
    );

  const filterButtons =
    [
      ...document.querySelectorAll(
        '[data-harvest-filter]',
      ),
    ];

  let disposed = false;

  function syncUrl() {
    const params =
      new URLSearchParams();

    if (filter !== 'all') {
      params.set(
        'filter',
        filter,
      );
    }

    if (propertyId) {
      params.set(
        'property',
        propertyId,
      );
    }

    const value =
      params.toString();

    window.history.replaceState(
      {},
      '',
      value
        ? `/more/harvest-forecast?${value}`
        : '/more/harvest-forecast',
    );
  }

  async function loadCycles() {
    content.innerHTML =
      loader({
        label:
          'Carregando previsões…',
      });

    try {
      const cycles =
        await listHarvestForecastCycles({
          propertyId:
            propertyId || null,
          filter,
        });

      if (disposed) {
        return;
      }

      if (!cycles.length) {
        content.innerHTML =
          emptyState({
            iconName:
              'harvest',
            title:
              'Nenhum ciclo neste filtro',
            description:
              filter === 'all'
                ? 'Os ciclos com previsão atual de colheita aparecerão aqui.'
                : 'Altere o filtro ou atualize a previsão de um plantio.',
            actionLabel:
              'Abrir plantios',
            actionHref:
              '/plantings',
          });

        return;
      }

      content.innerHTML = `
        <section class="harvest-forecast-list">
          ${cycles
            .map(
              harvestForecastCard,
            )
            .join('')}
        </section>
      `;
    } catch (error) {
      console.error(
        'Erro ao carregar previsões:',
        error,
      );

      content.innerHTML =
        emptyState({
          iconName:
            'harvest',
          title:
            'Não foi possível carregar',
          description:
            'Verifique sua conexão e tente novamente.',
        });

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

  const handleFilter =
    (event) => {
      const button =
        event.target.closest(
          '[data-harvest-filter]',
        );

      if (!button) {
        return;
      }

      filter =
        button.dataset
          .harvestFilter;

      filterButtons.forEach(
        (item) => {
          const active =
            item === button;

          item.classList.toggle(
            'segmented-control__button--active',
            active,
          );

          item.setAttribute(
            'aria-selected',
            String(active),
          );
        },
      );

      syncUrl();
      void loadCycles();
    };

  const handleProperty =
    () => {
      propertyId =
        propertySelect.value;

      syncUrl();
      void loadCycles();
    };

  filterButtons.forEach(
    (button) => {
      button.addEventListener(
        'click',
        handleFilter,
      );
    },
  );

  propertySelect.addEventListener(
    'change',
    handleProperty,
  );

  await loadCycles();

  return () => {
    disposed = true;

    filterButtons.forEach(
      (button) => {
        button.removeEventListener(
          'click',
          handleFilter,
        );
      },
    );

    propertySelect.removeEventListener(
      'change',
      handleProperty,
    );
  };
}
