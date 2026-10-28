import { supabase } from '../js/supabase.js';
import { offlineUserId, isOnline } from '../offline/runtime.js';
export async function expenseRpc(name, args = {}) {
  const user = offlineUserId();
  if (!user || !isOnline()) throw Error('Conecte-se e entre na sua conta para gerenciar despesas.');
  const { data, error } = await supabase.rpc(name, args);
  if (user !== offlineUserId() || !isOnline())
    throw Error('A conta ou conexão mudou. Atualize a tela.');
  if (error)
    throw Error(
      ['42P01', 'PGRST202', 'PGRST205', '42883'].includes(error.code)
        ? name.startsWith('receivable_')
          ? 'Execute a etapa 45 de contas a receber no Supabase.'
          : ['expense_allocation_context', 'expense_allocate', 'operating_cost_report'].includes(
                name,
              )
            ? 'Execute a etapa 44 de rateio no Supabase.'
            : 'Execute a etapa 43 de despesas operacionais no Supabase.'
        : error.message,
    );
  return data;
}
