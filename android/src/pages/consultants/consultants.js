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
  listConsultants,
  restoreConsultant,
} from '../../services/consultantService.js';

import {
  consultantCard,
} from './consultantView.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  showConfirmModal,
} from '../../components/confirmModal.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

export async function renderConsultantsPage({
  session,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  app.innerHTML =
    appShell({
      session,
      title: 'Consultores',
      eyebrow: 'Rede de apoio',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Consultores agrícolas
            </p>

            <h2>
              Contatos e suporte técnico
            </h2>

            <p>
              Cadastre consultores e abra conversas no WhatsApp sempre por ação explícita do usuário.
            </p>
          </div>

          <a
            href="/more/consultants/new"
            class="icon-button"
            aria-label="Cadastrar consultor"
            data-link
          >
            ${icon('plus')}
          </a>
        </section>

        <section class="consultant-toolbar">
          <div class="crop-search">
            ${icon('search')}

            <input
              id="consultant-search"
              type="search"
              placeholder="Buscar nome, empresa ou especialidade..."
              autocomplete="off"
            />
          </div>

          <div
            class="segmented-control"
            role="tablist"
            aria-label="Situação dos consultores"
          >
            <button
              class="
                segmented-control__button
                segmented-control__button--active
              "
              type="button"
              data-consultant-filter="active"
              aria-selected="true"
            >
              Ativos
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-consultant-filter="inactive"
              aria-selected="false"
            >
              Inativos
            </button>

            <button
              class="segmented-control__button"
              type="button"
              data-consultant-filter="archived"
              aria-selected="false"
            >
              Arquivados
            </button>
          </div>
        </section>

        <div class="season-list-actions">
          <a
            href="/more/consultants/new"
            class="button button--primary button--compact"
            data-link
          >
            ${icon('plus')}
            Novo consultor
          </a>
        </div>

        <div id="consultants-content">
          ${loader({
            label:
              'Carregando consultores…',
          })}
        </div>
      `,
    });

  const content =
    document.querySelector(
      '#consultants-content',
    );

  const searchInput =
    document.querySelector(
      '#consultant-search',
    );

  const filterButtons =
    [
      ...document.querySelectorAll(
        '[data-consultant-filter]',
      ),
    ];

  let currentFilter =
    'active';

  let consultants = [];

  function filteredConsultants() {
    const term =
      searchInput.value
        .trim()
        .toLocaleLowerCase(
          'pt-BR',
        );

    return consultants.filter(
      (consultant) => {
        if (!term) {
          return true;
        }

        return [
          consultant.name,
          consultant.company,
          consultant.specialty,
          consultant.email,
          consultant.phone,
          consultant.whatsapp,
        ]
          .filter(Boolean)
          .some(
            (value) =>
              String(value)
                .toLocaleLowerCase(
                  'pt-BR',
                )
                .includes(term),
          );
      },
    );
  }

  function renderList() {
    const filtered =
      filteredConsultants();

    if (!filtered.length) {
      content.innerHTML =
        emptyState({
          iconName: 'users',
          title:
            currentFilter ===
              'active'
              ? 'Nenhum consultor ativo'
              : 'Nenhum consultor encontrado',
          description:
            currentFilter ===
              'active'
              ? 'Cadastre um contato para ter acesso rápido ao WhatsApp quando precisar de suporte ou reposição.'
              : 'Altere o filtro ou a busca.',
          actionLabel:
            currentFilter ===
              'active'
              ? 'Cadastrar consultor'
              : null,
          actionHref:
            currentFilter ===
              'active'
              ? '/more/consultants/new'
              : null,
        });

      return;
    }

    content.innerHTML = `
      <section class="consultant-list">
        ${filtered
          .map(
            (consultant) =>
              consultantCard(
                consultant,
                {
                  archived:
                    currentFilter ===
                    'archived',
                },
              ),
          )
          .join('')}
      </section>
    `;
  }

  async function loadConsultants() {
    content.innerHTML =
      loader({
        label:
          'Carregando consultores…',
      });

    try {
      if (
        currentFilter ===
        'archived'
      ) {
        consultants =
          await listConsultants({
            archived: true,
          });
      } else {
        consultants =
          await listConsultants({
            active:
              currentFilter ===
              'active',
          });
      }

      renderList();
    } catch (error) {
      console.error(
        'Erro ao listar consultores:',
        error,
      );

      content.innerHTML =
        emptyState({
          iconName: 'users',
          title:
            'Não foi possível carregar',
          description:
            'Verifique sua conexão e tente novamente.',
        });

      showToast(
        getDataErrorMessage(
          error,
        ),
        {
          type: 'error',
        },
      );
    }
  }

  const handleFilter =
    (event) => {
      const button =
        event.target.closest(
          '[data-consultant-filter]',
        );

      if (!button) {
        return;
      }

      currentFilter =
        button.dataset
          .consultantFilter;

      filterButtons.forEach(
        (item) => {
          const active =
            item === button;

          item.classList.toggle(
            'segmented-control__button--active',
            active,
          );

          item.setAttribute(
            'aria-selected',
            String(active),
          );
        },
      );

      void loadConsultants();
    };

  const handleSearch =
    () => {
      renderList();
    };

  filterButtons.forEach(
    (button) => {
      button.addEventListener(
        'click',
        handleFilter,
      );
    },
  );

  searchInput.addEventListener(
    'input',
    handleSearch,
  );

  await loadConsultants();

  return () => {
    filterButtons.forEach(
      (button) => {
        button.removeEventListener(
          'click',
          handleFilter,
        );
      },
    );

    searchInput.removeEventListener(
      'input',
      handleSearch,
    );
  };
}
