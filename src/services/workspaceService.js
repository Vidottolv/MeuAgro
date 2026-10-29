import { supabase } from '../js/supabase.js';
import { offlineUserId, isOnline } from '../offline/runtime.js';
export async function workspaceRpc(name, args = {}) {
  const user = offlineUserId();
  if (!user || !isOnline()) throw Error('Conecte-se e entre na sua conta.');
  const { data, error } = await supabase.rpc(name, args);
  if (user !== offlineUserId() || !isOnline())
    throw Error('A conta ou conexão mudou. Atualize a tela.');
  if (error)
    throw Error(
      ['42P01', 'PGRST202', 'PGRST205', '42883'].includes(error.code)
        ? name.startsWith('visit_ai_')
          ? 'Instale a etapa 58 de apoio de IA no Supabase.'
          : /^(app_operations_|app_privacy_)/.test(name)
            ? 'Instale a etapa 57 de operação e privacidade no Supabase.'
            : name === 'app_farm_workflow'
              ? 'Instale a etapa 55 de conferência agrícola no Supabase.'
              : name === 'app_permissions_context'
                ? 'Instale a etapa 54 de permissões e isolamento no Supabase.'
                : name.startsWith('app_onboarding_')
                  ? 'Instale a etapa 53 de primeiros passos por perfil no Supabase.'
                  : name.startsWith('app_lifecycle_')
                    ? 'Instale a etapa 52 de ciclo da assinatura no Supabase.'
                    : /^(app_commercial_|app_trial_|app_change_)/.test(name)
                      ? 'Instale a etapa 51 de regras comerciais no Supabase.'
                      : name.startsWith('app_checkout_')
                        ? 'Instale a etapa 50 de contratação no Supabase.'
                        : name === 'app_is_platform_admin' || name.startsWith('app_admin_')
                          ? 'Instale a etapa 49 de administração no Supabase.'
                          : 'Instale as etapas 45 a 48 deste pacote no Supabase.'
        : error.message,
    );
  return data;
}
export async function workspaceFunction(name, body) {
  const user = offlineUserId();
  if (!user || !isOnline()) throw Error('Conecte-se e entre na sua conta.');
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (user !== offlineUserId() || !isOnline()) throw Error('A conta ou conexão mudou.');
  if (error) {
    let message = 'Integração indisponível. Confira a ativação no servidor.';
    try {
      const e = await error.context?.json();
      if (e?.error) message = e.error;
    } catch {}
    throw Error(message);
  }
  return data;
}
