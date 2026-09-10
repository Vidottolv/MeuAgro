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
  getCycleFinancialDetail,
} from '../../services/financeService.js';

import {
  getFinancialResultClass,
  getFinancialResultLabel,
} from '../../constants/financialResult.js';

import {
  getProductionCycleStatusLabel,
} from '../../constants/productionCycleStatus.js';

import {
  saleCard,
} from '../sales/saleView.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDatePtBr,
  formatNumberPtBr,
} from '../../js/html.js';

function cycleTitle(
  cycle,
) {
  const crop =
    cycle.crop?.name ||
    'Ciclo produtivo';

  const variety =
    cycle.variety?.trim();

  return variety
    ? `${crop} • ${variety}`
    : crop;
}

function cycleLocation(
  cycle,
) {
  return [
    cycle.property?.name,
    cycle.area?.name,
  ]
    .filter(Boolean)
    .join(' • ') ||
    'Local não informado';
}

export async function renderCycleFinanceDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let detail = null;

  try {
    detail =
      await getCycleFinancialDetail(
        params.cycleId,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar resultado do ciclo:',
      error,
    );
  }

  if (!detail) {
    app.innerHTML =
      appShell({
        session,
        title: 'Financeiro',
        eyebrow: 'Resultado do ciclo',
        activeNav: 'more',
        content:
          emptyState({
            iconName:
              'chart',
            title:
              'Resultado não encontrado',
            description:
              'O ciclo pode não existir, estar arquivado ou a migration da Etapa 23 ainda não ter sido executada.',
            actionLabel:
              'Voltar para o financeiro',
            actionHref:
              '/more/finance',
          }),
      });

    return null;
  }

  const {
    cycle,
    summary,
    inputCosts,
    production,
    sales,
  } = detail;

  app.innerHTML =
    appShell({
      session,
      title: 'Resultado do ciclo',
      eyebrow: 'Financeiro',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/more/finance"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Financeiro
            </a>
          </div>
        </section>

        <section class="finance-detail-hero">
          <div class="finance-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${escapeHtml(
                  cycleLocation(
                    cycle,
                  ),
                )}
              </p>

              <h2>
                ${escapeHtml(
                  cycleTitle(
                    cycle,
                  ),
                )}
              </h2>

              <p>
                ${escapeHtml(
                  getProductionCycleStatusLabel(
                    cycle.status,
                  ),
                )}
                ${
                  cycle.season?.name
                    ? ` • ${escapeHtml(
                        cycle.season.name,
                      )}`
                    : ''
                }
              </p>
            </div>

            <span
              class="
                financial-result
                ${getFinancialResultClass(
                  summary.result_state,
                )}
              "
            >
              ${escapeHtml(
                getFinancialResultLabel(
                  summary.result_state,
                ),
              )}
            </span>
          </div>

          <div class="property-detail-actions">
            <a
              href="/plantings/${cycle.id}"
              class="button button--secondary"
              data-link
            >
              ${icon('sprout')}
              Abrir ciclo
            </a>

            <a
              href="/more/sales"
              class="button button--secondary"
              data-link
            >
              ${icon('cart')}
              Ver vendas
            </a>
          </div>
        </section>

        <section class="finance-detail-summary">
          <article>
            <span>
              Custos de insumos
            </span>

            <strong class="finance-value--cost">
              ${formatCurrencyBRL(
                summary.input_cost,
              )}
            </strong>

            <small>
              ${summary.usage_transactions_count}
              ${
                summary.usage_transactions_count === 1
                  ? 'uso'
                  : 'usos'
              }
            </small>
          </article>

          <article>
            <span>
              Receita de vendas
            </span>

            <strong class="finance-value--revenue">
              ${formatCurrencyBRL(
                summary.sales_revenue,
              )}
            </strong>

            <small>
              ${summary.sales_count}
              ${
                summary.sales_count === 1
                  ? 'venda'
                  : 'vendas'
              }
            </small>
          </article>

          <article>
            <span>
              Resultado estimado
            </span>

            <strong
              class="
                ${summary.estimated_result > 0
                  ? 'finance-value--positive'
                  : summary.estimated_result < 0
                    ? 'finance-value--negative'
                    : ''
                }
              "
            >
              ${formatCurrencyBRL(
                summary.estimated_result,
              )}
            </strong>

            <small>
              Receita - insumos
            </small>
          </article>

          <article>
            <span>
              Margem sobre receita
            </span>

            <strong>
              ${
                summary.gross_margin_percent ===
                  null
                  ? '-'
                  : `${formatNumberPtBr(
                      summary.gross_margin_percent,
                      {
                        maximumFractionDigits: 2,
                      },
                    )}%`
              }
            </strong>

            <small>
              Apenas custos desta etapa
            </small>
          </article>
        </section>

        <section class="finance-scope-note">
          ${icon('info')}

          <div>
            <strong>
              Como o resultado é calculado
            </strong>

            <p>
              Resultado estimado = receita das vendas - custos dos insumos consumidos no ciclo. Este valor ainda não inclui mão de obra, combustível, máquinas, energia, frete, impostos ou despesas administrativas.
            </p>
          </div>
        </section>

        <section class="finance-detail-section">
          <div class="finance-detail-section__header">
            <div>
              <p class="section-eyebrow">
                Produção
              </p>

              <h2>
                Colhido, vendido e disponível
              </h2>

              <p>
                Quantidades são separadas por unidade para evitar somar kg, caixas, sacas ou outras unidades incompatíveis.
              </p>
            </div>
          </div>

          ${
            production.length
              ? `
                <div class="finance-production-grid">
                  ${production
                    .map(
                      (row) => `
                        <article class="finance-production-card">
                          <div class="finance-production-card__header">
                            <strong>
                              ${escapeHtml(
                                row.unit,
                              )}
                            </strong>

                            <span>
                              ${row.harvests_count}
                              ${
                                row.harvests_count === 1
                                  ? 'colheita'
                                  : 'colheitas'
                              }
                            </span>
                          </div>

                          <div class="finance-production-card__metrics">
                            <div>
                              <span>
                                Colhido
                              </span>

                              <strong>
                                ${formatNumberPtBr(
                                  row.harvested_quantity,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Vendido
                              </span>

                              <strong>
                                ${formatNumberPtBr(
                                  row.sold_quantity,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Não vendido
                              </span>

                              <strong>
                                ${formatNumberPtBr(
                                  row.remaining_quantity,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Receita
                              </span>

                              <strong>
                                ${formatCurrencyBRL(
                                  row.gross_revenue,
                                )}
                              </strong>
                            </div>
                          </div>
                        </article>
                      `,
                    )
                    .join('')}
                </div>
              `
              : `
                <div class="settings-empty-state">
                  ${icon('harvest')}

                  <p>
                    Nenhuma colheita foi registrada neste ciclo.
                  </p>
                </div>
              `
          }
        </section>

        <section class="finance-detail-section">
          <div class="finance-detail-section__header">
            <div>
              <p class="section-eyebrow">
                Custos
              </p>

              <h2>
                Insumos consumidos
              </h2>

              <p>
                O custo é capturado pelo preço do lote no momento em que o insumo é utilizado em um evento.
              </p>
            </div>

            <strong class="finance-section-total">
              ${formatCurrencyBRL(
                summary.input_cost,
              )}
            </strong>
          </div>

          ${
            inputCosts.length
              ? `
                <div class="finance-cost-list">
                  ${inputCosts
                    .map(
                      (item) => `
                        <article class="finance-cost-row">
                          <span class="finance-cost-row__icon">
                            ${icon('box')}
                          </span>

                          <div class="finance-cost-row__content">
                            <strong>
                              ${escapeHtml(
                                item.input_name,
                              )}
                            </strong>

                            <span>
                              ${formatNumberPtBr(
                                item.quantity_used,
                              )}
                              ${escapeHtml(
                                item.unit,
                              )}
                              •
                              ${item.usage_count}
                              ${
                                item.usage_count === 1
                                  ? 'aplicação'
                                  : 'aplicações'
                              }
                              ${
                                item.brand
                                  ? ` • ${escapeHtml(
                                      item.brand,
                                    )}`
                                  : ''
                              }
                            </span>
                          </div>

                          <strong class="finance-cost-row__value">
                            ${formatCurrencyBRL(
                              item.total_cost,
                            )}
                          </strong>
                        </article>
                      `,
                    )
                    .join('')}
                </div>
              `
              : `
                <div class="settings-empty-state">
                  ${icon('box')}

                  <p>
                    Nenhum custo de insumo foi registrado neste ciclo.
                  </p>
                </div>
              `
          }
        </section>

        <section class="finance-detail-section">
          <div class="finance-detail-section__header">
            <div>
              <p class="section-eyebrow">
                Receitas
              </p>

              <h2>
                Vendas do ciclo
              </h2>

              <p>
                Todas as vendas das colheitas deste ciclo são consolidadas aqui.
              </p>
            </div>

            <strong class="finance-section-total finance-value--revenue">
              ${formatCurrencyBRL(
                summary.sales_revenue,
              )}
            </strong>
          </div>

          ${
            sales.length
              ? `
                <div class="sale-list">
                  ${sales
                    .map(
                      saleCard,
                    )
                    .join('')}
                </div>
              `
              : `
                <div class="settings-empty-state">
                  ${icon('cart')}

                  <p>
                    Nenhuma venda foi registrada para as colheitas deste ciclo.
                  </p>
                </div>
              `
          }
        </section>

        <section class="finance-detail-section">
          <div class="finance-detail-section__header">
            <div>
              <p class="section-eyebrow">
                Referências
              </p>

              <h2>
                Dados do ciclo
              </h2>
            </div>
          </div>

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
                Plantio
              </p>

              <p class="detail-card__value">
                ${formatDatePtBr(
                  cycle.planting_date,
                )}
              </p>
            </article>

            <article class="detail-card">
              <p class="detail-card__label">
                Colheita final
              </p>

              <p class="detail-card__value">
                ${formatDatePtBr(
                  cycle.final_harvest_date,
                )}
              </p>
            </article>
          </section>
        </section>
      `,
    });

  return null;
}
