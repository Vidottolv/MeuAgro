<script setup lang="ts">
import { computed, ref, watch, onScopeDispose } from 'vue';
import { useOffline } from '../../offline/useOffline.js';
import { workspaceRpc } from '../../services/workspaceService.js';
const platformAdmin = ref(false);
const { status } = useOffline();
let accessRevision = 0;
watch(
  [() => status.value.user, () => status.value.online],
  async () => {
    const token = ++accessRevision;
    platformAdmin.value = false;
    if (!status.value.user || !status.value.online) return;
    try {
      const allowed = await workspaceRpc('app_is_platform_admin');
      if (token === accessRevision) platformAdmin.value = allowed === true;
    } catch {
      /* Banco anterior ou conta sem permissão: não exibir atalho. */
    }
  },
  { immediate: true },
);
onScopeDispose(() => {
  accessRevision++;
});
const groups = [
  {
    id: 'campo',
    title: 'Rotina de campo',
    description: 'Visitas, tarefas e acompanhamento dos talhões.',
    items: [
      {
        title: 'Visitas técnicas',
        description: 'Anamnese, acompanhamento e fotos de campo',
        href: '/more/visits',
      },
      {
        title: 'Agenda e tarefas técnicas',
        description: 'Responsáveis, prazos e acompanhamento das visitas',
        href: '/more/tasks',
      },
      {
        title: 'Mapas e satélite',
        description: 'Contornos de sítios e talhões e preparação do monitoramento',
        href: '/more/satellite',
      },
      {
        title: 'Clima e chuva',
        description: 'Previsão regional e medições na propriedade',
        href: '/more/weather',
      },
    ],
  },
  {
    id: 'producao',
    title: 'Produção e planejamento',
    description: 'Organize os ciclos e acompanhe a safra.',
    items: [
      {
        title: 'Safras',
        description: 'Agrupe ciclos produtivos',
        href: '/more/seasons',
      },
      {
        title: 'Culturas',
        description: 'Ciclos médios e variedades',
        href: '/more/crops',
      },
      {
        title: 'Planejamento da safra',
        description: 'Orçamento e comparação com custos realizados',
        href: '/more/budgets',
      },
      {
        title: 'Previsão de colheita',
        description: 'Atrasos, semana da colheita e lembretes',
        href: '/more/harvest-forecast',
      },
      {
        title: 'Colheitas',
        description: 'Registros e produtividade',
        href: '/more/harvests',
      },
      {
        title: 'Conferência agrícola',
        description: 'Plantios, colheitas, vendas e custos registrados',
        href: '/more/farm-workflow',
      },
    ],
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    description: 'Consulte resultados, pagamentos e recebimentos.',
    items: [
      {
        title: 'Financeiro',
        description: 'Insumos, receitas e resultado por ciclo',
        href: '/more/finance',
      },
      {
        title: 'Contas a receber',
        description: 'Vencimentos e recebimentos parciais',
        href: '/more/receivables',
      },
      {
        title: 'Despesas operacionais',
        description: 'Vencimentos, pagamentos parciais e saldo em aberto',
        href: '/more/expenses',
      },
      {
        title: 'Fluxo de caixa registrado',
        description: 'Entradas e saídas por data de pagamento',
        href: '/more/cashflow',
      },
    ],
  },
  {
    id: 'comercial',
    title: 'Compras e vendas',
    description: 'Negocie e planeje a reposição de insumos.',
    items: [
      {
        title: 'Minhas compras',
        description: 'Consultores, produtos e orçamentos',
        href: '/compras',
      },
      {
        title: 'Vendas',
        description: 'Destino e comercialização',
        href: '/more/sales',
      },
      {
        title: 'Reposição planejada',
        description: 'Saldo, consumo previsto e pedidos a receber',
        href: '/more/procurement',
      },
    ],
  },
  {
    id: 'equipe',
    title: 'Equipe e consultoria',
    description: 'Gerencie sua atuação e os acessos da equipe.',
    items: [
      {
        title: 'Meu espaço de consultor',
        description: 'Atuação própria, empresas e representantes',
        href: '/consultor',
      },
      {
        title: 'Gerentes e representantes',
        description: 'Administre a equipe da sua empresa',
        href: '/consultor/equipe',
      },
      {
        title: 'Compartilhamento técnico',
        description: 'Convites e acompanhamento autorizado por propriedade',
        href: '/more/sharing',
      },
      {
        title: 'Consultores',
        description: 'Contatos, especialidades e WhatsApp',
        href: '/more/consultants',
      },
    ],
  },
  {
    id: 'conta',
    title: 'Conta e suporte',
    description: 'Plano, preferências e cuidado com seus dados.',
    items: [
      {
        title: 'Começar e gerenciar plano',
        description: 'Roteiro por perfil, importação e utilização da conta',
        href: '/more/account-plan',
      },
      {
        title: 'Configurações',
        description: 'Lembretes de colheita e notificações',
        href: '/more/settings',
      },
      {
        title: 'Perfil',
        description: 'Sua conta e sessão',
        href: '/more/profile',
      },
      {
        title: 'Diagnóstico e privacidade',
        description: 'Recuperação de pendências e solicitações sobre seus dados',
        href: '/more/operations',
      },
    ],
  },
];
const selected = ref('campo');
const search = ref('');
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
const themedGroups = computed(() =>
  groups.map((group) => ({
    ...group,
    items:
      group.id === 'conta' && platformAdmin.value
        ? [
            ...group.items,
            {
              title: 'Administração do MeuAgro',
              description: 'Gestão da plataforma para administradores autorizados',
              href: '/more/platform-admin',
            },
          ]
        : group.items,
  })),
);
const visibleGroups = computed(() => {
  const term = normalize(search.value.trim());
  if (!term) return themedGroups.value.filter((group) => group.id === selected.value);
  return themedGroups.value
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        normalize(item.title + ' ' + item.description + ' ' + group.title).includes(term),
      ),
    }))
    .filter((group) => group.items.length);
});
function selectTheme(id: string) {
  selected.value = id;
  search.value = '';
}
</script>
<template>
  <div class="rural-vue management-hub">
    <header class="hub-header">
      <h2>Gestão e configurações</h2>
      <p>Escolha um tema ou encontre o que precisa pela busca.</p>
      <label class="hub-search" for="management-search"
        >Buscar recurso
        <input
          id="management-search"
          v-model="search"
          type="search"
          placeholder="Ex.: visitas, despesas ou equipe"
          autocomplete="off"
        />
      </label>
    </header>
    <div class="hub-layout">
      <aside class="hub-sidebar">
        <nav aria-label="Temas de gestão">
          <p class="hub-nav-title">Explorar por tema</p>
          <div class="hub-themes">
            <button
              v-for="group in themedGroups"
              :key="group.id"
              type="button"
              :aria-pressed="!search.trim() && selected === group.id"
              aria-controls="management-resources"
              @click="selectTheme(group.id)"
            >
              <span>{{ group.title }}</span
              ><span class="hub-count" aria-hidden="true">{{ group.items.length }}</span>
            </button>
          </div>
        </nav>
      </aside>
      <div id="management-resources" class="hub-content" aria-live="polite" aria-atomic="false">
        <p v-if="search.trim()" class="hub-search-status">
          {{ visibleGroups.reduce((total, group) => total + group.items.length, 0) }} recurso(s)
          encontrado(s)
        </p>
        <section
          v-for="group in visibleGroups"
          :key="group.id"
          class="hub-section"
          :aria-labelledby="'theme-' + group.id"
        >
          <header>
            <h3 :id="'theme-' + group.id">{{ group.title }}</h3>
            <p>{{ group.description }}</p>
          </header>
          <ul class="hub-links">
            <li v-for="item in group.items" :key="item.href">
              <a :href="item.href" data-link>
                <span
                  ><strong>{{ item.title }}</strong
                  ><span class="hub-description">{{ item.description }}</span></span
                >
                <span class="hub-arrow" aria-hidden="true">→</span>
              </a>
            </li>
          </ul>
        </section>
        <div v-if="!visibleGroups.length" class="rural-panel">
          <h3>Nenhum recurso encontrado</h3>
          <p>Tente outra palavra ou escolha um tema no menu.</p>
          <button type="button" class="button button--secondary" @click="search = ''">
            Limpar busca
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.hub-header {
  display: grid;
  gap: 12px;
}
.hub-search {
  display: grid;
  gap: 8px;
  max-width: 620px;
  font-weight: 600;
}
.hub-search input {
  font-weight: 400;
  font: inherit;
  min-height: 48px;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}
