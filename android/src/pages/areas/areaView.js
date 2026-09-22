import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatNumberPtBr,
} from '../../js/html.js';

import {
  getAreaSizeUnitLabel,
} from '../../constants/areaUnits.js';

export function areaTypeName(
  area,
) {
  return (
    area.area_type?.name ||
    'Sem tipo'
  );
}

export function areaSizeLabel(
  area,
) {
  if (
    area.size === null ||
    area.size === undefined
  ) {
    return null;
  }

  const unit =
    getAreaSizeUnitLabel(
      area.unit,
    );

  return `${formatNumberPtBr(
    area.size,
  )}${unit ? ` • ${unit}` : ''}`;
}

export function areaCard(
  area,
  {
    propertyId,
    archived = false,
  },
) {
  const size =
    areaSizeLabel(area);

  return `
    <article class="area-card">
      <a
        href="/properties/${propertyId}/areas/${area.id}"
        class="area-card__main"
        data-link
      >
        <div class="area-card__top">
          <span class="area-type-icon">
            ${icon('layers')}
          </span>

          <div class="area-card__identity">
            <h3>
              ${escapeHtml(
                area.name,
              )}
            </h3>

            <p>
              ${escapeHtml(
                areaTypeName(
                  area,
                ),
              )}
            </p>
          </div>

          <span class="area-card__arrow">
            ${icon('chevronRight')}
          </span>
        </div>

        ${
          area.description
            ? `
              <p class="area-card__description">
                ${escapeHtml(
                  area.description,
                )}
              </p>
            `
            : ''
        }

        <div class="area-card__meta">
          ${
            size
              ? `
                <span class="property-chip">
                  ${icon('ruler')}
                  ${escapeHtml(size)}
                </span>
              `
              : ''
          }

          ${
            area.location_description
              ? `
                <span class="property-chip">
                  ${icon('location')}
                  ${escapeHtml(
                    area.location_description,
                  )}
                </span>
              `
              : ''
          }

          <span class="property-chip">
            ${
              archived
                ? 'Arquivada'
                : 'Ativa'
            }
          </span>
        </div>
      </a>

      ${
        archived
          ? `
            <div class="property-card__footer">
              <button
                class="property-card__restore"
                type="button"
                data-action="restore-area"
                data-area-id="${area.id}"
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
