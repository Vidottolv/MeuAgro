import { supabase } from '../js/supabase.js';
import { offlineUserId, isOnline } from '../offline/runtime.js';
export async function taskRpc(name, args = {}) {
  const user = offlineUserId();
  if (!user || !isOnline()) throw Error('Conecte-se e entre na sua conta para gerenciar tarefas.');
  const { data, error } = await supabase.rpc(name, args);
  if (user !== offlineUserId() || !isOnline())
    throw Error('A conta ou conexão mudou. Atualize a tela.');
  if (error)
    throw Error(
      ['42P01', 'PGRST202', 'PGRST205', '42883'].includes(error.code)
        ? 'Execute as etapas 39 e 40 de tarefas técnicas no Supabase.'
        : error.message,
    );
  return data;
}
