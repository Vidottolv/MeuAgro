import {
  appShell,
} from '../../components/appShell.js';

import {
  emptyState,
} from '../../components/emptyState.js';

import {
  icon,
} from '../../components/icons.js';

import {
  getPropertyById,
} from '../../services/propertyService.js';

import {
  getAreaById,
  archiveArea,
  restoreArea,
} from '../../services/areaService.js';

import {
  areaTypeName,
  areaSizeLabel,
} from './areaView.js';

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
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

import {
  navigate,
} from '../../js/router.js';

import {
  listProductionCycles,
  countOpenProductionCycles,
} from '../../services/productionCycleService.js';

import {
  cycleTitle,
} from '../plantings/productionCycleView.js';

import {
  getProductionCycleStatusLabel,
} from '../../constants/productionCycleStatus.js';

export async function renderAreaDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let property = null;
  let area = null;

  try {
    [
      property,
      area,
    ] =
      await Promise.all([
        getPropertyById(
          params.propertyId,
        ),
        getAreaById(
          params.areaId,
        ),
      ]);
  } catch (error) {
    console.error(
      'Erro ao carregar área:',
      error,
    );
  }

  if (
    !property ||
    !area ||
    area.property_id !==
      property.id
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Área',
        eyebrow: 'Propriedades',
        activeNav:
          'properties',
        content:
          emptyState({
            iconName:
              'layers',
            title:
              'Área não encontrada',
            description:
              'Este registro não existe ou não pertence à propriedade informada.',
            actionLabel:
              'Voltar para propriedades',
            actionHref:
              '/properties',
          }),
      });

    return null;
  }

  const archived =
    area.status ===
      'archived' ||
    Boolean(
      area.deleted_at,
    );

  const size =
    areaSizeLabel(area);

  let recentCycles = [];
  let openCycleCount = 0;

  if (!archived) {
    try {
      [
        recentCycles,
        openCycleCount,
      ] = await Promise.all([
        listProductionCycles({
          areaId: area.id,
          archived: false,
          limit: 3,
        }),
        countOpenProductionCycles({
          areaId: area.id,
        }),
      ]);
    } catch (error) {
      console.error(
        'Erro ao carregar ciclos da área:',
        error,
      );
    }
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Área',
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
              href="/properties/${property.id}/areas"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Áreas
            </a>
          </div>
        </section>

        <section class="area-detail-hero">
          <div class="property-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${escapeHtml(
                  areaTypeName(
                    area,
                  ),
                )}
              </p>

              <h2>
                ${escapeHtml(
                  area.name,
                )}
              </h2>

              <p>
                ${escapeHtml(
                  property.name,
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
                    href="/properties/${property.id}/areas/${area.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${icon('edit')}
                    Editar
                  </a>

                  <button
                    id="archive-area"
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
                    id="restore-area"
                    class="button button--secondary"
                    type="button"
                  >
                    ${icon('refresh')}
                    Restaurar área
                  </button>
                </div>
              `
          }
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Tipo
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                areaTypeName(
                  area,
                ),
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Tamanho
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                size ||
                'Não informado',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Localização interna
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                area.location_description ||
                'Não informada',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Cadastrada em
            </p>

            <p class="detail-card__value">
              ${formatDatePtBr(
                area.created_at,
              )}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Descrição
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${escapeHtml(
              area.description ||
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
              area.notes ||
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
                      Ciclos produtivos
                    </h2>

                    <p>
                      ${openCycleCount} ${
                        openCycleCount === 1
                          ? 'ciclo em aberto'
                          : 'ciclos em aberto'
                      }
                    </p>
                  </div>

                  <a
                    href="/plantings/new?property=${property.id}&area=${area.id}"
                    class="icon-button"
                    aria-label="Registrar plantio"
                    data-link
                  >
                    ${icon('plus')}
                  </a>
                </div>

                ${
                  recentCycles.length
                    ? `
                      <div class="area-preview-list">
                        ${recentCycles
                          .map(
                            (cycle) => `
                              <a
                                href="/plantings/${cycle.id}"
                                class="area-preview"
                                data-link
                              >
                                <span class="area-preview__icon">
                                  ${icon('sprout')}
                                </span>

                                <span class="area-preview__content">
                                  <strong>
                                    ${escapeHtml(
                                      cycleTitle(
                                        cycle,
                                      ),
                                    )}
                                  </strong>

                                  <span>
                                    ${escapeHtml(
                                      getProductionCycleStatusLabel(
                                        cycle.status,
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
                          ${icon('sprout')}
                        </div>

                        <h2>
                          Nenhum plantio nesta área
                        </h2>

                        <p>
                          Registre o primeiro ciclo produtivo sem perder os plantios futuros desta mesma área.
                        </p>

                        <a
                          href="/plantings/new?property=${property.id}&area=${area.id}"
                          class="button button--primary"
                          data-link
                        >
                          ${icon('plus')}
                          Registrar plantio
                        </a>
                      </div>
                    `
                }
              </section>
            `
            : ''
        }
      `,
    });

  const archiveButton =
    document.querySelector(
      '#archive-area',
    );

  const restoreButton =
    document.querySelector(
      '#restore-area',
    );

  const handleArchive =
    async () => {
      const confirmed =
        await showConfirmModal({
          title:
            'Arquivar área?',
          message:
            'Ela sairá da lista de áreas ativas, mas o histórico permanecerá preservado.',
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
        await archiveArea(
          area.id,
        );

        showToast(
          'Área arquivada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/properties/${property.id}/areas`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao arquivar área:',
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

        archiveButton.disabled =
          false;
      }
    };

  const handleRestore =
    async () => {
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

      restoreButton.disabled =
        true;

      try {
        await restoreArea(
          area.id,
        );

        showToast(
          'Área restaurada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/properties/${property.id}/areas/${area.id}`,
          {
            replace: true,
          },
        );
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
