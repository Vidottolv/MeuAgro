<script setup lang="ts">
const items = [
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
    <div class="rural-grid">
      <article v-for="item in items" :key="item.href" class="rural-card">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
        <a :href="item.href" data-link class="button button--secondary">Abrir {{ item.title }}</a>
      </article>
    </div>
  </div>
</template>
