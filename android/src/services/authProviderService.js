import { Capacitor } from '@capacitor/core';
import { supabase } from '../js/supabase.js';
import { getAuthRedirectUrl } from './authRedirectService.js';

// Disabled until credentials and consent screens are configured in Supabase/providers.
export const AUTH_PROVIDERS = Object.freeze({
  google: { enabled: import.meta.env?.VITE_AUTH_GOOGLE_ENABLED === 'true' },
  apple: { enabled: import.meta.env?.VITE_AUTH_APPLE_ENABLED === 'true' },
});
export async function signInWithProvider(provider, { openExternal } = {}) {
  if (!Object.hasOwn(AUTH_PROVIDERS, provider) || !AUTH_PROVIDERS[provider].enabled) {
    throw new Error('Este provedor de login ainda não está habilitado.');
  }
  if (!supabase) throw new Error('Autenticação não configurada.');
  const native = Capacitor.isNativePlatform();
  if (native && typeof openExternal !== 'function') throw new Error('Configure o navegador externo para autenticação nativa.');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider, options: { redirectTo: getAuthRedirectUrl('oauth'), skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('O provedor não retornou um endereço de login.');
  if (native) await openExternal(data.url);
  else window.location.assign(data.url);
}
