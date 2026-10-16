<script setup lang="ts">
import { computed, ref, onScopeDispose } from 'vue';
import { tradeUnreadCount } from '../../services/tradeNotificationService.js';
import AppIcon from './AppIcon.vue';
import OfflineBanner from '../../offline/OfflineBanner.vue';
const props = withDefaults(
  defineProps<{
    session?: { user?: { email?: string; user_metadata?: { full_name?: string } } };
    title: string;
    eyebrow?: string;
    activeNav?: string;
  }>(),
  { eyebrow: 'Meu Agro' },
);
const count = ref(tradeUnreadCount()),
  path = location.pathname;
const update = () => (count.value = tradeUnreadCount());
document.addEventListener('trade-notifications-updated', update);
onScopeDispose(() => document.removeEventListener('trade-notifications-updated', update));
const initials = computed(() => {
  const n = props.session?.user?.user_metadata?.full_name?.trim();
  if (!n) return (props.session?.user?.email || 'MA').slice(0, 2).toUpperCase();
  const p = n.split(/\s+/);
  return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2)).toUpperCase();
});
const items = [
  { key: 'home', label: 'Início', path: '/dashboard', icon: 'home' },
  { key: 'properties', label: 'Propriedades', path: '/properties', icon: 'map' },
  { key: 'plantings', label: 'Plantios', path: '/plantings', icon: 'sprout' },
  { key: 'inventory', label: 'Barracão', path: '/inventory', icon: 'box' },
  { key: 'more', label: 'Mais', path: '/more', icon: 'more' },
];
const commercial = [
  ['/consultor', 'briefcase', 'Meu espaço'],
  ['/consultor/negociacoes', 'clipboard', 'Negociações'],
  ['/consultor/resultados', 'chart', 'Resultados'],
];
</script>
<template>
  <div class="mobile-app" :class="{ 'commercial-app': activeNav === 'commerce' }">
    <div class="app-topbar-wrap">
      <header class="app-topbar">
        <div class="app-topbar__identity">
          <p class="app-topbar__eyebrow">{{ eyebrow }}</p>
          <h1 class="app-topbar__title">{{ title }}</h1>
          <button
            type="button"
            class="button commerce-mode-button"
            :data-app-route="activeNav === 'commerce' ? '/dashboard' : '/consultor'"
          >
            <AppIcon :name="activeNav === 'commerce' ? 'sprout' : 'briefcase'" /><span>{{
              activeNav === 'commerce' ? 'Ir para produtor' : 'Ir para consultor'
            }}</span>
          </button>
        </div>
        <div class="app-topbar__actions">
          <a
            href="/notificacoes/compras"
            class="trade-bell"
            :aria-label="'Avisos de compras' + (count ? ', ' + count + ' não lidos' : '')"
            title="Avisos de compras"
            data-link
            ><AppIcon name="bell" /><span aria-hidden="true">{{
              count > 99 ? '99+' : count || ''
            }}</span></a
          ><a
            href="/more/profile"
            class="button button--secondary user-avatar"
            aria-label="Abrir meu perfil"
            data-link
            >{{ initials }}</a
          >
        </div>
      </header>
    </div>
    <OfflineBanner />
    <main class="app-content"><slot /></main>
    <div class="bottom-nav-wrap">
      <nav v-if="activeNav === 'commerce'" class="commerce-nav" aria-label="Navegação comercial">
        <a
          v-for="[href, name, label] in commercial"
          :key="href"
          :href="href"
          data-link
          :aria-current="
            path === href || (href === '/consultor' && path === '/consultor/empresa')
              ? 'page'
              : undefined
          "
          ><AppIcon :name="name" /><span>{{ label }}</span></a
        >
      </nav>
      <nav v-else class="bottom-nav" aria-label="Navegação principal">
        <a
          v-for="item in items"
          :key="item.key"
          :href="item.path"
          class="bottom-nav__item"
          :class="{ 'bottom-nav__item--active': activeNav === item.key }"
          :aria-current="activeNav === item.key ? 'page' : undefined"
          data-link
          ><AppIcon :name="item.icon" /><span class="bottom-nav__label">{{ item.label }}</span></a
        >
      </nav>
    </div>
  </div>
</template>
