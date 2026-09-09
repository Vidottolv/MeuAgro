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
  showAreaTypeModal,
} from '../../components/areaTypeModal.js';

import {
  getPropertyById,
} from '../../services/propertyService.js';

import {
  listAreaTypes,
  createAreaType,
  createArea,
  getAreaById,
  updateArea,
} from '../../services/areaService.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

import {
  AREA_UNITS,
} from '../../constants/areaUnits.js';

import {
  escapeHtml,
} from '../../js/html.js';

import {
  navigate,
} from '../../js/router.js';

function unitOptions(
  selected,
) {
  return `
    <option value="">
      Selecione
    </option>

    ${AREA_UNITS
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

function areaTypeOptions(
  types,
  selected,
) {
  const system =
    types.filter(
      (item) =>
        item.is_system,
    );

  const custom =
    types.filter(
      (item) =>
        !item.is_system,
    );

  const render =
    (items) =>
      items
        .map(
          (item) => `
            <option
              value="${item.id}"
              ${
                selected ===
                item.id
                  ? 'selected'
                  : ''
              }
            >
              ${escapeHtml(
                item.name,
              )}
            </option>
          `,
        )
        .join('');

  return `
    <option value="">
      Selecione
    </option>

    ${
      system.length
        ? `
          <optgroup label="Tipos do Meu Agro">
            ${render(system)}
          </optgroup>
        `
        : ''
    }

    ${
      custom.length
        ? `
          <optgroup label="Meus tipos">
            ${render(custom)}
          </optgroup>
        `
        : ''
    }
  `;
}

function normalizeSize(
  raw,
) {
  const value =
    String(raw || '')
      .trim()
      .replace(',', '.');

  if (!value) {
    return '';
  }

  return Number(value);
}

function validateArea(
  data,
) {
  if (
    data.name.length < 2
  ) {
    return 'Informe um nome com pelo menos 2 caracteres.';
  }

  if (!data.areaTypeId) {
    return 'Selecione o tipo da área.';
  }

  if (
    data.size !== '' &&
    (
      !Number.isFinite(
        data.size,
      ) ||
      data.size < 0
    )
  ) {
    return 'Informe um tamanho válido.';
  }

  if (
    data.size !== '' &&
    !data.unit
  ) {
    return 'Selecione a unidade do tamanho.';
  }

  return null;
}

export async function renderAreaFormPage({
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

  let property = null;

  try {
    property =
      await getPropertyById(
        params.propertyId,
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
        title: 'Área',
        eyebrow: 'Propriedades',
        activeNav:
          'properties',
        content: `
          <section class="empty-state">
            <h2>
              Propriedade não encontrada
            </h2>

            <p>
              Não é possível cadastrar áreas nesta propriedade.
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

  let area = null;

  if (editing) {
    try {
      area =
        await getAreaById(
          params.areaId,
        );
    } catch (error) {
      console.error(
        'Erro ao carregar área:',
        error,
      );
    }

    if (
      !area ||
      area.property_id !==
        property.id ||
      area.deleted_at
    ) {
      app.innerHTML =
        appShell({
          session,
          title: 'Área',
          eyebrow:
            escapeHtml(
              property.name,
            ),
          activeNav:
            'properties',
          content: `
            <section class="empty-state">
              <h2>
                Área não encontrada
              </h2>

              <p>
                Ela pode ter sido arquivada ou não pertencer a esta propriedade.
              </p>

              <a
                href="/properties/${property.id}/areas"
                class="button button--primary"
                data-link
              >
                Voltar para áreas
              </a>
            </section>
          `,
        });

      return null;
    }
  }

  let types = [];

  try {
    types =
      await listAreaTypes();
  } catch (error) {
    console.error(
      'Erro ao carregar tipos:',
      error,
    );
  }

  const title =
    editing
      ? 'Editar área'
      : 'Nova área';

  app.innerHTML =
    appShell({
      session,
      title,
      eyebrow:
        escapeHtml(
          property.name,
        ),
      activeNav:
        'properties',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                editing
                  ? `/properties/${property.id}/areas/${area.id}`
                  : `/properties/${property.id}/areas`
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
              ${title}
            </h2>

            <p>
              Cadastre qualquer espaço produtivo ou de manejo usando a entidade genérica Área.
            </p>
          </div>
        </section>

        <div
          id="area-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="area-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Identificação
              </h2>

              <p>
                Dê um nome fácil de reconhecer e escolha o tipo da área.
              </p>
            </div>

            <div class="field">
              <label
                for="area-name"
              >
                Nome *
              </label>

              <input
                id="area-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="120"
                placeholder="Ex.: Talhão 01"
                value="${escapeHtml(
                  area?.name || '',
                )}"
                required
              />
            </div>

            <div class="field">
              <div class="field__label-row">
                <label
                  for="area-type"
                >
                  Tipo *
                </label>

                <button
                  id="create-area-type"
                  class="inline-link-button"
                  type="button"
                >
                  + Novo tipo
                </button>
              </div>

              <select
                id="area-type"
                name="areaTypeId"
                required
              >
                ${areaTypeOptions(
                  types,
                  area?.area_type_id ||
                  '',
                )}
              </select>

              <small
                id="area-type-description"
                class="field__hint"
              ></small>
            </div>

            <div class="field">
              <label
                for="area-description"
              >
                Descrição
              </label>

              <textarea
                id="area-description"
                name="description"
                maxlength="600"
                placeholder="Ex.: Área utilizada para plantio de milho."
              >${escapeHtml(
                area?.description || '',
              )}</textarea>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Tamanho
              </h2>

              <p>
                Informe a dimensão da área quando souber.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="area-size"
                >
                  Tamanho
                </label>

                <input
                  id="area-size"
                  name="size"
                  type="number"
                  min="0"
                  step="0.0001"
                  inputmode="decimal"
                  placeholder="Ex.: 2.5"
                  value="${
                    area?.size ??
                    ''
                  }"
                />
              </div>

              <div class="field">
                <label
                  for="area-unit"
                >
                  Unidade
                </label>

                <select
                  id="area-unit"
                  name="unit"
                >
                  ${unitOptions(
                    area?.unit ||
                    '',
                  )}
                </select>
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Localização interna
              </h2>

              <p>
                Ajude a identificar onde esta área fica dentro da propriedade.
              </p>
            </div>

            <div class="field">
              <label
                for="area-location"
              >
                Localização / referência
              </label>

              <input
                id="area-location"
                name="locationDescription"
                type="text"
                maxlength="240"
                placeholder="Ex.: Após o curral, lado norte"
                value="${escapeHtml(
                  area?.location_description ||
                  '',
                )}"
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Observações
              </h2>

              <p>
                Registre informações adicionais úteis para o manejo.
              </p>
            </div>

            <div class="field">
              <label
                for="area-notes"
              >
                Observações
              </label>

              <textarea
                id="area-notes"
                name="notes"
                maxlength="1500"
                placeholder="Ex.: solo argiloso, irrigação por gotejamento..."
              >${escapeHtml(
                area?.notes || '',
              )}</textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                editing
                  ? `/properties/${property.id}/areas/${area.id}`
                  : `/properties/${property.id}/areas`
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="area-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar alterações'
                  : 'Cadastrar área'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#area-form',
    );

  const feedback =
    document.querySelector(
      '#area-form-feedback',
    );

  const submit =
    document.querySelector(
      '#area-submit',
    );

  const typeSelect =
    document.querySelector(
      '#area-type',
    );

  const descriptionHint =
    document.querySelector(
      '#area-type-description',
    );

  const createTypeButton =
    document.querySelector(
      '#create-area-type',
    );

  function renderTypeHint() {
    const selected =
      types.find(
        (item) =>
          item.id ===
          typeSelect.value,
      );

    descriptionHint.textContent =
      selected?.description ||
      (
        selected?.is_system
          ? 'Tipo padrão do Meu Agro.'
          : selected
            ? 'Tipo personalizado.'
            : ''
      );
  }

  renderTypeHint();

  const handleTypeChange =
    () => {
      renderTypeHint();
    };

  const handleCreateType =
    async () => {
      const input =
        await showAreaTypeModal();

      if (!input) {
        return;
      }

      createTypeButton.disabled =
        true;

      try {
        const created =
          await createAreaType(
            input,
          );

        types = [
          ...types,
          created,
        ].sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              'pt-BR',
            ),
        );

        typeSelect.innerHTML =
          areaTypeOptions(
            types,
            created.id,
          );

        typeSelect.value =
          created.id;

        renderTypeHint();

        showToast(
          'Tipo de área criado.',
          {
            type: 'success',
          },
        );
      } catch (error) {
        console.error(
          'Erro ao criar tipo:',
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
      } finally {
        createTypeButton.disabled =
          false;
      }
    };

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
        areaTypeId:
          String(
            formData.get(
              'areaTypeId',
            ) || '',
          ).trim(),
        description:
          String(
            formData.get(
              'description',
            ) || '',
          ).trim(),
        size:
          normalizeSize(
            formData.get(
              'size',
            ),
          ),
        unit:
          String(
            formData.get(
              'unit',
            ) || '',
          ).trim(),
        locationDescription:
          String(
            formData.get(
              'locationDescription',
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
        validateArea(data);

      if (validationError) {
        setFormMessage(
          feedback,
          validationError,
        );

        feedback.scrollIntoView({
          behavior:
            'smooth',
          block:
            'center',
        });

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
            ? await updateArea(
                area.id,
                data,
              )
            : await createArea(
                property.id,
                data,
              );

        showToast(
          editing
            ? 'Área atualizada.'
            : 'Área cadastrada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/properties/${property.id}/areas/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar área:',
          error,
        );

        setFormMessage(
          feedback,
          getDataErrorMessage(
            error,
          ),
        );

        feedback.scrollIntoView({
          behavior:
            'smooth',
          block:
            'center',
        });
      } finally {
        setButtonLoading(
          submit,
          false,
        );
      }
    };

  typeSelect.addEventListener(
    'change',
    handleTypeChange,
  );

  createTypeButton.addEventListener(
    'click',
    handleCreateType,
  );

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  return () => {
    typeSelect.removeEventListener(
      'change',
      handleTypeChange,
    );

    createTypeButton.removeEventListener(
      'click',
      handleCreateType,
    );

    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
