import {
  appShell,
} from '../../components/appShell.js';

import {
  emptyState,
} from '../../components/emptyState.js';

import {
  loader,
} from '../../components/loader.js';

import {
  icon,
} from '../../components/icons.js';

import {
  getAgriculturalInputById,
} from '../../services/agriculturalInputService.js';

import {
  listInventoryLots,
} from '../../services/inventoryLotService.js';

import {
  inventoryLotCard,
} from './lotView.js';

import {
  escapeHtml,
} from '../../js/html.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

export async function renderInventoryLotsPage({
  session,
  params,
}) {
  const app =
    document.querySelector('#app');

  let input = null;

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
        title: 'Lotes',
        eyebrow: 'Barracão',
        activeNav: 'inventory',
        content:
          emptyState({
            iconName: 'box',
            title:
              'Insumo não encontrado',
            description:
              'Não foi possível localizar o insumo deste lote.',
            actionLabel:
              'Voltar ao Barracão',
            actionHref:
              '/inventory',
          }),
      });

    return null;
  }

  app.innerHTML =
    appShell({
      session,
      title: 'Lotes de estoque',
      eyebrow: 'Barracão',
      activeNav: 'inventory',
      content: `
        <section class="page-heading">
          <div>
            <a
              href="/inventory/${input.id}"
              class="button button--ghost button--compact"
              data-link
            >
              ${icon('arrowLeft')}
              ${escapeHtml(input.name)}
            </a>

            <h2 style="margin-top: 10px;">
              Lotes de estoque
            </h2>

            <p>
              Cada compra é preservada em um lote próprio, com custo, fornecedor, validade e saldo individual.
            </p>
          </div>

          ${
            input.active
              ? `
                <a
                  href="/inventory/${input.id}/lots/new"
                  class="icon-button"
                  aria-label="Cadastrar lote"
                  data-link
                >
                  ${icon('plus')}
                </a>
              `
              : ''
          }
        </section>

        ${
          input.active
            ? `
              <div class="season-list-actions">
                <a
                  href="/inventory/${input.id}/lots/new"
                  class="button button--primary button--compact"
                  data-link
                >
                  ${icon('plus')}
                  Novo lote
                </a>
              </div>
            `
            : `
              <div class="input-stage-note">
                ${icon('info')}
                <div>
                  <strong>
                    Insumo inativo
                  </strong>
                  <span>
                    Reative o insumo antes de registrar uma nova compra. Os lotes existentes continuam disponíveis para consulta e movimentações de correção/saída.
                  </span>
                </div>
              </div>
            `
        }

        <div id="inventory-lots-content">
          ${loader({
            label:
              'Carregando lotes…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#inventory-lots-content',
    );

  try {
    const lots =
      await listInventoryLots({
        inputId: input.id,
      });

    if (!lots.length) {
      content.innerHTML =
        emptyState({
          iconName: 'box',
          title:
            'Nenhum lote registrado',
          description:
            'Cadastre uma compra para gerar automaticamente a primeira entrada de estoque deste insumo.',
          actionLabel:
            input.active
              ? 'Cadastrar lote'
              : null,
          actionHref:
            input.active
              ? `/inventory/${input.id}/lots/new`
              : null,
        });
    } else {
      content.innerHTML = `
        <section class="inventory-lot-list">
          ${lots
            .map(inventoryLotCard)
            .join('')}
        </section>
      `;
    }
  } catch (error) {
    console.error(
      'Erro ao listar lotes:',
      error,
    );

    content.innerHTML =
      emptyState({
        iconName: 'box',
        title:
          'Não foi possível carregar os lotes',
        description:
          'Verifique sua conexão e tente novamente.',
      });

    showToast(
      getDataErrorMessage(error),
      {
        type: 'error',
      },
    );
  }

  return null;
}
