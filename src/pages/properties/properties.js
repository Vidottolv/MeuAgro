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
  propertyCard,
} from './propertyView.js';
import {
  listActiveProperties,
  listArchivedProperties,
  restoreProperty,
} from '../../services/propertyService.js';
import {
  showToast,
} from '../../components/toast.js';
import {
  showConfirmModal,
} from '../../components/confirmModal.js';
import {
  getAuthErrorMessage,
} from '../../services/authErrorService.js';

export async function renderPropertiesPage({
  session,
}) {
  const app =
    document.querySelector('#app');

  app.innerHTML =
    appShell({
      session,
      title: 'Propriedades',
      eyebrow: 'Gestão rural',
      activeNav: 'properties',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Propriedades
            </p>

            <h2>
              Seus sítios e fazendas
            </h2>

            <p>
              Cadastre cada propriedade para depois organizar suas áreas, plantios e safras.
            </p>
          </div>

          <a
            href="/properties/new"
            class="icon-button"
            aria-label="Cadastrar propriedade"
            data-link
          >
            ${icon('plus')}
          </a>
        </section>

        <div class="property-toolbar">
          <div
            class="segmented-control"
            role="tablist"
            aria-label="Filtro de propriedades"
          >
            <button
              id="filter-active"
              class="
                segmented-control__button
                segmented-control__button--active
              "
              type="button"
              role="tab"
              aria-selected="true"
              data-filter="active"
            >
              Ativas
            </button>

            <button
              id="filter-archived"
              class="segmented-control__button"
              type="button"
              role="tab"
              aria-selected="false"
              data-filter="archived"
            >
              Arquivadas
            </button>
          </div>

          <a
            href="/properties/new"
            class="button button--primary button--compact"
            data-link
          >
            ${icon('plus')}
            Nova
          </a>
        </div>

        <div id="properties-content">
          ${loader({
            label: 'Carregando propriedades…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#properties-content',
    );

  const filterButtons =
    [
      ...document.querySelectorAll(
        '[data-filter]',
      ),
    ];

  let currentFilter =
    'active';

  let disposed =
    false;

  async function loadProperties() {
    content.innerHTML =
      loader({
        label:
          currentFilter === 'active'
            ? 'Carregando propriedades…'
            : 'Carregando arquivadas…',
      });

    try {
      const properties =
        currentFilter === 'active'
          ? await listActiveProperties()
          : await listArchivedProperties();

      if (disposed) {
        return;
      }

      if (!properties.length) {
        content.innerHTML =
          currentFilter === 'active'
            ? emptyState({
                iconName: 'map',
                title:
                  'Cadastre sua primeira propriedade',
                description:
                  'A partir dela você poderá criar talhões, hortas, piquetes e outros tipos de área.',
                actionLabel:
                  'Cadastrar propriedade',
                actionHref:
                  '/properties/new',
              })
            : emptyState({
                iconName: 'archive',
                title:
                  'Nenhuma propriedade arquivada',
                description:
                  'Quando uma propriedade for arquivada, ela aparecerá aqui e poderá ser restaurada.',
              });

        return;
      }

      content.innerHTML = `
        <section class="property-list">
          ${properties
            .map(
              (property) =>
                propertyCard(
                  property,
                  {
                    archived:
                      currentFilter ===
                      'archived',
                  },
                ),
            )
            .join('')}
        </section>
      `;
    } catch (error) {
      console.error(
        'Erro ao listar propriedades:',
        error,
      );

      content.innerHTML =
        emptyState({
          iconName: 'map',
          title:
            'Não foi possível carregar',
          description:
            'Verifique sua conexão e tente novamente.',
        });

      showToast(
        getAuthErrorMessage(error),
        {
          type: 'error',
        },
      );
    }
  }

  function setFilter(filter) {
    currentFilter = filter;

    for (
      const button of filterButtons
    ) {
      const active =
        button.dataset.filter ===
        filter;

      button.classList.toggle(
        'segmented-control__button--active',
        active,
      );

      button.setAttribute(
        'aria-selected',
        String(active),
      );
    }

    void loadProperties();
  }

  const handleFilterClick =
    (event) => {
      const button =
        event.target.closest(
          '[data-filter]',
        );

      if (!button) {
        return;
      }

      setFilter(
        button.dataset.filter,
      );
    };

  const handleRestoreClick =
    async (event) => {
      const button =
        event.target.closest(
          '[data-action="restore-property"]',
        );

      if (!button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const propertyId =
        button.dataset.propertyId;

      const confirmed =
        await showConfirmModal({
          title:
            'Restaurar propriedade?',
          message:
            'Ela voltará a aparecer entre as propriedades ativas.',
          confirmLabel:
            'Restaurar',
        });

      if (!confirmed) {
        return;
      }

      button.disabled = true;

      try {
        await restoreProperty(
          propertyId,
        );

        showToast(
          'Propriedade restaurada.',
          {
            type: 'success',
          },
        );

        await loadProperties();
      } catch (error) {
        console.error(
          'Erro ao restaurar propriedade:',
          error,
        );

        showToast(
          getAuthErrorMessage(error),
          {
            type: 'error',
          },
        );

        button.disabled = false;
      }
    };

  document.addEventListener(
    'click',
    handleFilterClick,
  );

  document.addEventListener(
    'click',
    handleRestoreClick,
  );

  await loadProperties();

  return () => {
    disposed = true;

    document.removeEventListener(
      'click',
      handleFilterClick,
    );

    document.removeEventListener(
      'click',
      handleRestoreClick,
    );
  };
}
