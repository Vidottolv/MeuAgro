import { supabase } from '../js/supabase.js';
import { offlineUserId, isOnline } from '../offline/runtime.js';
export async function satelliteRpc(name, args = {}) {
  const user = offlineUserId();
  if (!supabase || !user) throw Error('Entre na sua conta.');
  if (!isOnline()) throw Error('Mapas compartilhados e monitoramento exigem conexão.');
  const { data, error } = await supabase.rpc(name, args);
  if (user !== offlineUserId() || !isOnline())
    throw Error('A conta ou conexão mudou. Atualize a tela.');
  if (error)
    throw Error(
      ['42P01', 'PGRST202', 'PGRST205', '42883'].includes(error.code)
        ? name.startsWith('satellite_image_')
          ? 'Execute a etapa 36 de imagens de satélite no Supabase.'
          : 'Execute a etapa 35 de mapas e satélite no Supabase.'
        : error.message,
    );
  return data;
}
export async function satelliteFunction(body) {
  const user = offlineUserId();
  if (!user || !isOnline()) throw Error('Conecte-se e entre na sua conta.');
  const { data, error } = await supabase.functions.invoke('satellite-imagery', { body });
  if (user !== offlineUserId() || !isOnline())
    throw Error('A sessão ou a conexão mudou. Atualize a tela.');
  if (error) {
    let message =
      'Não foi possível consultar as imagens. Confira a instalação da função satellite-imagery.';
    try {
      const result = await error.context?.json();
      if (result?.error) message = result.error;
    } catch {
      /* A non-JSON gateway failure has no user-facing provider details. */
    }
    throw Error(message);
  }
  if (body.action === 'view') {
    if (
      !(data instanceof Blob) ||
      data.size > 2097152 ||
      new Uint8Array(await data.slice(0, 8).arrayBuffer()).join(',') !== '137,80,78,71,13,10,26,10'
    )
      throw Error('A resposta não contém uma imagem PNG válida.');
    return new Blob([data], { type: 'image/png' });
  }
  return data;
}
