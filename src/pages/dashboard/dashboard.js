import {
  appShell,
} from '../../components/appShell.js';

import {
  icon,
} from '../../components/icons.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  escapeHtml,
  formatDatePtBr,
  formatNumberPtBr,
} from '../../js/html.js';

import {
  getCycleMetrics,
} from '../../js/cycleMetrics.js';

import {
  emptyDashboardSummary,
  getDashboardSummary,
  listLowStockInputs,
  listNearHarvestCycles,
  listRecentActivities,
} from '../../services/dashboardService.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

function firstName(session) {
  const name =
    session?.user?.user_metadata
      ?.full_name?.trim();

  if (name) {
    return name
      .split(/\s+/)[0];
  }

  return (
    session?.user?.email
      ?.split('@')[0] ||
    'produtor'
  );
}

function plural(
  value,
  singular,
  pluralValue,
) {
  return value === 1
    ? singular
    : pluralValue;
}

function dashboardHero(summary) {
  if (
    summary.properties_count === 0
  ) {
    return {
      eyebrow:
        'Seu campo começa aqui',
      title:
        'Cadastre sua primeira propriedade.',
      description:
        'Depois dela, você poderá organizar áreas, safras, culturas e ciclos produtivos.',
      href:
        '/properties/new',
      action:
        'Cadastrar propriedade',
      iconName:
        'plus',
    };
  }

  if (
    summary.near_harvest_count > 0
  ) {
    return {
      eyebrow:
        'Atenção à produção',
      title:
        `${summary.near_harvest_count} ${plural(
          summary.near_harvest_count,
          'ciclo está',
          'ciclos estão',
        )} próximo${
          summary.near_harvest_count === 1
            ? ''
            : 's'
        } da colheita.`,
      description:
        'Confira as previsões dos próximos 7 dias e atualize o andamento dos plantios quando necessário.',
      href:
        '/plantings?open=1',
      action:
        'Acompanhar plantios',
      iconName:
        'harvest',
    };
  }

  if (
    summary.active_cycles_count > 0
  ) {
    return {
      eyebrow:
        'Produção em andamento',
      title:
        `${summary.active_cycles_count} ${plural(
          summary.active_cycles_count,
          'ciclo produtivo ativo',
          'ciclos produtivos ativos',
        )}.`,
      description:
        'Acompanhe o tempo de cultivo, as previsões de colheita e os próximos registros da produção.',
      href:
        '/plantings?open=1',
      action:
        'Ver ciclos ativos',
      iconName:
        'sprout',
    };
  }

  if (
    summary.active_areas_count > 0
  ) {
    return {
      eyebrow:
        'Estrutura pronta',
      title:
        'Registre o próximo plantio.',
      description:
        'Você já possui áreas cadastradas. Agora escolha uma cultura e inicie um novo ciclo produtivo.',
      href:
        '/plantings/new',
      action:
        'Novo plantio',
      iconName:
        'sprout',
    };
  }

  return {
    eyebrow:
      'Próximo passo',
    title:
      'Cadastre as áreas da propriedade.',
    description:
      'Talhões, hortas, piquetes e outros espaços serão usados para organizar os futuros plantios.',
    href:
      '/properties',
    action:
      'Ver propriedades',
    iconName:
      'layers',
  };
}

function metricCard({
  iconName,
  value,
  label,
  description,
  href,
  tone = 'default',
}) {
  const content = `
    <span
      class="dashboard-metric__icon dashboard-metric__icon--${tone}"
    >
      ${icon(iconName)}
    </span>

    <span class="dashboard-metric__value">
      ${value}
    </span>

    <span class="dashboard-metric__label">
      ${label}
    </span>

    <span class="dashboard-metric__description">
      ${description}
    </span>
  `;

  if (!href) {
    return `
      <article class="dashboard-metric">
        ${content}
      </article>
    `;
  }

  return `
    <a
      href="${href}"
      class="dashboard-metric dashboard-metric--link"
      data-link
    >
      ${content}
    </a>
  `;
}

