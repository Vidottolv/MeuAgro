import { withShell } from '../shared/mountShell.js';
function mount(session, Page, props, title) {
  const createApp = withShell({
    session,
    title,
    eyebrow: 'Produção',
    activeNav: 'more',
    content: '<div id="seasons-vue-root"></div>',
  });
  const app = createApp(Page, props);
  app.mount('#app');
  return () => app.unmount();
}
export async function renderSeasonsVue({ session }) {
  const { default: Page } = await import('./SeasonsPage.vue');
  return mount(session, Page, {}, 'Safras');
}
export async function renderSeasonDetailVue({ session, params }) {
  const { default: Page } = await import('./SeasonDetailPage.vue');
  return mount(session, Page, { seasonId: params.seasonId }, 'Safra');
}
export async function renderSeasonFormVue({ session, params, mode }) {
  const { default: Page } = await import('./SeasonFormPage.vue');
  const { navigate } = await import('../../js/router.js');
  const { showToast } = await import('../../components/toast.js');
  return mount(
    session,
    Page,
    {
      seasonId: mode === 'edit' ? params.seasonId : undefined,
      requestedProperty: new URLSearchParams(location.search).get('property') || '',
      onSaved: (id) => {
        showToast('Safra salva.', { type: 'success' });
        navigate(`/more/seasons/${encodeURIComponent(id)}`, { replace: true });
      },
    },
    mode === 'edit' ? 'Editar safra' : 'Nova safra',
  );
}
