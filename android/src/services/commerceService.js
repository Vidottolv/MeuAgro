import { supabase } from '../js/supabase.js';

export function commerceError(error) {
  if (['42P01','PGRST202','PGRST205'].includes(error?.code)) return 'O módulo Consultor ainda precisa ser instalado pelo responsável pelo sistema. Seu modo produtor continua disponível.';
  if (error?.code === '22P02') return 'Confira o código do convite e tente novamente.';
  if (error?.code === '23505') return 'Este cadastro ou convite já existe. Atualize a página antes de tentar novamente.';
  return error?.message || 'Não foi possível concluir. Verifique sua conexão e tente novamente.';
}

export async function loadCommerce() {
  if (!supabase) throw new Error('Não foi possível conectar à sua conta.');
  const results = await Promise.all([
    supabase.from('commerce_accounts').select('*').maybeSingle(),
    supabase.from('commerce_sellers').select('*').order('created_at'),
    supabase.from('commerce_memberships').select('*').order('joined_at'),
    supabase.from('commerce_invitations').select('*').order('created_at', { ascending: false }),
  ]);
  for (const result of results) if (result.error) throw result.error;
  return { account: results[0].data, sellers: (results[1].data || []).filter(s => s.owner_id === results[0].data?.user_id || (results[2].data || []).some(m => m.user_id === results[0].data?.user_id && m.seller_id === s.id)), memberships: results[2].data || [], invitations: results[3].data || [] };
}

export async function commerceCommand(action, data = {}) {
  if (!supabase) throw new Error('Não foi possível conectar à sua conta.');
  const result = await supabase.rpc('commerce_command', { p_action: action, p_data: data });
  if (result.error) throw result.error;
  return result.data;
}

export function sellerAccess(seller, memberships, userId) {
  if (seller.owner_id === userId) return { owner: true, active: true, label: seller.kind === 'personal' ? 'Por conta própria' : 'Responsável pela empresa' };
  const member = memberships.find(row => row.seller_id === seller.id && row.user_id === userId);
  return { owner: false, active: !!member?.active, label: member?.active ? 'Representante' : 'Vínculo encerrado' };
}
