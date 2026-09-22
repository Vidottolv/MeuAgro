import { icon } from './icons.js';

const items = [
  {
    key: 'home',
    label: 'Início',
    path: '/dashboard',
    icon: 'home',
  },
  {
    key: 'properties',
    label: 'Propriedades',
    path: '/properties',
    icon: 'map',
  },
  {
    key: 'plantings',
    label: 'Plantios',
    path: '/plantings',
    icon: 'sprout',
  },
  {
    key: 'inventory',
    label: 'Barracão',
    path: '/inventory',
    icon: 'box',
  },
  {
    key: 'more',
    label: 'Mais',
    path: '/more',
    icon: 'more',
  },
];

export function bottomNavigation(activeKey) {
  return `
    <div class="bottom-nav-wrap">
      <nav
        class="bottom-nav"
        aria-label="Navegação principal"
      >
        ${items
          .map((item) => {
            const active =
              item.key === activeKey;

            return `
              <a
                href="${item.path}"
                class="
                  bottom-nav__item
                  ${active ? 'bottom-nav__item--active' : ''}
                "
                ${active ? 'aria-current="page"' : ''}
                data-link
              >
                ${icon(item.icon)}
                <span class="bottom-nav__label">
                  ${item.label}
                </span>
              </a>
            `;
          })
          .join('')}
      </nav>
    </div>
  `;
}
