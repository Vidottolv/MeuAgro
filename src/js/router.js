import {scrollToRouteAnchor} from '../modules/shared/routeAnchor.js';
import {setPushSession} from '../services/tradePushService.js';
const renderManagement = async c => (await import('../modules/commerce/mount.js')).renderManagement(c);
const renderManagementWorkspace = async c => (await import('../modules/commerce/mount.js')).renderManagementWorkspace(c);
const renderSalesResults = async c => (await import('../modules/commerce/mount.js')).renderSalesResults(c);
import { setTradeNotificationSession } from '../services/tradeNotificationService.js';
const renderTradeNotifications = async c => (await import('../modules/account/mount.js')).renderTradeNotifications(c);
const renderTradePage = async c => (await import('../modules/commerce/mount.js')).renderTradePage(c);
const renderCommercePage = async c => (await import('../modules/commerce/mount.js')).renderCommercePage(c);
import {
  getSession,
} from '../services/authService.js';

const renderLoginPage = async c => (await import('../modules/account/mount.js')).renderLoginPage(c);

const renderRegisterPage = async c => (await import('../modules/account/mount.js')).renderRegisterPage(c);

const renderForgotPasswordPage = async c => (await import('../modules/account/mount.js')).renderForgotPasswordPage(c);

const renderResetPasswordPage = async c => (await import('../modules/account/mount.js')).renderResetPasswordPage(c);

const renderDashboardPage = async c => (await import('../modules/account/mount.js')).renderDashboardPage(c);

async function renderPropertiesPage(context) {
  const { renderPropertiesVue } = await import('../modules/properties/mount.js');
  return renderPropertiesVue(context);
}

async function renderPropertyFormPage(context) {
  const { renderPropertyFormVue } = await import('../modules/properties/mount.js');
  return renderPropertyFormVue(context);
}

async function renderPropertyDetailPage(context) {
  const { renderPropertyDetailVue } = await import('../modules/properties/mount.js');
  return renderPropertyDetailVue(context);
}

async function renderAreasPage(context) {
  const { renderAreasVue } = await import('../modules/properties/mount.js');
  return renderAreasVue(context);
}

async function renderAreaFormPage(context) {
  const { renderAreaFormVue } = await import('../modules/properties/mount.js');
  return renderAreaFormVue(context);
}

async function renderAreaDetailPage(context) {
  const { renderAreaDetailVue } = await import('../modules/properties/mount.js');
  return renderAreaDetailVue(context);
}

const renderPlantingsPage = async (context) => (await import('../modules/plantings/mount.js')).renderPlantingsVue(context);



const renderMorePage = async c => (await import('../modules/account/mount.js')).renderMorePage(c);



const renderProfilePage = async c => (await import('../modules/account/mount.js')).renderProfilePage(c);

const renderSeasonsPage = async (context) => (await import('../modules/seasons/mount.js')).renderSeasonsVue(context);

const renderSeasonFormPage = async (context) => (await import('../modules/seasons/mount.js')).renderSeasonFormVue(context);

const renderSeasonDetailPage = async (context) => (await import('../modules/seasons/mount.js')).renderSeasonDetailVue(context);

const renderCropsPage = async (context) => (await import('../modules/production/mount.js')).renderCropsVue(context);

const renderCropFormPage = async (context) => (await import('../modules/production/mount.js')).renderCropFormVue(context);

const renderCropDetailPage = async (context) => (await import('../modules/production/mount.js')).renderCropDetailVue(context);

const renderProductionCycleFormPage = async (context) => (await import('../modules/plantings/mount.js')).renderPlantingFormVue(context);

const renderProductionCycleDetailPage = async (context) => (await import('../modules/plantings/mount.js')).renderPlantingDetailVue(context);

const renderProductionEventFormPage = async (context) => (await import('../modules/production/mount.js')).renderEventFormVue(context);

const renderEvolutionPage = async (context) => (await import('../modules/production/mount.js')).renderGalleryVue(context);

const renderEvolutionPhotoFormPage = async (context) => (await import('../modules/production/mount.js')).renderPhotoFormVue(context);

const renderEventInputFormPage = async (context) => (await import('../modules/production/mount.js')).renderUsageVue(context);

async function renderInputFormPage(context) {
  const { renderInputFormVue } = await import('../modules/inventory/mount.js');
  return renderInputFormVue(context);
}

