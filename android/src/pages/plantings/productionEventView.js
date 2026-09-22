import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
  formatCurrencyBRL,
  formatDateTimePtBr,
  formatNumberPtBr,
} from '../../js/html.js';

import {
  getProductionEventIconName,
  getProductionEventTypeLabel,
} from '../../constants/productionEventTypes.js';

export function productionEventCard(
  event,
  {
    cycleId,
    readonly = false,
  } = {},
) {
  const photos =
    event.event_photos ||
    [];

  const inputs =
    event.event_inputs ||
    [];

  const totalInputCost =
    inputs.reduce(
      (sum, item) =>
        sum +
        Number(
          item.total_cost ||
          0,
        ),
      0,
    );

  return `
    <article class="timeline-event">
      <div class="timeline-event__rail">
        <span class="timeline-event__icon">
          ${icon(
            getProductionEventIconName(
              event.event_type,
            ),
          )}
        </span>

        <span class="timeline-event__line"></span>
      </div>

      <div class="timeline-event__card">
        <div class="timeline-event__header">
          <div>
            <span class="timeline-event__type">
              ${escapeHtml(
                getProductionEventTypeLabel(
                  event.event_type,
                ),
              )}
            </span>

            <h3>
              ${escapeHtml(
                event.title,
              )}
            </h3>
          </div>

          <time>
            ${formatDateTimePtBr(
              event.occurred_at,
            )}
          </time>
        </div>

        ${
          event.description
            ? `
              <p class="timeline-event__description">
                ${escapeHtml(
                  event.description,
                )}
              </p>
            `
            : ''
        }

        ${
          event.notes
            ? `
              <div class="timeline-event__notes">
                <strong>
                  Observações
                </strong>

                <p>
                  ${escapeHtml(
                    event.notes,
                  )}
                </p>
              </div>
            `
            : ''
        }

        ${
          photos.length
            ? `
              <div class="timeline-event__photos">
                ${photos
                  .filter(
                    (photo) =>
                      photo.signed_url,
                  )
                  .slice(0, 4)
                  .map(
                    (photo) => `
                      <button
                        class="timeline-event__photo"
                        type="button"
                        data-photo-view="${escapeHtml(
                          photo.signed_url,
                        )}"
                        data-photo-alt="${escapeHtml(
                          photo.description ||
                          event.title ||
                          'Foto do evento',
                        )}"
                      >
                        <img
                          src="${escapeHtml(
                            photo.signed_url,
                          )}"
                          alt="${escapeHtml(
                            photo.description ||
                            event.title ||
                            'Foto do evento',
                          )}"
                          loading="lazy"
                        />
                      </button>
                    `,
                  )
                  .join('')}
              </div>
            `
            : ''
        }

        ${
          inputs.length
            ? `
              <div class="timeline-event__inputs">
                <div class="timeline-event__inputs-title">
                  <span>
                    Insumos utilizados
                  </span>

                  ${
                    totalInputCost > 0
                      ? `
                        <span>
                          Custo:
                          ${formatCurrencyBRL(
                            totalInputCost,
                          )}
                        </span>
                      `
                      : ''
                  }
                </div>

                ${inputs
                  .map(
                    (item) => `
                      <div class="timeline-event__input">
                        <span class="timeline-event__input-icon">
                          ${icon('box')}
                        </span>

                        <div class="timeline-event__input-content">
                          <strong>
                            ${escapeHtml(
                              item.agricultural_input?.name ||
                              'Insumo',
                            )}
                          </strong>

                          <span>
                            ${formatNumberPtBr(
                              item.quantity,
                            )}
                            ${escapeHtml(
                              item.unit,
                            )}
                            ${
                              item.inventory_lot?.batch_number
                                ? ` • Lote ${escapeHtml(
                                    item.inventory_lot.batch_number,
                                  )}`
                                : ''
                            }
                          </span>
                        </div>

                        ${
                          item.total_cost !== null &&
                          item.total_cost !== undefined
                            ? `
                              <span class="timeline-event__input-cost">
                                ${formatCurrencyBRL(
                                  item.total_cost,
                                )}
                              </span>
                            `
                            : ''
                        }
                      </div>
                    `,
                  )
                  .join('')}
              </div>
            `
            : ''
        }

        ${
          readonly
            ? ''
            : `
              <div class="timeline-event__actions">
                <a
                  href="/plantings/${cycleId}/events/${event.id}/edit"
                  class="button button--ghost button--compact"
                  data-link
                >
                  ${icon('edit')}
                  Editar
                </a>

                <a
                  href="/plantings/${cycleId}/events/${event.id}/inputs/new"
                  class="button button--ghost button--compact"
                  data-link
                >
                  ${icon('box')}
                  Adicionar insumo
                </a>

                <a
                  href="/plantings/${cycleId}/evolution/new?event=${event.id}"
                  class="button button--ghost button--compact"
                  data-link
                >
                  ${icon('camera')}
                  Adicionar foto
                </a>
              </div>
            `
        }
      </div>
    </article>
  `;
}
