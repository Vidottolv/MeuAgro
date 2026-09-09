import { icon } from './icons.js';

export function moreItem({
  iconName,
  title,
  description,
  href,
}) {
  return `
    <a
      href="${href}"
      class="more-item"
      data-link
    >
      <span class="more-item__icon">
        ${icon(iconName)}
      </span>

      <span class="more-item__content">
        <strong>${title}</strong>
        <span>${description}</span>
      </span>

      <span class="more-item__arrow">
        ${icon('chevronRight')}
      </span>
    </a>
  `;
}
