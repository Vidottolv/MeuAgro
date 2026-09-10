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
  formatCurrencyBRL,
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
  listProductionEvents,
} from '../../services/productionEventService.js';

import {
  productionEventCard,
} from './productionEventView.js';

import {
  showPhotoViewer,
} from '../../components/photoViewerModal.js';

import {
  listHarvests,
} from '../../services/harvestService.js';

import {
  harvestCard,
} from '../harvests/harvestView.js';

import {
  getCycleFinancialSummary,
} from '../../services/financeService.js';

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

  let events = [];
  let harvests = [];
  let financialSummary = null;

  try {
    [
      events,
      harvests,
    ] =
      await Promise.all([
        listProductionEvents(
          cycle.id,
        ),
        listHarvests({
          cycleId:
            cycle.id,
        }),
      ]);
  } catch (error) {
    console.error(
      'Erro ao carregar linha do tempo:',
      error,
    );
  }

  try {
    financialSummary =
      await getCycleFinancialSummary(
        cycle.id,
      );
  } catch (error) {
    console.warn(
      'Resumo financeiro ainda não disponível:',
      error,
    );
  }

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

        <section class="cycle-harvest-section">
          <div class="cycle-harvest-section__header">
            <div>
              <p class="section-eyebrow">
                Colheitas
              </p>

              <h2>
                Produção colhida
              </h2>

              <p>
                ${harvests.length} ${
                  harvests.length === 1
                    ? 'colheita registrada'
                    : 'colheitas registradas'
                } neste ciclo.
              </p>
            </div>

            ${
              archived ||
              [
                'harvested',
                'closed',
                'cancelled',
              ].includes(
                cycle.status,
              )
                ? ''
                : `
                  <a
                    href="/plantings/${cycle.id}/harvests/new"
                    class="button button--primary button--compact"
                    data-link
                  >
                    ${icon('plus')}
                    Registrar colheita
                  </a>
                `
            }
          </div>

          ${
            harvests.length
              ? `
                <div class="cycle-harvest-list">
                  ${harvests
                    .slice(0, 3)
                    .map(
                      harvestCard,
                    )
                    .join('')}
                </div>

                ${
                  harvests.length > 3
                    ? `
                      <a
                        href="/more/harvests?cycle=${cycle.id}"
                        class="button button--ghost button--full"
                        data-link
                      >
                        Ver todas as colheitas
                      </a>
                    `
                    : ''
                }
              `
              : `
                <div class="dashboard-empty-inline dashboard-empty-inline--wide">
                  <span class="dashboard-empty-inline__icon">
                    ${icon('harvest')}
                  </span>

                  <div>
                    <strong>
                      Nenhuma colheita registrada
                    </strong>

                    <span>
                      Registre cada retirada separadamente para preservar colheitas parciais e sucessivas.
                    </span>
                  </div>
                </div>
              `
          }
        </section>

        ${
          financialSummary
            ? `
              <section class="cycle-finance-summary">
                <div class="cycle-finance-summary__header">
                  <div>
                    <p class="section-eyebrow">
                      Financeiro
                    </p>

                    <h2>
                      Resultado básico do ciclo
                    </h2>

                    <p>
                      Considera receitas de vendas e custos dos insumos consumidos.
                    </p>
                  </div>

                  <a
                    href="/more/finance/${cycle.id}"
                    class="button button--secondary button--compact"
                    data-link
                  >
                    ${icon('chart')}
                    Ver detalhes
                  </a>
                </div>

                <div class="cycle-finance-summary__metrics">
                  <div>
                    <span>
                      Custos
                    </span>

                    <strong class="finance-value--cost">
                      ${formatCurrencyBRL(
                        financialSummary.input_cost,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Receita
                    </span>

                    <strong class="finance-value--revenue">
                      ${formatCurrencyBRL(
                        financialSummary.sales_revenue,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Resultado
                    </span>

                    <strong
                      class="${
                        financialSummary.estimated_result > 0
                          ? 'finance-value--positive'
                          : financialSummary.estimated_result < 0
                            ? 'finance-value--negative'
                            : ''
                      }"
                    >
                      ${formatCurrencyBRL(
                        financialSummary.estimated_result,
                      )}
                    </strong>
                  </div>
                </div>
              </section>
            `
            : ''
        }

        <section
          id="timeline"
          class="timeline-section"
        >
          <div class="timeline-section__header">
            <div>
              <h2>
                Linha do tempo
              </h2>

              <p>
                ${events.length} ${
                  events.length === 1
                    ? 'evento registrado'
                    : 'eventos registrados'
                } neste ciclo.
              </p>
            </div>

            <div class="timeline-section__actions">
              <a
                href="/plantings/${cycle.id}/evolution"
                class="button button--secondary button--compact"
                data-link
              >
                ${icon('camera')}
                Evolução
              </a>

              ${
                archived
                  ? ''
                  : `
                    <a
                      href="/plantings/${cycle.id}/events/new"
                      class="button button--primary button--compact"
                      data-link
                    >
                      ${icon('plus')}
                      Novo evento
                    </a>
                  `
              }
            </div>
          </div>

          ${
            events.length
              ? `
                <div class="timeline-list">
                  ${events
                    .map(
                      (event) =>
                        productionEventCard(
                          event,
                          {
                            cycleId:
                              cycle.id,
                            readonly:
                              archived,
                          },
                        ),
                    )
                    .join('')}
                </div>
              `
              : `
                <div class="dashboard-empty-inline dashboard-empty-inline--wide">
                  <span class="dashboard-empty-inline__icon">
                    ${icon('clipboard')}
                  </span>

                  <div>
                    <strong>
                      Nenhum evento registrado
                    </strong>

                    <span>
                      Execute o SQL das Etapas 11–13 para criar automaticamente o evento inicial de plantio e registre novas atividades aqui.
                    </span>
                  </div>
                </div>
              `
          }
        </section>
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

  const timeline =
    document.querySelector(
      '#timeline',
    );

  const handleTimelineClick =
    (event) => {
      const viewer =
        event.target.closest(
          '[data-photo-view]',
        );

      if (!viewer) {
        return;
      }

      showPhotoViewer({
        src:
          viewer.dataset.photoView,
        alt:
          viewer.dataset.photoAlt ||
          'Foto do evento',
      });
    };

  timeline?.addEventListener(
    'click',
    handleTimelineClick,
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

    timeline?.removeEventListener(
      'click',
      handleTimelineClick,
    );
  };
}
