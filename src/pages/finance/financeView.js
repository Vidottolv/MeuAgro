import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatCurrencyBRL,
} from '../../js/html.js';

import {
  getProductionCycleStatusLabel,
} from '../../constants/productionCycleStatus.js';

import {
  getFinancialResultClass,
  getFinancialResultLabel,
} from '../../constants/financialResult.js';

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

export function financeCycleCard(
  cycle,
) {
  const finance =
    cycle.finance;

  return `
    <article class="finance-cycle-card">
      <a
        href="/more/finance/${cycle.id}"
        class="finance-cycle-card__main"
        data-link
      >
        <div class="finance-cycle-card__top">
          <span class="finance-cycle-card__icon">
            ${icon('chart')}
          </span>

          <div class="finance-cycle-card__identity">
            <h3>
              ${escapeHtml(
                cycleTitle(
                  cycle,
                ),
              )}
            </h3>

            <p>
              ${escapeHtml(
                cycleLocation(
                  cycle,
                ),
              )}
            </p>
          </div>

          ${icon('chevronRight')}
        </div>

        <div class="finance-cycle-card__badges">
          <span class="cycle-chip">
            ${escapeHtml(
              getProductionCycleStatusLabel(
                cycle.status,
              ),
            )}
          </span>

          <span
            class="
              financial-result
              ${getFinancialResultClass(
                finance.result_state,
              )}
            "
          >
            ${escapeHtml(
              getFinancialResultLabel(
                finance.result_state,
              ),
            )}
          </span>
        </div>

        <div class="finance-cycle-card__metrics">
          <div>
            <span>
              Custos de insumos
            </span>

            <strong class="finance-value--cost">
              ${formatCurrencyBRL(
                finance.input_cost,
              )}
            </strong>
          </div>

          <div>
            <span>
              Receita
            </span>

            <strong class="finance-value--revenue">
              ${formatCurrencyBRL(
                finance.sales_revenue,
              )}
            </strong>
          </div>

          <div class="finance-cycle-card__result">
            <span>
              Resultado estimado
            </span>

            <strong
              class="
                ${finance.estimated_result > 0
                  ? 'finance-value--positive'
                  : finance.estimated_result < 0
                    ? 'finance-value--negative'
                    : ''
                }
              "
            >
              ${formatCurrencyBRL(
                finance.estimated_result,
              )}
            </strong>
          </div>
        </div>

        <div class="finance-cycle-card__footer">
          <span>
            ${finance.usage_transactions_count}
            ${
              finance.usage_transactions_count === 1
                ? 'uso de insumo'
                : 'usos de insumo'
            }
          </span>

          <span>
            ${finance.harvests_count}
            ${
              finance.harvests_count === 1
                ? 'colheita'
                : 'colheitas'
            }
          </span>

          <span>
            ${finance.sales_count}
            ${
              finance.sales_count === 1
                ? 'venda'
                : 'vendas'
            }
          </span>
        </div>
      </a>
    </article>
  `;
}
