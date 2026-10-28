<script setup lang="ts">
import { ref, watch, onScopeDispose } from 'vue';
import { useOffline } from '../../offline/useOffline.js';
import { workspaceRpc } from '../../services/workspaceService.js';
const platformAdmin = ref(false);
const { status } = useOffline();
let accessRevision = 0;
watch([() => status.value.user, () => status.value.online], async () => {
  const token = ++accessRevision;
  platformAdmin.value = false;
  if (!status.value.user || !status.value.online) return;
  try {
    const allowed = await workspaceRpc('app_is_platform_admin');
    if (token === accessRevision) platformAdmin.value = allowed === true;
  } catch { /* Banco anterior ou conta sem permissão: não exibir atalho. */ }
}, { immediate: true });
onScopeDispose(() => { accessRevision++; });
const items = [
  {iconName:'settings',title:'Diagnóstico e privacidade',description:'Recuperação de pendências e solicitações sobre seus dados',href:'/more/operations'},
  {iconName:'leaf',title:'Conferência agrícola',description:'Plantios, colheitas, vendas e custos registrados',href:'/more/farm-workflow'},
  {iconName:'chart',title:'Contas a receber',description:'Vencimentos e recebimentos parciais',href:'/more/receivables'},
  {iconName:'chart',title:'Fluxo de caixa registrado',description:'Entradas e saídas por data de pagamento',href:'/more/cashflow'},
  {iconName:'calendar',title:'Planejamento da safra',description:'Orçamento e comparação com custos realizados',href:'/more/budgets'},
  {iconName:'cart',title:'Reposição planejada',description:'Saldo, consumo previsto e pedidos a receber',href:'/more/procurement'},
  {iconName:'leaf',title:'Clima e chuva',description:'Previsão regional e medições na propriedade',href:'/more/weather'},
  {iconName:'settings',title:'Começar e gerenciar plano',description:'Roteiro por perfil, importação e utilização da conta',href:'/more/account-plan'},
  {iconName:'chart',title:'Despesas operacionais',description:'Vencimentos, pagamentos parciais e saldo em aberto',href:'/more/expenses'},
  {iconName:'calendar',title:'Agenda e tarefas técnicas',description:'Responsáveis, prazos e acompanhamento das visitas',href:'/more/tasks'},
  { iconName:'leaf',title:'Mapas e satélite',description:'Contornos de sítios e talhões e preparação do monitoramento',href:'/more/satellite' },
  { iconName:'users',title:'Compartilhamento técnico',description:'Convites e acompanhamento autorizado por propriedade',href:'/more/sharing' },
  { iconName:'clipboard',title:'Visitas técnicas',description:'Anamnese, acompanhamento e fotos de campo',href:'/more/visits' },
  {
    iconName: 'cart',
    title: 'Minhas compras',
    description: 'Consultores, produtos e orçamentos',
    href: '/compras',
  },
  {
    iconName: 'users',
    title: 'Meu espaço de consultor',
    description: 'Atuação própria, empresas e representantes',
    href: '/consultor',
  },
  {
    iconName: 'users',
    title: 'Gerentes e representantes',
    description: 'Administre a equipe da sua empresa',
    href: '/consultor/equipe',
  },
  {
    iconName: 'calendar',
    title: 'Safras',
    description: 'Agrupe ciclos produtivos',
    href: '/more/seasons',
  },
  {
    iconName: 'leaf',
    title: 'Culturas',
    description: 'Ciclos médios e variedades',
    href: '/more/crops',
  },
  {
    iconName: 'harvest',
    title: 'Previsão de colheita',
    description: 'Atrasos, semana da colheita e lembretes',
    href: '/more/harvest-forecast',
  },
  {
    iconName: 'users',
    title: 'Consultores',
    description: 'Contatos, especialidades e WhatsApp',
    href: '/more/consultants',
  },
  {
    iconName: 'harvest',
    title: 'Colheitas',
    description: 'Registros e produtividade',
    href: '/more/harvests',
  },
  {
    iconName: 'cart',
    title: 'Vendas',
    description: 'Destino e comercialização',
    href: '/more/sales',
  },
  {
    iconName: 'chart',
    title: 'Financeiro',
    description: 'Insumos, receitas e resultado por ciclo',
    href: '/more/finance',
  },
  {
    iconName: 'settings',
    title: 'Configurações',
    description: 'Lembretes de colheita e notificações',
    href: '/more/settings',
  },
  { iconName: 'user', title: 'Perfil', description: 'Sua conta e sessão', href: '/more/profile' },
];
</script>
<template>
  <div class="rural-vue">
    <h2>Gestão e configurações</h2>
    <p>Acesse cadastros complementares, produção, vendas e sua conta.</p>
    <a v-if="platformAdmin" href="/more/platform-admin" data-link class="button button--secondary">Administração do MeuAgro</a>
    <div class="rural-grid">
      <article v-for="item in items" :key="item.href" class="rural-card">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
        <a :href="item.href" data-link class="button button--secondary">Abrir {{ item.title }}</a>
      </article>
    </div>
  </div>
</template>
