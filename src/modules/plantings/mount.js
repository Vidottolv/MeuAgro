import { withShell } from '../shared/mountShell.js';
function mount(session, Page, props, title) {
  const createApp = withShell({
    session,
    title,
    eyebrow: 'Ciclos produtivos',
    activeNav: 'plantings',
    content: '<div id="plantings-vue-root"></div>',
  });
  const app = createApp(Page, props);
  app.mount('#app');
  return () => app.unmount();
}
export async function renderPlantingsVue({ session }) {
  const { default: Page } = await import('./PlantingsPage.vue');
  return mount(session, Page, {}, 'Plantios');
}
export async function renderPlantingDetailVue({ session, params }) {
  const { default: Page } = await import('./PlantingDetailPage.vue');
  return mount(session, Page, { cycleId: params.cycleId }, 'Plantio');
}
export async function renderPlantingFormVue({ session, params, mode }) {
  const { default: Page } = await import('./PlantingFormPage.vue');
  const { navigate } = await import('../../js/router.js');
  const { showToast } = await import('../../components/toast.js');
  return mount(
    session,
    Page,
    {
      cycleId: mode === 'edit' ? params.cycleId : undefined,
      onSaved: (id) => {
        showToast('Plantio salvo.', { type: 'success' });
        navigate(`/plantings/${encodeURIComponent(id)}`, { replace: true });
      },
    },
    mode === 'edit' ? 'Editar plantio' : 'Novo plantio',
  );
}
