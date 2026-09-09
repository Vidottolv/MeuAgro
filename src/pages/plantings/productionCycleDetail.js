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
  archiveProductionCycle,
  getProductionCycleById,
  restoreProductionCycle,
} from '../../services/productionCycleService.js';

import {
  cycleLocationLabel,
  cycleTitle,
  plantedQuantityLabel,
} from './productionCycleView.js';

import {
  getProductionCycleStatusClass,
  getProductionCycleStatusLabel,
} from '../../constants/productionCycleStatus.js';

import {
  getCycleMetrics,
} from '../../js/cycleMetrics.js';

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

export async function renderProductionCycleDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector('#app');

  let cycle = null;

  try {
    cycle =
      await getProductionCycleById(
        params.cycleId,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar plantio:',
      error,
    );
  }

  if (!cycle) {
    app.innerHTML =
      appShell({
        session,
        title: 'Plantio',
        eyebrow: 'Ciclos produtivos',
        activeNav: 'plantings',
        content:
          emptyState({
            iconName: 'sprout',
            title:
              'Plantio não encontrado',
            description:
              'Este ciclo não existe ou não pertence à sua conta.',
            actionLabel:
              'Voltar para plantios',
            actionHref:
              '/plantings',
          }),
      });

    return null;
  }

  const archived =
    Boolean(cycle.deleted_at);

  const metrics =
    getCycleMetrics(cycle);

  const quantity =
    plantedQuantityLabel(cycle);

  app.innerHTML =
    appShell({
      session,
      title: 'Plantio',
      eyebrow: 'Ciclo produtivo',
      activeNav: 'plantings',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/plantings"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Plantios
            </a>
          </div>
        </section>

        <section class="cycle-detail-hero">
          <div class="cycle-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${escapeHtml(
                  cycleLocationLabel(
                    cycle,
                  ),
                )}
              </p>

              <h2>
                ${escapeHtml(
                  cycleTitle(cycle),
                )}
              </h2>

              <p>
                ${escapeHtml(
                  cycle.season?.name ||
                  'Sem safra vinculada',
                )}
              </p>
            </div>

            ${
              archived
                ? `
                  <span class="property-status property-status--archived">
                    Arquivado
                  </span>
                `
                : `
                  <span
                    class="
                      cycle-status
                      ${getProductionCycleStatusClass(
                        cycle.status,
                      )}
                    "
                  >
                    ${escapeHtml(
                      getProductionCycleStatusLabel(
                        cycle.status,
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
                    id="restore-cycle"
                    class="button button--secondary"
                    type="button"
                  >
                    ${icon('refresh')}
                    Restaurar plantio
                  </button>
                </div>
              `
              : `
                <div class="property-detail-actions">
                  <a
                    href="/plantings/${cycle.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${icon('edit')}
                    Editar
                  </a>

                  <button
                    id="archive-cycle"
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

        <section class="cycle-metrics-grid">
          <article class="cycle-metric">
            <span class="cycle-metric__icon">
              ${icon('calendar')}
            </span>

            <div>
              <strong>
                ${escapeHtml(
                  metrics.plantingText,
                )}
              </strong>

              <span>
                Plantio: ${formatDatePtBr(
                  cycle.planting_date,
                )}
              </span>
            </div>
          </article>

          <article class="cycle-metric">
            <span class="cycle-metric__icon">
              ${icon('harvest')}
            </span>

            <div>
              <strong
                class="${
                  metrics.delayedDays > 0
                    ? 'text-danger'
                    : ''
                }"
              >
                ${escapeHtml(
                  metrics.forecastText,
                )}
              </strong>

              <span>
                Atual: ${formatDatePtBr(
                  cycle.current_harvest_forecast,
                )}
              </span>
            </div>
          </article>

          <article class="cycle-metric">
            <span class="cycle-metric__icon">
              ${icon('chart')}
            </span>

            <div>
              <strong>
                ${
                  metrics.progressPercent !==
                  null
                    ? `${metrics.progressPercent}%`
                    : '-'
                }
              </strong>

              <span>
                Ciclo estimado concluído
              </span>
            </div>
          </article>
        </section>

        ${
          metrics.progressPercent !== null
            ? `
              <section class="cycle-detail-progress">
                <div class="cycle-progress__row">
                  <span>
                    Progresso aproximado
                  </span>

                  <strong>
                    ${metrics.progressPercent}%
                  </strong>
                </div>

                <div class="cycle-progress__track">
                  <span
                    style="width: ${metrics.progressPercent}%"
                  ></span>
                </div>
              </section>
            `
            : ''
        }

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Propriedade
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                cycle.property?.name ||
                '-',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Área
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                cycle.area?.name ||
                '-',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Safra
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                cycle.season?.name ||
                'Sem safra',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Cultura
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                cycle.crop?.name ||
                '-',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Variedade
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                cycle.variety ||
                'Não informada',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Quantidade plantada
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                quantity ||
                'Não informada',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Previsão inicial
            </p>
            <p class="detail-card__value">
              ${formatDatePtBr(
                cycle.initial_harvest_forecast,
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Data real da colheita
            </p>
            <p class="detail-card__value">
              ${formatDatePtBr(
                cycle.final_harvest_date,
              )}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${escapeHtml(
              cycle.notes ||
              'Nenhuma observação informada.',
            )}
          </p>
        </article>

        ${
          !archived
            ? `
              <section
                class="empty-state"
                style="margin-top: 16px;"
              >
                <div class="empty-state__icon">
                  ${icon('clipboard')}
                </div>

                <h2>
                  Linha do tempo
                </h2>

                <p>
                  Na Etapa 11 os eventos de plantio, irrigação, adubação, pragas, fotografias e demais operações aparecerão aqui.
                </p>
              </section>
            `
            : ''
        }
      `,
    });

  const archiveButton =
    document.querySelector(
      '#archive-cycle',
    );

  const restoreButton =
    document.querySelector(
      '#restore-cycle',
    );

  const handleArchive =
    async () => {
      const confirmed =
        await showConfirmModal({
          title:
            'Arquivar plantio?',
          message:
            'O ciclo deixará a listagem normal, mas permanecerá armazenado para preservar todo o histórico.',
          confirmLabel:
            'Arquivar',
          danger: true,
        });

      if (!confirmed) return;

      archiveButton.disabled =
        true;

      try {
        await archiveProductionCycle(
          cycle.id,
        );

        showToast(
          'Plantio arquivado.',
          {
            type: 'success',
          },
        );

        navigate(
          '/plantings',
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao arquivar plantio:',
          error,
        );

        showToast(
          getDataErrorMessage(error),
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
            'Restaurar plantio?',
          message:
            'As referências da propriedade, área, safra e cultura serão verificadas novamente antes da restauração.',
          confirmLabel:
            'Restaurar',
        });

      if (!confirmed) return;

      restoreButton.disabled =
        true;

      try {
        await restoreProductionCycle(
          cycle.id,
        );

        showToast(
          'Plantio restaurado.',
          {
            type: 'success',
          },
        );

        navigate(
          `/plantings/${cycle.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao restaurar plantio:',
          error,
        );

        showToast(
          getDataErrorMessage(error),
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
