import {
  appShell,
} from '../../components/appShell.js';

import {
  icon,
} from '../../components/icons.js';

import {
  getPropertyById,
  archiveProperty,
  restoreProperty,
} from '../../services/propertyService.js';

import {
  listAreasByProperty,
  countActiveAreas,
} from '../../services/areaService.js';

import {
  listRecentPropertySeasons,
  countOpenSeasons,
} from '../../services/seasonService.js';

import {
  getSeasonStatusLabel,
} from '../../constants/seasonStatus.js';

import {
  propertyArea,
  propertyLocation,
} from './propertyView.js';

import {
  areaTypeName,
} from '../areas/areaView.js';

import {
  escapeHtml,
  formatDatePtBr,
} from '../../js/html.js';

import {
  showConfirmModal,
} from '../../components/confirmModal.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getAuthErrorMessage,
} from '../../services/authErrorService.js';

import {
  navigate,
} from '../../js/router.js';

export async function renderPropertyDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let property;

  try {
    property =
      await getPropertyById(
        params.id,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar propriedade:',
      error,
    );
  }

  if (!property) {
    app.innerHTML =
      appShell({
        session,
        title: 'Propriedade',
        eyebrow: 'Gestão rural',
        activeNav:
          'properties',
        content: `
          <section class="empty-state">
            <h2>
              Propriedade não encontrada
            </h2>

            <p>
              Este registro não existe ou não pertence à sua conta.
            </p>

            <a
              href="/properties"
              class="button button--primary"
              data-link
            >
              Voltar para propriedades
            </a>
          </section>
        `,
      });

    return null;
  }

  const archived =
    property.status ===
      'archived' ||
    Boolean(
      property.deleted_at,
    );

  const area =
    propertyArea(
      property,
    );

  let areas = [];
  let areaCount = 0;
  let seasons = [];
  let openSeasonCount = 0;

  if (!archived) {
    try {
      [
        areas,
        areaCount,
        seasons,
        openSeasonCount,
      ] =
        await Promise.all([
          listAreasByProperty(
            property.id,
            {
              limit: 3,
            },
          ),
          countActiveAreas(
            property.id,
          ),
          listRecentPropertySeasons(
            property.id,
            3,
          ),
          countOpenSeasons(
            property.id,
          ),
        ]);
    } catch (error) {
      console.error(
        'Erro ao carregar áreas da propriedade:',
        error,
      );
    }
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Propriedade',
      eyebrow: 'Gestão rural',
      activeNav:
        'properties',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/properties"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Voltar
            </a>
          </div>
        </section>

        <section class="property-detail-hero">
          <div class="property-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${
                  archived
                    ? 'Propriedade arquivada'
                    : 'Propriedade ativa'
                }
              </p>

              <h2>
                ${escapeHtml(
                  property.name,
                )}
              </h2>

              <p>
                ${escapeHtml(
                  propertyLocation(
                    property,
                  ),
                )}
              </p>
            </div>

            <span
              class="
                property-status
                ${
                  archived
                    ? 'property-status--archived'
                    : 'property-status--active'
                }
              "
            >
              ${
                archived
                  ? 'Arquivada'
                  : 'Ativa'
              }
            </span>
          </div>

          ${
            !archived
              ? `
                <div class="property-detail-actions">
                  <a
                    href="/properties/${property.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${icon('edit')}
                    Editar
                  </a>

                  <button
                    id="archive-property"
                    class="button button--danger"
                    type="button"
                  >
                    ${icon('archive')}
                    Arquivar
                  </button>
                </div>
              `
              : `
                <div class="property-detail-actions">
                  <button
                    id="restore-property"
                    class="button button--secondary"
                    type="button"
                  >
                    ${icon('refresh')}
                    Restaurar propriedade
                  </button>
                </div>
              `
          }
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Localização
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                propertyLocation(
                  property,
                ),
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Área total
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                area ||
                'Não informada',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Áreas cadastradas
            </p>

            <p class="detail-card__value">
              ${
                archived
                  ? '-'
                  : areaCount
              }
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Safras em aberto
            </p>

            <p class="detail-card__value">
              ${
                archived
                  ? '-'
                  : openSeasonCount
              }
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Descrição
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${escapeHtml(
              property.description ||
              'Nenhuma descrição informada.',
            )}
          </p>
        </article>

        <article
          class="detail-card"
          style="margin-top: 12px;"
        >
          <p class="detail-card__label">
            Observações
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${escapeHtml(
              property.notes ||
              'Nenhuma observação informada.',
            )}
          </p>
        </article>

        ${
          !archived
            ? `
              <section class="property-areas-summary">
                <div class="property-areas-summary__header">
                  <div>
                    <h2>
                      Áreas da propriedade
                    </h2>

                    <p>
                      ${areaCount} ${
                        areaCount === 1
                          ? 'área ativa'
                          : 'áreas ativas'
                      }
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
                </div>

                ${
                  areas.length
                    ? `
                      <div class="area-preview-list">
                        ${areas
                          .map(
                            (item) => `
                              <a
                                href="/properties/${property.id}/areas/${item.id}"
                                class="area-preview"
                                data-link
                              >
                                <span class="area-preview__icon">
                                  ${icon('layers')}
                                </span>

                                <span class="area-preview__content">
                                  <strong>
                                    ${escapeHtml(
                                      item.name,
                                    )}
                                  </strong>

                                  <span>
                                    ${escapeHtml(
                                      areaTypeName(
                                        item,
                                      ),
                                    )}
                                  </span>
                                </span>

                                ${icon('chevronRight')}
                              </a>
                            `,
                          )
                          .join('')}
                      </div>
                    `
                    : `
                      <div
                        class="empty-state"
                        style="margin-top: 14px;"
                      >
                        <div class="empty-state__icon">
                          ${icon('layers')}
                        </div>

                        <h2>
                          Nenhuma área cadastrada
                        </h2>

                        <p>
                          Comece criando um talhão, horta, piquete ou outro espaço desta propriedade.
                        </p>

                        <a
                          href="/properties/${property.id}/areas/new"
                          class="button button--primary"
                          data-link
                        >
                          ${icon('plus')}
                          Cadastrar área
                        </a>
                      </div>
                    `
                }

                ${
                  areaCount > 0
                    ? `
                      <a
                        href="/properties/${property.id}/areas"
                        class="button button--secondary button--full"
                        style="margin-top: 14px;"
                        data-link
                      >
                        Gerenciar todas as áreas
                      </a>
                    `
                    : ''
                }
              </section>

              <section class="property-seasons-summary">
                <div class="property-seasons-summary__header">
                  <div>
                    <h2>
                      Safras
                    </h2>

                    <p>
                      ${openSeasonCount} ${
                        openSeasonCount === 1
                          ? 'safra em aberto'
                          : 'safras em aberto'
                      }
                    </p>
                  </div>

                  <a
                    href="/more/seasons/new?property=${property.id}"
                    class="icon-button"
                    aria-label="Cadastrar safra"
                    data-link
                  >
                    ${icon('plus')}
                  </a>
                </div>

                ${
                  seasons.length
                    ? `
                      <div class="season-preview-list">
                        ${seasons
                          .map(
                            (season) => `
                              <a
                                href="/more/seasons/${season.id}"
                                class="season-preview"
                                data-link
                              >
                                <span class="season-preview__icon">
                                  ${icon('calendar')}
                                </span>

                                <span class="season-preview__content">
                                  <strong>
                                    ${escapeHtml(
                                      season.name,
                                    )}
                                  </strong>

                                  <span>
                                    ${escapeHtml(
                                      getSeasonStatusLabel(
                                        season.status,
                                      ),
                                    )}
                                  </span>
                                </span>

                                ${icon('chevronRight')}
                              </a>
                            `,
                          )
                          .join('')}
                      </div>
                    `
                    : `
                      <div
                        class="empty-state"
                        style="margin-top: 14px;"
                      >
                        <div class="empty-state__icon">
                          ${icon('calendar')}
                        </div>

                        <h2>
                          Nenhuma safra cadastrada
                        </h2>

                        <p>
                          Organize os próximos ciclos produtivos criando uma safra para esta propriedade.
                        </p>

                        <a
                          href="/more/seasons/new?property=${property.id}"
                          class="button button--primary"
                          data-link
                        >
                          ${icon('plus')}
                          Cadastrar safra
                        </a>
                      </div>
                    `
                }

                ${
                  seasons.length
                    ? `
                      <a
                        href="/more/seasons?property=${property.id}"
                        class="button button--secondary button--full"
                        style="margin-top: 14px;"
                        data-link
                      >
                        Gerenciar safras
                      </a>
                    `
                    : ''
                }
              </section>
            `
            : ''
        }
      `,
    });

  const archiveButton =
    document.querySelector(
      '#archive-property',
    );

  const restoreButton =
    document.querySelector(
      '#restore-property',
    );

  const handleArchive =
    async () => {
      const confirmed =
        await showConfirmModal({
          title:
            'Arquivar propriedade?',
          message:
            'Ela deixará de aparecer entre as propriedades ativas, mas o histórico será preservado.',
          confirmLabel:
            'Arquivar',
          danger: true,
        });

      if (!confirmed) {
        return;
      }

      archiveButton.disabled =
        true;

      try {
        await archiveProperty(
          property.id,
        );

        showToast(
          'Propriedade arquivada.',
          {
            type: 'success',
          },
        );

        navigate(
          '/properties',
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao arquivar:',
          error,
        );

        showToast(
          getAuthErrorMessage(
            error,
          ),
          {
            type: 'error',
          },
        );

        archiveButton.disabled =
          false;
      }
    };

  const handleRestore =
    async () => {
      const confirmed =
        await showConfirmModal({
          title:
            'Restaurar propriedade?',
          message:
            'Ela voltará a ficar disponível entre as propriedades ativas.',
          confirmLabel:
            'Restaurar',
        });

      if (!confirmed) {
        return;
      }

      restoreButton.disabled =
        true;

      try {
        await restoreProperty(
          property.id,
        );

        showToast(
          'Propriedade restaurada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/properties/${property.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao restaurar:',
          error,
        );

        showToast(
          getAuthErrorMessage(
            error,
          ),
          {
            type: 'error',
          },
        );

        restoreButton.disabled =
          false;
      }
    };

  archiveButton?.addEventListener(
    'click',
    handleArchive,
  );

  restoreButton?.addEventListener(
    'click',
    handleRestore,
  );

  return () => {
    archiveButton?.removeEventListener(
      'click',
      handleArchive,
    );

    restoreButton?.removeEventListener(
      'click',
      handleRestore,
    );
  };
}
