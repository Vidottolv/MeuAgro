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
  createAgriculturalInput,
  getAgriculturalInputById,
  updateAgriculturalInput,
} from '../../services/agriculturalInputService.js';

import {
  INPUT_CATEGORIES,
} from '../../constants/inputCategories.js';

import {
  INPUT_UNITS,
} from '../../constants/inputUnits.js';

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

function categoryOptions(
  selected,
) {
  return `
    <option value="">
      Selecione
    </option>

    ${INPUT_CATEGORIES
      .map(
        ([value, label]) => `
          <option
            value="${value}"
            ${
              selected === value
                ? 'selected'
                : ''
            }
          >
            ${label}
          </option>
        `,
      )
      .join('')}
  `;
}

function unitOptions(
  selected,
) {
  return `
    <option value="">
      Selecione
    </option>

    ${INPUT_UNITS
      .map(
        ([value, label]) => `
          <option
            value="${value}"
            ${
              selected === value
                ? 'selected'
                : ''
            }
          >
            ${label}
          </option>
        `,
      )
      .join('')}
  `;
}

function normalizeNumber(
  value,
) {
  const text =
    String(value || '')
      .trim()
      .replace(',', '.');

  if (!text) {
    return '';
  }

  return Number(text);
}

function validateInput(
  data,
) {
  if (
    data.name.length < 2
  ) {
    return 'Informe o nome do insumo.';
  }

  if (!data.category) {
    return 'Selecione a categoria.';
  }

  if (!data.baseUnit) {
    return 'Selecione a unidade principal.';
  }

  if (
    data.minimumStock !== '' &&
    (
      !Number.isFinite(
        data.minimumStock,
      ) ||
      data.minimumStock < 0
    )
  ) {
    return 'Informe um estoque mínimo válido.';
  }

  if (
    data.idealStock !== '' &&
    (
      !Number.isFinite(
        data.idealStock,
      ) ||
      data.idealStock < 0
    )
  ) {
    return 'Informe um estoque ideal válido.';
  }

  if (
    data.minimumStock !== '' &&
    data.idealStock !== '' &&
    data.idealStock <
      data.minimumStock
  ) {
    return 'O estoque ideal não pode ser menor que o estoque mínimo.';
  }

  return null;
}

export async function renderInputFormPage({
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

  let input = null;

  if (editing) {
    try {
      input =
        await getAgriculturalInputById(
          params.inputId,
        );
    } catch (error) {
      console.error(
        'Erro ao carregar insumo:',
        error,
      );
    }

    if (!input) {
      app.innerHTML =
        appShell({
          session,
          title: 'Insumo',
          eyebrow: 'Barracão',
          activeNav: 'inventory',
          content:
            emptyState({
              iconName: 'box',
              title:
                'Insumo não encontrado',
              description:
                'Este registro não existe ou não pertence à sua conta.',
              actionLabel:
                'Voltar para o Barracão',
              actionHref:
                '/inventory',
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
          ? 'Editar insumo'
          : 'Novo insumo',
      eyebrow: 'Barracão',
      activeNav: 'inventory',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                editing
                  ? `/inventory/${input.id}`
                  : '/inventory'
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
                  ? 'Editar insumo'
                  : 'Cadastrar insumo'
              }
            </h2>

            <p>
              Cadastre o produto sem informar quantidade atual. O saldo será calculado pelas movimentações de estoque.
            </p>
          </div>
        </section>

        <div
          id="input-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="input-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Identificação
              </h2>

              <p>
                Nome, marca e categoria ajudam a diferenciar produtos semelhantes.
              </p>
            </div>

            <div class="field">
              <label
                for="input-name"
              >
                Nome *
              </label>

              <input
                id="input-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="160"
                placeholder="Ex.: NPK 10-10-10"
                value="${escapeHtml(
                  input?.name || '',
                )}"
                required
              />
            </div>

            <div class="field">
              <label
                for="input-brand"
              >
                Marca
              </label>

              <input
                id="input-brand"
                name="brand"
                type="text"
                maxlength="160"
                placeholder="Ex.: Marca Rural"
                value="${escapeHtml(
                  input?.brand || '',
                )}"
              />
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="input-category"
                >
                  Categoria *
                </label>

                <select
                  id="input-category"
                  name="category"
                  required
                >
                  ${categoryOptions(
                    input?.category ||
                    '',
                  )}
                </select>
              </div>

              <div class="field">
                <label
                  for="input-unit"
                >
                  Unidade principal *
                </label>

                <select
                  id="input-unit"
                  name="baseUnit"
                  required
                >
                  ${unitOptions(
                    input?.base_unit ||
                    '',
                  )}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Estoque de referência
              </h2>

              <p>
                Estes valores serão usados pelos alertas quando os lotes e movimentações estiverem ativos.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="input-minimum-stock"
                >
                  Estoque mínimo
                </label>

                <input
                  id="input-minimum-stock"
                  name="minimumStock"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 5"
                  value="${
                    input?.minimum_stock ??
                    0
                  }"
                />
              </div>

              <div class="field">
                <label
                  for="input-ideal-stock"
                >
                  Estoque ideal
                </label>

                <input
                  id="input-ideal-stock"
                  name="idealStock"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 20"
                  value="${
                    input?.ideal_stock ??
                    ''
                  }"
                />
              </div>
            </div>

            <small class="field__hint">
              O saldo atual não aparece neste formulário porque nunca deve ser alterado diretamente.
            </small>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Informações adicionais
              </h2>

              <p>
                Registre características do produto e observações de uso.
              </p>
            </div>

            <div class="field">
              <label
                for="input-description"
              >
                Descrição
              </label>

              <textarea
                id="input-description"
                name="description"
                maxlength="1200"
                placeholder="Ex.: Fertilizante granulado para aplicação em cobertura."
              >${escapeHtml(
                input?.description ||
                '',
              )}</textarea>
            </div>

            <div class="field">
              <label
                for="input-notes"
              >
                Observações
              </label>

              <textarea
                id="input-notes"
                name="notes"
                maxlength="1600"
                placeholder="Ex.: armazenar em local seco e ventilado."
              >${escapeHtml(
                input?.notes || '',
              )}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                editing
                  ? `/inventory/${input.id}`
                  : '/inventory'
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="input-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar alterações'
                  : 'Cadastrar insumo'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#input-form',
    );

  const feedback =
    document.querySelector(
      '#input-form-feedback',
    );

  const submit =
    document.querySelector(
      '#input-submit',
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
            formData.get(
              'name',
            ) || '',
          ).trim(),
        brand:
          String(
            formData.get(
              'brand',
            ) || '',
          ).trim(),
        category:
          String(
            formData.get(
              'category',
            ) || '',
          ),
        baseUnit:
          String(
            formData.get(
              'baseUnit',
            ) || '',
          ),
        minimumStock:
          normalizeNumber(
            formData.get(
              'minimumStock',
            ),
          ),
        idealStock:
          normalizeNumber(
            formData.get(
              'idealStock',
            ),
          ),
        description:
          String(
            formData.get(
              'description',
            ) || '',
          ).trim(),
        notes:
          String(
            formData.get(
              'notes',
            ) || '',
          ).trim(),
      };

      const validationError =
        validateInput(data);

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
            ? await updateAgriculturalInput(
                input.id,
                data,
              )
            : await createAgriculturalInput(
                data,
              );

        showToast(
          editing
            ? 'Insumo atualizado.'
            : 'Insumo cadastrado.',
          {
            type: 'success',
          },
        );

        navigate(
          `/inventory/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar insumo:',
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
