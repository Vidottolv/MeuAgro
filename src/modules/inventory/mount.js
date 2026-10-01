import { withShell } from '../shared/mountShell.js';
import InventoryPage from './InventoryPage.vue';

// Bridge to the current router. Vue owns only this page's content.
export function renderInventoryVue({ session }) {
  const createApp = withShell({
    session,
    title: 'Barracão',
    eyebrow: 'Insumos',
    activeNav: 'inventory',
    content: '<div id="inventory-vue-root"></div>',
  });
  const app = createApp(InventoryPage);
  app.mount('#app');
  return () => app.unmount();
}

export async function renderInputFormVue({ session, params, mode }) {
  const { default: InputFormPage } = await import('./InputFormPage.vue');
  const { navigate } = await import('../../js/router.js');
  const { showToast } = await import('../../components/toast.js');
  const editing = mode === 'edit';
  const createApp = withShell({
    session,
    title: editing ? 'Editar insumo' : 'Novo insumo',
    eyebrow: 'Barracão',
    activeNav: 'inventory',
    content: '<div id="input-form-vue-root"></div>',
  });
  const app = createApp(InputFormPage, {
    inputId: editing ? params.inputId : undefined,
    onSaved: (id) => {
      showToast(editing ? 'Insumo atualizado.' : 'Insumo cadastrado.', { type: 'success' });
      navigate(`/inventory/${encodeURIComponent(id)}`, { replace: true });
    },
  });
  app.mount('#app');
  return () => app.unmount();
}

export async function renderInputDetailVue({ session, params }) {
  const { default: InputDetailPage } = await import('./InputDetailPage.vue');
  const createApp = withShell({
    session,
    title: 'Insumo',
    eyebrow: 'Barracão',
    activeNav: 'inventory',
    content: '<div id="input-detail-vue-root"></div>',
  });
  const app = createApp(InputDetailPage, { inputId: params.inputId });
  app.mount('#app');
  return () => app.unmount();
}

async function mountLotPage(session, Page, props, title) {
  const createApp = withShell({
    session,
    title,
    eyebrow: 'Barracão',
    activeNav: 'inventory',
    content: '<div id="lot-vue-root"></div>',
  });
  const app = createApp(Page, props);
  app.mount('#app');
  return () => app.unmount();
}
export async function renderLotsVue({ session, params }) {
  const { default: Page } = await import('./lots/LotsPage.vue');
  return mountLotPage(session, Page, { inputId: params.inputId }, 'Lotes de estoque');
}
export async function renderLotDetailVue({ session, params }) {
  const { default: Page } = await import('./lots/LotDetailPage.vue');
  return mountLotPage(
    session,
    Page,
    { inputId: params.inputId, lotId: params.lotId },
    'Lote de estoque',
  );
}
export async function renderLotFormVue({ session, params, mode }) {
  const { default: Page } = await import('./lots/LotFormPage.vue');
  const { navigate } = await import('../../js/router.js');
  const { showToast } = await import('../../components/toast.js');
  const editing = mode === 'edit';
  return mountLotPage(
    session,
    Page,
    {
      inputId: params.inputId,
      lotId: editing ? params.lotId : undefined,
      onSaved: (id) => {
        showToast(
          editing
            ? 'Informações do lote atualizadas.'
            : 'Lote cadastrado e entrada de estoque gerada.',
          { type: 'success' },
        );
        navigate(
          `/inventory/${encodeURIComponent(params.inputId)}/lots/${encodeURIComponent(id)}`,
          { replace: true },
        );
      },
    },
    editing ? 'Editar lote' : 'Novo lote',
  );
}

export async function renderTransactionsVue({ session, params = {} }) {
  const { default: Page } = await import('./transactions/TransactionsPage.vue');
  return mountLotPage(session, Page, { inputId: params.inputId }, 'Movimentações');
}
export async function renderTransactionDetailVue({ session, params }) {
  const { default: Page } = await import('./transactions/TransactionDetailPage.vue');
  return mountLotPage(session, Page, { transactionId: params.transactionId }, 'Movimentação');
}
export async function renderTransactionFormVue({ session }) {
  const { default: Page } = await import('./transactions/TransactionFormPage.vue');
  const { navigate } = await import('../../js/router.js');
  const { showToast } = await import('../../components/toast.js');
  const query = new URLSearchParams(window.location.search);
  return mountLotPage(
    session,
    Page,
    {
      inputId: query.get('input') || '',
      lotId: query.get('lot') || '',
      onSaved: (id) => {
        showToast('Movimentação registrada. O saldo foi recalculado.', { type: 'success' });
        navigate(`/inventory/transactions/${encodeURIComponent(id)}`, { replace: true });
      },
    },
    'Nova movimentação',
  );
}
