import {Capacitor} from '@capacitor/core';
import {Browser} from '@capacitor/browser';
import {createClient} from '@supabase/supabase-js';
import {supabase} from '../js/supabase.js';
import {getAuthRedirectUrl} from './authRedirectService.js';
import {createOAuthFlow, verifierStorage} from './oauthFlow.js';

export const AUTH_PROVIDERS = Object.freeze({
  google: {enabled:import.meta.env?.VITE_AUTH_GOOGLE_ENABLED === 'true'},
  apple: {enabled:false},
});
let flow;
function getFlow() {
  if (flow) return flow;
  if (!supabase) throw new Error('Autenticação não configurada.');
  const projectUrl = import.meta.env.VITE_SUPABASE_URL.trim();
  const key = 'meuagro-oauth-' + new URL(projectUrl).hostname;
  const storage = globalThis.localStorage;
  const client = createClient(projectUrl, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY.trim(), {
    auth:{flowType:'pkce', storageKey:key, storage:verifierStorage(storage,key), persistSession:true, autoRefreshToken:false, detectSessionInUrl:false},
  });
  flow = createOAuthFlow({client, sessionClient:supabase, storage, key, projectUrl,
    redirectUrl:() => {
      const url = getAuthRedirectUrl('oauth');
      if (!Capacitor.isNativePlatform() && new URL(url).origin !== location.origin) throw new Error('Abra o Meu Agro pelo endereço configurado em VITE_APP_URL para entrar com Google.');
      return url;
    },
    open:async url => {
      if (Capacitor.isNativePlatform()) await Browser.open({url, toolbarColor:'#1f5d3a'});
      else location.assign(url);
    },
  });
  return flow;
}
export async function signInWithProvider(provider, {destination} = {}) {
  if (provider !== 'google' || !AUTH_PROVIDERS.google.enabled) throw new Error('O login Google ainda não foi habilitado.');
  return getFlow().start(destination);
}
export function cancelProviderSignIn() {
  // A page reload may leave an earlier Google attempt in storage.
  if (AUTH_PROVIDERS.google.enabled && supabase) getFlow().cancel();
}
export const completeProviderSignIn = value => getFlow().finish(value);
export async function closeAuthBrowser() {
  if (Capacitor.isNativePlatform()) await Browser.close().catch(() => {});
}
export function providerErrorMessage(error) {
  const message = error?.message || '';
  if (/provider.*(disabled|not enabled)|unsupported provider/i.test(message)) return 'O login Google ainda precisa ser configurado pelo responsável pelo aplicativo.';
  if (/fetch|network|failed to load/i.test(message)) return 'Não foi possível conectar ao Google. Confira sua internet e tente novamente.';
  return /[áàãâéêíóôõúç]/i.test(message) ? message : 'Não foi possível iniciar o login Google. Tente novamente ou entre com e-mail e senha.';
}
