import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDatePtBr,
  formatNumberPtBr,
} from '../../js/html.js';

import {
  getHarvestDestinationLabel,
} from '../../constants/harvestDestinations.js';

import {
  getHarvestSalesSummary,
} from '../../services/harvestService.js';

export function harvestTitle(
  harvest,
) {
  const crop =
    harvest.production_cycle
      ?.crop?.name ||
    'Colheita';

  const variety =
    harvest.production_cycle
      ?.variety?.trim();

  return variety
    ? `${crop} • ${variety}`
    : crop;
}

export function harvestLocationLabel(
  harvest,
) {
  return [
    harvest.production_cycle
      ?.property?.name,
    harvest.production_cycle
      ?.area?.name,
  ]
    .filter(Boolean)
    .join(' • ') ||
    'Local não informado';
}

export function harvestCard(
  harvest,
) {
  const salesSummary =
    getHarvestSalesSummary(
      harvest,
    );

  return `
    <article class="harvest-card">
      <a
        href="/more/harvests/${harvest.id}"
        class="harvest-card__main"
        data-link
      >
        <div class="harvest-card__top">
          <span class="harvest-card__icon">
            ${icon('harvest')}
          </span>

          <div class="harvest-card__identity">
            <h3>
              ${escapeHtml(
                harvestTitle(
                  harvest,
                ),
              )}
            </h3>

            <p>
              ${escapeHtml(
                harvestLocationLabel(
                  harvest,
                ),
              )}
            </p>
          </div>

          ${icon('chevronRight')}
        </div>

        <div class="harvest-card__metrics">
          <div>
            <span>Data</span>
            <strong>
              ${formatDatePtBr(
                harvest.harvest_date,
              )}
            </strong>
          </div>

          <div>
            <span>Quantidade</span>
            <strong>
              ${formatNumberPtBr(
                harvest.quantity,
              )}
              ${escapeHtml(
                harvest.unit,
              )}
            </strong>
          </div>

          <div>
            <span>Destino</span>
            <strong>
              ${escapeHtml(
                getHarvestDestinationLabel(
                  harvest.destination,
                ),
              )}
            </strong>
          </div>
        </div>

        ${
          salesSummary.salesCount > 0
            ? `
              <div class="harvest-card__sales">
                <span>
                  ${salesSummary.salesCount} ${
                    salesSummary.salesCount === 1
                      ? 'venda'
                      : 'vendas'
                  }
                </span>

                <strong>
                  ${formatCurrencyBRL(
                    salesSummary.grossRevenue,
                  )}
                </strong>
              </div>
            `
            : ''
        }
      </a>
    </article>
  `;
}