async function renderInputDetailPage(context) {
  const { renderInputDetailVue } = await import('../modules/inventory/mount.js');
  return renderInputDetailVue(context);
}


async function renderInventoryLotsPage(context) {
  const { renderLotsVue } = await import('../modules/inventory/mount.js');
  return renderLotsVue(context);
}

async function renderInventoryLotFormPage(context) {
  const { renderLotFormVue } = await import('../modules/inventory/mount.js');
  return renderLotFormVue(context);
}

async function renderInventoryLotDetailPage(context) {
  const { renderLotDetailVue } = await import('../modules/inventory/mount.js');
  return renderLotDetailVue(context);
}

async function renderInventoryTransactionsPage(context) {
  const { renderTransactionsVue } = await import('../modules/inventory/mount.js');
  return renderTransactionsVue(context);
}

async function renderInventoryTransactionFormPage(context) {
  const { renderTransactionFormVue } = await import('../modules/inventory/mount.js');
  return renderTransactionFormVue(context);
}

async function renderInventoryTransactionDetailPage(context) {
  const { renderTransactionDetailVue } = await import('../modules/inventory/mount.js');
  return renderTransactionDetailVue(context);
}

const renderConsultantsPage = async c => (await import('../modules/contacts/mount.js')).renderConsultantsPage(c);

const renderConsultantFormPage = async c => (await import('../modules/contacts/mount.js')).renderConsultantFormPage(c);

const renderConsultantDetailPage = async c => (await import('../modules/contacts/mount.js')).renderConsultantDetailPage(c);

const renderHarvestForecastPage = async (context) => (await import('../modules/production/mount.js')).renderForecastVue(context);

const renderSettingsPage = async c => (await import('../modules/account/mount.js')).renderSettingsPage(c);

const renderHarvestsPage = async c => (await import('../modules/harvests/mount.js')).renderHarvestsPage(c);

const renderHarvestFormPage = async c => (await import('../modules/harvests/mount.js')).renderHarvestFormPage(c);

const renderHarvestDetailPage = async c => (await import('../modules/harvests/mount.js')).renderHarvestDetailPage(c);

const renderSalesPage = async c => (await import('../modules/harvests/mount.js')).renderSalesPage(c);

const renderSaleFormPage = async c => (await import('../modules/harvests/mount.js')).renderSaleFormPage(c);

const renderSaleDetailPage = async c => (await import('../modules/harvests/mount.js')).renderSaleDetailPage(c);

const renderFinancePage = async c => (await import('../modules/harvests/mount.js')).renderFinancePage(c);

const renderCycleFinanceDetailPage = async c => (await import('../modules/harvests/mount.js')).renderCycleFinanceDetailPage(c);

const privateRoute = (render) => ({
  render,
  requiresAuth: true,
});

