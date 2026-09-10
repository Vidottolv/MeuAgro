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
  deleteProductionEvent,
  listProductionEvents,
} from '../../services/productionEventService.js';

import {
  createPhotoRecord,
  removePhotoFile,
  uploadCyclePhotoFile,
  validatePhotoFile,
} from '../../services/photoService.js';

import {
  dateTimeLocalToIso,
  escapeHtml,
  formatDateTimePtBr,
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

function eventOptions(
  events,
  selected,
) {
  return `
    <option value="__auto__">
      Criar evento fotográfico automaticamente
    </option>

    ${events
      .map(
        (event) => `
          <option
            value="${event.id}"
            ${
              selected ===
                event.id
                ? 'selected'
                : ''
            }
          >
            ${escapeHtml(
              `${formatDateTimePtBr(
                event.occurred_at,
              )} • ${event.title}`,
            )}
          </option>
        `,
      )
      .join('')}
  `;
}

export async function renderEvolutionPhotoFormPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let cycle = null;
  let events = [];

  try {
    cycle =
      await getProductionCycleById(
        params.cycleId,
      );

    if (cycle) {
      events =
        await listProductionEvents(
          cycle.id,
        );
    }
  } catch (error) {
    console.error(
      'Erro ao preparar foto:',
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
        title: 'Adicionar foto',
        eyebrow: 'Evolução',
        activeNav: 'plantings',
        content:
          emptyState({
            iconName: 'camera',
            title:
              'Ciclo indisponível',
            description:
              'Fotos novas só podem ser adicionadas a ciclos ativos.',
            actionLabel:
              'Voltar para plantios',
            actionHref:
              '/plantings',
          }),
      });

    return null;
  }

  const query =
    new URLSearchParams(
      window.location.search,
    );

  const requestedEvent =
    query.get('event');

  const selectedEvent =
    events.some(
      (event) =>
        event.id ===
        requestedEvent,
    )
      ? requestedEvent
      : '__auto__';

  const selectedEventData =
    events.find(
      (event) =>
        event.id ===
        selectedEvent,
    );

  app.innerHTML =
    appShell({
      session,
      title: 'Adicionar foto',
      eyebrow:
        cycle.crop?.name ||
        'Evolução visual',
      activeNav: 'plantings',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/plantings/${cycle.id}/evolution"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Evolução
            </a>

            <h2
              style="margin-top: 10px;"
            >
              Registrar imagem
            </h2>

            <p>
              A foto será armazenada no bucket privado do Meu Agro e ligada ao ciclo produtivo.
            </p>
          </div>
        </section>

        <div
          id="photo-form-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="photo-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Imagem
              </h2>

              <p>
                Formatos aceitos: JPG, PNG e WebP. Tamanho máximo: 8 MB.
              </p>
            </div>

            <label
              class="photo-upload-field"
              for="photo-file"
            >
              <span
                id="photo-upload-placeholder"
                class="photo-upload-field__placeholder"
              >
                ${icon('camera')}

                <strong>
                  Selecionar imagem
                </strong>

                <small>
                  Toque para escolher uma foto do dispositivo.
                </small>
              </span>

              <img
                id="photo-preview"
                class="photo-upload-field__preview"
                alt="Prévia da imagem selecionada"
                hidden
              />

              <input
                id="photo-file"
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
              />
            </label>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Registro
              </h2>

              <p>
                Relacione a imagem a um evento existente ou deixe o Meu Agro criar um evento de fotografia.
              </p>
            </div>

            <div class="field">
              <label
                for="photo-event"
              >
                Evento relacionado
              </label>

              <select
                id="photo-event"
                name="eventId"
              >
                ${eventOptions(
                  events,
                  selectedEvent,
                )}
              </select>
            </div>

            <div class="field">
              <label
                for="photo-captured-at"
              >
                Data e horário da foto *
              </label>

              <input
                id="photo-captured-at"
                name="capturedAt"
                type="datetime-local"
                value="${escapeHtml(
                  toDateTimeLocalValue(
                    selectedEventData
                      ?.occurred_at ||
                    new Date(),
                  ),
                )}"
                required
              />
            </div>

            <div class="field">
              <label
                for="photo-description"
              >
                Descrição
              </label>

              <textarea
                id="photo-description"
                name="description"
                maxlength="800"
                placeholder="Ex.: Desenvolvimento das folhas após 30 dias."
              ></textarea>
            </div>
          </section>

          <div class="property-form-actions">
            <a
              href="/plantings/${cycle.id}/evolution"
              class="button button--secondary"
              data-link
            >
              Cancelar
            </a>

            <button
              id="photo-submit"
              class="button button--primary"
              type="submit"
            >
              Salvar foto
            </button>
          </div>
        </form>
      `,
    });

  const form =
    document.querySelector(
      '#photo-form',
    );

  const feedback =
    document.querySelector(
      '#photo-form-feedback',
    );

  const fileInput =
    document.querySelector(
      '#photo-file',
    );

  const preview =
    document.querySelector(
      '#photo-preview',
    );

  const placeholder =
    document.querySelector(
      '#photo-upload-placeholder',
    );

  const eventSelect =
    document.querySelector(
      '#photo-event',
    );

  const capturedInput =
    document.querySelector(
      '#photo-captured-at',
    );

  const submit =
    document.querySelector(
      '#photo-submit',
    );

  let previewUrl = null;

  const clearPreview =
    () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl,
        );

        previewUrl = null;
      }
    };

  const handleFileChange =
    () => {
      clearPreview();

      const file =
        fileInput.files?.[0];

      const validation =
        validatePhotoFile(
          file,
        );

      if (validation) {
        setFormMessage(
          feedback,
          validation,
        );

        preview.hidden = true;
        placeholder.hidden =
          false;

        return;
      }

      setFormMessage(
        feedback,
        '',
      );

      previewUrl =
        URL.createObjectURL(
          file,
        );

      preview.src =
        previewUrl;

      preview.hidden = false;
      placeholder.hidden =
        true;
    };

  const handleEventChange =
    () => {
      const selected =
        events.find(
          (event) =>
            event.id ===
            eventSelect.value,
        );

      if (selected) {
        capturedInput.value =
          toDateTimeLocalValue(
            selected.occurred_at,
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

      const file =
        fileInput.files?.[0];

      const fileError =
        validatePhotoFile(
          file,
        );

      if (fileError) {
        setFormMessage(
          feedback,
          fileError,
        );

        return;
      }

      const formData =
        new FormData(form);

      const capturedAtLocal =
        String(
          formData.get(
            'capturedAt',
          ) || '',
        );

      const capturedAt =
        dateTimeLocalToIso(
          capturedAtLocal,
        );

      if (!capturedAt) {
        setFormMessage(
          feedback,
          'Informe a data e o horário da foto.',
        );

        return;
      }

      const description =
        String(
          formData.get(
            'description',
          ) || '',
        ).trim();

      setButtonLoading(
        submit,
        true,
        'Enviando…',
      );

      let storagePath = null;
      let autoEvent = null;

      try {
        storagePath =
          await uploadCyclePhotoFile({
            file,
            cycle,
          });

        let eventId =
          eventSelect.value;

        if (
          eventId ===
          '__auto__'
        ) {
          autoEvent =
            await createProductionEvent(
              cycle.id,
              {
                eventType: 'photo',
                title:
                  'Registro fotográfico',
                description:
                  description ||
                  'Foto adicionada à evolução visual do ciclo.',
                notes: '',
                occurredAt:
                  capturedAt,
              },
            );

          eventId =
            autoEvent.id;
        }

        await createPhotoRecord({
          cycle,
          eventId:
            eventId ||
            null,
          storagePath,
          description,
          capturedAt,
        });

        showToast(
          'Foto adicionada à evolução.',
          {
            type: 'success',
          },
        );

        navigate(
          `/plantings/${cycle.id}/evolution`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao salvar foto:',
          error,
        );

        if (storagePath) {
          try {
            await removePhotoFile(
              storagePath,
            );
          } catch (
            cleanupError
          ) {
            console.warn(
              'Não foi possível limpar o arquivo após a falha:',
              cleanupError,
            );
          }
        }

        if (autoEvent?.id) {
          try {
            await deleteProductionEvent(
              autoEvent.id,
            );
          } catch (
            rollbackError
          ) {
            console.warn(
              'Não foi possível desfazer o evento fotográfico:',
              rollbackError,
            );
          }
        }

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

  fileInput.addEventListener(
    'change',
    handleFileChange,
  );

  eventSelect.addEventListener(
    'change',
    handleEventChange,
  );

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  return () => {
    clearPreview();

    fileInput.removeEventListener(
      'change',
      handleFileChange,
    );

    eventSelect.removeEventListener(
      'change',
      handleEventChange,
    );

    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
