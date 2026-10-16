import { supabase } from '../js/supabase.js';
import { isOnline, offlineUserId } from '../offline/runtime.js';

// POST RPC responses intentionally never enter IndexedDB or the producer GET cache.
export async function sharingRpc(name, args = {}) {
  const user = offlineUserId();
  if (!user || !supabase) throw Error('Entre na sua conta.');
  if (!isOnline()) throw Error('O compartilhamento técnico exige conexão com a internet.');
  const { data, error } = await supabase.rpc(name, args);
  if (user !== offlineUserId() || !isOnline())
    throw Error('A sessão ou a conexão mudou. Atualize a página.');
  if (error) {
    if (['42P01', 'PGRST202', 'PGRST205', '42883'].includes(error.code))
      throw Error('Instale a etapa 34 de compartilhamento no Supabase.');
    throw Error(error.message || 'Não foi possível consultar o compartilhamento.');
  }
  return data;
}
export const listPropertyShares = () => sharingRpc('property_share_list');
export const propertyShareDetail = (id) => sharingRpc('property_share_detail', { p_id: id });
export const propertyShareCommand = (action, data) =>
  sharingRpc('property_share_command', { p_action: action, p_data: data });
