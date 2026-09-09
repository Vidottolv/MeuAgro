import { icon } from './icons.js';

export function emptyState({
  iconName,
  title,
  description,
  actionLabel,
  actionHref,
}) {
  return `
    <section class="empty-state">
      <div class="empty-state__icon">
        ${icon(iconName)}
      </div>

      <h2>${title}</h2>
      <p>${description}</p>

      ${
        actionLabel && actionHref
          ? `
            <a
              href="${actionHref}"
              class="button button--primary"
              data-link
            >
              ${icon('plus')}
              ${actionLabel}
            </a>
          `
          : ''
      }
    </section>
  `;
}
