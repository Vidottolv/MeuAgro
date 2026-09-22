import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
} from '../../js/html.js';

export function cropCycleLabel(crop) {
  const days =
    Number(
      crop.average_cycle_days,
    );

  if (
    !Number.isFinite(days) ||
    days <= 0
  ) {
    return 'Ciclo médio não informado';
  }

  return `${days} ${
    days === 1
      ? 'dia'
      : 'dias'
  }`;
}

export function cropCard(crop) {
  return `
    <article class="crop-card">
      <a
        href="/more/crops/${crop.id}"
        class="crop-card__main"
        data-link
      >
        <div class="crop-card__top">
          <span class="crop-card__icon">
            ${icon('leaf')}
          </span>

          <div class="crop-card__identity">
            <h3>
              ${escapeHtml(
                crop.name,
              )}
            </h3>

            <p>
              ${escapeHtml(
                crop.category ||
                'Sem categoria',
              )}
            </p>
          </div>

          <span class="crop-card__arrow">
            ${icon('chevronRight')}
          </span>
        </div>

        <div class="crop-card__meta">
          <span
            class="
              crop-source-badge
              ${
                crop.is_system
                  ? 'crop-source-badge--system'
                  : 'crop-source-badge--custom'
              }
            "
          >
            ${
              crop.is_system
                ? 'Meu Agro'
                : 'Personalizada'
            }
          </span>

          <span
            class="
              crop-active-badge
              ${
                crop.active
                  ? 'crop-active-badge--active'
                  : 'crop-active-badge--inactive'
              }
            "
          >
            ${
              crop.active
                ? 'Ativa'
                : 'Inativa'
            }
          </span>
        </div>

        <p class="crop-cycle-label">
          ${icon('calendar')}
          ${escapeHtml(
            cropCycleLabel(
              crop,
            ),
          )}
        </p>
      </a>
    </article>
  `;
}
