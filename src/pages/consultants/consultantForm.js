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
  setButtonLoading,
  setFormMessage,
} from '../../components/formHelpers.js';

import {
  createConsultant,
  getConsultantById,
  updateConsultant,
} from '../../services/consultantService.js';

import {
  isValidWhatsAppNumber,
} from '../../services/whatsappService.js';

import {
  escapeHtml,
} from '../../js/html.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

import {
  navigate,
} from '../../js/router.js';

function validateConsultant(data) {
  if (
    data.name.length < 2
  ) {
    return 'Informe um nome com pelo menos 2 caracteres.';
  }

  if (
    data.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      data.email,
    )
  ) {
    return 'Informe um e-mail válido.';
  }

  if (
    data.whatsapp &&
    !isValidWhatsAppNumber(
      data.whatsapp,
    )
  ) {
    return 'Informe um número de WhatsApp válido, preferencialmente com DDD.';
  }

  return null;
}

export async function renderConsultantFormPage({
  session,
  params,
  mode,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  const editing =
    mode === 'edit';

  let consultant = null;

  if (editing) {
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

    if (
      !consultant ||
      consultant.deleted_at
    ) {
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
                'Este registro não existe ou foi arquivado.',
              actionLabel:
                'Voltar para consultores',
              actionHref:
                '/more/consultants',
            }),
        });

      return null;
    }
  }

  app.innerHTML =
    appShell({
      session,
      title:
        editing
          ? 'Editar consultor'
          : 'Novo consultor',
      eyebrow: 'Rede de apoio',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                editing
                  ? `/more/consultants/${consultant.id}`
                  : '/more/consultants'
              }"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Voltar
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${
                editing
                  ? 'Editar consultor'
                  : 'Cadastrar consultor agrícola'
              }
            </h2>

            <p>
              Guarde os contatos usados para orientação técnica e reposição de insumos.
            </p>
          </div>
        </section>

        <div
          id="consultant-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="consultant-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>Identificação</h2>
              <p>
                Nome, empresa e área principal de atuação.
              </p>
            </div>

            <div class="field">
              <label for="consultant-name">
                Nome *
              </label>

              <input
                id="consultant-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="140"
                placeholder="Ex.: Carlos Almeida"
                value="${escapeHtml(
                  consultant?.name ||
                  '',
                )}"
                required
              />
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="consultant-company"
                >
                  Empresa
                </label>

                <input
                  id="consultant-company"
                  name="company"
                  type="text"
                  maxlength="140"
                  placeholder="Ex.: Agro Consultoria"
                  value="${escapeHtml(
                    consultant?.company ||
                    '',
                  )}"
                />
              </div>

              <div class="field">
                <label
                  for="consultant-specialty"
                >
                  Especialidade
                </label>

                <input
                  id="consultant-specialty"
                  name="specialty"
                  type="text"
                  maxlength="160"
                  placeholder="Ex.: Nutrição de plantas"
                  value="${escapeHtml(
                    consultant?.specialty ||
                    '',
                  )}"
                />
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Contato</h2>
              <p>
                O WhatsApp será usado apenas para abrir a conversa após sua ação.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="consultant-phone"
                >
                  Telefone
                </label>

                <input
                  id="consultant-phone"
                  name="phone"
                  type="tel"
                  maxlength="30"
                  placeholder="Ex.: (16) 3333-4444"
                  value="${escapeHtml(
                    consultant?.phone ||
                    '',
                  )}"
                />
              </div>

              <div class="field">
                <label
                  for="consultant-whatsapp"
                >
                  WhatsApp
                </label>

                <input
                  id="consultant-whatsapp"
                  name="whatsapp"
                  type="tel"
                  maxlength="30"
                  placeholder="Ex.: (16) 99999-8888"
                  value="${escapeHtml(
                    consultant?.whatsapp ||
                    '',
                  )}"
                />

                <small class="field__hint">
                  Se informar apenas DDD + número, o Meu Agro considera o DDI do Brasil (+55).
                </small>
              </div>
            </div>

            <div class="field">
              <label
                for="consultant-email"
              >
                E-mail
              </label>

              <input
                id="consultant-email"
                name="email"
                type="email"
                maxlength="180"
                placeholder="consultor@empresa.com"
                value="${escapeHtml(
                  consultant?.email ||
                  '',
                )}"
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Observações</h2>
              <p>
                Registre informações úteis sobre atendimento, regiões ou produtos.
              </p>
            </div>

            <div class="field">
              <label
                for="consultant-notes"
              >
                Observações
              </label>

              <textarea
                id="consultant-notes"
                name="notes"
                maxlength="1600"
                placeholder="Ex.: atende de segunda a sexta e trabalha com fertilizantes e defensivos."
              >${escapeHtml(
                consultant?.notes ||
                '',
              )}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                editing
                  ? `/more/consultants/${consultant.id}`
                  : '/more/consultants'
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="consultant-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar alterações'
                  : 'Cadastrar consultor'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#consultant-form',
    );

  const feedback =
    document.querySelector(
      '#consultant-form-feedback',
    );

  const submit =
    document.querySelector(
      '#consultant-submit',
    );

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setFormMessage(
        feedback,
        '',
      );

      const formData =
        new FormData(form);

      const data = {
        name:
          String(
            formData.get('name') ||
            '',
          ).trim(),
        company:
          String(
            formData.get('company') ||
            '',
          ).trim(),
        phone:
          String(
            formData.get('phone') ||
            '',
          ).trim(),
        whatsapp:
          String(
            formData.get('whatsapp') ||
            '',
          ).trim(),
        email:
          String(
            formData.get('email') ||
            '',
          ).trim(),
        specialty:
          String(
            formData.get('specialty') ||
            '',
          ).trim(),
        notes:
          String(
            formData.get('notes') ||
            '',
          ).trim(),
      };

      const validationError =
        validateConsultant(data);

      if (validationError) {
        setFormMessage(
          feedback,
          validationError,
        );
        return;
      }

      setButtonLoading(
        submit,
        true,
        editing
          ? 'Salvando…'
          : 'Cadastrando…',
      );

      try {
        const saved =
          editing
            ? await updateConsultant(
                consultant.id,
                data,
              )
            : await createConsultant(
                data,
              );

        showToast(
          editing
            ? 'Consultor atualizado.'
            : 'Consultor cadastrado.',
          {
            type: 'success',
          },
        );

        navigate(
          `/more/consultants/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar consultor:',
          error,
        );

        setFormMessage(
          feedback,
          getDataErrorMessage(
            error,
          ),
        );
      } finally {
        setButtonLoading(
          submit,
          false,
        );
      }
    };

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  return () => {
    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
