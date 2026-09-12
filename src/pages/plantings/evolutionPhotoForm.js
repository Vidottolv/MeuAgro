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
  choosePhotoFromGallery,
  isNativeCameraPlatform,
  takePhotoWithCamera,
} from '../../services/cameraService.js';

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


  const nativeCamera =
    isNativeCameraPlatform();

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

            <div class="photo-source-actions">
              ${
                nativeCamera
                  ? `
                    <button
                      id="take-photo"
                      class="photo-source-button photo-source-button--camera"
                      type="button"
                    >
                      ${icon('camera')}

                      <span>
                        <strong>
                          Tirar foto
                        </strong>

                        <small>
                          Abrir a câmera do dispositivo
                        </small>
                      </span>
                    </button>
                  `
                  : ''
              }

              <button
                id="choose-photo"
                class="photo-source-button"
                type="button"
              >
                ${icon('image')}

                <span>
                  <strong>
                    Escolher da galeria
                  </strong>

                  <small>
                    Usar uma imagem já existente
                  </small>
                </span>
              </button>
            </div>

            <div
              class="photo-upload-field"
              id="photo-upload-field"
            >
              <span
                id="photo-upload-placeholder"
                class="photo-upload-field__placeholder"
              >
                ${icon('camera')}

                <strong>
                  Nenhuma imagem selecionada
                </strong>

                <small>
                  ${
                    nativeCamera
                      ? 'Tire uma foto agora ou escolha uma imagem da galeria.'
                      : 'Escolha uma imagem do dispositivo.'
                  }
                </small>
              </span>

              <img
                id="photo-preview"
                class="photo-upload-field__preview"
                alt=""
                hidden
              />
            </div>

            <p
              id="photo-source-status"
              class="photo-source-status"
              hidden
            ></p>

            <input
              id="photo-file"
              name="file"
              class="photo-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              tabindex="-1"
              aria-hidden="true"
            />
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


  const takePhotoButton =
    document.querySelector(
      '#take-photo',
    );

  const choosePhotoButton =
    document.querySelector(
      '#choose-photo',
    );

  const sourceStatus =
    document.querySelector(
      '#photo-source-status',
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
  let previewUsesObjectUrl = false;
  let selectedFile = null;
  let disposed = false;

  const setSourceButtonLoading =
    (
      button,
      loading,
      label,
    ) => {
      if (!button) {
        return;
      }

      if (loading) {
        button.dataset.originalHtml =
          button.innerHTML;

        button.innerHTML = `
          ${icon('refresh')}
          <span>
            <strong>${label}</strong>
          </span>
        `;

        button.disabled = true;
        button.setAttribute(
          'aria-busy',
          'true',
        );

        return;
      }

      if (
        button.dataset
          .originalHtml
      ) {
        button.innerHTML =
          button.dataset
            .originalHtml;
      }

      button.disabled = false;
      button.removeAttribute(
        'aria-busy',
      );
    };

  const clearPreview =
    () => {
      if (
        previewUrl &&
        previewUsesObjectUrl
      ) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }

      previewUrl = null;
      previewUsesObjectUrl =
        false;

      preview.removeAttribute(
        'src',
      );

      preview.alt = '';
      preview.hidden = true;
    };

  const setSelectedFile =
    (
      file,
      {
        sourceLabel =
          'Imagem selecionada',
        capturedAt = null,
        previewPath = null,
      } = {},
    ) => {
      if (disposed) {
        return false;
      }

      clearPreview();

      const validation =
        validatePhotoFile(
          file,
        );

      if (validation) {
        selectedFile = null;

        setFormMessage(
          feedback,
          validation,
        );

        clearPreview();

        placeholder.hidden =
          false;

        sourceStatus.hidden =
          true;

        return false;
      }

      selectedFile = file;

      setFormMessage(
        feedback,
        '',
      );

      if (previewPath) {
        previewUrl =
          previewPath;

        previewUsesObjectUrl =
          false;
      } else {
        previewUrl =
          URL.createObjectURL(
            file,
          );

        previewUsesObjectUrl =
          true;
      }

      preview.src =
        previewUrl;

      preview.alt =
        sourceLabel;

      preview.hidden = false;
      placeholder.hidden =
        true;

      sourceStatus.textContent =
        `${sourceLabel} • ${file.name}`;

      sourceStatus.hidden =
        false;

      if (
        capturedAt &&
        eventSelect.value ===
          '__auto__'
      ) {
        const capturedDate =
          new Date(
            capturedAt,
          );

        if (
          !Number.isNaN(
            capturedDate.getTime(),
          )
        ) {
          capturedInput.value =
            toDateTimeLocalValue(
              capturedDate,
            );
        }
      }

      return true;
    };

  const handleFileChange =
    () => {
      const file =
        fileInput.files?.[0];

      if (!file) {
        return;
      }

      setSelectedFile(
        file,
        {
          sourceLabel:
            'Imagem da galeria',
        },
      );
    };

  const handleChoosePhoto =
    async () => {
      if (!nativeCamera) {
        fileInput.click();
        return;
      }

      setSourceButtonLoading(
        choosePhotoButton,
        true,
        'Abrindo galeria…',
      );

      try {
        const selected =
          await choosePhotoFromGallery();

        if (
          !selected ||
          disposed
        ) {
          return;
        }

        setSelectedFile(
          selected.file,
          {
            sourceLabel:
              'Imagem da galeria',
            capturedAt:
              selected.capturedAt,
            previewPath:
              selected.previewPath ||
              selected.webPath,
          },
        );
      } catch (error) {
        console.warn(
          'Seleção de imagem cancelada ou não concluída:',
          error,
        );

        if (
          !String(
            error?.message || '',
          )
            .toLocaleLowerCase('pt-BR')
            .includes('cancel')
        ) {
          setFormMessage(
            feedback,
            getDataErrorMessage(
              error,
            ),
          );
        }
      } finally {
        setSourceButtonLoading(
          choosePhotoButton,
          false,
        );
      }
    };

  const handleTakePhoto =
    async () => {
      setSourceButtonLoading(
        takePhotoButton,
        true,
        'Abrindo câmera…',
      );

      try {
        const captured =
          await takePhotoWithCamera();

        if (disposed) {
          return;
        }

        setSelectedFile(
          captured.file,
          {
            sourceLabel:
              'Foto tirada agora',
            capturedAt:
              captured.capturedAt ||
              new Date()
                .toISOString(),
            previewPath:
              captured.previewPath ||
              captured.webPath,
          },
        );
      } catch (error) {
        console.warn(
          'Captura de foto cancelada ou não concluída:',
          error,
        );

        if (
          !String(
            error?.message || '',
          )
            .toLocaleLowerCase('pt-BR')
            .includes('cancel')
        ) {
          setFormMessage(
            feedback,
            getDataErrorMessage(
              error,
            ),
          );
        }
      } finally {
        setSourceButtonLoading(
          takePhotoButton,
          false,
        );
      }
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
        selectedFile;

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

  choosePhotoButton.addEventListener(
    'click',
    handleChoosePhoto,
  );

  takePhotoButton?.addEventListener(
    'click',
    handleTakePhoto,
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
    disposed = true;

    clearPreview();

    fileInput.removeEventListener(
      'change',
      handleFileChange,
    );

    choosePhotoButton.removeEventListener(
      'click',
      handleChoosePhoto,
    );

    takePhotoButton?.removeEventListener(
      'click',
      handleTakePhoto,
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