const routes = {
  '/more/visits': privateRoute(async ({session}) => {
    const {withShell}=await import('../modules/shared/mountShell.js');
    const {default:Page}=await import('../modules/visits/VisitsPage.vue');
    const app=withShell({session,title:'Visitas técnicas',activeNav:'more'})(Page,{onNavigate:path=>navigate(path)});
    app.mount('#app');return ()=>app.unmount();
  }),
  '/consultor/equipe': privateRoute(async c => (await import('../modules/commerce/mount.js')).renderCompanyTeam(c)),
  '/consultor/gestao': privateRoute(renderManagement),
  '/consultor/acompanhamento': privateRoute(renderManagementWorkspace),
  '/consultor/resultados': privateRoute(renderSalesResults),
  '/notificacoes/compras': privateRoute(renderTradeNotifications),
  '/compras': privateRoute(renderTradePage),
  '/consultor/negociacoes': privateRoute(renderTradePage),
  '/consultor': privateRoute(renderCommercePage),
  '/consultor/empresa': privateRoute(renderCommercePage),
  '/login': {
    render: renderLoginPage,
    publicOnly: true,
  },

  '/register': {
    render: renderRegisterPage,
    publicOnly: true,
  },

  '/forgot-password': {
    render:
      renderForgotPasswordPage,
    publicOnly: true,
  },

  '/reset-password': {
    render:
      renderResetPasswordPage,
  },

  '/dashboard':
    privateRoute(
      renderDashboardPage,
    ),

  '/properties':
    privateRoute(
      renderPropertiesPage,
    ),

  '/properties/new':
    privateRoute(
      (context) =>
        renderPropertyFormPage({
          ...context,
          mode: 'create',
        }),
    ),

  '/plantings':
    privateRoute(
      renderPlantingsPage,
    ),

  '/plantings/new':
    privateRoute(
      (context) =>
        renderProductionCycleFormPage({
          ...context,
          mode: 'create',
        }),
    ),

  '/inventory': privateRoute(async context => {
    const { renderInventoryVue } = await import('../modules/inventory/mount.js');
    return renderInventoryVue(context);
  }),
  '/inventory/classic': privateRoute(async () => navigate('/inventory', {replace:true})),

  '/inventory/new':
    privateRoute(
      (context) =>
        renderInputFormPage({
          ...context,
          mode: 'create',
        }),
    ),


  '/inventory/transactions':
    privateRoute(
      renderInventoryTransactionsPage,
    ),

  '/inventory/transactions/new':
    privateRoute(
      renderInventoryTransactionFormPage,
    ),

  '/more':
    privateRoute(
      renderMorePage,
    ),

  '/more/seasons':
    privateRoute(
      renderSeasonsPage,
    ),

  '/more/seasons/new':
    privateRoute(
      (context) =>
        renderSeasonFormPage({
          ...context,
          mode: 'create',
        }),
    ),

  '/more/crops':
    privateRoute(
      renderCropsPage,
    ),

  '/more/crops/new':
    privateRoute(
      (context) =>
        renderCropFormPage({
          ...context,
          mode: 'create',
        }),
    ),

  '/more/consultants':
    privateRoute(
      renderConsultantsPage,
    ),

  '/more/consultants/new':
    privateRoute(
      (context) =>
        renderConsultantFormPage({
          ...context,
          mode: 'create',
        }),
    ),

  '/more/harvest-forecast':
    privateRoute(
      renderHarvestForecastPage,
    ),

  '/more/harvests':
    privateRoute(
      renderHarvestsPage,
    ),

  '/more/harvests/new':
    privateRoute(
      (context) =>
        renderHarvestFormPage({
          ...context,
          mode: 'create',
        }),
    ),

  '/more/sales':
    privateRoute(
      renderSalesPage,
    ),

  '/more/sales/new':
    privateRoute(
      (context) =>
        renderSaleFormPage({
          ...context,
          mode: 'create',
        }),
    ),

  '/more/finance':
    privateRoute(
      renderFinancePage,
    ),

  '/more/settings':
    privateRoute(
      renderSettingsPage,
    ),

  '/more/profile':
    privateRoute(
      renderProfilePage,
    ),
};

