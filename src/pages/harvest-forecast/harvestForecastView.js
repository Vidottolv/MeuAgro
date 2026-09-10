import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatDatePtBr,
} from '../../js/html.js';

import {
  getHarvestForecastClass,
  getHarvestForecastLabel,
} from '../../constants/harvestForecast.js';

function relativeForecastLabel(
  cycle,
) {
  const days =
    cycle.days_to_harvest;

  if (days < 0) {
    const delayed =
      Math.abs(days);

    return `Atrasada há ${delayed} ${
      delayed === 1
        ? 'dia'
        : 'dias'
    }`;
  }

  if (days === 0) {
    return 'Prevista para hoje';
  }

  if (days === 1) {
    return 'Falta 1 dia';
  }

  return `Faltam ${days} dias`;
}

export function harvestForecastCard(
  cycle,
) {
  const title =
    cycle.variety
      ? `${cycle.crop?.name || 'Cultura'} • ${cycle.variety}`
      : cycle.crop?.name ||
        'Cultura';

  return `
    <article class="harvest-forecast-card">
      <a
        href="/plantings/${cycle.id}"
        class="harvest-forecast-card__main"
        data-link
      >
        <div class="harvest-forecast-card__top">
          <span class="harvest-forecast-card__icon">
            ${icon('harvest')}
          </span>

          <div class="harvest-forecast-card__identity">
            <h3>
              ${escapeHtml(
                title,
              )}
            </h3>

            <p>
              ${escapeHtml(
                cycle.property?.name ||
                'Propriedade',
              )}
              •
              ${escapeHtml(
                cycle.area?.name ||
                'Área',
              )}
            </p>
          </div>

          ${icon('chevronRight')}
        </div>

        <div class="harvest-forecast-card__status-row">
          <span
            class="
              harvest-forecast-status
              ${getHarvestForecastClass(
                cycle.forecast_state,
              )}
            "
          >
            ${escapeHtml(
              getHarvestForecastLabel(
                cycle.forecast_state,
              ),
            )}
          </span>

          <strong>
            ${escapeHtml(
              relativeForecastLabel(
                cycle,
              ),
            )}
          </strong>
        </div>

        <div class="harvest-forecast-card__date">
          ${icon('calendar')}

          <span>
            Previsão atual:
            <strong>
              ${formatDatePtBr(
                cycle.current_harvest_forecast,
              )}
            </strong>
          </span>
        </div>

        ${
          cycle.initial_harvest_forecast &&
          cycle.initial_harvest_forecast !==
            cycle.current_harvest_forecast
            ? `
              <p class="harvest-forecast-card__initial">
                Previsão inicial:
                ${formatDatePtBr(
                  cycle.initial_harvest_forecast,
                )}
              </p>
            `
            : ''
        }
      </a>
    </article>
  `;
}
