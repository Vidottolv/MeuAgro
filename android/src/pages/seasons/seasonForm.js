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
  listActiveProperties,
} from '../../services/propertyService.js';

import {
  createSeason,
  getSeasonById,
  updateSeason,
} from '../../services/seasonService.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

import {
  SEASON_STATUSES,
} from '../../constants/seasonStatus.js';

import {
  escapeHtml,
} from '../../js/html.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  navigate,
} from '../../js/router.js';

function propertyOptions(
  properties,
  selected,
) {
  return `
    <option value="">
      Selecione
    </option>

    ${properties
      .map(
        (property) => `
          <option
            value="${property.id}"
            ${
              selected ===
                property.id
                ? 'selected'
                : ''
            }
          >
            ${escapeHtml(
              property.name,
            )}
          </option>
        `,
      )
      .join('')}
  `;
}

function statusOptions(
  selected,
) {
  return SEASON_STATUSES
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
    .join('');
}

function validateSeason(data) {
  if (!data.propertyId) {
    return 'Selecione a propriedade.';
  }

  if (
    data.name.length < 2
  ) {
    return 'Informe um nome com pelo menos 2 caracteres.';
  }

  if (
    data.startDate &&
    data.endDate &&
    data.endDate <
      data.startDate
  ) {
    return 'A data final não pode ser anterior à data inicial.';
  }

  if (
    !SEASON_STATUSES.some(
      ([value]) =>
        value === data.status,
    )
  ) {
    return 'Selecione um status válido.';
  }

  return null;
}

export async function renderSeasonFormPage({
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

  let properties = [];

  try {
    properties =
      await listActiveProperties();
  } catch (error) {
    console.error(
      'Erro ao carregar propriedades:',
      error,
    );
  }

  if (!properties.length) {
    app.innerHTML =
      appShell({
        session,
        title:
          editing
            ? 'Editar safra'
            : 'Nova safra',
        eyebrow: 'Safras',
        activeNav: 'more',
        content:
          emptyState({
            iconName: 'map',
            title:
              'Cadastre uma propriedade primeiro',
            description:
              'Toda safra precisa estar vinculada a uma propriedade ativa.',
            actionLabel:
              'Cadastrar propriedade',
            actionHref:
              '/properties/new',
          }),
      });

    return null;
  }

  let season = null;

  if (editing) {
    try {
      season =
        await getSeasonById(
          params.seasonId,
        );
    } catch (error) {
      console.error(
        'Erro ao carregar safra:',
        error,
      );
    }

    if (
      !season ||
      season.deleted_at
    ) {
      app.innerHTML =
        appShell({
          session,
          title: 'Safra',
          eyebrow: 'Produção',
          activeNav: 'more',
          content:
            emptyState({
              iconName:
                'calendar',
              title:
                'Safra não encontrada',
              description:
                'Ela pode ter sido arquivada ou não pertencer à sua conta.',
              actionLabel:
                'Voltar para safras',
              actionHref:
                '/more/seasons',
            }),
        });

      return null;
    }
  }

  const queryParams =
    new URLSearchParams(
      window.location.search,
    );

  const requestedProperty =
    queryParams.get(
      'property',
    );

  const selectedProperty =
    season?.property_id ||
    (
      properties.some(
        (property) =>
          property.id ===
          requestedProperty,
      )
        ? requestedProperty
        : ''
    );

  const title =
    editing
      ? 'Editar safra'
      : 'Nova safra';

  app.innerHTML =
    appShell({
      session,
      title,
      eyebrow: 'Produção',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="${
                editing
                  ? `/more/seasons/${season.id}`
                  : '/more/seasons'
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
              Defina o período produtivo e a propriedade à qual esta safra pertence.
            </p>
          </div>
        </section>

        <div
          id="season-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="season-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Identificação
              </h2>

              <p>
                Use um nome claro, como Safra Verão 2026 ou Safra 2026/2027.
              </p>
            </div>

            <div class="field">
              <label
                for="season-property"
              >
                Propriedade *
              </label>

              <select
                id="season-property"
                name="propertyId"
                required
              >
                ${propertyOptions(
                  properties,
                  selectedProperty,
                )}
              </select>
            </div>

            <div class="field">
              <label
                for="season-name"
              >
                Nome *
              </label>

              <input
                id="season-name"
                name="name"
                type="text"
                minlength="2"
                maxlength="120"
                placeholder="Ex.: Safra Verão 2026"
                value="${escapeHtml(
                  season?.name ||
                  '',
                )}"
                required
              />
            </div>

            <div class="field">
              <label
                for="season-description"
              >
                Descrição
              </label>

              <textarea
                id="season-description"
                name="description"
                maxlength="800"
                placeholder="Ex.: Safra destinada ao cultivo de milho e feijão."
              >${escapeHtml(
                season?.description ||
                '',
              )}</textarea>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Período
              </h2>

              <p>
                As datas podem ser preenchidas agora ou atualizadas depois.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="season-start-date"
                >
                  Data inicial
                </label>

                <input
                  id="season-start-date"
                  name="startDate"
                  type="date"
                  value="${
                    season?.start_date ||
                    ''
                  }"
                />
              </div>

              <div class="field">
                <label
                  for="season-end-date"
                >
                  Data final
                </label>

                <input
                  id="season-end-date"
                  name="endDate"
                  type="date"
                  value="${
                    season?.end_date ||
                    ''
                  }"
                />
              </div>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Situação
              </h2>

              <p>
                O status ajuda a distinguir safras planejadas, atuais e encerradas.
              </p>
            </div>

            <div class="field">
              <label
                for="season-status"
              >
                Status *
              </label>

              <select
                id="season-status"
                name="status"
                required
              >
                ${statusOptions(
                  season?.status ||
                  'planned',
                )}
              </select>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="${
                editing
                  ? `/more/seasons/${season.id}`
                  : '/more/seasons'
              }"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="season-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar alterações'
                  : 'Cadastrar safra'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#season-form',
    );

  const feedback =
    document.querySelector(
      '#season-form-feedback',
    );

  const submit =
    document.querySelector(
      '#season-submit',
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
        propertyId:
          String(
            formData.get(
              'propertyId',
            ) || '',
          ).trim(),
        name:
          String(
            formData.get(
              'name',
            ) || '',
          ).trim(),
        description:
          String(
            formData.get(
              'description',
            ) || '',
          ).trim(),
        startDate:
          String(
            formData.get(
              'startDate',
            ) || '',
          ),
        endDate:
          String(
            formData.get(
              'endDate',
            ) || '',
          ),
        status:
          String(
            formData.get(
              'status',
            ) || '',
          ),
      };

      const validationError =
        validateSeason(data);

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
        submit,
        true,
        editing
          ? 'Salvando…'
          : 'Cadastrando…',
      );

      try {
        const saved =
          editing
            ? await updateSeason(
                season.id,
                data,
              )
            : await createSeason(
                data,
              );

        showToast(
          editing
            ? 'Safra atualizada.'
            : 'Safra cadastrada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/more/seasons/${saved.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar safra:',
          error,
        );

        setFormMessage(
          feedback,
          getDataErrorMessage(
            error,
          ),
        );

        feedback.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
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
