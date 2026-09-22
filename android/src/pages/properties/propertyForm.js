import {
  appShell,
} from '../../components/appShell.js';
import {
  icon,
} from '../../components/icons.js';
import {
  setButtonLoading,
  setFormMessage,
} from '../../components/formHelpers.js';
import {
  showToast,
} from '../../components/toast.js';
import {
  createProperty,
  getPropertyById,
  updateProperty,
} from '../../services/propertyService.js';
import {
  getAuthErrorMessage,
} from '../../services/authErrorService.js';
import {
  BRAZIL_STATES,
  PROPERTY_AREA_UNITS,
} from '../../constants/brazilStates.js';
import {
  escapeHtml,
} from '../../js/html.js';
import {
  navigate,
} from '../../js/router.js';

function stateOptions(selected) {
  return `
    <option value="">
      Selecione
    </option>

    ${BRAZIL_STATES
      .map(
        ([uf, name]) => `
          <option
            value="${uf}"
            ${
              selected === uf
                ? 'selected'
                : ''
            }
          >
            ${uf} - ${name}
          </option>
        `,
      )
      .join('')}
  `;
}

function areaUnitOptions(selected) {
  return `
    <option value="">
      Selecione
    </option>

    ${PROPERTY_AREA_UNITS
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

function normalizeTotalArea(
  rawValue,
) {
  const value =
    String(rawValue || '')
      .trim()
      .replace(',', '.');

  if (!value) {
    return '';
  }

  return Number(value);
}

function validateForm(data) {
  if (!data.name) {
    return 'Informe o nome da propriedade.';
  }

  if (data.name.length < 2) {
    return 'O nome deve possuir pelo menos 2 caracteres.';
  }

  if (
    data.totalArea !== '' &&
    (
      !Number.isFinite(
        data.totalArea,
      ) ||
      data.totalArea < 0
    )
  ) {
    return 'Informe uma área total válida.';
  }

  if (
    data.totalArea !== '' &&
    !data.areaUnit
  ) {
    return 'Selecione a unidade da área total.';
  }

  return null;
}

export async function renderPropertyFormPage({
  session,
  params,
  mode,
}) {
  const app =
    document.querySelector('#app');

  const editing =
    mode === 'edit';

  let property = null;

  if (editing) {
    try {
      property =
        await getPropertyById(
          params.id,
        );
    } catch (error) {
      console.error(
        'Erro ao carregar propriedade:',
        error,
      );
    }

    if (
      !property ||
      property.deleted_at
    ) {
      app.innerHTML =
        appShell({
          session,
          title: 'Propriedade',
          eyebrow: 'Gestão rural',
          activeNav: 'properties',
          content: `
            <section class="empty-state">
              <h2>
                Propriedade não encontrada
              </h2>

              <p>
                Ela pode ter sido arquivada ou não pertencer à sua conta.
              </p>

              <a
                href="/properties"
                class="button button--primary"
                data-link
              >
                Voltar
              </a>
            </section>
          `,
        });

      return null;
    }
  }

  const title =
    editing
      ? 'Editar propriedade'
      : 'Nova propriedade';

  app.innerHTML =
    appShell({
      session,
      title,
      eyebrow: 'Propriedades',
      activeNav: 'properties',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              ${
                editing
                  ? 'Edição'
                  : 'Cadastro'
              }
            </p>

            <h2>${title}</h2>

            <p>
              ${
                editing
                  ? 'Atualize os dados principais da propriedade.'
                  : 'Comece pelos dados gerais. Depois criaremos as áreas dentro dela.'
              }
            </p>
          </div>

          <a
            href="${
              editing
                ? `/properties/${property.id}`
                : '/properties'
            }"
            class="icon-button"
            aria-label="Voltar"
            data-link
          >
            ${icon('arrowLeft')}
          </a>
        </section>

        <div
          id="property-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="property-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>Identificação</h2>
              <p>
                Como você reconhece esta propriedade no dia a dia?
              </p>
            </div>

            <div class="field">
              <label for="property-name">
                Nome *
              </label>

              <input
                id="property-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="120"
                autocomplete="organization"
                placeholder="Ex.: Sítio Boa Esperança"
                value="${escapeHtml(
                  property?.name || '',
                )}"
                required
              />
            </div>

            <div class="field">
              <label for="property-description">
                Descrição
              </label>

              <textarea
                id="property-description"
                name="description"
                maxlength="600"
                placeholder="Uma breve descrição da propriedade."
              >${escapeHtml(
                property?.description || '',
              )}</textarea>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Localização</h2>
              <p>
                Município e estado ajudam a identificar rapidamente a propriedade.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="property-city">
                  Município
                </label>

                <input
                  id="property-city"
                  name="city"
                  type="text"
                  maxlength="120"
                  placeholder="Ex.: Ribeirão Preto"
                  value="${escapeHtml(
                    property?.city || '',
                  )}"
                />
              </div>

              <div class="field">
                <label for="property-state">
                  Estado
                </label>

                <select
                  id="property-state"
                  name="state"
                >
                  ${stateOptions(
                    property?.state || '',
                  )}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Área</h2>
              <p>
                Informe a área total e a unidade utilizada.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label for="property-total-area">
                  Área total
                </label>

                <input
                  id="property-total-area"
                  name="totalArea"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 12.5"
                  value="${
                    property?.total_area ??
                    ''
                  }"
                />
              </div>

              <div class="field">
                <label for="property-area-unit">
                  Unidade
                </label>

                <select
                  id="property-area-unit"
                  name="areaUnit"
                >
                  ${areaUnitOptions(
                    property?.area_unit ||
                    '',
                  )}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>Observações</h2>
              <p>
                Informações adicionais que sejam úteis para você.
              </p>
            </div>

            <div class="field">
              <label for="property-notes">
                Observações
              </label>

              <textarea
                id="property-notes"
                name="notes"
                maxlength="1500"
                placeholder="Ex.: acesso pela estrada municipal, possui poço artesiano..."
              >${escapeHtml(
                property?.notes || '',
              )}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                editing
                  ? `/properties/${property.id}`
                  : '/properties'
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="property-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar alterações'
                  : 'Cadastrar propriedade'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#property-form',
    );

  const feedback =
    document.querySelector(
      '#property-form-feedback',
    );

  const submitButton =
    document.querySelector(
      '#property-submit',
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
            formData.get('name') || '',
          ).trim(),
        description:
          String(
            formData.get(
              'description',
            ) || '',
          ).trim(),
        city:
          String(
            formData.get('city') || '',
          ).trim(),
        state:
          String(
            formData.get('state') || '',
          ).trim(),
        totalArea:
          normalizeTotalArea(
            formData.get('totalArea'),
          ),
        areaUnit:
          String(
            formData.get(
              'areaUnit',
            ) || '',
          ).trim(),
        notes:
          String(
            formData.get('notes') || '',
          ).trim(),
      };

      const validationError =
        validateForm(data);

      if (validationError) {
        setFormMessage(
          feedback,
          validationError,
        );

        feedback.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        return;
      }

      setButtonLoading(
        submitButton,
        true,
        editing
          ? 'Salvando…'
          : 'Cadastrando…',
      );

      try {
        const saved =
          editing
            ? await updateProperty(
                property.id,
                data,
              )
            : await createProperty(
                data,
              );

        showToast(
          editing
            ? 'Propriedade atualizada.'
            : 'Propriedade cadastrada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/properties/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar propriedade:',
          error,
        );

        setFormMessage(
          feedback,
          getAuthErrorMessage(error),
        );

        feedback.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } finally {
        setButtonLoading(
          submitButton,
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
