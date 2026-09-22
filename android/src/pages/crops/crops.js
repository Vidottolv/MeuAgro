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
  listCrops,
} from '../../services/cropService.js';

import {
  cropCard,
} from './cropView.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

export async function renderCropsPage({
  session,
}) {
  const app =
    document.querySelector('#app');

  app.innerHTML =
    appShell({
      session,
      title: 'Culturas',
      eyebrow: 'Produção',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Culturas
            </p>

            <h2>
              Catálogo de culturas
            </h2>

            <p>
              Use as culturas padrão do Meu Agro ou cadastre culturas personalizadas para os seus plantios.
            </p>
          </div>

          <a
            href="/more/crops/new"
            class="icon-button"
            aria-label="Cadastrar cultura"
            data-link
          >
            ${icon('plus')}
          </a>
        </section>

        <section class="crop-toolbar">
          <div class="crop-search">
            ${icon('search')}

            <input
              id="crop-search"
              type="search"
              placeholder="Buscar cultura..."
              autocomplete="off"
            />
          </div>

          <div
            class="segmented-control crop-source-filter"
            role="tablist"
            aria-label="Origem das culturas"
          >
            <button
              class="
                segmented-control__button
                segmented-control__button--active
              "
              type="button"
              data-crop-source="all"
              aria-selected="true"
            >
              Todas
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-crop-source="system"
              aria-selected="false"
            >
              Padrão
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-crop-source="custom"
              aria-selected="false"
            >
              Minhas
            </button>
          </div>
        </section>

        <div class="crop-inactive-toggle">
          <label>
            <input
              id="crop-show-inactive"
              type="checkbox"
            />
            <span>
              Mostrar culturas personalizadas inativas
            </span>
          </label>

          <a
            href="/more/crops/new"
            class="button button--primary button--compact"
            data-link
          >
            ${icon('plus')}
            Nova cultura
          </a>
        </div>

        <div id="crops-content">
          ${loader({
            label:
              'Carregando culturas…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#crops-content',
    );

  const searchInput =
    document.querySelector(
      '#crop-search',
    );

  const inactiveInput =
    document.querySelector(
      '#crop-show-inactive',
    );

  const sourceButtons =
    [
      ...document.querySelectorAll(
        '[data-crop-source]',
      ),
    ];

  let crops = [];
  let source = 'all';
  let search = '';
  let showInactive = false;

  function getFilteredCrops() {
    const term =
      search
        .trim()
        .toLocaleLowerCase(
          'pt-BR',
        );

    return crops.filter(
      (crop) => {
        if (
          source === 'system' &&
          !crop.is_system
        ) {
          return false;
        }

        if (
          source === 'custom' &&
          crop.is_system
        ) {
          return false;
        }

        if (
          !crop.is_system &&
          !crop.active &&
          !showInactive
        ) {
          return false;
        }

        if (!term) {
          return true;
        }

        return [
          crop.name,
          crop.category,
        ]
          .filter(Boolean)
          .some(
            (value) =>
              String(value)
                .toLocaleLowerCase(
                  'pt-BR',
                )
                .includes(term),
          );
      },
    );
  }

  function renderList() {
    const filtered =
      getFilteredCrops();

    if (!filtered.length) {
      content.innerHTML =
        emptyState({
          iconName: 'leaf',
          title:
            'Nenhuma cultura encontrada',
          description:
            source === 'custom'
              ? 'Cadastre uma cultura personalizada ou altere os filtros.'
              : 'Tente alterar a busca ou os filtros.',
          actionLabel:
            source === 'custom'
              ? 'Cadastrar cultura'
              : null,
          actionHref:
            source === 'custom'
              ? '/more/crops/new'
              : null,
        });
      return;
    }

    content.innerHTML = `
      <section class="crop-list">
        ${filtered
          .map(cropCard)
          .join('')}
      </section>
    `;
  }

  const handleSource =
    (event) => {
      const button =
        event.target.closest(
          '[data-crop-source]',
        );

      if (!button) return;

      source =
        button.dataset.cropSource;

      for (
        const item of
        sourceButtons
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
      search =
        searchInput.value;
      renderList();
    };

  const handleInactive =
    () => {
      showInactive =
        inactiveInput.checked;
      renderList();
    };

  sourceButtons.forEach(
    (button) => {
      button.addEventListener(
        'click',
        handleSource,
      );
    },
  );

  searchInput.addEventListener(
    'input',
    handleSearch,
  );

  inactiveInput.addEventListener(
    'change',
    handleInactive,
  );

  try {
    crops =
      await listCrops();
    renderList();
  } catch (error) {
    console.error(
      'Erro ao carregar culturas:',
      error,
    );

    content.innerHTML =
      emptyState({
        iconName: 'leaf',
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

  return () => {
    sourceButtons.forEach(
      (button) => {
        button.removeEventListener(
          'click',
          handleSource,
        );
      },
    );

    searchInput.removeEventListener(
      'input',
      handleSearch,
    );

    inactiveInput.removeEventListener(
      'change',
      handleInactive,
    );
  };
}
