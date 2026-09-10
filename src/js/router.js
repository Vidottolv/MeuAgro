import {
  getSession,
} from '../services/authService.js';

import {
  renderLoginPage,
} from '../pages/login/login.js';

import {
  renderRegisterPage,
} from '../pages/register/register.js';

import {
  renderForgotPasswordPage,
} from '../pages/forgot-password/forgot-password.js';

import {
  renderResetPasswordPage,
} from '../pages/reset-password/reset-password.js';

import {
  renderDashboardPage,
} from '../pages/dashboard/dashboard.js';

import {
  renderPropertiesPage,
} from '../pages/properties/properties.js';

import {
  renderPropertyFormPage,
} from '../pages/properties/propertyForm.js';

import {
  renderPropertyDetailPage,
} from '../pages/properties/propertyDetail.js';

import {
  renderAreasPage,
} from '../pages/areas/areas.js';

import {
  renderAreaFormPage,
} from '../pages/areas/areaForm.js';

import {
  renderAreaDetailPage,
} from '../pages/areas/areaDetail.js';

import {
  renderPlantingsPage,
} from '../pages/plantings/plantings.js';

import {
  renderInventoryPage,
} from '../pages/inventory/inventory.js';

import {
  renderMorePage,
} from '../pages/more/more.js';

import {
  renderFeaturePlaceholder,
} from '../pages/more/featurePlaceholder.js';

import {
  renderProfilePage,
} from '../pages/profile/profile.js';

import {
  renderSeasonsPage,
} from '../pages/seasons/seasons.js';

import {
  renderSeasonFormPage,
} from '../pages/seasons/seasonForm.js';

import {
  renderSeasonDetailPage,
} from '../pages/seasons/seasonDetail.js';

import {
  renderCropsPage,
} from '../pages/crops/crops.js';

import {
  renderCropFormPage,
} from '../pages/crops/cropForm.js';

import {
  renderCropDetailPage,
} from '../pages/crops/cropDetail.js';

import {
  renderProductionCycleFormPage,
} from '../pages/plantings/productionCycleForm.js';

import {
  renderProductionCycleDetailPage,
} from '../pages/plantings/productionCycleDetail.js';

import {
  renderProductionEventFormPage,
} from '../pages/plantings/productionEventForm.js';

import {
  renderEvolutionPage,
} from '../pages/plantings/evolution.js';

import {
  renderEvolutionPhotoFormPage,
} from '../pages/plantings/evolutionPhotoForm.js';

import {
  renderEventInputFormPage,
} from '../pages/plantings/eventInputForm.js';

import {
  renderInputFormPage,
} from '../pages/inventory/inputForm.js';

import {
  renderInputDetailPage,
} from '../pages/inventory/inputDetail.js';


import {
  renderInventoryLotsPage,
} from '../pages/inventory/lots.js';

import {
  renderInventoryLotFormPage,
} from '../pages/inventory/lotForm.js';

import {
  renderInventoryLotDetailPage,
} from '../pages/inventory/lotDetail.js';

import {
  renderInventoryTransactionsPage,
} from '../pages/inventory/inventoryTransactions.js';

import {
  renderInventoryTransactionFormPage,
} from '../pages/inventory/inventoryTransactionForm.js';

import {
  renderInventoryTransactionDetailPage,
} from '../pages/inventory/inventoryTransactionDetail.js';

import {
  renderConsultantsPage,
} from '../pages/consultants/consultants.js';

import {
  renderConsultantFormPage,
} from '../pages/consultants/consultantForm.js';

import {
  renderConsultantDetailPage,
} from '../pages/consultants/consultantDetail.js';

import {
  renderHarvestForecastPage,
} from '../pages/harvest-forecast/harvestForecast.js';

import {
  renderSettingsPage,
} from '../pages/settings/settings.js';

import {
  renderHarvestsPage,
} from '../pages/harvests/harvests.js';

import {
  renderHarvestFormPage,
} from '../pages/harvests/harvestForm.js';

import {
  renderHarvestDetailPage,
} from '../pages/harvests/harvestDetail.js';

import {
  renderSalesPage,
} from '../pages/sales/sales.js';

import {
  renderSaleFormPage,
} from '../pages/sales/saleForm.js';

import {
  renderSaleDetailPage,
} from '../pages/sales/saleDetail.js';

import {
  renderFinancePage,
} from '../pages/finance/finance.js';

import {
  renderCycleFinanceDetailPage,
} from '../pages/finance/cycleFinanceDetail.js';

const privateRoute = (render) => ({
  render,
  requiresAuth: true,
});

const routes = {
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

  '/inventory':
    privateRoute(
      renderInventoryPage,
    ),

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

function renderNotFound() {
  const app =
    document.querySelector('#app');

  app.innerHTML = `
    <main class="auth-layout">
      <section class="auth-panel--message">
        <p class="brand__eyebrow">
          Meu Agro
        </p>

        <h1>
          Página não encontrada
        </h1>

        <p
          style="
            margin: 16px 0;
            color: var(--color-text-soft);
          "
        >
          O endereço informado não existe.
        </p>

        <a
          href="/"
          class="button button--primary button--full"
          data-link
        >
          Voltar ao início
        </a>
      </section>
    </main>
  `;
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
      renderNotFound();
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

    const hash =
      window.location.hash;

    if (hash) {
      const target =
        document.getElementById(
          decodeURIComponent(
            hash.slice(1),
          ),
        );

      if (target) {
        target.scrollIntoView({
          block: 'start',
          behavior: 'instant',
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'instant',
        });
      }
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    }
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
          'a[data-link]',
        );

      if (!link) {
        return;
      }

      const url =
        new URL(
          link.href,
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
