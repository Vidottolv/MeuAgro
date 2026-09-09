import {
  appShell,
} from '../../components/appShell.js';
import {
  emptyState,
} from '../../components/emptyState.js';
import {
  icon,
} from '../../components/icons.js';

export function renderInventoryPage({
  session,
}) {
  const app =
    document.querySelector('#app');

  app.innerHTML =
    appShell({
      session,
      title: 'Barracão',
      eyebrow: 'Estoque',
      activeNav: 'inventory',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Barracão
            </p>

            <h2>
              Insumos e estoque
            </h2>

            <p>
              Entradas, lotes, consumo em plantios e alertas de estoque baixo ficarão concentrados aqui.
            </p>
          </div>

          <button
            class="icon-button"
            type="button"
            disabled
            aria-label="Cadastrar insumo em breve"
          >
            ${icon('plus')}
          </button>
        </section>

        ${emptyState({
          iconName: 'box',
          title: 'O módulo de estoque já tem seu espaço',
          description:
            'A estrutura do banco já registra lotes e movimentações. As telas serão ligadas ao Supabase nas etapas de insumos e estoque.',
        })}

        <span class="feature-stage-badge">
          Etapas 13 a 16
        </span>
      `,
    });

  return null;
}
