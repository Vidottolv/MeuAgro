import {
  icon,
} from '../../components/icons.js';

import {
  escapeHtml,
} from '../../js/html.js';

import {
  buildConsultantWhatsAppUrl,
} from '../../services/whatsappService.js';

export function consultantCard(
  consultant,
  {
    archived = false,
  } = {},
) {
  const whatsappUrl =
    buildConsultantWhatsAppUrl(
      consultant,
    );

  return `
    <article class="consultant-card">
      <a
        href="/more/consultants/${consultant.id}"
        class="consultant-card__main"
        data-link
      >
        <div class="consultant-card__top">
          <span class="consultant-card__icon">
            ${icon('user')}
          </span>

          <div class="consultant-card__identity">
            <h3>
              ${escapeHtml(
                consultant.name,
              )}
            </h3>

            <p>
              ${escapeHtml(
                consultant.specialty ||
                consultant.company ||
                'Consultor agrícola',
              )}
            </p>
          </div>

          ${icon('chevronRight')}
        </div>

        <div class="consultant-card__meta">
          ${
            consultant.company
              ? `
                <span>
                  ${icon('briefcase')}
                  ${escapeHtml(
                    consultant.company,
                  )}
                </span>
              `
              : ''
          }

          ${
            consultant.whatsapp ||
            consultant.phone
              ? `
                <span>
                  ${icon('phone')}
                  ${escapeHtml(
                    consultant.whatsapp ||
                    consultant.phone,
                  )}
                </span>
              `
              : ''
          }
        </div>
      </a>

      <div class="consultant-card__footer">
        <span
          class="
            consultant-status
            ${
              archived
                ? 'consultant-status--archived'
                : consultant.active
                  ? 'consultant-status--active'
                  : 'consultant-status--inactive'
            }
          "
        >
          ${
            archived
              ? 'Arquivado'
              : consultant.active
                ? 'Ativo'
                : 'Inativo'
          }
        </span>

        ${
          !archived &&
          consultant.active &&
          whatsappUrl
            ? `
              <a
                href="${escapeHtml(
                  whatsappUrl,
                )}"
                class="button button--whatsapp button--compact"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${icon('messageCircle')}
                WhatsApp
              </a>
            `
            : ''
        }
      </div>
    </article>
  `;
}
