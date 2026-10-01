import { createApp } from 'vue';
import { withShell } from '../shared/mountShell.js';
import '../properties/rural.css';
async function auth(mode) {
  const { default: Page } = await import('./AuthPage.vue');
  const { navigate } = await import('../../js/router.js');
  const app = createApp(Page, { mode, onNavigate: (path) => navigate(path, { replace: true }) });
  app.mount('#app');
  return () => app.unmount();
}
export const renderLoginPage = () => auth('login');
export const renderRegisterPage = () => auth('register');
export const renderForgotPasswordPage = () => auth('forgot');
export const renderResetPasswordPage = () => auth('reset');
async function mount(session, Page, title, props, activeNav = 'more') {
  const createApp = withShell({
    session,
    title,
    eyebrow: 'Meu Agro',
    activeNav,
    content: '<div id="account-vue-root"></div>',
  });
  const app = createApp(Page, props);
  app.mount('#app');
  return () => app.unmount();
}
export async function renderProfilePage({ session }) {
  const { default: Page } = await import('./ProfilePage.vue');
  const { navigate } = await import('../../js/router.js');
  return mount(session, Page, 'Perfil', {
    session,
    onLogout: () => navigate('/login', { replace: true }),
  });
}
export async function renderMorePage({ session }) {
  const { default: Page } = await import('./MorePage.vue');
  return mount(session, Page, 'Mais', {});
}

export async function renderSettingsPage({ session }) {
  const { default: Page } = await import('./SettingsPage.vue');
  return mount(session, Page, 'Configurações', {});
}
export async function renderTradeNotifications({ session }) {
  const { default: Page } = await import('./NotificationsPage.vue');
  const { navigate } = await import('../../js/router.js');
  return mount(session, Page, 'Avisos de compras', { onNavigate: (route) => navigate(route) });
}
export async function renderDashboardPage({ session }) {
  const { default: Page } = await import('./DashboardPage.vue');
  return mount(session, Page, 'Início', { session }, 'home');
}
