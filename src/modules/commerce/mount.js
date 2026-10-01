import { withShell } from '../shared/mountShell.js';
import '../properties/rural.css';
export function mount(session, Page, props, title, activeNav = 'commerce') {
  const createApp = withShell({
    session,
    title,
    eyebrow: 'Meu Agro • Comercial',
    activeNav,
    content: '<div id="commerce-vue-root"></div>',
  });
  const app = createApp(Page, props);
  app.mount('#app');
  return () => app.unmount();
}
export async function renderCommercePage({ session }) {
  const { default: Page } = await import('./CommercePage.vue');
  return mount(session, Page, { session }, 'Consultor');
}
export async function renderTradePage({ session }) {
  const { default: Page } = await import('./TradePage.vue');
  const { navigate } = await import('../../js/router.js');
  return mount(
    session,
    Page,
    { session, onNavigate: (path) => navigate(path) },
    location.pathname.startsWith('/consultor') ? 'Catálogo e propostas' : 'Minhas compras',
    location.pathname.startsWith('/consultor') ? 'commerce' : 'more',
  );
}
export async function renderSalesResults({ session }) {
  const { default: Page } = await import('./SalesResultsPage.vue');
  const { navigate } = await import('../../js/router.js');
  return mount(
    session,
    Page,
    { session, onNavigate: (path) => navigate(path) },
    'Vendas e resultados',
  );
}
export async function renderManagement({ session }) {
  const { default: Page } = await import('./ManagementPage.vue');
  const { navigate } = await import('../../js/router.js');
  return mount(session, Page, { onNavigate: (path) => navigate(path) }, 'Gestão da empresa');
}
export async function renderManagementWorkspace({ session }) {
  const { default: Page } = await import('./ManagementWorkspace.vue');
  return mount(session, Page, {}, 'Acompanhamento interno');
}