const dynamicRoutes = [
  {
    regex:
      /^\/more\/finance\/([^/]+)$/,
    route:
      privateRoute(
        renderCycleFinanceDetailPage,
      ),
    paramNames: [
      'cycleId',
    ],
  },
  {
    regex:
      /^\/plantings\/([^/]+)\/harvests\/new$/,
    route:
      privateRoute(
        (context) =>
          renderHarvestFormPage({
            ...context,
            mode: 'create',
          }),
      ),
    paramNames: [
      'cycleId',
    ],
  },
  {
    regex:
      /^\/more\/harvests\/([^/]+)\/sales\/new$/,
    route:
      privateRoute(
        (context) =>
          renderSaleFormPage({
            ...context,
            mode: 'create',
          }),
      ),
    paramNames: [
      'harvestId',
    ],
  },
  {
    regex:
      /^\/more\/harvests\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderHarvestFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: [
      'harvestId',
    ],
  },
  {
    regex:
      /^\/more\/harvests\/([^/]+)$/,
    route:
      privateRoute(
        renderHarvestDetailPage,
      ),
    paramNames: [
      'harvestId',
    ],
  },
  {
    regex:
      /^\/more\/sales\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderSaleFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: [
      'saleId',
    ],
  },
  {
    regex:
      /^\/more\/sales\/([^/]+)$/,
    route:
      privateRoute(
        renderSaleDetailPage,
      ),
    paramNames: [
      'saleId',
    ],
  },
  {
    regex:
      /^\/more\/consultants\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderConsultantFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: [
      'consultantId',
    ],
  },
  {
    regex:
      /^\/more\/consultants\/([^/]+)$/,
    route:
      privateRoute(
        renderConsultantDetailPage,
      ),
    paramNames: [
      'consultantId',
    ],
  },
  {
    regex:
      /^\/plantings\/([^/]+)\/events\/([^/]+)\/inputs\/new$/,
    route:
      privateRoute(
        renderEventInputFormPage,
      ),
    paramNames: [
      'cycleId',
      'eventId',
    ],
  },
  {
    regex:
      /^\/plantings\/([^/]+)\/events\/new$/,
    route:
      privateRoute(
        (context) =>
          renderProductionEventFormPage({
            ...context,
            mode: 'create',
          }),
      ),
    paramNames: [
      'cycleId',
    ],
  },
  {
    regex:
      /^\/plantings\/([^/]+)\/events\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderProductionEventFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: [
      'cycleId',
      'eventId',
    ],
  },
  {
    regex:
      /^\/plantings\/([^/]+)\/evolution\/new$/,
    route:
      privateRoute(
        renderEvolutionPhotoFormPage,
      ),
    paramNames: [
      'cycleId',
    ],
  },
  {
    regex:
      /^\/plantings\/([^/]+)\/evolution$/,
    route:
      privateRoute(
        renderEvolutionPage,
      ),
    paramNames: [
      'cycleId',
    ],
  },
  {
    regex:
      /^\/inventory\/transactions\/([^/]+)$/,
    route:
      privateRoute(
        renderInventoryTransactionDetailPage,
      ),
    paramNames: [
      'transactionId',
    ],
  },
  {
    regex:
      /^\/inventory\/([^/]+)\/lots\/new$/,
    route:
      privateRoute(
        (context) =>
          renderInventoryLotFormPage({
            ...context,
            mode: 'create',
          }),
      ),
    paramNames: [
      'inputId',
    ],
  },
  {
    regex:
      /^\/inventory\/([^/]+)\/lots\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderInventoryLotFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: [
      'inputId',
      'lotId',
    ],
  },
  {
    regex:
      /^\/inventory\/([^/]+)\/lots\/([^/]+)$/,
    route:
      privateRoute(
        renderInventoryLotDetailPage,
      ),
    paramNames: [
      'inputId',
      'lotId',
    ],
  },
  {
    regex:
      /^\/inventory\/([^/]+)\/lots$/,
    route:
      privateRoute(
        renderInventoryLotsPage,
      ),
    paramNames: [
      'inputId',
    ],
  },
  {
    regex:
      /^\/inventory\/([^/]+)\/transactions$/,
    route:
      privateRoute(
        renderInventoryTransactionsPage,
      ),
    paramNames: [
      'inputId',
    ],
  },
  {
    regex:
      /^\/inventory\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderInputFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: [
      'inputId',
    ],
  },
  {
    regex:
      /^\/inventory\/([^/]+)$/,
    route:
      privateRoute(
        renderInputDetailPage,
      ),
    paramNames: [
      'inputId',
    ],
  },
  {
    regex:
      /^\/more\/crops\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderCropFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: [
      'cropId',
    ],
  },
  {
    regex:
      /^\/more\/crops\/([^/]+)$/,
    route:
      privateRoute(
        renderCropDetailPage,
      ),
    paramNames: [
      'cropId',
    ],
  },
  {
    regex:
      /^\/plantings\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderProductionCycleFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: [
      'cycleId',
    ],
  },
  {
    regex:
      /^\/plantings\/([^/]+)$/,
    route:
      privateRoute(
        renderProductionCycleDetailPage,
      ),
    paramNames: [
      'cycleId',
    ],
  },
  {
    regex:
      /^\/more\/seasons\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderSeasonFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: [
      'seasonId',
    ],
  },
  {
    regex:
      /^\/more\/seasons\/([^/]+)$/,
    route:
      privateRoute(
        renderSeasonDetailPage,
      ),
    paramNames: [
      'seasonId',
    ],
  },
  {
    regex:
      /^\/properties\/([^/]+)\/areas\/new$/,
    route:
      privateRoute(
        (context) =>
          renderAreaFormPage({
            ...context,
            mode: 'create',
          }),
      ),
    paramNames: [
      'propertyId',
    ],
  },
  {
    regex:
      /^\/properties\/([^/]+)\/areas\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderAreaFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: [
      'propertyId',
      'areaId',
    ],
  },
  {
    regex:
      /^\/properties\/([^/]+)\/areas\/([^/]+)$/,
    route:
      privateRoute(
        renderAreaDetailPage,
      ),
    paramNames: [
      'propertyId',
      'areaId',
    ],
  },
  {
    regex:
      /^\/properties\/([^/]+)\/areas$/,
    route:
      privateRoute(
        renderAreasPage,
      ),
    paramNames: [
      'propertyId',
    ],
  },
  {
    regex:
      /^\/properties\/([^/]+)\/edit$/,
    route:
      privateRoute(
        (context) =>
          renderPropertyFormPage({
            ...context,
            mode: 'edit',
          }),
      ),
    paramNames: ['id'],
  },
  {
    regex:
      /^\/properties\/([^/]+)$/,
    route:
      privateRoute(
        renderPropertyDetailPage,
      ),
    paramNames: ['id'],
  },
];

