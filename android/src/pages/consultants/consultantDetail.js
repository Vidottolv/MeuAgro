import {
  appShell,
} from '../../components/appShell.js';

import {
  emptyState,
} from '../../components/emptyState.js';

import {
  icon,
} from '../../components/icons.js';

import {
  archiveConsultant,
  getConsultantById,
  restoreConsultant,
  setConsultantActive,
} from '../../services/consultantService.js';

import {
  buildConsultantWhatsAppUrl,
} from '../../services/whatsappService.js';

import {
  escapeHtml,
  formatDatePtBr,
} from '../../js/html.js';

import {
  showConfirmModal,
} from '../../components/confirmModal.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

import {
  navigate,
} from '../../js/router.js';

export async function renderConsultantDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let consultant = null;

  try {
    consultant =
      await getConsultantById(
        params.consultantId,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar consultor:',
      error,
    );
  }

  if (!consultant) {
    app.innerHTML =
      appShell({
        session,
        title: 'Consultor',
        eyebrow: 'Rede de apoio',
        activeNav: 'more',
        content:
          emptyState({
            iconName: 'users',
            title:
              'Consultor não encontrado',
            description:
              'Este registro não existe ou não pertence à sua conta.',
            actionLabel:
              'Voltar para consultores',
            actionHref:
              '/more/consultants',
          }),
      });

    return null;
  }

  const archived =
    Boolean(
      consultant.deleted_at,
    );

  const whatsappUrl =
    buildConsultantWhatsAppUrl(
      consultant,
    );

  app.innerHTML =
    appShell({
      session,
      title: 'Consultor',
      eyebrow: 'Rede de apoio',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/more/consultants"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Consultores
            </a>
          </div>
        </section>

        <section class="consultant-detail-hero">
          <div class="consultant-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${escapeHtml(
                  consultant.specialty ||
                  'Consultor agrícola',
                )}
              </p>

              <h2>
                ${escapeHtml(
                  consultant.name,
                )}
              </h2>

              <p>
                ${escapeHtml(
                  consultant.company ||
                  'Sem empresa informada',
                )}
              </p>
            </div>

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
          </div>

          ${
            archived
              ? `
                <div class="property-detail-actions">
                  <button
                    id="restore-consultant"
                    class="button button--secondary"
                    type="button"
                  >
                    ${icon('refresh')}
                    Restaurar
                  </button>
                </div>
              `
              : `
                <div class="property-detail-actions">
                  ${
                    whatsappUrl &&
                    consultant.active
                      ? `
                        <a
                          href="${escapeHtml(
                            whatsappUrl,
                          )}"
                          class="button button--whatsapp"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ${icon('messageCircle')}
                          Falar no WhatsApp
                        </a>
                      `
                      : ''
                  }

                  <a
                    href="/more/consultants/${consultant.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${icon('edit')}
                    Editar
                  </a>
                </div>
              `
          }
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Empresa
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                consultant.company ||
                'Não informada',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Especialidade
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                consultant.specialty ||
                'Não informada',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Telefone
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                consultant.phone ||
                'Não informado',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              WhatsApp
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                consultant.whatsapp ||
                consultant.phone ||
                'Não informado',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              E-mail
            </p>

            <p class="detail-card__value">
              ${escapeHtml(
                consultant.email ||
                'Não informado',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Cadastrado em
            </p>

            <p class="detail-card__value">
              ${formatDatePtBr(
                consultant.created_at,
              )}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>

          <p class="detail-card__value detail-card__value--soft">
            ${escapeHtml(
              consultant.notes ||
              'Nenhuma observação informada.',
            )}
          </p>
        </article>

        ${
          !archived
            ? `
              <section class="consultant-management-card">
                <div>
                  <strong>
                    Situação do contato
                  </strong>

                  <p>
                    Consultores inativos deixam de aparecer no fluxo de reposição, mas continuam preservados.
                  </p>
                </div>

                <div class="consultant-management-card__actions">
                  <button
                    id="toggle-consultant-active"
                    class="button button--secondary"
                    type="button"
                  >
                    ${
                      consultant.active
                        ? icon('archive')
                        : icon('refresh')
                    }

                    ${
                      consultant.active
                        ? 'Desativar'
                        : 'Reativar'
                    }
                  </button>

                  <button
                    id="archive-consultant"
                    class="button button--danger"
                    type="button"
                  >
                    ${icon('trash')}
                    Arquivar
                  </button>
                </div>
              </section>
            `
            : ''
        }
      `,
    });

  const toggleButton =
    document.querySelector(
      '#toggle-consultant-active',
    );

  const archiveButton =
    document.querySelector(
      '#archive-consultant',
    );

  const restoreButton =
    document.querySelector(
      '#restore-consultant',
    );

  const handleToggle =
    async () => {
      const nextActive =
        !consultant.active;

      const confirmed =
        await showConfirmModal({
          title:
            nextActive
              ? 'Reativar consultor?'
              : 'Desativar consultor?',
          message:
            nextActive
              ? 'Ele voltará a aparecer nos fluxos de contato e reposição.'
              : 'O contato será preservado, mas deixará de aparecer no fluxo de reposição.',
          confirmLabel:
            nextActive
              ? 'Reativar'
              : 'Desativar',
          danger:
            !nextActive,
        });

      if (!confirmed) {
        return;
      }

      toggleButton.disabled =
        true;

      try {
        await setConsultantActive(
          consultant.id,
          nextActive,
        );

        showToast(
          nextActive
            ? 'Consultor reativado.'
            : 'Consultor desativado.',
          {
            type: 'success',
          },
        );

        navigate(
          `/more/consultants/${consultant.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao alterar consultor:',
          error,
        );

        showToast(
          getDataErrorMessage(
            error,
          ),
          {
            type: 'error',
          },
        );

        toggleButton.disabled =
          false;
      }
    };

  const handleArchive =
    async () => {
      const confirmed =
        await showConfirmModal({
          title:
            'Arquivar consultor?',
          message:
            'O registro sairá das listas normais, mas continuará preservado.',
          confirmLabel:
            'Arquivar',
          danger: true,
        });

      if (!confirmed) {
        return;
      }

      archiveButton.disabled =
        true;

      try {
        await archiveConsultant(
          consultant.id,
        );

        showToast(
          'Consultor arquivado.',
          {
            type: 'success',
          },
        );

        navigate(
          '/more/consultants',
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao arquivar consultor:',
          error,
        );

        showToast(
          getDataErrorMessage(
            error,
          ),
          {
            type: 'error',
          },
        );

        archiveButton.disabled =
          false;
      }
    };

  const handleRestore =
    async () => {
      const confirmed =
        await showConfirmModal({
          title:
            'Restaurar consultor?',
          message:
            'O consultor voltará ativo e disponível nos fluxos de contato.',
          confirmLabel:
            'Restaurar',
        });

      if (!confirmed) {
        return;
      }

      restoreButton.disabled =
        true;

      try {
        await restoreConsultant(
          consultant.id,
        );

        showToast(
          'Consultor restaurado.',
          {
            type: 'success',
          },
        );

        navigate(
          `/more/consultants/${consultant.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao restaurar consultor:',
          error,
        );

        showToast(
          getDataErrorMessage(
            error,
          ),
          {
            type: 'error',
          },
        );

        restoreButton.disabled =
          false;
      }
    };

  toggleButton?.addEventListener(
    'click',
    handleToggle,
  );

  archiveButton?.addEventListener(
    'click',
    handleArchive,
  );

  restoreButton?.addEventListener(
    'click',
    handleRestore,
  );

  return () => {
    toggleButton?.removeEventListener(
      'click',
      handleToggle,
    );

    archiveButton?.removeEventListener(
      'click',
      handleArchive,
    );

    restoreButton?.removeEventListener(
      'click',
      handleRestore,
    );
  };
}
