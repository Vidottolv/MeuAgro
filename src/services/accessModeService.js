import { reactive } from 'vue';
import { supabase } from '../js/supabase.js';
export const accessMode = reactive({ mode: 'unknown', active: false, protected: false });
let currentUser = '';
export async function resolveAccessMode(session) {
  const user = session?.user?.id || '';
  currentUser = user;
  Object.assign(accessMode, { mode: 'unknown', active: false, protected: false });
  if (!user) return accessMode;
  const key = `meuagro-access:${import.meta.env.VITE_SUPABASE_URL}:${user}`;
  if (!navigator.onLine) {
    let cached;
    try {
      cached = localStorage.getItem(key);
    } catch {}
    if (!['full', 'lite'].includes(cached))
      throw Error('Conecte-se para identificar o plano da conta.');
    Object.assign(accessMode, { mode: cached });
    return accessMode;
  }
  const { data, error } = await supabase.rpc('app_lite_access');
  if (currentUser !== user) throw Error('A conta mudou. Atualize a página.');
  // Preserve compatibility before the administrator installs stage 59.
  if (error && !['PGRST202', '42883'].includes(error.code))
    throw Error('Não foi possível verificar o plano. Atualize a página para tentar novamente.');
  const value = error ? { mode: 'full', active: true } : data;
  if (!['full', 'lite'].includes(value?.mode)) throw Error('Resposta de plano inválida.');
  if (value.mode === 'lite' && !value.protected)
    throw Error('O administrador precisa ativar a proteção do plano Lite no Supabase.');
  Object.assign(accessMode, value);
  try {
    localStorage.setItem(key, value.mode);
  } catch {}
  return accessMode;
}
export function liteRouteAllowed(path) {
  return (
    path.startsWith('/consultor/lite') ||
    [
      '/help',
      '/more/help',
      '/more/profile',
      '/more/account-plan',
      '/reset-password',
      '/login',
      '/register',
      '/forgot-password',
    ].includes(path)
  );
}
