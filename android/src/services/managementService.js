import {supabase} from '../js/supabase.js';
const rpc=async(name,args={})=>{const {data,error}=await supabase.rpc(name,args);if(error)throw error;return data;};
export const managementCompanies=()=>rpc('management_companies');
export const managementReport=(seller,from,to,filter={},offset=0)=>rpc('management_report',{p_seller:seller,p_from:from,p_to:to,p_filter:filter,p_offset:offset});
export const managementWallet=(seller,search='',offset=0)=>rpc('management_wallet',{p_seller:seller,p_search:search,p_offset:offset});
export const managementWorkspace=request=>rpc('management_workspace',{p_request:request});
export const managementCommand=(action,data,operation)=>rpc('management_command',{p_action:action,p_data:data,p_operation_id:operation});
export const managementError=error=>['42P01','PGRST202','PGRST205','42703'].includes(error?.code)?'A gestão da empresa precisa ser atualizada pelo responsável pelo sistema.':error?.message||'Não foi possível concluir. Verifique a conexão.';
