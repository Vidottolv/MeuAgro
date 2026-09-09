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
  createCrop,
  getCropById,
  updateCrop,
} from '../../services/cropService.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

import {
  CROP_CATEGORY_SUGGESTIONS,
} from '../../constants/cropCategories.js';

import {
  escapeHtml,
} from '../../js/html.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  navigate,
} from '../../js/router.js';

function validateCrop(data) {
  if (data.name.length < 2) {
    return 'Informe um nome com pelo menos 2 caracteres.';
  }

  if (
    data.averageCycleDays !== '' &&
    (
      !Number.isInteger(
        data.averageCycleDays,
      ) ||
      data.averageCycleDays <= 0
    )
  ) {
    return 'O ciclo médio deve ser informado em dias inteiros maiores que zero.';
  }

  return null;
}

export async function renderCropFormPage({
  session,
  params,
  mode,
}) {
  const app =
    document.querySelector('#app');

  const editing =
    mode === 'edit';

  let crop = null;

  if (editing) {
    try {
      crop =
        await getCropById(
          params.cropId,
        );
    } catch (error) {
      console.error(
        'Erro ao carregar cultura:',
        error,
      );
    }

    if (
      !crop ||
      crop.is_system
    ) {
      app.innerHTML =
        appShell({
          session,
          title: 'Cultura',
          eyebrow: 'Produção',
          activeNav: 'more',
          content:
            emptyState({
              iconName: 'leaf',
              title:
                'Cultura não editável',
              description:
                'Culturas padrão do Meu Agro são somente leitura. Apenas culturas personalizadas podem ser alteradas.',
              actionLabel:
                'Voltar para culturas',
              actionHref:
                '/more/crops',
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
          ? 'Editar cultura'
          : 'Nova cultura',
      eyebrow: 'Produção',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                editing
                  ? `/more/crops/${crop.id}`
                  : '/more/crops'
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
                  ? 'Editar cultura'
                  : 'Nova cultura personalizada'
              }
            </h2>

            <p>
              O ciclo médio poderá sugerir automaticamente a previsão inicial de colheita nos plantios.
            </p>
          </div>
        </section>

        <div
          id="crop-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="crop-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>Identificação</h2>
              <p>
                Informe o nome e uma categoria para facilitar a organização.
              </p>
            </div>

            <div class="field">
              <label for="crop-name">
                Nome *
              </label>

              <input
                id="crop-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="120"
                placeholder="Ex.: Abóbora"
                value="${escapeHtml(
                  crop?.name || '',
                )}"
                required
              />
            </div>

            <div class="field">
              <label for="crop-category">
                Categoria
              </label>

              <input
                id="crop-category"
                name="category"
                type="text"
                maxlength="100"
                list="crop-category-options"
                placeholder="Ex.: Hortaliças"
                value="${escapeHtml(
                  crop?.category || '',
                )}"
              />

              <datalist
                id="crop-category-options"
              >
                ${CROP_CATEGORY_SUGGESTIONS
                  .map(
                    (category) => `
                      <option
                        value="${escapeHtml(
                          category,
                        )}"
                      ></option>
                    `,
                  )
                  .join('')}
              </datalist>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Ciclo médio</h2>
              <p>
                Quantos dias, em média, esta cultura leva do plantio até a colheita?
              </p>
            </div>

            <div class="field">
              <label
                for="crop-average-cycle-days"
              >
                Ciclo médio em dias
              </label>

              <input
                id="crop-average-cycle-days"
                name="averageCycleDays"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                placeholder="Ex.: 90"
                value="${
                  crop?.average_cycle_days ??
                  ''
                }"
              />

              <small class="field__hint">
                Se informado, o Meu Agro poderá sugerir a previsão de colheita.
              </small>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Observações</h2>
              <p>
                Registre informações gerais úteis sobre a cultura.
              </p>
            </div>

            <div class="field">
              <label for="crop-notes">
                Observações
              </label>

              <textarea
                id="crop-notes"
                name="notes"
                maxlength="1500"
                placeholder="Ex.: variedade mais utilizada, particularidades de manejo..."
              >${escapeHtml(
                crop?.notes || '',
              )}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                editing
                  ? `/more/crops/${crop.id}`
                  : '/more/crops'
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="crop-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar alterações'
                  : 'Cadastrar cultura'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#crop-form',
    );

  const feedback =
    document.querySelector(
      '#crop-form-feedback',
    );

  const submit =
    document.querySelector(
      '#crop-submit',
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

      const averageRaw =
        String(
          formData.get(
            'averageCycleDays',
          ) || '',
        ).trim();

      const data = {
        name:
          String(
            formData.get('name') || '',
          ).trim(),
        category:
          String(
            formData.get(
              'category',
            ) || '',
          ).trim(),
        averageCycleDays:
          averageRaw
            ? Number(averageRaw)
            : '',
        notes:
          String(
            formData.get('notes') || '',
          ).trim(),
      };

      const validationError =
        validateCrop(data);

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
            ? await updateCrop(
                crop.id,
                data,
              )
            : await createCrop(data);

        showToast(
          editing
            ? 'Cultura atualizada.'
            : 'Cultura cadastrada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/more/crops/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar cultura:',
          error,
        );

        setFormMessage(
          feedback,
          getDataErrorMessage(error),
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
