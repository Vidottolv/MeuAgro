import { withShell } from '../shared/mountShell.js';
export async function renderLite({ session }) {
  const { default: Page } = await import('./LitePage.vue');
  const view = location.pathname.split('/')[3] || 'resumo';
  const app = withShell({
    session,
    title: 'Consultor Lite',
    eyebrow: 'Meu Agro',
    activeNav: 'lite',
  })(Page, { view });
  app.mount('#app');
  return () => app.unmount();
}
