import { withShell } from '../shared/mountShell.js';
function mount(session, Page, props, title, activeNav = 'more') {
  const createApp = withShell({
    session,
    title,
    eyebrow: 'Produção',
    activeNav,
    content: '<div id="production-vue-root"></div>',
  });
  const app = createApp(Page, props);
  app.mount('#app');
  return () => app.unmount();
}
export async function renderCropsVue({ session }) {
  const { default: Page } = await import('./CropsPage.vue');
  return mount(session, Page, {}, 'Culturas');
}
export async function renderCropDetailVue({ session, params }) {
  const { default: Page } = await import('./CropDetailPage.vue');
  return mount(session, Page, { cropId: params.cropId }, 'Cultura');
}
export async function renderCropFormVue({ session, params, mode }) {
  const { default: Page } = await import('./CropFormPage.vue');
  const { navigate } = await import('../../js/router.js');
  return mount(
    session,
    Page,
    {
      cropId: mode === 'edit' ? params.cropId : undefined,
      onSaved: (id) => navigate(`/more/crops/${encodeURIComponent(id)}`, { replace: true }),
    },
    mode === 'edit' ? 'Editar cultura' : 'Nova cultura',
  );
}
export async function renderEventFormVue({ session, params, mode }) {
  const { default: Page } = await import('./EventFormPage.vue');
  const { navigate } = await import('../../js/router.js');
  return mount(
    session,
    Page,
    {
      cycleId: params.cycleId,
      eventId: mode === 'edit' ? params.eventId : undefined,
      onSaved: () =>
        navigate(`/plantings/${encodeURIComponent(params.cycleId)}#timeline`, { replace: true }),
    },
    mode === 'edit' ? 'Editar evento' : 'Novo evento',
    'plantings',
  );
}
export async function renderUsageVue({ session, params }) {
  const { default: Page } = await import('./UsageFormPage.vue');
  return mount(
    session,
    Page,
    { cycleId: params.cycleId, eventId: params.eventId },
    'Uso de insumo',
    'plantings',
  );
}
export async function renderGalleryVue({ session, params }) {
  const { default: Page } = await import('./GalleryPage.vue');
  return mount(session, Page, { cycleId: params.cycleId }, 'Evolução', 'plantings');
}
export async function renderPhotoFormVue({ session, params }) {
  const { default: Page } = await import('./PhotoFormPage.vue');
  const { navigate } = await import('../../js/router.js');
  return mount(
    session,
    Page,
    {
      cycleId: params.cycleId,
      onSaved: () =>
        navigate(`/plantings/${encodeURIComponent(params.cycleId)}/evolution`, { replace: true }),
    },
    'Adicionar foto',
    'plantings',
  );
}
export async function renderForecastVue({ session }) {
  const { default: Page } = await import('./ForecastPage.vue');
  return mount(session, Page, {}, 'Previsão de colheita');
}
