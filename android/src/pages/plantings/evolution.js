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
  getProductionCycleById,
} from '../../services/productionCycleService.js';

import {
  listCyclePhotos,
  deletePhoto,
} from '../../services/photoService.js';

import {
  differenceInCalendarDays,
} from '../../js/cycleMetrics.js';

import {
  escapeHtml,
  formatDateTimePtBr,
} from '../../js/html.js';

import {
  showConfirmModal,
} from '../../components/confirmModal.js';

import {
  showPhotoViewer,
} from '../../components/photoViewerModal.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

function photoDayLabel(
  cycle,
  photo,
) {
  const difference =
    differenceInCalendarDays(
      photo.captured_at,
      cycle.planting_date,
    );

  if (
    difference === null
  ) {
    return 'Evolução';
  }

  if (difference < 0) {
    return 'Antes do plantio';
  }

  return `Dia ${difference + 1}`;
}

function galleryMarkup(
  cycle,
  photos,
  readonly,
) {
  if (!photos.length) {
    return emptyState({
      iconName: 'camera',
      title:
        'Nenhuma foto registrada',
      description:
        'Adicione imagens ao longo do ciclo para acompanhar visualmente a evolução da área.',
      actionLabel:
        readonly
          ? null
          : 'Adicionar primeira foto',
      actionHref:
        readonly
          ? null
          : `/plantings/${cycle.id}/evolution/new`,
    });
  }

  return `
    <section class="evolution-gallery">
      ${photos
        .map(
          (photo) => `
            <article class="evolution-photo-card">
              <button
                class="evolution-photo-card__image"
                type="button"
                ${
                  photo.signed_url
                    ? `data-photo-view="${escapeHtml(
                        photo.signed_url,
                      )}"`
                    : 'disabled'
                }
                data-photo-alt="${escapeHtml(
                  photo.description ||
                  photoDayLabel(
                    cycle,
                    photo,
                  ),
                )}"
              >
                ${
                  photo.signed_url
                    ? `
                      <img
                        src="${escapeHtml(
                          photo.signed_url,
                        )}"
                        alt="${escapeHtml(
                          photo.description ||
                          photoDayLabel(
                            cycle,
                            photo,
                          ),
                        )}"
                        loading="lazy"
                      />
                    `
                    : `
                      <span class="evolution-photo-card__missing">
                        ${icon('camera')}
                        Imagem indisponível
                      </span>
                    `
                }
              </button>

              <div class="evolution-photo-card__body">
                <div class="evolution-photo-card__heading">
                  <strong>
                    ${escapeHtml(
                      photoDayLabel(
                        cycle,
                        photo,
                      ),
                    )}
                  </strong>

                  <time>
                    ${formatDateTimePtBr(
                      photo.captured_at,
                    )}
                  </time>
                </div>

                ${
                  photo.description
                    ? `
                      <p>
                        ${escapeHtml(
                          photo.description,
                        )}
                      </p>
                    `
                    : ''
                }

                ${
                  photo.production_event
                    ?.title
                    ? `
                      <span class="evolution-photo-card__event">
                        ${icon('clipboard')}
                        ${escapeHtml(
                          photo.production_event.title,
                        )}
                      </span>
                    `
                    : ''
                }

                ${
                  readonly
                    ? ''
                    : `
                      <button
                        class="button button--ghost button--compact evolution-photo-card__delete"
                        type="button"
                        data-delete-photo="${photo.id}"
                      >
                        ${icon('trash')}
                        Remover foto
                      </button>
                    `
                }
              </div>
            </article>
          `,
        )
        .join('')}
    </section>
  `;
}