.hub-layout {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}
.hub-sidebar {
  position: sticky;
  top: 24px;
  min-width: 0;
}
.hub-nav-title {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.hub-themes {
  display: grid;
  gap: 6px;
}
.hub-themes button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 14px 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
  min-height: 48px;
}
.hub-themes button:hover {
  background: var(--color-surface);
}
.hub-themes button[aria-pressed='true'] {
  background: var(--color-surface);
  border-color: var(--color-primary);
  font-weight: 700;
}
.hub-count {
  font-size: 0.8rem;
  color: var(--color-text-soft);
}
.hub-content,
.hub-section {
  display: grid;
  gap: 18px;
  min-width: 0;
}
.hub-section header {
  display: grid;
  gap: 8px;
}
.hub-links {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  overflow: hidden;
}
.hub-links li + li {
  border-top: 1px solid var(--color-border);
}
.hub-links a {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px;
  text-decoration: none;
  color: var(--color-text);
  min-height: 80px;
}
.hub-links a:hover {
  background: var(--color-surface-soft);
}
.hub-links strong {
  display: block;
  overflow-wrap: anywhere;
}
.hub-description {
  display: block;
  color: var(--color-text-soft);
  margin-top: 6px;
  font-size: 0.92rem;
  overflow-wrap: anywhere;
}
.hub-arrow {
  flex: 0 0 auto;
  color: var(--color-primary);
  font-size: 1.4rem;
}
.hub-themes button:focus-visible,
.hub-links a:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: -3px;
}
@media (max-width: 700px) {
  .hub-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
  .hub-sidebar {
    position: static;
  }
  .hub-themes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .hub-themes button {
    border-color: var(--color-border);
    padding: 12px;
    font-size: 0.88rem;
  }
  .hub-links a {
    padding: 16px;
  }
}
</style>
