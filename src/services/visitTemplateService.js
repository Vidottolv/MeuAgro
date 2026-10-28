import { supabase } from '../js/supabase.js';
import { offlineUserId, offlineStore, isOnline } from '../offline/runtime.js';
async function rpc(name, args = {}) {
  const user = offlineUserId();
  if (!user || !isOnline()) throw Error('Conecte-se à sua conta para salvar modelos.');
  const { data, error } = await supabase.rpc(name, args);
  if (user !== offlineUserId() || !isOnline())
    throw Error('A conta ou conexão mudou. Reabra a biblioteca.');
  if (error)
    throw Error(
      ['42P01', 'PGRST202', 'PGRST205', '42883'].includes(error.code)
        ? 'Execute a etapa 41 de evolução das visitas no Supabase.'
        : error.message,
    );
  return data;
}
export async function listVisitTemplates(strict = false) {
  const user = offlineUserId();
  if (!user) throw Error('Entre na sua conta.');
  const key = user + ':visit-templates';
  if (!isOnline()) {
    const cached = await offlineStore.get(key);
    if (user !== offlineUserId()) throw Error('A conta mudou.');
    return cached || [];
  }
  const result = await rpc('visit_template_list');
  try {
    await offlineStore.batch([[key, result]]);
  } catch (e) {
    if (strict) throw Error('Não foi possível preparar os modelos pessoais neste dispositivo.');
  }
  if (user !== offlineUserId()) throw Error('A conta mudou.');
  return result;
}
export async function saveVisitTemplate(operation, action, data) {
  return rpc('visit_template_command', { p_operation: operation, p_action: action, p_data: data });
}
