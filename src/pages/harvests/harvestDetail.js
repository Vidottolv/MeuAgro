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
  finalizeCycleFromHarvest,
  getHarvestById,
  getHarvestSalesSummary,
} from '../../services/harvestService.js';

import {
  getHarvestDestinationLabel,
  harvestAllowsSales,
} from '../../constants/harvestDestinations.js';

import {
  getProductionCycleStatusLabel,
} from '../../constants/productionCycleStatus.js';

import {
  harvestLocationLabel,
  harvestTitle,
} from './harvestView.js';

import {
  saleCard,
} from '../sales/saleView.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDatePtBr,
  formatNumberPtBr,
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

const TERMINAL_CYCLE_STATUSES = [
  'harvested',
  'closed',
  'cancelled',
];

export async function renderHarvestDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let harvest = null;

  try {
    harvest =
      await getHarvestById(
        params.harvestId,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar colheita:',
      error,
    );
  }

  if (!harvest) {
    app.innerHTML =
      appShell({
        session,
        title: 'Colheita',
        eyebrow: 'Produção',
        activeNav: 'more',
        content:
          emptyState({
            iconName:
              'harvest',
            title:
              'Colheita não encontrada',
            description:
              'Este registro não existe ou não pertence à sua conta.',
            actionLabel:
              'Voltar para colheitas',
            actionHref:
              '/more/harvests',
          }),
      });

    return null;
  }

  const cycle =
    harvest.production_cycle;

  const salesSummary =
    getHarvestSalesSummary(
      harvest,
    );

  const canSell =
    harvestAllowsSales(
      harvest.destination,
    );

  const cycleTerminal =
    TERMINAL_CYCLE_STATUSES
      .includes(
        cycle?.status,
      );

  app.innerHTML =
    appShell({
      session,
      title: 'Colheita',
      eyebrow: 'Produção',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/more/harvests"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Colheitas
            </a>
          </div>
        </section>

        <section class="harvest-detail-hero">
          <div class="harvest-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${escapeHtml(
                  harvestLocationLabel(
                    harvest,
                  ),
                )}
              </p>

              <h2>
                ${escapeHtml(
                  harvestTitle(
                    harvest,
                  ),
                )}
              </h2>

              <p>
                ${formatDatePtBr(
                  harvest.harvest_date,
                )}
              </p>
            </div>

            <span class="harvest-destination-badge">
              ${escapeHtml(
                getHarvestDestinationLabel(
                  harvest.destination,
                ),
              )}
            </span>
          </div>

          <div class="property-detail-actions">
            <a
              href="/more/harvests/${harvest.id}/edit"
              class="button button--secondary"
              data-link
            >
              ${icon('edit')}
              Editar
            </a>

            ${
              canSell &&
              salesSummary.remainingQuantity >
                0
                ? `
                  <a
                    href="/more/harvests/${harvest.id}/sales/new"
                    class="button button--primary"
                    data-link
                  >
                    ${icon('cart')}
                    Registrar venda
                  </a>
                `
                : ''
            }
          </div>
        </section>

        <section class="harvest-detail-summary">
          <article>
            <span>Quantidade colhida</span>
            <strong>
              ${formatNumberPtBr(
                harvest.quantity,
              )}
              ${escapeHtml(
                harvest.unit,
              )}
            </strong>
          </article>

          <article>
            <span>Quantidade vendida</span>
            <strong>
              ${formatNumberPtBr(
                salesSummary.soldQuantity,
              )}
              ${escapeHtml(
                harvest.unit,
              )}
            </strong>
          </article>

          <article>
            <span>Disponível para venda</span>
            <strong>
              ${
                canSell
                  ? `${formatNumberPtBr(
                      salesSummary.remainingQuantity,
                    )} ${escapeHtml(
                      harvest.unit,
                    )}`
                  : 'Não se aplica'
              }
            </strong>
          </article>

          <article>
            <span>Receita vinculada</span>
            <strong>
              ${formatCurrencyBRL(
                salesSummary.grossRevenue,
              )}
            </strong>
          </article>
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Ciclo produtivo
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                harvestTitle(
                  harvest,
                ),
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Situação do ciclo
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                getProductionCycleStatusLabel(
                  cycle?.status,
                ),
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Classificação
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                harvest.quality_classification ||
                'Não informada',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Destino
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                getHarvestDestinationLabel(
                  harvest.destination,
                ),
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
              harvest.notes ||
              'Nenhuma observação informada.',
            )}
          </p>
        </article>

        <section class="harvest-links-card">
          <a
            href="/plantings/${cycle.id}"
            class="harvest-link-row"
            data-link
          >
            <span>
              ${icon('sprout')}
              Abrir ciclo produtivo
            </span>

            ${icon('chevronRight')}
          </a>

          ${
            harvest.production_event_id
              ? `
                <a
                  href="/plantings/${cycle.id}#timeline"
                  class="harvest-link-row"
                  data-link
                >
                  <span>
                    ${icon('clipboard')}
                    Ver evento na linha do tempo
                  </span>

                  ${icon('chevronRight')}
                </a>
              `
              : ''
          }
        </section>

        ${
          !cycleTerminal
            ? `
              <section class="harvest-finalize-card">
                <div>
                  <strong>
                    Esta foi a colheita final?
                  </strong>

                  <p>
                    Como um ciclo pode possuir várias colheitas, registrar uma colheita não encerra o plantio automaticamente.
                  </p>
                </div>

                <button
                  id="finalize-harvest-cycle"
                  class="button button--secondary"
                  type="button"
                >
                  ${icon('harvest')}
                  Marcar ciclo como colhido
                </button>
              </section>
            `
            : ''
        }

        <section class="harvest-sales-section">
          <div class="harvest-sales-section__header">
            <div>
              <p class="section-eyebrow">
                Etapa 22
              </p>

              <h2>
                Vendas desta colheita
              </h2>

              <p>
                ${salesSummary.salesCount} ${
                  salesSummary.salesCount === 1
                    ? 'venda registrada'
                    : 'vendas registradas'
                }.
              </p>
            </div>

            ${
              canSell &&
              salesSummary.remainingQuantity >
                0
                ? `
                  <a
                    href="/more/harvests/${harvest.id}/sales/new"
                    class="button button--primary button--compact"
                    data-link
                  >
                    ${icon('plus')}
                    Nova venda
                  </a>
                `
                : ''
            }
          </div>

          ${
            harvest.sales?.length
              ? `
                <div class="sale-list">
                  ${harvest.sales
                    .slice()
                    .sort(
                      (a, b) =>
                        String(
                          b.sale_date,
                        ).localeCompare(
                          String(
                            a.sale_date,
                          ),
                        ),
                    )
                    .map(
                      (sale) =>
                        saleCard({
                          ...sale,
                          harvest,
                        }),
                    )
                    .join('')}
                </div>
              `
              : (
                  canSell
                    ? `
                      <div class="settings-empty-state">
                        ${icon('cart')}

                        <p>
                          Nenhuma venda foi registrada para esta colheita.
                        </p>
                      </div>
                    `
                    : `
                      <div class="settings-empty-state">
                        ${icon('info')}

                        <p>
                          O destino desta colheita não permite vendas. Edite o destino para "Venda" ou "Consumo próprio e venda" se necessário.
                        </p>
                      </div>
                    `
                )
          }
        </section>
      `,
    });

  const finalizeButton =
    document.querySelector(
      '#finalize-harvest-cycle',
    );

  const handleFinalize =
    async () => {
      const confirmed =
        await showConfirmModal({
          title:
            'Marcar ciclo como colhido?',
          message:
            'Use esta ação somente quando esta tiver sido a colheita final. O ciclo será marcado como Colhido e os lembretes futuros serão cancelados.',
          confirmLabel:
            'Marcar como colhido',
        });

      if (!confirmed) {
        return;
      }

      finalizeButton.disabled =
        true;

      try {
        await finalizeCycleFromHarvest(
          harvest.id,
        );

        showToast(
          'Ciclo marcado como colhido.',
          {
            type: 'success',
          },
        );

        navigate(
          `/more/harvests/${harvest.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao finalizar ciclo:',
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

        finalizeButton.disabled =
          false;
      }
    };

  finalizeButton?.addEventListener(
    'click',
    handleFinalize,
  );

  return () => {
    finalizeButton?.removeEventListener(
      'click',
      handleFinalize,
    );
  };
}