export async function renderEvolutionPage({
  session,
  params,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let cycle = null;
  let photos = [];

  try {
    cycle =
      await getProductionCycleById(
        params.cycleId,
      );

    if (cycle) {
      photos =
        await listCyclePhotos(
          cycle.id,
        );
    }
  } catch (error) {
    console.error(
      'Erro ao carregar evolução:',
      error,
    );
  }

  if (!cycle) {
    app.innerHTML =
      appShell({
        session,
        title: 'Evolução',
        eyebrow: 'Fotos',
        activeNav: 'plantings',
        content:
          emptyState({
            iconName: 'camera',
            title:
              'Ciclo não encontrado',
            description:
              'Não foi possível carregar a evolução visual.',
            actionLabel:
              'Voltar para plantios',
            actionHref:
              '/plantings',
          }),
      });

    return null;
  }

  const readonly =
    Boolean(
      cycle.deleted_at,
    );

  app.innerHTML =
    appShell({
      session,
      title: 'Evolução',
      eyebrow:
        cycle.crop?.name ||
        'Ciclo produtivo',
      activeNav: 'plantings',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/plantings/${cycle.id}"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Plantio
            </a>

            <h2
              style="margin-top: 10px;"
            >
              Evolução visual
            </h2>

            <p>
              Fotos em ordem cronológica para acompanhar as mudanças do ciclo produtivo.
            </p>
          </div>

          ${
            readonly
              ? ''
              : `
                <a
                  href="/plantings/${cycle.id}/evolution/new"
                  class="icon-button"
                  aria-label="Adicionar foto"
                  data-link
                >
                  ${icon('camera')}
                </a>
              `
          }
        </section>

        <section class="evolution-summary">
          <div>
            <strong>
              ${photos.length}
            </strong>

            <span>
              ${
                photos.length === 1
                  ? 'foto registrada'
                  : 'fotos registradas'
              }
            </span>
          </div>

          <div>
            <strong>
              ${escapeHtml(
                cycle.area?.name ||
                '-',
              )}
            </strong>

            <span>
              Área acompanhada
            </span>
          </div>

          ${
            readonly
              ? `
                <span class="property-status property-status--archived">
                  Somente leitura
                </span>
              `
              : `
                <a
                  href="/plantings/${cycle.id}/evolution/new"
                  class="button button--primary button--compact"
                  data-link
                >
                  ${icon('plus')}
                  Adicionar foto
                </a>
              `
          }
        </section>

        <div id="evolution-gallery-root">
          ${galleryMarkup(
            cycle,
            photos,
            readonly,
          )}
        </div>
      `,
    });

  const galleryRoot =
    document.querySelector(
      '#evolution-gallery-root',
    );

  const handlePhotoClick =
    async (event) => {
      const viewer =
        event.target.closest(
          '[data-photo-view]',
        );

      if (viewer) {
        showPhotoViewer({
          src:
            viewer.dataset
              .photoView,
          alt:
            viewer.dataset
              .photoAlt ||
            'Foto da evolução',
        });

        return;
      }

      const deleteButton =
        event.target.closest(
          '[data-delete-photo]',
        );

      if (
        !deleteButton ||
        readonly
      ) {
        return;
      }

      const photo =
        photos.find(
          (item) =>
            item.id ===
            deleteButton.dataset
              .deletePhoto,
        );

      if (!photo) {
        return;
      }

      const confirmed =
        await showConfirmModal({
          title:
            'Remover foto?',
          message:
            'O arquivo será removido da evolução visual. O evento relacionado continuará preservado na linha do tempo.',
          confirmLabel:
            'Remover',
          danger: true,
        });

      if (!confirmed) {
        return;
      }

      deleteButton.disabled =
        true;

      try {
        await deletePhoto(
          photo,
        );

        photos =
          photos.filter(
            (item) =>
              item.id !==
              photo.id,
          );

        galleryRoot.innerHTML =
          galleryMarkup(
            cycle,
            photos,
            readonly,
          );

        showToast(
          'Foto removida.',
          {
            type: 'success',
          },
        );
      } catch (error) {
        console.error(
          'Erro ao remover foto:',
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

        deleteButton.disabled =
          false;
      }
    };

  galleryRoot.addEventListener(
    'click',
    handlePhotoClick,
  );

  return () => {
    galleryRoot.removeEventListener(
      'click',
      handlePhotoClick,
    );
  };
}