let cleanupCurrentPage = null;
let rendering = false;
let renderPending = false;

function normalizePath(path) {
  if (
    !path ||
    path === '/'
  ) {
    return '/';
  }

  return path.length > 1
    ? path.replace(/\/+$/, '')
    : path;
}

export function getCurrentPath() {
  return normalizePath(
    window.location.pathname,
  );
}

export function navigate(
  path,
  {
    replace = false,
  } = {},
) {
  const current =
    `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (current === path) {
    return;
  }

  if (replace) {
    window.history.replaceState(
      {},
      '',
      path,
    );
  } else {
    window.history.pushState(
      {},
      '',
      path,
    );
  }

  void renderRoute();
}

function findRoute(path) {
  if (routes[path]) {
    return {
      route: routes[path],
      params: {},
    };
  }

  for (
    const dynamicRoute of
    dynamicRoutes
  ) {
    const match =
      path.match(
        dynamicRoute.regex,
      );

    if (!match) {
      continue;
    }

    const params = {};

    dynamicRoute.paramNames.forEach(
      (name, index) => {
        params[name] =
          decodeURIComponent(
            match[index + 1],
          );
      },
    );

    return {
      route:
        dynamicRoute.route,
      params,
    };
  }

  return null;
}

async function renderNotFound() {
 const {createApp}=await import('vue');
 const {default:Page}=await import('../modules/shared/NotFoundPage.vue');
 const app=createApp(Page);app.mount('#app');cleanupCurrentPage=()=>app.unmount();
}

export async function renderRoute() {
  if (rendering) {
    renderPending = true;
    return;
  }

  rendering = true;

  try {
    if (
      typeof cleanupCurrentPage ===
      'function'
    ) {
      cleanupCurrentPage();
      cleanupCurrentPage = null;
    }

    let session = null;

    try {
      session =
        await getSession();
    } catch (error) {
      console.error(
        'Erro ao recuperar sessão:',
        error,
      );
    }

    setTradeNotificationSession(session);
    setPushSession(session);
    const path =
      getCurrentPath();

    if (path === '/') {
      navigate(
        session
          ? '/dashboard'
          : '/login',
        {
          replace: true,
        },
      );

      return;
    }

    const matched =
      findRoute(path);

    if (!matched) {
      await renderNotFound();
      return;
    }

    const {
      route,
      params,
    } = matched;

    if (
      route.requiresAuth &&
      !session
    ) {
      navigate(
        `/login?redirect=${encodeURIComponent(path)}`,
        {
          replace: true,
        },
      );

      return;
    }

    if (
      route.publicOnly &&
      !new URLSearchParams(window.location.search).has('nativeError') &&
      session
    ) {
      navigate(
        '/dashboard',
        {
          replace: true,
        },
      );

      return;
    }

    const cleanup =
      await route.render({
        session,
        params,
      });

    if (
      typeof cleanup ===
      'function'
    ) {
      cleanupCurrentPage =
        cleanup;
    }

    const stopAnchor = scrollToRouteAnchor(window.location.hash);
    const disposePage = cleanupCurrentPage;
    cleanupCurrentPage = () => { stopAnchor(); disposePage?.(); };
  } finally {
    rendering = false;

    if (renderPending) {
      renderPending = false;
      void renderRoute();
    }
  }
}

export function initializeRouter() {
  window.addEventListener(
    'popstate',
    () => {
      void renderRoute();
    },
  );

  document.addEventListener(
    'click',
    (event) => {
      const link =
        event.target.closest(
          'a[data-link], button[data-app-route]',
        );

      if (!link) {
        return;
      }

      const url =
        new URL(
          link.dataset.appRoute || link.href,
          window.location.origin,
        );

      if (
        url.origin !==
        window.location.origin
      ) {
        return;
      }

      event.preventDefault();

      navigate(
        `${url.pathname}${url.search}${url.hash}`,
      );
    },
  );

  void renderRoute();
}

