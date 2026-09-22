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
  listSeasons,
  restoreSeason,
} from '../../services/seasonService.js';

import {
  seasonCard,
} from './seasonView.js';

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

import {
  SEASON_STATUSES,
} from '../../constants/seasonStatus.js';

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

function statusOptions(
  selected,
) {
  return `
    <option value="">
      Todos os status
    </option>

    ${SEASON_STATUSES
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

export async function renderSeasonsPage({
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

  const queryParams =
    new URLSearchParams(
      window.location.search,
    );

  let propertyFilter =
    queryParams.get('property') ||
    '';

  let statusFilter =
    queryParams.get('status') ||
    '';

  let archivedFilter =
    queryParams.get('archived') ===
    '1';

  if (
    propertyFilter &&
    !properties.some(
      (property) =>
        property.id ===
        propertyFilter,
    )
  ) {
    propertyFilter = '';
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Safras',
      eyebrow: 'Produção',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Safras
            </p>

            <h2>
              Organize períodos produtivos
            </h2>

            <p>
              Agrupe ciclos produtivos por período e propriedade, como Safra Verão 2026 ou Safra 2026/2027.
            </p>
          </div>

          <a
            href="/more/seasons/new${
              propertyFilter
                ? `?property=${encodeURIComponent(
                    propertyFilter,
                  )}`
                : ''
            }"
            class="icon-button"
            aria-label="Cadastrar safra"
            data-link
          >
            ${icon('plus')}
          </a>
        </section>

        ${
          !properties.length
            ? `
              ${emptyState({
                iconName: 'map',
                title:
                  'Cadastre uma propriedade primeiro',
                description:
                  'Toda safra precisa estar vinculada a uma propriedade.',
                actionLabel:
                  'Cadastrar propriedade',
                actionHref:
                  '/properties/new',
              })}
            `
            : `
              <section class="season-filters">
                <div class="field season-filter-field">
                  <label for="season-property-filter">
                    Propriedade
                  </label>

                  <select
                    id="season-property-filter"
                  >
                    ${propertyOptions(
                      properties,
                      propertyFilter,
                    )}
                  </select>
                </div>

                <div class="field season-filter-field">
                  <label for="season-status-filter">
                    Status
                  </label>

                  <select
                    id="season-status-filter"
                    ${
                      archivedFilter
                        ? 'disabled'
                        : ''
                    }
                  >
                    ${statusOptions(
                      statusFilter,
                    )}
                  </select>
                </div>

                <div class="season-filter-archive">
                  <label>
                    <input
                      id="season-archived-filter"
                      type="checkbox"
                      ${
                        archivedFilter
                          ? 'checked'
                          : ''
                      }
                    />

                    <span>
                      Mostrar arquivadas
                    </span>
                  </label>
                </div>
              </section>

              <div class="season-list-actions">
                <a
                  href="/more/seasons/new${
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
                  Nova safra
                </a>
              </div>

              <div id="seasons-content">
                ${loader({
                  label:
                    'Carregando safras…',
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
      '#seasons-content',
    );

  const propertySelect =
    document.querySelector(
      '#season-property-filter',
    );

  const statusSelect =
    document.querySelector(
      '#season-status-filter',
    );

  const archivedCheckbox =
    document.querySelector(
      '#season-archived-filter',
    );

  let disposed = false;

  async function loadSeasons() {
    content.innerHTML =
      loader({
        label:
          archivedFilter
            ? 'Carregando safras arquivadas…'
            : 'Carregando safras…',
      });

    try {
      const seasons =
        await listSeasons({
          propertyId:
            propertyFilter ||
            null,
          status:
            archivedFilter
              ? null
              : statusFilter ||
                null,
          archived:
            archivedFilter,
        });

      if (disposed) {
        return;
      }

      if (!seasons.length) {
        content.innerHTML =
          archivedFilter
            ? emptyState({
                iconName:
                  'archive',
                title:
                  'Nenhuma safra arquivada',
                description:
                  'As safras arquivadas continuarão preservadas e aparecerão aqui.',
              })
            : emptyState({
                iconName:
                  'calendar',
                title:
                  'Nenhuma safra encontrada',
                description:
                  propertyFilter
                    ? 'Cadastre a primeira safra desta propriedade ou altere os filtros.'
                    : 'Cadastre sua primeira safra para começar a organizar os ciclos produtivos.',
                actionLabel:
                  'Cadastrar safra',
                actionHref:
                  `/more/seasons/new${
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
        <section class="season-list">
          ${seasons
            .map(
              (season) =>
                seasonCard(
                  season,
                  {
                    archived:
                      archivedFilter,
                  },
                ),
            )
            .join('')}
        </section>
      `;
    } catch (error) {
      console.error(
        'Erro ao listar safras:',
        error,
      );

      content.innerHTML =
        emptyState({
          iconName:
            'calendar',
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

  function syncUrl() {
    const params =
      new URLSearchParams();

    if (propertyFilter) {
      params.set(
        'property',
        propertyFilter,
      );
    }

    if (
      statusFilter &&
      !archivedFilter
    ) {
      params.set(
        'status',
        statusFilter,
      );
    }

    if (archivedFilter) {
      params.set(
        'archived',
        '1',
      );
    }

    const query =
      params.toString();

    window.history.replaceState(
      {},
      '',
      query
        ? `/more/seasons?${query}`
        : '/more/seasons',
    );
  }

  const handleFilterChange =
    () => {
      propertyFilter =
        propertySelect.value;

      statusFilter =
        statusSelect.value;

      archivedFilter =
        archivedCheckbox.checked;

      statusSelect.disabled =
        archivedFilter;

      syncUrl();
      void loadSeasons();
    };

  const handleRestore =
    async (event) => {
      const button =
        event.target.closest(
          '[data-action="restore-season"]',
        );

      if (!button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const confirmed =
        await showConfirmModal({
          title:
            'Restaurar safra?',
          message:
            'Ela voltará a aparecer na listagem normal de safras.',
          confirmLabel:
            'Restaurar',
        });

      if (!confirmed) {
        return;
      }

      button.disabled = true;

      try {
        await restoreSeason(
          button.dataset.seasonId,
        );

        showToast(
          'Safra restaurada.',
          {
            type: 'success',
          },
        );

        await loadSeasons();
      } catch (error) {
        console.error(
          'Erro ao restaurar safra:',
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

  propertySelect.addEventListener(
    'change',
    handleFilterChange,
  );

  statusSelect.addEventListener(
    'change',
    handleFilterChange,
  );

  archivedCheckbox.addEventListener(
    'change',
    handleFilterChange,
  );

  document.addEventListener(
    'click',
    handleRestore,
  );

  await loadSeasons();

  return () => {
    disposed = true;

    propertySelect.removeEventListener(
      'change',
      handleFilterChange,
    );

    statusSelect.removeEventListener(
      'change',
      handleFilterChange,
    );

    archivedCheckbox.removeEventListener(
      'change',
      handleFilterChange,
    );

    document.removeEventListener(
      'click',
      handleRestore,
    );
  };
}
