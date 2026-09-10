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
  getFinancialOverview,
  listCycleFinancialSummaries,
} from '../../services/financeService.js';

import {
  FINANCIAL_RESULT_FILTERS,
  getFinancialResultState,
} from '../../constants/financialResult.js';

import {
  PRODUCTION_CYCLE_STATUSES,
} from '../../constants/productionCycleStatus.js';

import {
  financeCycleCard,
} from './financeView.js';

import {
  escapeHtml,
  formatCurrencyBRL,
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
              property.id === selected
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

function statusOptions(
  selected,
) {
  return `
    <option value="">
      Todos os status
    </option>

    ${PRODUCTION_CYCLE_STATUSES
      .map(
        ([value, label]) => `
          <option
            value="${value}"
            ${
              value === selected
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

function resultOptions(
  selected,
) {
  return FINANCIAL_RESULT_FILTERS
    .map(
      ([value, label]) => `
        <option
          value="${value}"
          ${
            value === selected
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

export async function renderFinancePage({
  session,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let properties = [];
  let overview = {
    cycles_count: 0,
    cycles_with_activity_count: 0,
    positive_result_count: 0,
    negative_result_count: 0,
    break_even_count: 0,
    input_cost: 0,
    sales_revenue: 0,
    estimated_result: 0,
  };

  try {
    [
      properties,
      overview,
    ] =
      await Promise.all([
        listActiveProperties(),
        getFinancialOverview(),
      ]);
  } catch (error) {
    console.error(
      'Erro ao preparar financeiro:',
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

  let status =
    query.get('status') ||
    '';

  let resultFilter =
    query.get('result') ||
    'all';

  let search =
    query.get('search') ||
    '';

  if (
    !FINANCIAL_RESULT_FILTERS
      .some(
        ([value]) =>
          value === resultFilter,
      )
  ) {
    resultFilter = 'all';
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Financeiro',
      eyebrow: 'Resultados básicos',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Etapa 23
            </p>

            <h2>
              Custos, receitas e resultados
            </h2>

            <p>
              Consolidação básica por ciclo produtivo usando custos de insumos consumidos e receitas das vendas.
            </p>
          </div>
        </section>

        <section class="finance-overview-grid">
          <article class="finance-overview-card">
            <span>
              Custos de insumos
            </span>

            <strong class="finance-value--cost">
              ${formatCurrencyBRL(
                overview.input_cost,
              )}
            </strong>

            <small>
              Movimentações de uso registradas
            </small>
          </article>

          <article class="finance-overview-card">
            <span>
              Receita de vendas
            </span>

            <strong class="finance-value--revenue">
              ${formatCurrencyBRL(
                overview.sales_revenue,
              )}
            </strong>

            <small>
              Vendas vinculadas às colheitas
            </small>
          </article>

          <article class="finance-overview-card finance-overview-card--result">
            <span>
              Resultado estimado
            </span>

            <strong
              class="
                ${overview.estimated_result > 0
                  ? 'finance-value--positive'
                  : overview.estimated_result < 0
                    ? 'finance-value--negative'
                    : ''
                }
              "
            >
              ${formatCurrencyBRL(
                overview.estimated_result,
              )}
            </strong>

            <small>
              Receita - custos de insumos
            </small>
          </article>

          <article class="finance-overview-card">
            <span>
              Ciclos com movimento
            </span>

            <strong>
              ${overview.cycles_with_activity_count}
            </strong>

            <small>
              ${overview.positive_result_count} positivos •
              ${overview.negative_result_count} negativos
            </small>
          </article>
        </section>

        <section class="finance-scope-note">
          ${icon('info')}

          <div>
            <strong>
              Resultado básico, não lucro contábil
            </strong>

            <p>
              Nesta etapa são considerados apenas os custos dos insumos efetivamente consumidos e as receitas das vendas. Mão de obra, combustível, máquinas, energia, frete, impostos e outros custos ainda não entram no cálculo.
            </p>
          </div>
        </section>

        <section class="finance-toolbar">
          <div class="crop-search">
            ${icon('search')}

            <input
              id="finance-search"
              type="search"
              value="${escapeHtml(
                search,
              )}"
              placeholder="Buscar cultura, variedade, propriedade ou área..."
              autocomplete="off"
            />
          </div>

          <div class="field">
            <label
              for="finance-property"
            >
              Propriedade
            </label>

            <select
              id="finance-property"
            >
              ${propertyOptions(
                properties,
                propertyId,
              )}
            </select>
          </div>

          <div class="field">
            <label
              for="finance-status"
            >
              Status
            </label>

            <select
              id="finance-status"
            >
              ${statusOptions(
                status,
              )}
            </select>
          </div>

          <div class="field">
            <label
              for="finance-result"
            >
              Resultado
            </label>

            <select
              id="finance-result"
            >
              ${resultOptions(
                resultFilter,
              )}
            </select>
          </div>
        </section>

        <div class="harvest-list-actions">
          <button
            id="finance-clear-filters"
            class="button button--ghost button--compact"
            type="button"
          >
            Limpar filtros
          </button>

          <a
            href="/more/sales"
            class="button button--secondary button--compact"
            data-link
          >
            ${icon('cart')}
            Ver vendas
          </a>
        </div>

        <div
          id="finance-content"
        >
          ${loader({
            label:
              'Carregando resultados…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#finance-content',
    );

  const searchInput =
    document.querySelector(
      '#finance-search',
    );

  const propertySelect =
    document.querySelector(
      '#finance-property',
    );

  const statusSelect =
    document.querySelector(
      '#finance-status',
    );

  const resultSelect =
    document.querySelector(
      '#finance-result',
    );

  const clearButton =
    document.querySelector(
      '#finance-clear-filters',
    );

  let cycles = [];
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

    if (status) {
      params.set(
        'status',
        status,
      );
    }

    if (
      resultFilter !==
      'all'
    ) {
      params.set(
        'result',
        resultFilter,
      );
    }

    if (search.trim()) {
      params.set(
        'search',
        search.trim(),
      );
    }

    const value =
      params.toString();

    window.history.replaceState(
      {},
      '',
      value
        ? `/more/finance?${value}`
        : '/more/finance',
    );
  }

  function getFilteredCycles() {
    const normalizedSearch =
      search
        .trim()
        .toLocaleLowerCase(
          'pt-BR',
        );

    return cycles.filter(
      (cycle) => {
        if (
          propertyId &&
          cycle.property_id !==
            propertyId
        ) {
          return false;
        }

        if (
          status &&
          cycle.status !== status
        ) {
          return false;
        }

        const resultState =
          getFinancialResultState(
            cycle.finance,
          );

        if (
          resultFilter !==
            'all' &&
          resultState !==
            resultFilter
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          cycle.crop?.name,
          cycle.variety,
          cycle.property?.name,
          cycle.area?.name,
          cycle.season?.name,
        ]
          .filter(Boolean)
          .some(
            (value) =>
              String(value)
                .toLocaleLowerCase(
                  'pt-BR',
                )
                .includes(
                  normalizedSearch,
                ),
          );
      },
    );
  }

  function renderCycles() {
    const filtered =
      getFilteredCycles();

    if (!filtered.length) {
      content.innerHTML =
        emptyState({
          iconName:
            'chart',
          title:
            'Nenhum ciclo encontrado',
          description:
            'Altere os filtros ou registre usos de insumos, colheitas e vendas para gerar resultados.',
          actionLabel:
            'Abrir plantios',
          actionHref:
            '/plantings',
        });

      return;
    }

    const filteredCosts =
      filtered.reduce(
        (sum, cycle) =>
          sum +
          Number(
            cycle.finance
              .input_cost || 0,
          ),
        0,
      );

    const filteredRevenue =
      filtered.reduce(
        (sum, cycle) =>
          sum +
          Number(
            cycle.finance
              .sales_revenue || 0,
          ),
        0,
      );

    const filteredResult =
      filteredRevenue -
      filteredCosts;

    content.innerHTML = `
      <section class="finance-filter-summary">
        <span>
          ${filtered.length}
          ${
            filtered.length === 1
              ? 'ciclo'
              : 'ciclos'
          }
        </span>

        <span>
          Custos:
          <strong>
            ${formatCurrencyBRL(
              filteredCosts,
            )}
          </strong>
        </span>

        <span>
          Receita:
          <strong>
            ${formatCurrencyBRL(
              filteredRevenue,
            )}
          </strong>
        </span>

        <span>
          Resultado:
          <strong
            class="
              ${filteredResult > 0
                ? 'finance-value--positive'
                : filteredResult < 0
                  ? 'finance-value--negative'
                  : ''
              }
            "
          >
            ${formatCurrencyBRL(
              filteredResult,
            )}
          </strong>
        </span>
      </section>

      <section class="finance-cycle-list">
        ${filtered
          .map(
            financeCycleCard,
          )
          .join('')}
      </section>
    `;
  }

  async function loadCycles() {
    content.innerHTML =
      loader({
        label:
          'Carregando resultados…',
      });

    try {
      cycles =
        await listCycleFinancialSummaries();

      if (disposed) {
        return;
      }

      renderCycles();
    } catch (error) {
      console.error(
        'Erro ao carregar financeiro:',
        error,
      );

      content.innerHTML =
        emptyState({
          iconName:
            'chart',
          title:
            'Não foi possível carregar o financeiro',
          description:
            'Execute a migration da Etapa 23 no Supabase e tente novamente.',
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

      status =
        statusSelect.value;

      resultFilter =
        resultSelect.value;

      search =
        searchInput.value;

      syncUrl();
      renderCycles();
    };

  const handleSearch =
    () => {
      search =
        searchInput.value;

      syncUrl();
      renderCycles();
    };

  const handleClear =
    () => {
      propertyId = '';
      status = '';
      resultFilter = 'all';
      search = '';

      propertySelect.value =
        '';

      statusSelect.value =
        '';

      resultSelect.value =
        'all';

      searchInput.value =
        '';

      syncUrl();
      renderCycles();
    };

  propertySelect.addEventListener(
    'change',
    handleFilters,
  );

  statusSelect.addEventListener(
    'change',
    handleFilters,
  );

  resultSelect.addEventListener(
    'change',
    handleFilters,
  );

  searchInput.addEventListener(
    'input',
    handleSearch,
  );

  clearButton.addEventListener(
    'click',
    handleClear,
  );

  await loadCycles();

  return () => {
    disposed = true;

    propertySelect.removeEventListener(
      'change',
      handleFilters,
    );

    statusSelect.removeEventListener(
      'change',
      handleFilters,
    );

    resultSelect.removeEventListener(
      'change',
      handleFilters,
    );

    searchInput.removeEventListener(
      'input',
      handleSearch,
    );

    clearButton.removeEventListener(
      'click',
      handleClear,
    );
  };
}
