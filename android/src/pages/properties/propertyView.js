import {
  icon,
} from '../../components/icons.js';
import {
  escapeHtml,
  formatNumberPtBr,
} from '../../js/html.js';
import {
  getAreaUnitLabel,
} from '../../constants/brazilStates.js';

export function propertyLocation(property) {
  const parts = [
    property.city,
    property.state,
  ].filter(Boolean);

  return parts.length
    ? parts.join(' - ')
    : 'Localização não informada';
}

export function propertyArea(property) {
  if (
    property.total_area === null ||
    property.total_area === undefined
  ) {
    return null;
  }

  const label =
    getAreaUnitLabel(
      property.area_unit,
    );

  return `${formatNumberPtBr(
    property.total_area,
  )}${label ? ` • ${label}` : ''}`;
}

export function propertyCard(
  property,
  {
    archived = false,
  } = {},
) {
  const area =
    propertyArea(property);

  return `
    <article class="property-card">
      <a
        href="/properties/${property.id}"
        class="property-card__main"
        data-link
        style="
          display: block;
          color: inherit;
          text-decoration: none;
        "
      >
        <div class="property-card__top">
          <div class="property-card__title">
            <h3>
              ${escapeHtml(property.name)}
            </h3>

            <p class="property-card__location">
              ${icon('location')}
              ${escapeHtml(
                propertyLocation(property),
              )}
            </p>
          </div>

          <span class="property-card__chevron">
            ${icon('chevronRight')}
          </span>
        </div>

        ${
          property.description
            ? `
              <p class="property-card__description">
                ${escapeHtml(
                  property.description,
                )}
              </p>
            `
            : ''
        }

        <div class="property-card__meta">
          ${
            area
              ? `
                <span class="property-chip">
                  ${icon('ruler')}
                  ${escapeHtml(area)}
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
                data-action="restore-property"
                data-property-id="${property.id}"
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