function summaryMarkup(summary) {
  return `
    ${metricCard({
      iconName: 'map',
      value: summary.properties_count,
      label: 'Propriedades',
      description: 'ativas',
      href: '/properties',
    })}

    ${metricCard({
      iconName: 'layers',
      value: summary.active_areas_count,
      label: 'Áreas ativas',
      description: 'em suas propriedades',
      href: '/properties',
    })}

    ${metricCard({
      iconName: 'sprout',
      value: summary.active_cycles_count,
      label: 'Ciclos ativos',
      description: 'em produção',
      href: '/plantings?open=1',
      tone: 'success',
    })}

    ${metricCard({
      iconName: 'harvest',
      value: summary.near_harvest_count,
      label: 'Próximos da colheita',
      description: 'nos próximos 7 dias',
      href: '/more/harvest-forecast?filter=harvest_week',
      tone:
        summary.near_harvest_count > 0
          ? 'warning'
          : 'default',
    })}

    ${metricCard({
      iconName: 'box',
      value: summary.low_stock_count,
      label: 'Estoque baixo',
      description: 'itens em atenção',
      href: '/inventory',
      tone:
        summary.low_stock_count > 0
          ? 'danger'
          : 'default',
    })}

    ${metricCard({
      iconName: 'calendar',
      value: summary.month_harvests_count,
      label: 'Colheitas do mês',
      description: 'registros no período',
      href: '/more/harvests',
    })}
  `;
}

function nearHarvestMarkup(cycles) {
  if (!cycles.length) {
    return `
      <div class="dashboard-empty-inline">
        <span class="dashboard-empty-inline__icon">
          ${icon('harvest')}
        </span>

        <div>
          <strong>
            Nenhuma colheita prevista para os próximos 7 dias
          </strong>

          <span>
            Quando um ciclo entrar nessa janela ele aparecerá aqui automaticamente.
          </span>
        </div>
      </div>
    `;
  }

  return `
    <div class="dashboard-attention-list">
      ${cycles
        .map(
          (cycle) => {
            const metrics =
              getCycleMetrics(
                cycle,
              );

            const title =
              cycle.crop?.name ||
              'Cultura';

            const variety =
              cycle.variety
                ? ` • ${cycle.variety}`
                : '';

            return `
              <a
                href="/plantings/${cycle.id}"
                class="dashboard-attention-row"
                data-link
              >
                <span class="dashboard-attention-row__icon dashboard-attention-row__icon--harvest">
                  ${icon('harvest')}
                </span>

                <span class="dashboard-attention-row__content">
                  <strong>
                    ${escapeHtml(
                      `${title}${variety}`,
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                      cycle.area?.name ||
                      cycle.property?.name ||
                      'Área não informada',
                    )}
                  </span>

                  <small>
                    ${escapeHtml(
                      metrics.forecastText,
                    )}
                    • ${formatDatePtBr(
                      cycle.current_harvest_forecast,
                    )}
                  </small>
                </span>

                ${icon('chevronRight')}
              </a>
            `;
          },
        )
        .join('')}
    </div>
  `;
}

function lowStockMarkup(items) {
  if (!items.length) {
    return `
      <div class="dashboard-empty-inline">
        <span class="dashboard-empty-inline__icon">
          ${icon('box')}
        </span>

        <div>
          <strong>
            Nenhum item com estoque baixo
          </strong>

          <span>
            Alertas do Barracão aparecerão aqui quando houver itens abaixo do estoque mínimo.
          </span>
        </div>
      </div>
    `;
  }

  return `
    <div class="dashboard-attention-list">
      ${items
        .map(
          (item) => {
            const out =
              item.stock_status ===
              'out_of_stock';

            return `
              <a
                href="/inventory"
                class="dashboard-attention-row"
                data-link
              >
                <span class="dashboard-attention-row__icon dashboard-attention-row__icon--${
                  out
                    ? 'danger'
                    : 'warning'
                }">
                  ${icon('box')}
                </span>

                <span class="dashboard-attention-row__content">
                  <strong>
                    ${escapeHtml(
                      item.name,
                    )}
                  </strong>

                  <span>
                    ${
                      out
                        ? 'Sem estoque disponível'
                        : 'Estoque baixo'
                    }
                  </span>

                  <small>
                    ${formatNumberPtBr(
                      item.current_quantity,
                    )} ${escapeHtml(
                      item.base_unit ||
                      '',
                    )} restantes
                  </small>
                </span>

                ${icon('chevronRight')}
              </a>
            `;
          },
        )
        .join('')}
    </div>
  `;
}

