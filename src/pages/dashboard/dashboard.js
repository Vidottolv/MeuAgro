import {
  appShell,
} from '../../components/appShell.js';
import {
  icon,
} from '../../components/icons.js';
import {
  countActiveProperties,
} from '../../services/propertyService.js';

import {
  countActiveAreas,
} from '../../services/areaService.js';

import {
  countOpenSeasons,
} from '../../services/seasonService.js';

import {
  countOpenProductionCycles,
} from '../../services/productionCycleService.js';

function firstName(session) {
  const name =
    session?.user?.user_metadata
      ?.full_name?.trim();

  if (name) {
    return name.split(/\s+/)[0];
  }

  return (
    session?.user?.email
      ?.split('@')[0] ||
    'produtor'
  );
}

export async function renderDashboardPage({
  session,
}) {
  const app =
    document.querySelector('#app');

  const name =
    firstName(session);

  let propertyCount = 0;
  let areaCount = 0;
  let openSeasonCount = 0;
  let openCycleCount = 0;

  try {
    [
      propertyCount,
      areaCount,
      openSeasonCount,
      openCycleCount,
    ] = await Promise.all([
      countActiveProperties(),
      countActiveAreas(),
      countOpenSeasons(),
      countOpenProductionCycles(),
    ]);
  } catch (error) {
    console.error(
      'Erro ao carregar indicadores:',
      error,
    );
  }

  app.innerHTML =
    appShell({
      session,
      title: `Olá, ${name}`,
      eyebrow: 'Meu Agro',
      activeNav: 'home',
      content: `
        <section class="hero-card">
          <p class="hero-card__eyebrow">
            Sua propriedade em um só lugar
          </p>

          <h2>
            ${
              propertyCount > 0
                ? 'Continue organizando sua produção.'
                : 'Cadastre sua primeira propriedade.'
            }
          </h2>

          <p>
            ${
              propertyCount > 0
                ? `Você possui ${propertyCount} ${
                    propertyCount === 1
                      ? 'propriedade ativa'
                      : 'propriedades ativas'
                  } no Meu Agro.`
                : 'A propriedade é o ponto de partida para cadastrar áreas, safras e plantios.'
            }
          </p>

          <div class="hero-card__actions">
            <a
              href="${
                propertyCount > 0
                  ? '/properties'
                  : '/properties/new'
              }"
              class="button button--secondary"
              data-link
            >
              ${
                propertyCount > 0
                  ? icon('map')
                  : icon('plus')
              }

              ${
                propertyCount > 0
                  ? 'Ver propriedades'
                  : 'Cadastrar propriedade'
              }
            </a>
          </div>
        </section>

        <div class="section-heading">
          <h2>Acesso rápido</h2>
        </div>

        <section
          class="quick-actions"
          aria-label="Acesso rápido"
        >
          <a
            href="/properties"
            class="quick-action"
            data-link
          >
            <span class="quick-action__icon">
              ${icon('map')}
            </span>

            <span class="quick-action__content">
              <strong>
                ${
                  propertyCount
                } ${
                  propertyCount === 1
                    ? 'propriedade'
                    : 'propriedades'
                }
              </strong>

              <span>
                Sítios e fazendas
              </span>
            </span>
          </a>

          <a
            href="/plantings"
            class="quick-action"
            data-link
          >
            <span class="quick-action__icon">
              ${icon('sprout')}
            </span>

            <span class="quick-action__content">
              <strong>
                ${openCycleCount} ${
                  openCycleCount === 1
                    ? 'plantio em aberto'
                    : 'plantios em aberto'
                }
              </strong>
              <span>Ciclos produtivos</span>
            </span>
          </a>

          <a
            href="/inventory"
            class="quick-action"
            data-link
          >
            <span class="quick-action__icon">
              ${icon('box')}
            </span>

            <span class="quick-action__content">
              <strong>Barracão</strong>
              <span>Insumos e estoque</span>
            </span>
          </a>

          <a
            href="/more/harvests"
            class="quick-action"
            data-link
          >
            <span class="quick-action__icon">
              ${icon('harvest')}
            </span>

            <span class="quick-action__content">
              <strong>Colheitas</strong>
              <span>Histórico produtivo</span>
            </span>
          </a>
        </section>

        <div class="section-heading">
          <h2>Próximas atividades</h2>
        </div>

        <section class="activity-placeholder">
          <div class="activity-row">
            <span class="activity-row__dot"></span>

            <div class="activity-row__content">
              <strong>
                ${
                  propertyCount > 0 &&
                  areaCount === 0
                    ? 'Próximo passo: cadastrar as áreas'
                    : areaCount > 0 &&
                      openCycleCount === 0
                      ? 'Registre o primeiro plantio'
                      : openCycleCount > 0
                        ? `${openCycleCount} ${
                            openCycleCount === 1
                              ? 'plantio em aberto'
                              : 'plantios em aberto'
                          }`
                        : 'Comece pela sua propriedade'
                }
              </strong>

              <span>
                ${
                  propertyCount > 0 &&
                  areaCount === 0
                    ? 'Abra uma propriedade e cadastre talhões, hortas, piquetes ou outros espaços.'
                    : areaCount > 0 &&
                      openCycleCount === 0
                      ? 'Escolha uma área e cultura para criar um ciclo produtivo. A safra é opcional.'
                      : openCycleCount > 0
                        ? 'Acompanhe dias decorridos e previsões de colheita pela tela de Plantios.'
                        : 'Depois dela, você poderá organizar talhões, hortas, piquetes e outros espaços.'
                }
              </span>
            </div>
          </div>
        </section>
      `,
    });

  return null;
}
