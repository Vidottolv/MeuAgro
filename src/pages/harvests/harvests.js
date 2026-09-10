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
  listHarvests,
} from '../../services/harvestService.js';

import {
  HARVEST_DESTINATIONS,
} from '../../constants/harvestDestinations.js';

import {
  harvestCard,
} from './harvestView.js';

import {
  escapeHtml,
  formatCurrencyBRL,
} from '../../js/html.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

import {
  showToast,
} from '../../components/toast.js';

function currentMonth() {
  const now =
    new Date();

  return [
    now.getFullYear(),
    String(
      now.getMonth() + 1,
    ).padStart(2, '0'),
  ].join('-');
}

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

function destinationOptions(
  selected,
) {
  return `
    <option value="">
      Todos os destinos
    </option>

    ${HARVEST_DESTINATIONS
      .map(
        ([value, label]) => `
          <option
            value="${value}"
            ${
              selected ===
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
  `;
}

export async function renderHarvestsPage({
  session,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let properties = [];

  try {
    properties =
      await listActiveProperties();
  } catch (error) {
    console.error(
      'Erro ao carregar propriedades:',
      error,
    );
  }

  const query =
    new URLSearchParams(
      window.location.search,
    );

  let propertyId =
    query.get('property') ||
    '';

  let cycleId =
    query.get('cycle') ||
    '';

  let destination =
    query.get('destination') ||
    '';

  let month =
    query.get('month') ||
    '';

  app.innerHTML =
    appShell({
      session,
      title: 'Colheitas',
      eyebrow: 'Produção',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Etapa 21
            </p>

            <h2>
              Colheitas registradas
            </h2>

            <p>
              Um mesmo ciclo pode receber várias colheitas sem perder o histórico das anteriores.
            </p>
          </div>

          <a
            href="/more/harvests/new"
            class="icon-button"
            aria-label="Registrar colheita"
            data-link
          >
            ${icon('plus')}
          </a>
        </section>

        <section class="harvest-toolbar">
          <div class="field">
            <label
              for="harvest-property-filter"
            >
              Propriedade
            </label>

            <select
              id="harvest-property-filter"
            >
              ${propertyOptions(
                properties,
                propertyId,
              )}
            </select>
          </div>

          <div class="field">
            <label
              for="harvest-destination-filter"
            >
              Destino
            </label>

            <select
              id="harvest-destination-filter"
            >
              ${destinationOptions(
                destination,
              )}
            </select>
          </div>

          <div class="field">
            <label
              for="harvest-month-filter"
            >
              Mês
            </label>

            <input
              id="harvest-month-filter"
              type="month"
              value="${escapeHtml(
                month,
              )}"
            />
          </div>
        </section>

        <div class="harvest-list-actions">
          <button
            id="harvest-current-month"
            class="button button--ghost button--compact"
            type="button"
          >
            ${icon('calendar')}
            Mês atual
          </button>

          <button
            id="harvest-clear-filters"
            class="button button--ghost button--compact"
            type="button"
          >
            Limpar filtros
          </button>

          <a
            href="/more/harvests/new"
            class="button button--primary button--compact"
            data-link
          >
            ${icon('plus')}
            Nova colheita
          </a>
        </div>

        <div
          id="harvests-content"
        >
          ${loader({
            label:
              'Carregando colheitas…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#harvests-content',
    );

  const propertySelect =
    document.querySelector(
      '#harvest-property-filter',
    );

  const destinationSelect =
    document.querySelector(
      '#harvest-destination-filter',
    );

  const monthInput =
    document.querySelector(
      '#harvest-month-filter',
    );

  const currentMonthButton =
    document.querySelector(
      '#harvest-current-month',
    );

  const clearButton =
    document.querySelector(
      '#harvest-clear-filters',
    );

  let disposed = false;

  function syncUrl() {
    const params =
      new URLSearchParams();

    if (propertyId) {
      params.set(
        'property',
        propertyId,
      );
    }

    if (cycleId) {
      params.set(
        'cycle',
        cycleId,
      );
    }

    if (destination) {
      params.set(
        'destination',
        destination,
      );
    }

    if (month) {
      params.set(
        'month',
        month,
      );
    }

    const value =
      params.toString();

    window.history.replaceState(
      {},
      '',
      value
        ? `/more/harvests?${value}`
        : '/more/harvests',
    );
  }

  async function loadHarvests() {
    content.innerHTML =
      loader({
        label:
          'Carregando colheitas…',
      });

    try {
      const harvests =
        await listHarvests({
          cycleId:
            cycleId ||
            null,
          propertyId:
            propertyId ||
            null,
          destination:
            destination ||
            null,
          month:
            month || null,
        });

      if (disposed) {
        return;
      }

      if (!harvests.length) {
        content.innerHTML =
          emptyState({
            iconName:
              'harvest',
            title:
              'Nenhuma colheita encontrada',
            description:
              'Registre a primeira colheita ou altere os filtros.',
            actionLabel:
              'Registrar colheita',
            actionHref:
              '/more/harvests/new',
          });

        return;
      }

      const salesRevenue =
        harvests.reduce(
          (total, harvest) =>
            total +
            (harvest.sales || [])
              .reduce(
                (sum, sale) =>
                  sum +
                  Number(
                    sale.total_value ||
                    0,
                  ),
                0,
              ),
          0,
        );

      const saleHarvestCount =
        harvests.filter(
          (harvest) =>
            (harvest.sales || [])
              .length > 0,
        ).length;

      content.innerHTML = `
        <section class="harvest-list-summary">
          <article>
            <span>Registros</span>
            <strong>
              ${harvests.length}
            </strong>
          </article>

          <article>
            <span>Com vendas</span>
            <strong>
              ${saleHarvestCount}
            </strong>
          </article>

          <article>
            <span>Receita vinculada</span>
            <strong>
              ${formatCurrencyBRL(
                salesRevenue,
              )}
            </strong>
          </article>
        </section>

        <section class="harvest-list">
          ${harvests
            .map(
              harvestCard,
            )
            .join('')}
        </section>
      `;
    } catch (error) {
      console.error(
        'Erro ao listar colheitas:',
        error,
      );

      content.innerHTML =
        emptyState({
          iconName:
            'harvest',
          title:
            'Não foi possível carregar',
          description:
            'Verifique a conexão e tente novamente.',
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

  const handleFilters =
    () => {
      propertyId =
        propertySelect.value;

      destination =
        destinationSelect.value;

      month =
        monthInput.value;

      syncUrl();
      void loadHarvests();
    };

  const handleCurrentMonth =
    () => {
      month =
        currentMonth();

      monthInput.value =
        month;

      syncUrl();
      void loadHarvests();
    };

  const handleClear =
    () => {
      propertyId = '';
      cycleId = '';
      destination = '';
      month = '';

      propertySelect.value =
        '';

      destinationSelect.value =
        '';

      monthInput.value =
        '';

      syncUrl();
      void loadHarvests();
    };

  propertySelect.addEventListener(
    'change',
    handleFilters,
  );

  destinationSelect.addEventListener(
    'change',
    handleFilters,
  );

  monthInput.addEventListener(
    'change',
    handleFilters,
  );

  currentMonthButton.addEventListener(
    'click',
    handleCurrentMonth,
  );

  clearButton.addEventListener(
    'click',
    handleClear,
  );

  await loadHarvests();

  return () => {
    disposed = true;

    propertySelect.removeEventListener(
      'change',
      handleFilters,
    );

    destinationSelect.removeEventListener(
      'change',
      handleFilters,
    );

    monthInput.removeEventListener(
      'change',
      handleFilters,
    );

    currentMonthButton.removeEventListener(
      'click',
      handleCurrentMonth,
    );

    clearButton.removeEventListener(
      'click',
      handleClear,
    );
  };
}
