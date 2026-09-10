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
  listHarvestSales,
} from '../../services/harvestSaleService.js';

import {
  saleCard,
} from './saleView.js';

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
              selected ===
              property.id
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

export async function renderSalesPage({
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

  let month =
    query.get('month') ||
    '';

  app.innerHTML =
    appShell({
      session,
      title: 'Vendas',
      eyebrow: 'Comercialização',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Etapa 22
            </p>

            <h2>
              Vendas das colheitas
            </h2>

            <p>
              Cada venda pertence a uma colheita e calcula o valor total automaticamente.
            </p>
          </div>

          <a
            href="/more/sales/new"
            class="icon-button"
            aria-label="Registrar venda"
            data-link
          >
            ${icon('plus')}
          </a>
        </section>

        <section class="sale-toolbar">
          <div class="field">
            <label
              for="sale-property-filter"
            >
              Propriedade
            </label>

            <select
              id="sale-property-filter"
            >
              ${propertyOptions(
                properties,
                propertyId,
              )}
            </select>
          </div>

          <div class="field">
            <label
              for="sale-month-filter"
            >
              Mês
            </label>

            <input
              id="sale-month-filter"
              type="month"
              value="${escapeHtml(
                month,
              )}"
            />
          </div>
        </section>

        <div class="harvest-list-actions">
          <button
            id="sale-current-month"
            class="button button--ghost button--compact"
            type="button"
          >
            ${icon('calendar')}
            Mês atual
          </button>

          <button
            id="sale-clear-filters"
            class="button button--ghost button--compact"
            type="button"
          >
            Limpar filtros
          </button>

          <a
            href="/more/sales/new"
            class="button button--primary button--compact"
            data-link
          >
            ${icon('plus')}
            Nova venda
          </a>
        </div>

        <div
          id="sales-content"
        >
          ${loader({
            label:
              'Carregando vendas…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#sales-content',
    );

  const propertySelect =
    document.querySelector(
      '#sale-property-filter',
    );

  const monthInput =
    document.querySelector(
      '#sale-month-filter',
    );

  const currentMonthButton =
    document.querySelector(
      '#sale-current-month',
    );

  const clearButton =
    document.querySelector(
      '#sale-clear-filters',
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
        ? `/more/sales?${value}`
        : '/more/sales',
    );
  }

  async function loadSales() {
    content.innerHTML =
      loader({
        label:
          'Carregando vendas…',
      });

    try {
      const sales =
        await listHarvestSales({
          propertyId:
            propertyId ||
            null,
          month:
            month || null,
        });

      if (disposed) {
        return;
      }

      if (!sales.length) {
        content.innerHTML =
          emptyState({
            iconName:
              'cart',
            title:
              'Nenhuma venda encontrada',
            description:
              'Registre uma venda a partir de uma colheita destinada à comercialização.',
            actionLabel:
              'Registrar venda',
            actionHref:
              '/more/sales/new',
          });

        return;
      }

      const gross =
        sales.reduce(
          (sum, sale) =>
            sum +
            Number(
              sale.total_value ||
              0,
            ),
          0,
        );

      const average =
        sales.length
          ? gross /
            sales.length
          : 0;

      const buyers =
        new Set(
          sales
            .map(
              (sale) =>
                sale.buyer
                  ?.trim()
                  .toLocaleLowerCase(
                    'pt-BR',
                  ),
            )
            .filter(Boolean),
        ).size;

      content.innerHTML = `
        <section class="sale-list-summary">
          <article>
            <span>Vendas</span>
            <strong>
              ${sales.length}
            </strong>
          </article>

          <article>
            <span>Compradores</span>
            <strong>
              ${buyers}
            </strong>
          </article>

          <article>
            <span>Receita bruta</span>
            <strong>
              ${formatCurrencyBRL(
                gross,
              )}
            </strong>
          </article>

          <article>
            <span>Ticket médio</span>
            <strong>
              ${formatCurrencyBRL(
                average,
              )}
            </strong>
          </article>
        </section>

        <section class="sale-list">
          ${sales
            .map(
              saleCard,
            )
            .join('')}
        </section>
      `;
    } catch (error) {
      console.error(
        'Erro ao carregar vendas:',
        error,
      );

      content.innerHTML =
        emptyState({
          iconName:
            'cart',
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

      month =
        monthInput.value;

      syncUrl();
      void loadSales();
    };

  const handleCurrentMonth =
    () => {
      month =
        currentMonth();

      monthInput.value =
        month;

      syncUrl();
      void loadSales();
    };

  const handleClear =
    () => {
      propertyId = '';
      month = '';

      propertySelect.value =
        '';

      monthInput.value =
        '';

      syncUrl();
      void loadSales();
    };

  propertySelect.addEventListener(
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

  await loadSales();

  return () => {
    disposed = true;

    propertySelect.removeEventListener(
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
