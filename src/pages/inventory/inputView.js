import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatNumberPtBr,
} from '../../js/html.js';

import {
  getInputCategoryLabel,
} from '../../constants/inputCategories.js';

import {
  getInputUnitLabel,
} from '../../constants/inputUnits.js';

export function getStockStatusLabel(
  status,
) {
  switch (status) {
    case 'normal':
      return 'Estoque normal';

    case 'low_stock':
      return 'Estoque baixo';

    case 'out_of_stock':
      return 'Sem estoque';

    default:
      return 'Sem estoque';
  }
}

export function getStockStatusClass(
  status,
) {
  switch (status) {
    case 'normal':
      return 'input-stock--normal';

    case 'low_stock':
      return 'input-stock--low';

    case 'out_of_stock':
    default:
      return 'input-stock--out';
  }
}

export function currentStockLabel(
  input,
) {
  return `${formatNumberPtBr(
    input.current_quantity ?? 0,
  )} ${escapeHtml(
    input.base_unit ||
    '',
  )}`.trim();
}

export function agriculturalInputCard(
  input,
) {
  return `
    <article class="input-card">
      <a
        href="/inventory/${input.id}"
        class="input-card__main"
        data-link
      >
        <div class="input-card__top">
          <span class="input-card__icon">
            ${icon('box')}
          </span>

          <div class="input-card__identity">
            <h3>
              ${escapeHtml(
                input.name,
              )}
            </h3>

            <p>
              ${escapeHtml(
                [
                  input.brand,
                  getInputCategoryLabel(
                    input.category,
                  ),
                ]
                  .filter(Boolean)
                  .join(' • '),
              )}
            </p>
          </div>

          ${icon('chevronRight')}
        </div>

        <div class="input-card__meta">
          <span
            class="
              input-stock
              ${getStockStatusClass(
                input.stock_status,
              )}
            "
          >
            ${escapeHtml(
              getStockStatusLabel(
                input.stock_status,
              ),
            )}
          </span>

          <span class="input-card__quantity">
            ${escapeHtml(
              currentStockLabel(
                input,
              ),
            )}
          </span>

          <span
            class="
              crop-active-badge
              ${
                input.active
                  ? 'crop-active-badge--active'
                  : 'crop-active-badge--inactive'
              }
            "
          >
            ${
              input.active
                ? 'Ativo'
                : 'Inativo'
            }
          </span>
        </div>

        <p class="input-card__unit">
          Unidade principal:
          ${escapeHtml(
            getInputUnitLabel(
              input.base_unit,
            ),
          )}
        </p>
      </a>
    </article>
  `;
}