function activityRelativeLabel(value) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '';
  }

  const today =
    new Date();

  const normalizedToday =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
    );

  const normalizedDate =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
    );

  const difference =
    Math.round(
      (
        normalizedToday.getTime() -
        normalizedDate.getTime()
      ) /
      (24 * 60 * 60 * 1000),
    );

  if (difference === 0) {
    return 'Hoje';
  }

  if (difference === 1) {
    return 'Ontem';
  }

  if (
    difference > 1 &&
    difference <= 7
  ) {
    return `Há ${difference} dias`;
  }

  return formatDatePtBr(value);
}

function activityMarkup(activities) {
  if (!activities.length) {
    return `
      <div class="dashboard-empty-inline dashboard-empty-inline--wide">
        <span class="dashboard-empty-inline__icon">
          ${icon('clipboard')}
        </span>

        <div>
          <strong>
            Ainda não há atividades recentes
          </strong>

          <span>
            Eventos dos plantios e, futuramente, colheitas aparecerão nesta linha do tempo.
          </span>
        </div>
      </div>
    `;
  }

  return `
    <div class="dashboard-activity-list">
      ${activities
        .map(
          (activity) => `
            <a
              href="${activity.href}"
              class="dashboard-activity"
              data-link
            >
              <span class="dashboard-activity__timeline">
                <span class="dashboard-activity__icon">
                  ${icon(
                    activity.iconName,
                  )}
                </span>
              </span>

              <span class="dashboard-activity__content">
                <span class="dashboard-activity__header">
                  <strong>
                    ${escapeHtml(
                      activity.title,
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      activityRelativeLabel(
                        activity.occurredAt,
                      ),
                    )}
                  </small>
                </span>

                ${
                  activity.detail
                    ? `
                      <span>
                        ${escapeHtml(
                          activity.detail,
                        )}
                      </span>
                    `
                    : ''
                }
              </span>

              ${icon('chevronRight')}
            </a>
          `,
        )
        .join('')}
    </div>
  `;
}

function quickActionsMarkup(summary) {
  return `
    <a
      href="/properties"
      class="dashboard-quick-action"
      data-link
    >
      <span>
        ${icon('map')}
      </span>

      <strong>Propriedades</strong>
      <small>
        ${summary.properties_count} ativas
      </small>
    </a>

    <a
      href="/plantings/new"
      class="dashboard-quick-action"
      data-link
    >
      <span>
        ${icon('plus')}
      </span>

      <strong>Novo plantio</strong>
      <small>Registrar ciclo</small>
    </a>

    <a
      href="/more/crops"
      class="dashboard-quick-action"
      data-link
    >
      <span>
        ${icon('leaf')}
      </span>

      <strong>Culturas</strong>
      <small>Catálogo produtivo</small>
    </a>

    <a
      href="/inventory"
      class="dashboard-quick-action"
      data-link
    >
      <span>
        ${icon('box')}
      </span>

      <strong>Barracão</strong>
      <small>
        ${summary.low_stock_count} alertas
      </small>
    </a>
  `;
}

