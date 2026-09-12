const nativePaths = new Set(['/callback', '/recovery', '/login', '/reset-password']);
const webPaths = new Set(['/auth/callback', '/auth/recovery', '/login', '/reset-password']);
export function isAuthCallbackUrl(value, { native = false, origin } = {}) {
  try {
    const url = new URL(value);
    if (url.username || url.password || (url.port && native)) return false;
    if (native) return url.protocol === 'meuagro:' && url.hostname === 'auth' && nativePaths.has(url.pathname);
    return ['https:', 'http:'].includes(url.protocol) && url.origin === origin && webPaths.has(url.pathname);
  } catch { return false; }
}
export function hasAuthCallback(value) {
  const url = new URL(value);
  const hash = new URLSearchParams(url.hash.slice(1));
  return url.pathname.startsWith('/auth/') || ['code', 'error', 'error_description', 'access_token', 'refresh_token'].some(
    key => url.searchParams.has(key) || hash.has(key));
}
// Shared by e-mail confirmation, recovery and future OAuth providers.
export async function consumeAuthCallback(value, client, options) {
  if (!isAuthCallbackUrl(value, options)) throw new Error('Link de autenticação inválido.');
  if (!client) throw new Error('O serviço de autenticação não está configurado.');
  const url = new URL(value);
  const hash = new URLSearchParams(url.hash.slice(1));
  const param = key => url.searchParams.get(key) || hash.get(key);
  if (param('error') || param('error_description')) throw new Error('Este link expirou, já foi utilizado ou foi cancelado. Solicite um novo e-mail.');
  let result;
  if (param('code')) {
    result = await client.auth.exchangeCodeForSession(param('code'));
  } else if (hash.get('access_token') && hash.get('refresh_token')) {
    result = await client.auth.setSession({ access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token') });
  } else {
    throw new Error('Link incompleto. Abra o link enviado no e-mail ou solicite um novo.');
  }
  if (result.error) throw new Error('Não foi possível validar o link. Solicite um novo e-mail e abra-o no dispositivo que iniciou a solicitação.');
  if (!result.data?.session) throw new Error('O link não criou uma sessão válida. Solicite um novo e-mail.');
  const recovery = ['/recovery', '/auth/recovery', '/reset-password'].includes(url.pathname) || param('type') === 'recovery' || result.data.redirectType === 'recovery';
  return recovery ? '/reset-password' : '/dashboard';
}
