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
  getProductionCycleById,
} from '../../services/productionCycleService.js';

import {
  createProductionEvent,
  getProductionEventById,
  updateProductionEvent,
} from '../../services/productionEventService.js';

import {
  PRODUCTION_EVENT_TYPES,
  getProductionEventTypeLabel,
} from '../../constants/productionEventTypes.js';

import {
  dateTimeLocalToIso,
  escapeHtml,
  toDateTimeLocalValue,
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

function typeOptions(
  selected,
) {
  return PRODUCTION_EVENT_TYPES
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
          ${escapeHtml(label)}
        </option>
      `,
    )
    .join('');
}

function validateEvent(data) {
  if (!data.eventType) {
    return 'Selecione o tipo do evento.';
  }

  if (
    data.title.length < 2
  ) {
    return 'Informe um título com pelo menos 2 caracteres.';
  }

  if (!data.occurredAt) {
    return 'Informe a data e o horário do evento.';
  }

  return null;
}

export async function renderProductionEventFormPage({
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

  let cycle = null;
  let event = null;

  try {
    cycle =
      await getProductionCycleById(
        params.cycleId,
      );

    if (editing) {
      event =
        await getProductionEventById(
          params.eventId,
        );
    }
  } catch (error) {
    console.error(
      'Erro ao preparar evento:',
      error,
    );
  }

  if (
    !cycle ||
    cycle.deleted_at
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Evento',
        eyebrow: 'Linha do tempo',
        activeNav: 'plantings',
        content:
          emptyState({
            iconName: 'clipboard',
            title:
              'Ciclo indisponível',
            description:
              'Novos eventos só podem ser registrados em ciclos produtivos ativos.',
            actionLabel:
              'Voltar para plantios',
            actionHref:
              '/plantings',
          }),
      });

    return null;
  }

  if (
    editing &&
    (
      !event ||
      event.production_cycle_id !==
        cycle.id
    )
  ) {
    app.innerHTML =
      appShell({
        session,
        title: 'Evento',
        eyebrow: 'Linha do tempo',
        activeNav: 'plantings',
        content:
          emptyState({
            iconName: 'clipboard',
            title:
              'Evento não encontrado',
            description:
              'Este evento não pertence ao ciclo informado.',
            actionLabel:
              'Voltar para o plantio',
            actionHref:
              `/plantings/${cycle.id}`,
          }),
      });

    return null;
  }

  const defaultType =
    event?.event_type ||
    'observation';

  app.innerHTML =
    appShell({
      session,
      title:
        editing
          ? 'Editar evento'
          : 'Novo evento',
      eyebrow:
        cycle.crop?.name ||
        'Ciclo produtivo',
      activeNav: 'plantings',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/plantings/${cycle.id}#timeline"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Linha do tempo
            </a>

            <h2
              style="margin-top: 10px;"
            >
              ${
                editing
                  ? 'Editar evento'
                  : 'Registrar atividade'
              }
            </h2>

            <p>
              Cada operação fica armazenada como um evento independente do ciclo produtivo.
            </p>
          </div>
        </section>

        <div
          id="event-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="event-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Atividade
              </h2>

              <p>
                Informe o tipo, o título e quando a atividade ocorreu.
              </p>
            </div>

            <div class="field">
              <label
                for="event-type"
              >
                Tipo *
              </label>

              <select
                id="event-type"
                name="eventType"
                required
              >
                ${typeOptions(
                  defaultType,
                )}
              </select>
            </div>

            <div class="field">
              <label
                for="event-title"
              >
                Título *
              </label>

              <input
                id="event-title"
                name="title"
                type="text"
                minlength="2"
                maxlength="180"
                placeholder="Ex.: Irrigação do talhão"
                value="${escapeHtml(
                  event?.title || '',
                )}"
                required
              />
            </div>

            <div class="field">
              <label
                for="event-occurred-at"
              >
                Data e horário *
              </label>

              <input
                id="event-occurred-at"
                name="occurredAt"
                type="datetime-local"
                value="${escapeHtml(
                  toDateTimeLocalValue(
                    event?.occurred_at ||
                    new Date(),
                  ),
                )}"
                required
              />
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Detalhes
              </h2>

              <p>
                Descreva o que foi feito e registre observações importantes.
              </p>
            </div>

            <div class="field">
              <label
                for="event-description"
              >
                Descrição
              </label>

              <textarea
                id="event-description"
                name="description"
                maxlength="1600"
                placeholder="Ex.: Irrigação realizada por 40 minutos."
              >${escapeHtml(
                event?.description ||
                '',
              )}</textarea>
            </div>

            <div class="field">
              <label
                for="event-notes"
              >
                Observações
              </label>

              <textarea
                id="event-notes"
                name="notes"
                maxlength="1600"
                placeholder="Ex.: solo ainda apresentava boa umidade na parte baixa."
              >${escapeHtml(
                event?.notes || '',
              )}</textarea>
            </div>
          </section>

          ${
            editing &&
            event?.event_photos
              ?.length
              ? `
                <section class="form-card">
                  <div class="form-section-title">
                    <h2>
                      Fotos relacionadas
                    </h2>

                    <p>
                      Este evento possui ${event.event_photos.length} ${
                        event.event_photos.length === 1
                          ? 'foto relacionada'
                          : 'fotos relacionadas'
                      }.
                    </p>
                  </div>

                  <a
                    href="/plantings/${cycle.id}/evolution/new?event=${event.id}"
                    class="button button--secondary"
                    data-link
                  >
                    ${icon('camera')}
                    Adicionar outra foto
                  </a>
                </section>
              `
              : ''
          }

          ${
            editing
              ? `
                <section class="form-card">
                  <div class="form-section-title">
                    <h2>
                      Insumos utilizados
                    </h2>

                    <p>
                      O consumo gera automaticamente uma saída de estoque e captura o custo do lote.
                    </p>
                  </div>

                  <a
                    href="/plantings/${cycle.id}/events/${event.id}/inputs/new"
                    class="button button--secondary"
                    data-link
                  >
                    ${icon('box')}
                    Adicionar insumo utilizado
                  </a>
                </section>
              `
              : ''
          }

          <div class="property-form-actions">
            <a
              href="/plantings/${cycle.id}#timeline"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="event-submit"
              class="button button--primary"
              type="submit"
            >
              ${
                editing
                  ? 'Salvar alterações'
                  : 'Registrar evento'
              }
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#event-form',
    );

  const feedback =
    document.querySelector(
      '#event-form-feedback',
    );

  const submit =
    document.querySelector(
      '#event-submit',
    );

  const typeSelect =
    document.querySelector(
      '#event-type',
    );

  const titleInput =
    document.querySelector(
      '#event-title',
    );

  let titleTouched =
    Boolean(
      event?.title,
    );

  const handleTitleInput =
    () => {
      titleTouched =
        titleInput.value
          .trim()
          .length > 0;
    };

  const handleTypeChange =
    () => {
      if (
        !editing &&
        !titleTouched
      ) {
        titleInput.value =
          getProductionEventTypeLabel(
            typeSelect.value,
          );
      }
    };

  const handleSubmit =
    async (submitEvent) => {
      submitEvent.preventDefault();

      setFormMessage(
        feedback,
        '',
      );

      const formData =
        new FormData(form);

      const data = {
        eventType:
          String(
            formData.get(
              'eventType',
            ) || '',
          ),
        title:
          String(
            formData.get(
              'title',
            ) || '',
          ).trim(),
        occurredAt:
          dateTimeLocalToIso(
            String(
              formData.get(
                'occurredAt',
              ) || '',
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
        validateEvent(data);

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
          : 'Registrando…',
      );

      try {
        if (editing) {
          await updateProductionEvent(
            event.id,
            cycle.id,
            data,
          );
        } else {
          await createProductionEvent(
            cycle.id,
            data,
          );
        }

        showToast(
          editing
            ? 'Evento atualizado.'
            : 'Evento registrado na linha do tempo.',
          {
            type: 'success',
          },
        );

        navigate(
          `/plantings/${cycle.id}#timeline`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar evento:',
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

  titleInput.addEventListener(
    'input',
    handleTitleInput,
  );

  typeSelect.addEventListener(
    'change',
    handleTypeChange,
  );

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  if (
    !editing &&
    !titleInput.value
  ) {
    titleInput.value =
      getProductionEventTypeLabel(
        defaultType,
      );

    titleTouched = false;
  }

  return () => {
    titleInput.removeEventListener(
      'input',
      handleTitleInput,
    );

    typeSelect.removeEventListener(
      'change',
      handleTypeChange,
    );

    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
