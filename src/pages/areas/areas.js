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
  getPropertyById,
} from '../../services/propertyService.js';

import {
  listAreasByProperty,
  restoreArea,
} from '../../services/areaService.js';

import {
  areaCard,
} from './areaView.js';

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

export async function renderAreasPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let property = null;

  try {
    property =
      await getPropertyById(
        params.propertyId,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar propriedade:',
      error,
    );
  }

  if (
    !property ||
    property.deleted_at
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Áreas',
        eyebrow: 'Propriedades',
        activeNav:
          'properties',
        content: `
          ${emptyState({
            iconName: 'map',
            title:
              'Propriedade não encontrada',
            description:
              'A propriedade pode ter sido arquivada ou não pertencer à sua conta.',
            actionLabel:
              'Voltar para propriedades',
            actionHref:
              '/properties',
          })}
        `,
      });

    return null;
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Áreas',
      eyebrow:
        escapeHtml(
          property.name,
        ),
      activeNav:
        'properties',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/properties/${property.id}"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Propriedade
            </a>

            <h2
              style="margin-top: 10px;"
            >
              Áreas da propriedade
            </h2>

            <p>
              Talhões, hortas, piquetes e outros espaços ficam organizados sob a mesma entidade Área.
            </p>
          </div>

          <a
            href="/properties/${property.id}/areas/new"
            class="icon-button"
            aria-label="Cadastrar área"
            data-link
          >
            ${icon('plus')}
          </a>
        </section>

        <div class="property-toolbar">
          <div
            class="segmented-control"
            role="tablist"
            aria-label="Filtro de áreas"
          >
            <button
              class="
                segmented-control__button
                segmented-control__button--active
              "
              type="button"
              data-area-filter="active"
              aria-selected="true"
            >
              Ativas
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-area-filter="archived"
              aria-selected="false"
            >
              Arquivadas
            </button>
          </div>

          <a
            href="/properties/${property.id}/areas/new"
            class="button button--primary button--compact"
            data-link
          >
            ${icon('plus')}
            Nova área
          </a>
        </div>

        <div id="areas-content">
          ${loader({
            label:
              'Carregando áreas…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#areas-content',
    );

  const filterButtons =
    [
      ...document.querySelectorAll(
        '[data-area-filter]',
      ),
    ];

  let currentFilter =
    'active';

  let disposed =
    false;

  async function loadAreas() {
    content.innerHTML =
      loader({
        label:
          currentFilter ===
          'active'
            ? 'Carregando áreas…'
            : 'Carregando áreas arquivadas…',
      });

    try {
      const areas =
        await listAreasByProperty(
          property.id,
          {
            archived:
              currentFilter ===
              'archived',
          },
        );

      if (disposed) {
        return;
      }

      if (!areas.length) {
        content.innerHTML =
          currentFilter ===
          'active'
            ? emptyState({
                iconName:
                  'layers',
                title:
                  'Cadastre a primeira área',
                description:
                  'Crie um talhão, horta, piquete, pomar, estufa ou outro espaço da propriedade.',
                actionLabel:
                  'Cadastrar área',
                actionHref:
                  `/properties/${property.id}/areas/new`,
              })
            : emptyState({
                iconName:
                  'archive',
                title:
                  'Nenhuma área arquivada',
                description:
                  'Áreas arquivadas continuarão preservadas e aparecerão aqui.',
              });

        return;
      }

      content.innerHTML = `
        <section class="area-list">
          ${areas
            .map(
              (area) =>
                areaCard(
                  area,
                  {
                    propertyId:
                      property.id,
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
        'Erro ao listar áreas:',
        error,
      );

      content.innerHTML =
        emptyState({
          iconName:
            'layers',
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
          '[data-area-filter]',
        );

      if (!button) {
        return;
      }

      currentFilter =
        button.dataset.areaFilter;

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

      void loadAreas();
    };

  const handleRestore =
    async (event) => {
      const button =
        event.target.closest(
          '[data-action="restore-area"]',
        );

      if (!button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const confirmed =
        await showConfirmModal({
          title:
            'Restaurar área?',
          message:
            'Ela voltará a aparecer entre as áreas ativas desta propriedade.',
          confirmLabel:
            'Restaurar',
        });

      if (!confirmed) {
        return;
      }

      button.disabled = true;

      try {
        await restoreArea(
          button.dataset.areaId,
        );

        showToast(
          'Área restaurada.',
          {
            type: 'success',
          },
        );

        await loadAreas();
      } catch (error) {
        console.error(
          'Erro ao restaurar área:',
          error,
        );

        showToast(
          getDataErrorMessage(
            error,
          ),
          {
            type: 'error',
          },
        );

        button.disabled = false;
      }
    };

  document.addEventListener(
    'click',
    handleFilter,
  );

  document.addEventListener(
    'click',
    handleRestore,
  );

  await loadAreas();

  return () => {
    disposed = true;

    document.removeEventListener(
      'click',
      handleFilter,
    );

    document.removeEventListener(
      'click',
      handleRestore,
    );
  };
}
