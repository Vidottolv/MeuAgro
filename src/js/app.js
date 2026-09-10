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

initializeTheme();

onAuthStateChange((event) => {
  window.setTimeout(() => {
    if (
      event ===
      'PASSWORD_RECOVERY'
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

        return;
      }
    }

    void renderRoute();
  }, 0);
});

initializeRouter();

void bootstrapNotificationRuntime({
  navigate,
});
