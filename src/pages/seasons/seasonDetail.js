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
  archiveSeason,
  getSeasonById,
  restoreSeason,
} from '../../services/seasonService.js';

import {
  seasonPeriodLabel,
  seasonPropertyLabel,
} from './seasonView.js';

import {
  getSeasonStatusClass,
  getSeasonStatusLabel,
} from '../../constants/seasonStatus.js';

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

export async function renderSeasonDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let season = null;

  try {
    season =
      await getSeasonById(
        params.seasonId,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar safra:',
      error,
    );
  }

  if (!season) {
    app.innerHTML =
      appShell({
        session,
        title: 'Safra',
        eyebrow: 'Produção',
        activeNav: 'more',
        content:
          emptyState({
            iconName: 'calendar',
            title:
              'Safra não encontrada',
            description:
              'Este registro não existe ou não pertence à sua conta.',
            actionLabel:
              'Voltar para safras',
            actionHref:
              '/more/seasons',
          }),
      });

    return null;
  }

  const archived =
    Boolean(
      season.deleted_at,
    );

  let recentCycles = [];
  let openCycleCount = 0;

  if (!archived) {
    try {
      [
        recentCycles,
        openCycleCount,
      ] = await Promise.all([
        listProductionCycles({
          seasonId: season.id,
          archived: false,
          limit: 3,
        }),
        countOpenProductionCycles({
          seasonId: season.id,
        }),
      ]);
    } catch (error) {
      console.error(
        'Erro ao carregar ciclos da safra:',
        error,
      );
    }
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Safra',
      eyebrow: 'Produção',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/more/seasons"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Safras
            </a>
          </div>
        </section>

        <section class="season-detail-hero">
          <div class="season-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${escapeHtml(
                  seasonPropertyLabel(
                    season,
                  ),
                )}
              </p>

              <h2>
                ${escapeHtml(
                  season.name,
                )}
              </h2>

              <p>
                ${escapeHtml(
                  seasonPeriodLabel(
                    season,
                  ),
                )}
              </p>
            </div>

            ${
              archived
                ? `
                  <span class="property-status property-status--archived">
                    Arquivada
                  </span>
                `
                : `
                  <span
                    class="
                      season-status
                      ${getSeasonStatusClass(
                        season.status,
                      )}
                    "
                  >
                    ${escapeHtml(
                      getSeasonStatusLabel(
                        season.status,
                      ),
                    )}
                  </span>
                `
            }
          </div>

          ${
            archived
              ? `
                <div class="property-detail-actions">
                  <button
                    id="restore-season"
                    class="button button--secondary"
                    type="button"
                  >
                    ${icon('refresh')}
                    Restaurar safra
                  </button>
                </div>
              `
              : `
                <div class="property-detail-actions">
                  <a
                    href="/more/seasons/${season.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${icon('edit')}
                    Editar
                  </a>

                  <button
                    id="archive-season"
                    class="button button--danger"
                    type="button"
                  >
                    ${icon('archive')}
                    Arquivar
                  </button>
                </div>
              `
          }
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Propriedade
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                season.property?.name ||
                'Não encontrada',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Status
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                getSeasonStatusLabel(
                  season.status,
                ),
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Data inicial
            </p>

            <p class="detail-card__value">
              ${formatDatePtBr(
                season.start_date,
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Data final
            </p>

            <p class="detail-card__value">
              ${formatDatePtBr(
                season.end_date,
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
              season.description ||
              'Nenhuma descrição informada.',
            )}
          </p>
        </article>

        ${
          !archived
            ? `
              <section class="property-seasons-summary">
                <div class="property-seasons-summary__header">
                  <div>
                    <h2>
                      Ciclos desta safra
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
                    href="/plantings/new?property=${season.property_id}&season=${season.id}"
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
                      <div class="season-preview-list">
                        ${recentCycles
                          .map(
                            (cycle) => `
                              <a
                                href="/plantings/${cycle.id}"
                                class="season-preview"
                                data-link
                              >
                                <span class="season-preview__icon">
                                  ${icon('sprout')}
                                </span>

                                <span class="season-preview__content">
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
                          Nenhum ciclo nesta safra
                        </h2>

                        <p>
                          Vincule o primeiro plantio desta safra a uma área e cultura.
                        </p>

                        <a
                          href="/plantings/new?property=${season.property_id}&season=${season.id}"
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
      '#archive-season',
    );

  const restoreButton =
    document.querySelector(
      '#restore-season',
    );

  const handleArchive =
    async () => {
      const confirmed =
        await showConfirmModal({
          title:
            'Arquivar safra?',
          message:
            'A safra deixará de aparecer na listagem principal, mas continuará preservada para manter o histórico.',
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
        await archiveSeason(
          season.id,
        );

        showToast(
          'Safra arquivada.',
          {
            type: 'success',
          },
        );

        navigate(
          '/more/seasons',
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao arquivar safra:',
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
            'Restaurar safra?',
          message:
            'Ela voltará a aparecer entre as safras da sua conta.',
          confirmLabel:
            'Restaurar',
        });

      if (!confirmed) {
        return;
      }

      restoreButton.disabled =
        true;

      try {
        await restoreSeason(
          season.id,
        );

        showToast(
          'Safra restaurada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/more/seasons/${season.id}`,
          {
            replace: true,
          },
        );
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
