import { consumeAuthCallback } from './authCallbackService.js';
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

let callbackQueue = Promise.resolve();
let lastHandledUrl = null;
// Serialize cold/warm delivery; duplicate successful callbacks must not reuse a code.
export function handleNativeAppUrl(nativeUrl, { navigate } = {}) {
  if (!isNativeAuthUrl(nativeUrl)) return Promise.resolve(false);
  const task = callbackQueue.then(async () => {
    if (nativeUrl === lastHandledUrl) return true;
    try {
      const route = await consumeAuthCallback(nativeUrl, supabase, { native: true });
      lastHandledUrl = nativeUrl;
      navigate?.(route, { replace: true });
      return true;
    } catch {
      navigate?.('/login?nativeError=' + encodeURIComponent('Não foi possível validar o link. Solicite um novo e-mail e tente novamente.'), { replace: true });
      return false;
    }
  });
  callbackQueue = task.catch(() => false);
  return task;
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

  // Register first so a link arriving during startup is not missed.
  listenerHandles.push(await App.addListener('appUrlOpen', ({ url }) => {
    void handleNativeAppUrl(url, { navigate });
  }));
  const launch = await App.getLaunchUrl();
  if (launch?.url) await handleNativeAppUrl(launch.url, { navigate });

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
