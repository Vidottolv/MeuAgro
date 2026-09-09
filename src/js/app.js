import {
  initializeRouter,
  navigate,
  getCurrentPath,
  renderRoute,
} from './router.js';

import {
  onAuthStateChange,
} from '../services/authService.js';

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
