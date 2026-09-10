import {
  App,
} from '@capacitor/app';

import {
  Capacitor,
} from '@capacitor/core';

import {
  supabase,
} from '../js/supabase.js';

import {
  NATIVE_APP,
  isNativeAuthUrl,
} from '../constants/nativeApp.js';

let initialized = false;
let listenerHandles = [];

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function getPlatformName() {
  return Capacitor.getPlatform();
}

function getRouteFromNativeUrl(
  nativeUrl,
) {
  const url =
    new URL(nativeUrl);

  const pathname =
    url.pathname || '/';

  const search =
    url.search || '';

  if (
    url.hostname ===
    NATIVE_APP.authHost
  ) {
    return `${pathname}${search}`;
  }

  return '/dashboard';
}

async function applySupabaseSessionFromUrl(
  nativeUrl,
) {
  if (!supabase) {
    return;
  }

  const url =
    new URL(nativeUrl);

  const errorDescription =
    url.searchParams.get(
      'error_description',
    ) ||
    new URLSearchParams(
      url.hash.replace(
        /^#/,
        '',
      ),
    ).get(
      'error_description',
    );

  if (errorDescription) {
    throw new Error(
      decodeURIComponent(
        errorDescription,
      ),
    );
  }

  const code =
    url.searchParams.get(
      'code',
    );

  if (code) {
    const {
      error,
    } =
      await supabase.auth
        .exchangeCodeForSession(
          code,
        );

    if (error) {
      throw error;
    }

    return;
  }

  const hashParams =
    new URLSearchParams(
      url.hash.replace(
        /^#/,
        '',
      ),
    );

  const accessToken =
    hashParams.get(
      'access_token',
    );

  const refreshToken =
    hashParams.get(
      'refresh_token',
    );

  if (
    accessToken &&
    refreshToken
  ) {
    const {
      error,
    } =
      await supabase.auth
        .setSession({
          access_token:
            accessToken,
          refresh_token:
            refreshToken,
        });

    if (error) {
      throw error;
    }
  }
}

export async function handleNativeAppUrl(
  nativeUrl,
  {
    navigate,
  } = {},
) {
  if (
    !nativeUrl ||
    !isNativeAuthUrl(
      nativeUrl,
    )
  ) {
    return false;
  }

  try {
    await applySupabaseSessionFromUrl(
      nativeUrl,
    );

    const route =
      getRouteFromNativeUrl(
        nativeUrl,
      );

    if (
      typeof navigate ===
      'function'
    ) {
      navigate(
        route,
        {
          replace: true,
        },
      );
    }

    return true;
  } catch (error) {
    console.error(
      'Falha ao processar link de autenticação do aplicativo:',
      error,
    );

    if (
      typeof navigate ===
      'function'
    ) {
      const message =
        encodeURIComponent(
          error.message ||
          'Não foi possível concluir a autenticação.',
        );

      navigate(
        `/login?nativeError=${message}`,
        {
          replace: true,
        },
      );
    }

    return false;
  }
}

export async function initializeNativeRuntime({
  navigate,
  getCurrentPath,
} = {}) {
  if (
    initialized ||
    !isNativeApp()
  ) {
    return;
  }

  initialized = true;

  const launch =
    await App.getLaunchUrl();

  if (launch?.url) {
    await handleNativeAppUrl(
      launch.url,
      {
        navigate,
      },
    );
  }

  listenerHandles.push(
    await App.addListener(
      'appUrlOpen',
      ({ url }) => {
        void handleNativeAppUrl(
          url,
          {
            navigate,
          },
        );
      },
    ),
  );

  listenerHandles.push(
    await App.addListener(
      'backButton',
      ({ canGoBack }) => {
        const currentPath =
          typeof getCurrentPath ===
            'function'
            ? getCurrentPath()
            : window.location
                .pathname;

        if (
          canGoBack &&
          window.history.length >
            1
        ) {
          window.history.back();
          return;
        }

        if (
          currentPath !==
            '/dashboard' &&
          typeof navigate ===
            'function'
        ) {
          navigate('/dashboard');
          return;
        }

        void App.exitApp();
      },
    ),
  );
}

export async function removeNativeRuntimeListeners() {
  const handles =
    listenerHandles;

  listenerHandles = [];
  initialized = false;

  await Promise.all(
    handles.map(
      (handle) =>
        handle.remove(),
    ),
  );
}
