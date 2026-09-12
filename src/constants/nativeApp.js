import { isAuthCallbackUrl } from '../services/authCallbackService.js';
export const NATIVE_APP = {
  appId: 'com.meuagro.app',
  appName: 'Meu Agro',
  scheme: 'meuagro',
  authHost: 'auth',
};

export function isNativeAuthUrl(
  value,
) {
  return isAuthCallbackUrl(value, { native: true });
}

export function nativeAuthUrl(
  path = '/',
) {
  const normalizedPath =
    String(path || '/')
      .startsWith('/')
      ? String(path || '/')
      : `/${path}`;

  return `${NATIVE_APP.scheme}://${NATIVE_APP.authHost}${normalizedPath}`;
}
