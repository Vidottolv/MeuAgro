import { Capacitor } from '@capacitor/core';
export function getAuthRedirectUrl(flow = 'confirmation', {
  native = Capacitor.isNativePlatform(),
  webUrl = import.meta.env?.VITE_APP_URL,
  origin = globalThis.location?.origin,
  development = import.meta.env?.DEV === true,
} = {}) {
  if (!['confirmation', 'recovery', 'oauth'].includes(flow)) throw new Error('Fluxo de autenticação inválido.');
  const path = flow === 'recovery' ? 'recovery' : 'callback';
  if (native) return 'meuagro://auth/' + path;
  const base = new URL(webUrl?.trim() || origin);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if (base.username || base.password ||
      !(base.protocol === 'https:' || (development && base.protocol === 'http:')) ||
      (local && !development)) {
    throw new Error('Configure VITE_APP_URL com o endereço HTTPS publicado do Meu Agro.');
  }
  return new URL('/auth/' + path, base.origin).href;
}
