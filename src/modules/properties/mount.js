import { withShell } from '../shared/mountShell.js';
async function mount(session, Page, props, title) {
  const createApp = withShell({
    session,
    title,
    eyebrow: 'Gestão rural',
    activeNav: 'properties',
    content: '<div id="rural-vue-root"></div>',
  });
  const app = createApp(Page, props);
  app.mount('#app');
  return () => app.unmount();
}
export async function renderPropertiesVue({ session }) {
  const { default: Page } = await import('./PropertiesPage.vue');
  return mount(session, Page, {}, 'Propriedades');
}
export async function renderPropertyDetailVue({ session, params }) {
  const { default: Page } = await import('./PropertyDetailPage.vue');
  return mount(session, Page, { propertyId: params.id }, 'Propriedade');
}
export async function renderAreasVue({ session, params }) {
  const { default: Page } = await import('./AreasPage.vue');
  return mount(session, Page, { propertyId: params.propertyId }, 'Áreas');
}
export async function renderAreaDetailVue({ session, params }) {
  const { default: Page } = await import('./AreaDetailPage.vue');
  return mount(session, Page, { propertyId: params.propertyId, areaId: params.areaId }, 'Área');
}
export async function renderPropertyFormVue({ session, params, mode }) {
  const { default: Page } = await import('./PropertyFormPage.vue');
  const { navigate } = await import('../../js/router.js');
  const { showToast } = await import('../../components/toast.js');
  return mount(
    session,
    Page,
    {
      propertyId: mode === 'edit' ? params.id : undefined,
      onSaved: (id) => {
        showToast('Propriedade salva.', { type: 'success' });
        navigate(`/properties/${encodeURIComponent(id)}`, { replace: true });
      },
    },
    mode === 'edit' ? 'Editar propriedade' : 'Nova propriedade',
  );
}
export async function renderAreaFormVue({ session, params, mode }) {
  const { default: Page } = await import('./AreaFormPage.vue');
  const { navigate } = await import('../../js/router.js');
  const { showToast } = await import('../../components/toast.js');
  return mount(
    session,
    Page,
    {
      propertyId: params.propertyId,
      areaId: mode === 'edit' ? params.areaId : undefined,
      onSaved: (id) => {
        showToast('Área salva.', { type: 'success' });
        navigate(
          `/properties/${encodeURIComponent(params.propertyId)}/areas/${encodeURIComponent(id)}`,
          { replace: true },
        );
      },
    },
    mode === 'edit' ? 'Editar área' : 'Nova área',
  );
}