export async function renderDashboardPage({
  session,
}) {
  const app =
    document.querySelector('#app');

  const name =
    firstName(session);

  app.innerHTML =
    appShell({
      session,
      title: `Olá, ${name}`,
      eyebrow: 'Meu Agro',
      activeNav: 'home',
      content: `
        <section class="dashboard-loading-card">
          <span class="dashboard-loading-card__pulse"></span>

          <div>
            <strong>
              Atualizando sua visão geral…
            </strong>
            <span>
              Consultando propriedades, plantios e alertas.
            </span>
          </div>
        </section>
      `,
    });

  const [
    summaryResult,
    nearHarvestResult,
    lowStockResult,
    activitiesResult,
  ] =
    await Promise.allSettled([
      getDashboardSummary(),
      listNearHarvestCycles(),
      listLowStockInputs(),
      listRecentActivities(),
    ]);

  const summary =
    summaryResult.status ===
    'fulfilled'
      ? summaryResult.value
      : emptyDashboardSummary();

  const nearHarvest =
    nearHarvestResult.status ===
    'fulfilled'
      ? nearHarvestResult.value
      : [];

  const lowStock =
    lowStockResult.status ===
    'fulfilled'
      ? lowStockResult.value
      : [];

  const activities =
    activitiesResult.status ===
    'fulfilled'
      ? activitiesResult.value
      : [];

  const failedResults = [
    summaryResult,
    nearHarvestResult,
    lowStockResult,
    activitiesResult,
  ].filter(
    (result) =>
      result.status ===
      'rejected',
  );

  if (
    summaryResult.status ===
    'rejected'
  ) {
    console.error(
      'Erro ao carregar resumo do dashboard:',
      summaryResult.reason,
    );

    showToast(
      getDataErrorMessage(
        summaryResult.reason,
      ),
      {
        type: 'error',
      },
    );
  } else if (
    failedResults.length > 0
  ) {
    console.warn(
      'Algumas informações complementares do dashboard não puderam ser carregadas.',
      failedResults,
    );
  }

  const hero =
    dashboardHero(summary);

  app.innerHTML =
    appShell({
      session,
      title: `Olá, ${name}`,
      eyebrow: 'Meu Agro',
      activeNav: 'home',
      content: `
        <section class="dashboard-hero">
          <div class="dashboard-hero__content">
            <p class="dashboard-hero__eyebrow">
              ${escapeHtml(
                hero.eyebrow,
              )}
            </p>

            <h2>
              ${escapeHtml(
                hero.title,
              )}
            </h2>

            <p>
              ${escapeHtml(
                hero.description,
              )}
            </p>

            <a
              href="${hero.href}"
              class="button dashboard-hero__button"
              data-link
            >
              ${icon(hero.iconName)}
              ${escapeHtml(
                hero.action,
              )}
            </a>
          </div>

          <span class="dashboard-hero__visual">
            ${icon('sprout')}
          </span>
        </section>

        <div class="dashboard-section-heading">
          <div>
            <p class="section-eyebrow">
              Visão geral
            </p>
            <h2>Indicadores da produção</h2>
          </div>
        </div>

        <section
          class="dashboard-metrics"
          aria-label="Indicadores da produção"
        >
          ${summaryMarkup(summary)}
        </section>

        <div class="dashboard-section-heading dashboard-section-heading--with-link">
          <div>
            <p class="section-eyebrow">
              Prioridades
            </p>
            <h2>Atenção agora</h2>
          </div>

          <a
            href="/more/harvest-forecast"
            data-link
          >
            Ver previsões
          </a>
        </div>

        <section class="dashboard-attention-grid">
          <article class="dashboard-panel">
            <div class="dashboard-panel__header">
              <div>
                <span class="dashboard-panel__icon dashboard-panel__icon--harvest">
                  ${icon('harvest')}
                </span>

                <div>
                  <h3>
                    Próximos da colheita
                  </h3>
                  <p>
                    Janela dos próximos 7 dias
                  </p>
                </div>
              </div>

              <strong class="dashboard-panel__count">
                ${summary.near_harvest_count}
              </strong>
            </div>

            ${nearHarvestMarkup(
              nearHarvest,
            )}
          </article>

          <article class="dashboard-panel">
            <div class="dashboard-panel__header">
              <div>
                <span class="dashboard-panel__icon dashboard-panel__icon--stock">
                  ${icon('box')}
                </span>

                <div>
                  <h3>
                    Estoque em atenção
                  </h3>
                  <p>
                    Abaixo do mínimo ou esgotado
                  </p>
                </div>
              </div>

              <strong class="dashboard-panel__count">
                ${summary.low_stock_count}
              </strong>
            </div>

            ${lowStockMarkup(
              lowStock,
            )}
          </article>
        </section>

        <div class="dashboard-section-heading">
          <div>
            <p class="section-eyebrow">
              Atalhos
            </p>
            <h2>Acesso rápido</h2>
          </div>
        </div>

        <section class="dashboard-quick-actions">
          ${quickActionsMarkup(
            summary,
          )}
        </section>

        <div class="dashboard-section-heading dashboard-section-heading--with-link">
          <div>
            <p class="section-eyebrow">
              Histórico
            </p>
            <h2>Atividades recentes</h2>
          </div>

          <a
            href="/plantings"
            data-link
          >
            Ver plantios
          </a>
        </div>

        <section class="dashboard-panel dashboard-panel--activity">
          ${activityMarkup(
            activities,
          )}
        </section>
      `,
    });

  return null;
}
