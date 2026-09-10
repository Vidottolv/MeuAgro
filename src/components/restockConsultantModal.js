import {
  icon,
} from './icons.js';

import {
  escapeHtml,
} from '../js/html.js';

import {
  listActiveConsultantsWithWhatsApp,
} from '../services/consultantService.js';

import {
  buildConsultantWhatsAppUrl,
} from '../services/whatsappService.js';

export async function showRestockConsultantModal({
  inputName,
}) {
  const root =
    document.querySelector(
      '#modal-root',
    );

  if (!root) {
    return;
  }

  let consultants = [];

  try {
    consultants =
      await listActiveConsultantsWithWhatsApp();
  } catch (error) {
    console.error(
      'Erro ao carregar consultores:',
      error,
    );
  }

  return new Promise(
    (resolve) => {
      let finished = false;

      const finish =
        () => {
          if (finished) {
            return;
          }

          finished = true;

          document.removeEventListener(
            'keydown',
            onKeyDown,
          );

          root.innerHTML = '';
          resolve();
        };

      const onKeyDown =
        (event) => {
          if (
            event.key ===
            'Escape'
          ) {
            finish();
          }
        };

      const consultantOptions =
        consultants
          .map(
            (consultant) => `
              <option
                value="${consultant.id}"
              >
                ${escapeHtml(
                  consultant.name,
                )}${
                  consultant.company
                    ? ` • ${escapeHtml(
                        consultant.company,
                      )}`
                    : ''
                }
              </option>
            `,
          )
          .join('');

      const selectedConsultant =
        consultants.length === 1
          ? consultants[0]
          : null;

      const selectedUrl =
        selectedConsultant
          ? buildConsultantWhatsAppUrl(
              selectedConsultant,
              {
                productName:
                  inputName,
              },
            )
          : null;

      root.innerHTML = `
        <div
          class="modal-backdrop"
          role="presentation"
        >
          <section
            class="modal-card restock-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restock-modal-title"
          >
            <div class="restock-modal__icon">
              ${icon('alertTriangle')}
            </div>

            <h2
              id="restock-modal-title"
            >
              Estoque zerado
            </h2>

            <p>
              Seu estoque de
              <strong>
                ${escapeHtml(
                  inputName,
                )}
              </strong>
              acabou.
            </p>

            <p>
              Deseja solicitar reposição a um consultor?
            </p>

            ${
              consultants.length === 0
                ? `
                  <div class="restock-modal__empty">
                    <p>
                      Nenhum consultor ativo com WhatsApp foi cadastrado.
                    </p>

                    <a
                      href="/more/consultants/new"
                      class="button button--primary button--full"
                      data-link
                      data-restock-close
                    >
                      ${icon('users')}
                      Cadastrar consultor
                    </a>
                  </div>
                `
                : consultants.length === 1
                  ? `
                    <div class="restock-consultant-option">
                      <strong>
                        ${escapeHtml(
                          selectedConsultant.name,
                        )}
                      </strong>

                      <span>
                        ${escapeHtml(
                          selectedConsultant.specialty ||
                          selectedConsultant.company ||
                          'Consultor agrícola',
                        )}
                      </span>
                    </div>

                    <a
                      href="${escapeHtml(
                        selectedUrl || '#',
                      )}"
                      class="button button--whatsapp button--full"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-restock-close
                    >
                      ${icon('messageCircle')}
                      Falar no WhatsApp
                    </a>
                  `
                  : `
                    <div class="field">
                      <label
                        for="restock-consultant-select"
                      >
                        Selecione o consultor
                      </label>

                      <select
                        id="restock-consultant-select"
                      >
                        <option value="">
                          Selecione
                        </option>

                        ${consultantOptions}
                      </select>
                    </div>

                    <a
                      id="restock-whatsapp-link"
                      href="#"
                      class="button button--whatsapp button--full button--disabled"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled="true"
                    >
                      ${icon('messageCircle')}
                      Abrir WhatsApp
                    </a>
                  `
            }

            <button
              id="restock-later"
              class="button button--ghost button--full"
              type="button"
            >
              Agora não
            </button>
          </section>
        </div>
      `;

      const backdrop =
        root.querySelector(
          '.modal-backdrop',
        );

      const later =
        root.querySelector(
          '#restock-later',
        );

      const select =
        root.querySelector(
          '#restock-consultant-select',
        );

      const whatsappLink =
        root.querySelector(
          '#restock-whatsapp-link',
        );

      const updateLink =
        () => {
          if (
            !select ||
            !whatsappLink
          ) {
            return;
          }

          const consultant =
            consultants.find(
              (item) =>
                item.id ===
                select.value,
            );

          const url =
            consultant
              ? buildConsultantWhatsAppUrl(
                  consultant,
                  {
                    productName:
                      inputName,
                  },
                )
              : null;

          if (!url) {
            whatsappLink.href =
              '#';

            whatsappLink.classList.add(
              'button--disabled',
            );

            whatsappLink.setAttribute(
              'aria-disabled',
              'true',
            );

            return;
          }

          whatsappLink.href =
            url;

          whatsappLink.classList.remove(
            'button--disabled',
          );

          whatsappLink.setAttribute(
            'aria-disabled',
            'false',
          );
        };

      const handleLinkClick =
        (event) => {
          const link =
            event.target.closest(
              '[data-restock-close]',
            );

          if (!link) {
            return;
          }

          window.setTimeout(
            finish,
            0,
          );
        };

      const handleWhatsAppClick =
        (event) => {
          if (
            whatsappLink?.getAttribute(
              'aria-disabled',
            ) === 'true'
          ) {
            event.preventDefault();
            return;
          }

          window.setTimeout(
            finish,
            0,
          );
        };

      later.addEventListener(
        'click',
        finish,
        {
          once: true,
        },
      );

      backdrop.addEventListener(
        'click',
        (event) => {
          if (
            event.target ===
            backdrop
          ) {
            finish();
          }
        },
      );

      root.addEventListener(
        'click',
        handleLinkClick,
        {
          once: false,
        },
      );

      select?.addEventListener(
        'change',
        updateLink,
      );

      whatsappLink?.addEventListener(
        'click',
        handleWhatsAppClick,
      );

      document.addEventListener(
        'keydown',
        onKeyDown,
      );
    },
  );
}
