import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatNumberPtBr,
} from '../../js/html.js';

import {
  getProductionCycleStatusClass,
  getProductionCycleStatusLabel,
} from '../../constants/productionCycleStatus.js';

import {
  getPlantedUnitLabel,
} from '../../constants/plantedUnits.js';

import {
  getCycleMetrics,
} from '../../js/cycleMetrics.js';

export function cycleTitle(cycle) {
  const crop =
    cycle.crop?.name ||
    'Cultura';

  const variety =
    cycle.variety?.trim();

  return variety
    ? `${crop} • ${variety}`
    : crop;
}

export function cycleLocationLabel(cycle) {
  const property =
    cycle.property?.name;

  const area =
    cycle.area?.name;

  return [
    property,
    area,
  ]
    .filter(Boolean)
    .join(' • ') ||
    'Local não informado';
}

export function plantedQuantityLabel(cycle) {
  if (
    cycle.planted_quantity === null ||
    cycle.planted_quantity === undefined
  ) {
    return null;
  }

  const unit =
    getPlantedUnitLabel(
      cycle.planted_unit,
    );

  return `${formatNumberPtBr(
    cycle.planted_quantity,
  )}${unit ? ` • ${unit}` : ''}`;
}

export function productionCycleCard(
  cycle,
  {
    archived = false,
  } = {},
) {
  const metrics =
    getCycleMetrics(cycle);

  const quantity =
    plantedQuantityLabel(cycle);

  return `
    <article class="cycle-card">
      <a
        href="/plantings/${cycle.id}"
        class="cycle-card__main"
        data-link
      >
        <div class="cycle-card__top">
          <span class="cycle-card__icon">
            ${icon('sprout')}
          </span>

          <div class="cycle-card__identity">
            <h3>
              ${escapeHtml(
                cycleTitle(cycle),
              )}
            </h3>

            <p>
              ${escapeHtml(
                cycleLocationLabel(
                  cycle,
                ),
              )}
            </p>
          </div>

          <span class="cycle-card__arrow">
            ${icon('chevronRight')}
          </span>
        </div>

        <div class="cycle-card__meta">
          <span
            class="
              cycle-status
              ${getProductionCycleStatusClass(
                cycle.status,
              )}
            "
          >
            ${
              archived
                ? 'Arquivado'
                : escapeHtml(
                    getProductionCycleStatusLabel(
                      cycle.status,
                    ),
                  )
            }
          </span>

          ${
            cycle.season?.name
              ? `
                <span class="cycle-chip">
                  ${icon('calendar')}
                  ${escapeHtml(
                    cycle.season.name,
                  )}
                </span>
              `
              : ''
          }

          ${
            quantity
              ? `
                <span class="cycle-chip">
                  ${escapeHtml(
                    quantity,
                  )}
                </span>
              `
              : ''
          }
        </div>

        <div class="cycle-timing">
          <span>
            ${metrics.plantingText}
          </span>

          <span
            class="${
              metrics.delayedDays > 0
                ? 'cycle-timing__late'
                : ''
            }"
          >
            ${metrics.forecastText}
          </span>
        </div>

        ${
          metrics.progressPercent !== null
            ? `
              <div class="cycle-progress">
                <div class="cycle-progress__row">
                  <span>
                    Ciclo estimado
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
              </div>
            `
            : ''
        }
      </a>

      ${
        archived
          ? `
            <div class="cycle-card__footer">
              <button
                class="property-card__restore"
                type="button"
                data-action="restore-cycle"
                data-cycle-id="${cycle.id}"
              >
                ${icon('refresh')}
                Restaurar
              </button>
            </div>
          `
          : ''
      }
    </article>
  `;
}
