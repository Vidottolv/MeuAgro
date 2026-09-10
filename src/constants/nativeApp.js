export const NATIVE_APP = {
  appId: 'com.meuagro.app',
  appName: 'Meu Agro',
  scheme: 'meuagro',
  authHost: 'auth',
};

export function isNativeAuthUrl(
  value,
) {
  return String(value || '')
    .startsWith(
      `${NATIVE_APP.scheme}://${NATIVE_APP.authHost}`,
    );
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
