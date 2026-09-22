import {consumeAuthCallback, isAuthCallbackUrl} from './authCallbackService.js';
import {completeProviderSignIn} from './authProviderService.js';
export async function completeAuthCallback(value, client, options) {
  if (!isAuthCallbackUrl(value, options)) throw new Error('Link de autenticação inválido.');
  if (new URL(value).searchParams.get('flow') === 'oauth') return completeProviderSignIn(value);
  return consumeAuthCallback(value, client, options);
}
