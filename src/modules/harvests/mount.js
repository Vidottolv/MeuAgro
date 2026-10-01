import { withShell } from '../shared/mountShell.js';
import '../properties/rural.css';
async function mount(context, file, title, props = {}) {
  const Page = (await pages[file]()).default;
  const createApp = withShell({
    session: context.session,
    title,
    eyebrow: 'Produção e resultados',
    activeNav: 'more',
    content: '<div id="harvest-vue-root"></div>',
  });
  const app = createApp(Page, props);
  app.mount('#app');
  return () => app.unmount();
}
const pages = {
  HarvestList: () => import('./HarvestList.vue'),
  HarvestDetail: () => import('./HarvestDetail.vue'),
  HarvestForm: () => import('./HarvestForm.vue'),
  SaleList: () => import('./SaleList.vue'),
  SaleDetail: () => import('./SaleDetail.vue'),
  SaleForm: () => import('./SaleForm.vue'),
  FinancePage: () => import('../finance/FinancePage.vue'),
  FinanceDetail: () => import('../finance/FinanceDetail.vue'),
};
export const renderHarvestsPage = (c) => mount(c, 'HarvestList', 'Colheitas');
export const renderHarvestDetailPage = (c) =>
  mount(c, 'HarvestDetail', 'Colheita', { harvestId: c.params.harvestId });
export async function renderHarvestFormPage(c) {
  const { navigate } = await import('../../js/router.js');
  return mount(c, 'HarvestForm', c.mode === 'edit' ? 'Editar colheita' : 'Nova colheita', {
    harvestId: c.mode === 'edit' ? c.params.harvestId : undefined,
    cycleId: c.params?.cycleId,
    onSaved: (id) => navigate(`/more/harvests/${encodeURIComponent(id)}`, { replace: true }),
  });
}
export const renderSalesPage = (c) => mount(c, 'SaleList', 'Vendas');
export const renderSaleDetailPage = (c) =>
  mount(c, 'SaleDetail', 'Venda', { saleId: c.params.saleId });
export async function renderSaleFormPage(c) {
  const { navigate } = await import('../../js/router.js');
  return mount(c, 'SaleForm', c.mode === 'edit' ? 'Editar venda' : 'Nova venda', {
    saleId: c.mode === 'edit' ? c.params.saleId : undefined,
    harvestId: c.params?.harvestId,
    onSaved: (id) => navigate(`/more/sales/${encodeURIComponent(id)}`, { replace: true }),
  });
}
export const renderFinancePage = (c) => mount(c, 'FinancePage', 'Financeiro');
export const renderCycleFinanceDetailPage = (c) =>
  mount(c, 'FinanceDetail', 'Resultado do plantio', { cycleId: c.params.cycleId });
