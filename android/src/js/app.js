import { supabase } from './supabase.js';
import { consumeAuthCallback, hasAuthCallback } from '../services/authCallbackService.js';
import { Capacitor } from '@capacitor/core';
let processingAuthCallback = false;
import {
  initializeRouter,
  navigate,
  getCurrentPath,
  renderRoute,
} from './router.js';

import {
  onAuthStateChange,
} from '../services/authService.js';

import {
  bootstrapNotificationRuntime,
  syncHarvestNotifications,
} from '../services/notificationService.js';

import {
  initializeTheme,
} from '../services/themeService.js';

import {
  initializeNativeRuntime,
} from '../services/nativeRuntimeService.js';

initializeTheme();

onAuthStateChange((event) => {
  window.setTimeout(() => {
    if (
      event ===
      'PASSWORD_RECOVERY' && !processingAuthCallback
    ) {
      navigate(
        '/reset-password',
        {
          replace: true,
        },
      );

      return;
    }

    if (
      event ===
      'SIGNED_IN'
    ) {
      void syncHarvestNotifications()
        .catch(
          (error) => {
            console.warn(
              'Não foi possível sincronizar lembretes após o login:',
              error,
            );
          },
        );

      /*
       * A própria tela de login e os deep links nativos executam
       * a navegação necessária. Não renderizamos a rota novamente
       * aqui porque eventos de Auth também podem acontecer ao
       * retomar o aplicativo e isso destruiria formulários em edição.
       */
      return;
    }

    if (
      event ===
      'SIGNED_OUT'
    ) {
      const currentPath =
        getCurrentPath();

      if (
        currentPath !== '/login' &&
        currentPath !== '/register' &&
        currentPath !==
          '/forgot-password'
      ) {
        navigate(
          '/login',
          {
            replace: true,
          },
        );
      }

      return;
    }

    /*
     * INITIAL_SESSION, TOKEN_REFRESHED e USER_UPDATED não
     * precisam recriar a página atual. O Supabase mantém a
     * sessão internamente e preservar o DOM evita perder drafts.
     */
  }, 0);
});

async function startApp() {
  if (!Capacitor.isNativePlatform() && hasAuthCallback(window.location.href)) {
    processingAuthCallback = true;
    let route;
    try {
      route = await consumeAuthCallback(window.location.href, supabase, { origin: window.location.origin });
    } catch (error) {
      route = '/login?nativeError=' + encodeURIComponent(error.message);
    } finally {
      // Remove credentials and one-time codes from browser history, including failures.
      window.history.replaceState({}, '', route || '/login');
      processingAuthCallback = false;
    }
  }
  initializeRouter();
  await initializeNativeRuntime({ navigate, getCurrentPath });
}
void startApp().catch(() => console.error('Não foi possível inicializar o aplicativo.'));

void bootstrapNotificationRuntime({
  navigate,
});
