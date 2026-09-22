import { supabase } from '../js/supabase.js';

export const requestStates = { ordered:'Pedido confirmado', awaiting:'Aguardando orçamento', awaiting_buyer:'Aguardando esclarecimento', quoted:'Proposta recebida', revision_requested:'Revisão solicitada', declined:'Proposta recusada', cancelled:'Cancelada pelo produtor', rejected:'Recusada pelo vendedor' };
export const eventLabels = { mark_delivery:'Entrega informada', report_delivery_issue:'Problema na entrega', confirm_receipt:'Recebimento confirmado', accept_quote:'Pedido confirmado', create_request:'Solicitação enviada', send_quote:'Orçamento enviado', request_revision:'Revisão solicitada', decline_quote:'Proposta recusada', ask_clarification:'Esclarecimento solicitado', answer_clarification:'Esclarecimento respondido', cancel_request:'Solicitação cancelada', reject_request:'Atendimento recusado' };
export function tradeError(e) {
  if (['42P01','PGRST202','PGRST205'].includes(e?.code)) return 'A atualização de entregas e avisos ainda não foi instalada pelo responsável pelo sistema.';
  if (['22P02','22007','22003'].includes(e?.code)) return 'Confira o código, as datas e os valores informados.';
  return e?.message || 'Falha de conexão. Tente novamente; o mesmo envio não será duplicado.';
}
export async function loadTrade() {
  if (!supabase) throw new Error('Autenticação indisponível.');
  const tables=['commerce_accounts','commerce_sellers','commerce_memberships','trade_products','trade_connections','trade_invitations','trade_requests','trade_quotes','trade_events','trade_orders','trade_messages','trade_inventory_links','trade_receipt_items','agricultural_inputs'];
  const readAll=async table=>{
    const all=[];
    const key=table==='commerce_accounts'?'user_id':table==='trade_inventory_links'?'product_id':'id';
    for(let from=0;;from+=500) {
      const result=await supabase.from(table).select('*').order(key).range(from,from+499);
      if(result.error)throw result.error;
      all.push(...result.data);
      if(result.data.length<500)return {data:all};
    }
  };
  const results=await Promise.all(tables.map(readAll));
  const state={};
  results.forEach((r,i)=>{if(r.error)throw r.error;state[tables[i]]=r.data||[];});
  const properties=await supabase.from('properties').select('id,name').is('deleted_at',null).order('name');
  if(properties.error)throw properties.error;
  state.properties=properties.data||[];
  return state;
}
export async function tradeCommand(action,data,operationId) {
  const {data:result,error}=await supabase.rpc(['mark_delivery','report_delivery_issue','confirm_receipt'].includes(action)?'fulfillment_command':'trade_command',{p_action:action,p_data:data,p_operation_id:operationId});
  if(error)throw error;
  return result;
}
export const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value));
