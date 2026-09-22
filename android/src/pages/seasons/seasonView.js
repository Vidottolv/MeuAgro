import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatDatePtBr,
} from '../../js/html.js';

import {
  getSeasonStatusClass,
  getSeasonStatusLabel,
} from '../../constants/seasonStatus.js';

export function seasonPeriodLabel(
  season,
) {
  const start =
    season.start_date
      ? formatDatePtBr(
          season.start_date,
        )
      : null;

  const end =
    season.end_date
      ? formatDatePtBr(
          season.end_date,
        )
      : null;

  if (start && end) {
    return `${start} até ${end}`;
  }

  if (start) {
    return `Início em ${start}`;
  }

  if (end) {
    return `Até ${end}`;
  }

  return 'Período não informado';
}

export function seasonPropertyLabel(
  season,
) {
  const property =
    season.property;

  if (!property) {
    return 'Propriedade não encontrada';
  }

  const location =
    [
      property.city,
      property.state,
    ]
      .filter(Boolean)
      .join(' - ');

  return location
    ? `${property.name} • ${location}`
    : property.name;
}

export function seasonCard(
  season,
  {
    archived = false,
  } = {},
) {
  return `
    <article class="season-card">
      <a
        href="/more/seasons/${season.id}"
        class="season-card__main"
        data-link
      >
        <div class="season-card__top">
          <span class="season-card__icon">
            ${icon('calendar')}
          </span>

          <div class="season-card__identity">
            <h3>
              ${escapeHtml(
                season.name,
              )}
            </h3>

            <p>
              ${escapeHtml(
                seasonPropertyLabel(
                  season,
                ),
              )}
            </p>
          </div>

          <span class="season-card__arrow">
            ${icon('chevronRight')}
          </span>
        </div>

        <div class="season-card__meta">
          <span
            class="
              season-status
              ${getSeasonStatusClass(
                season.status,
              )}
            "
          >
            ${escapeHtml(
              getSeasonStatusLabel(
                season.status,
              ),
            )}
          </span>

          <span class="season-period">
            ${icon('calendar')}
            ${escapeHtml(
              seasonPeriodLabel(
                season,
              ),
            )}
          </span>
        </div>

        ${
          season.description
            ? `
              <p class="season-card__description">
                ${escapeHtml(
                  season.description,
                )}
              </p>
            `
            : ''
        }
      </a>

      ${
        archived
          ? `
            <div class="season-card__footer">
              <button
                class="property-card__restore"
                type="button"
                data-action="restore-season"
                data-season-id="${season.id}"
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
