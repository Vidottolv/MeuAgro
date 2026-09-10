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
  listAgriculturalInputs,
} from '../../services/agriculturalInputService.js';

import {
  agriculturalInputCard,
} from './inputView.js';

import {
  getInputCategoryLabel,
} from '../../constants/inputCategories.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

export async function renderInventoryPage({
  session,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  app.innerHTML =
    appShell({
      session,
      title: 'Barracão',
      eyebrow: 'Insumos',
      activeNav: 'inventory',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Barracão
            </p>

            <h2>
              Insumos agrícolas
            </h2>

            <p>
              Cadastre insumos, acompanhe lotes de compra e consulte o histórico completo de movimentações do estoque.
            </p>
          </div>

          <a
            href="/inventory/new"
            class="icon-button"
            aria-label="Cadastrar insumo"
            data-link
          >
            ${icon('plus')}
          </a>
        </section>

        <section class="input-toolbar">
          <div class="crop-search">
            ${icon('search')}

            <input
              id="input-search"
              type="search"
              placeholder="Buscar insumo, marca ou categoria..."
              autocomplete="off"
            />
          </div>

          <div
            class="segmented-control"
            role="tablist"
            aria-label="Situação dos insumos"
          >
            <button
              class="
                segmented-control__button
                segmented-control__button--active
              "
              type="button"
              data-input-filter="active"
              aria-selected="true"
            >
              Ativos
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-input-filter="inactive"
              aria-selected="false"
            >
              Inativos
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-input-filter="all"
              aria-selected="false"
            >
              Todos
            </button>
          </div>
        </section>

        <div class="input-stage-note">
          ${icon('lock')}

          <div>
            <strong>
              Estoque por movimentações
            </strong>

            <span>
              A quantidade atual nunca é editada diretamente. Compras criam entradas automáticas e demais alterações ficam registradas no histórico.
            </span>
          </div>
        </div>

        <section class="inventory-hub-actions">
          <a
            href="/inventory/transactions"
            class="inventory-hub-action"
            data-link
          >
            <span class="inventory-hub-action__icon">
              ${icon('history')}
            </span>

            <span class="inventory-hub-action__content">
              <strong>Movimentações</strong>
              <span>Histórico completo de entradas, saídas e ajustes</span>
            </span>

            ${icon('chevronRight')}
          </a>

          <a
            href="/inventory/transactions/new"
            class="inventory-hub-action"
            data-link
          >
            <span class="inventory-hub-action__icon">
              ${icon('plus')}
            </span>

            <span class="inventory-hub-action__content">
              <strong>Nova movimentação</strong>
              <span>Ajuste, perda, vencimento ou devolução</span>
            </span>

            ${icon('chevronRight')}
          </a>
        </section>

        <div class="season-list-actions">
          <a
            href="/inventory/new"
            class="button button--primary button--compact"
            data-link
          >
            ${icon('plus')}
            Novo insumo
          </a>
        </div>

        <div id="inputs-content">
          ${loader({
            label:
              'Carregando insumos…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#inputs-content',
    );

  const searchInput =
    document.querySelector(
      '#input-search',
    );

  const filterButtons =
    [
      ...document.querySelectorAll(
        '[data-input-filter]',
      ),
    ];

  let inputs = [];
  let currentFilter =
    'active';

  function filteredInputs() {
    const term =
      searchInput.value
        .trim()
        .toLocaleLowerCase(
          'pt-BR',
        );

    return inputs.filter(
      (input) => {
        if (
          currentFilter ===
            'active' &&
          !input.active
        ) {
          return false;
        }

        if (
          currentFilter ===
            'inactive' &&
          input.active
        ) {
          return false;
        }

        if (!term) {
          return true;
        }

        return [
          input.name,
          input.brand,
          getInputCategoryLabel(
            input.category,
          ),
        ]
          .filter(Boolean)
          .some(
            (value) =>
              String(value)
                .toLocaleLowerCase(
                  'pt-BR',
                )
                .includes(
                  term,
                ),
          );
      },
    );
  }

  function renderList() {
    const filtered =
      filteredInputs();

    if (!filtered.length) {
      content.innerHTML =
        emptyState({
          iconName: 'box',
          title:
            currentFilter ===
              'active'
              ? 'Nenhum insumo ativo'
              : 'Nenhum insumo encontrado',
          description:
            currentFilter ===
              'active'
              ? 'Cadastre sementes, fertilizantes, defensivos e outros produtos utilizados na produção.'
              : 'Altere os filtros ou a busca para localizar outros registros.',
          actionLabel:
            currentFilter ===
              'active'
              ? 'Cadastrar insumo'
              : null,
          actionHref:
            currentFilter ===
              'active'
              ? '/inventory/new'
              : null,
        });

      return;
    }

    content.innerHTML = `
      <section class="input-list">
        ${filtered
          .map(
            agriculturalInputCard,
          )
          .join('')}
      </section>
    `;
  }

  const handleFilter =
    (event) => {
      const button =
        event.target.closest(
          '[data-input-filter]',
        );

      if (!button) {
        return;
      }

      currentFilter =
        button.dataset
          .inputFilter;

      for (
        const item of
        filterButtons
      ) {
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
      }

      renderList();
    };

  const handleSearch =
    () => {
      renderList();
    };

  filterButtons.forEach(
    (button) => {
      button.addEventListener(
        'click',
        handleFilter,
      );
    },
  );

  searchInput.addEventListener(
    'input',
    handleSearch,
  );

  try {
    inputs =
      await listAgriculturalInputs();

    renderList();
  } catch (error) {
    console.error(
      'Erro ao carregar insumos:',
      error,
    );

    content.innerHTML =
      emptyState({
        iconName: 'box',
        title:
          'Não foi possível carregar os insumos',
        description:
          'Verifique sua conexão com o Supabase e tente novamente.',
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

  return () => {
    filterButtons.forEach(
      (button) => {
        button.removeEventListener(
          'click',
          handleFilter,
        );
      },
    );

    searchInput.removeEventListener(
      'input',
      handleSearch,
    );
  };
}
