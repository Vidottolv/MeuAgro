import { withShell } from '../shared/mountShell.js';
import '../properties/rural.css';
function mount(session, Page, props, title) {
  const createApp = withShell({
    session,
    title,
    eyebrow: 'Rede de apoio',
    activeNav: 'more',
    content: '<div id="contacts-vue-root"></div>',
  });
  const app = createApp(Page, props);
  app.mount('#app');
  return () => app.unmount();
}
export async function renderConsultantsPage({ session }) {
  const { default: Page } = await import('./ContactsPage.vue');
  return mount(session, Page, {}, 'Consultores');
}
export async function renderConsultantDetailPage({ session, params }) {
  const { default: Page } = await import('./ContactDetail.vue');
  return mount(session, Page, { contactId: params.consultantId }, 'Contato');
}
export async function renderConsultantFormPage({ session, params, mode }) {
  const { default: Page } = await import('./ContactForm.vue');
  const { navigate } = await import('../../js/router.js');
  return mount(
    session,
    Page,
    {
      contactId: mode === 'edit' ? params.consultantId : undefined,
      onSaved: (id) => navigate(`/more/consultants/${encodeURIComponent(id)}`, { replace: true }),
    },
    mode === 'edit' ? 'Editar contato' : 'Novo contato',
  );
}
