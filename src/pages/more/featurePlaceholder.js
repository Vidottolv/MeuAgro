import {
  appShell,
} from '../../components/appShell.js';
import {
  emptyState,
} from '../../components/emptyState.js';

export function renderFeaturePlaceholder({
  session,
  title,
  description,
  iconName,
  stage,
}) {
  const app =
    document.querySelector('#app');

  app.innerHTML =
    appShell({
      session,
      title,
      eyebrow: 'Mais',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              ${title}
            </p>

            <h2>
              Estrutura preparada
            </h2>

            <p>
              ${description}
            </p>
          </div>
        </section>

        ${emptyState({
          iconName,
          title: `${title} ainda não está conectado aos dados`,
          description:
            'A navegação já está pronta para receber este módulo sem precisarmos refazer o layout principal.',
        })}

        ${
          stage
            ? `
              <span class="feature-stage-badge">
                Planejado para a Etapa ${stage}
              </span>
            `
            : ''
        }
      `,
    });

  return null;
}
