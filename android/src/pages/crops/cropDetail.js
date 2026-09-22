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
  getCropById,
  setCropActive,
} from '../../services/cropService.js';

import {
  countOpenCyclesByCrop,
} from '../../services/productionCycleService.js';

import {
  cropCycleLabel,
} from './cropView.js';

import {
  escapeHtml,
  formatDatePtBr,
} from '../../js/html.js';

import {
  showConfirmModal,
} from '../../components/confirmModal.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

import {
  navigate,
} from '../../js/router.js';

export async function renderCropDetailPage({
  session,
  params,
}) {
  const app =
    document.querySelector('#app');

  let crop = null;
  let openCycleCount = 0;

  try {
    crop =
      await getCropById(
        params.cropId,
      );

    if (crop) {
      openCycleCount =
        await countOpenCyclesByCrop(
          crop.id,
        );
    }
  } catch (error) {
    console.error(
      'Erro ao carregar cultura:',
      error,
    );
  }

  if (!crop) {
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
              'Cultura não encontrada',
            description:
              'Este registro não existe ou não está disponível para sua conta.',
            actionLabel:
              'Voltar para culturas',
            actionHref:
              '/more/crops',
          }),
      });

    return null;
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Cultura',
      eyebrow: 'Produção',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/more/crops"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              Culturas
            </a>
          </div>
        </section>

        <section class="crop-detail-hero">
          <div class="crop-detail-hero__top">
            <div>
              <p class="hero-card__eyebrow">
                ${escapeHtml(
                  crop.category ||
                  'Cultura',
                )}
              </p>

              <h2>
                ${escapeHtml(
                  crop.name,
                )}
              </h2>

              <p>
                ${escapeHtml(
                  cropCycleLabel(crop),
                )}
              </p>
            </div>

            <span
              class="
                crop-active-badge
                ${
                  crop.active
                    ? 'crop-active-badge--active'
                    : 'crop-active-badge--inactive'
                }
              "
            >
              ${
                crop.active
                  ? 'Ativa'
                  : 'Inativa'
              }
            </span>
          </div>

          ${
            crop.is_system
              ? `
                <div class="crop-readonly-note">
                  ${icon('lock')}
                  Cultura padrão do Meu Agro. Somente leitura.
                </div>
              `
              : `
                <div class="property-detail-actions">
                  <a
                    href="/more/crops/${crop.id}/edit"
                    class="button button--secondary"
                    data-link
                  >
                    ${icon('edit')}
                    Editar
                  </a>

                  <button
                    id="toggle-crop-active"
                    class="
                      button
                      ${
                        crop.active
                          ? 'button--danger'
                          : 'button--secondary'
                      }
                    "
                    type="button"
                  >
                    ${
                      crop.active
                        ? icon('archive')
                        : icon('refresh')
                    }

                    ${
                      crop.active
                        ? 'Desativar'
                        : 'Reativar'
                    }
                  </button>
                </div>
              `
          }
        </section>

        <section class="detail-grid">
          <article class="detail-card">
            <p class="detail-card__label">
              Origem
            </p>
            <p class="detail-card__value">
              ${
                crop.is_system
                  ? 'Padrão do Meu Agro'
                  : 'Personalizada'
              }
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Categoria
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                crop.category ||
                'Não informada',
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Ciclo médio
            </p>
            <p class="detail-card__value">
              ${escapeHtml(
                cropCycleLabel(crop),
              )}
            </p>
          </article>

          <article class="detail-card">
            <p class="detail-card__label">
              Ciclos em aberto
            </p>
            <p class="detail-card__value">
              ${openCycleCount}
            </p>
          </article>
        </section>

        <article class="detail-card">
          <p class="detail-card__label">
            Observações
          </p>
          <p class="detail-card__value detail-card__value--soft">
            ${escapeHtml(
              crop.notes ||
              'Nenhuma observação informada.',
            )}
          </p>
        </article>

        <article
          class="detail-card"
          style="margin-top: 12px;"
        >
          <p class="detail-card__label">
            Última atualização
          </p>
          <p class="detail-card__value">
            ${formatDatePtBr(
              crop.updated_at,
            )}
          </p>
        </article>

        <a
          href="/plantings?crop=${crop.id}"
          class="button button--secondary button--full"
          style="margin-top: 16px;"
          data-link
        >
          ${icon('sprout')}
          Ver plantios desta cultura
        </a>
      `,
    });

  const toggleButton =
    document.querySelector(
      '#toggle-crop-active',
    );

  const handleToggle =
    async () => {
      const nextActive =
        !crop.active;

      let message =
        nextActive
          ? 'A cultura voltará a aparecer no cadastro de novos plantios.'
          : 'A cultura deixará de aparecer no cadastro de novos plantios. O histórico existente será preservado.';

      if (
        !nextActive &&
        openCycleCount > 0
      ) {
        message =
          `${message} Existem ${openCycleCount} ${
            openCycleCount === 1
              ? 'ciclo em aberto usando esta cultura.'
              : 'ciclos em aberto usando esta cultura.'
          }`;
      }

      const confirmed =
        await showConfirmModal({
          title:
            nextActive
              ? 'Reativar cultura?'
              : 'Desativar cultura?',
          message,
          confirmLabel:
            nextActive
              ? 'Reativar'
              : 'Desativar',
          danger:
            !nextActive,
        });

      if (!confirmed) return;

      toggleButton.disabled = true;

      try {
        await setCropActive(
          crop.id,
          nextActive,
        );

        showToast(
          nextActive
            ? 'Cultura reativada.'
            : 'Cultura desativada.',
          {
            type: 'success',
          },
        );

        navigate(
          `/more/crops/${crop.id}`,
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          'Erro ao alterar cultura:',
          error,
        );

        showToast(
          getDataErrorMessage(error),
          {
            type: 'error',
          },
        );

        toggleButton.disabled = false;
      }
    };

  toggleButton?.addEventListener(
    'click',
    handleToggle,
  );

  return () => {
    toggleButton?.removeEventListener(
      'click',
      handleToggle,
    );
  };
}
