import {supabase} from '../js/supabase.js';
export async function salesSellers(userId){
 const [s,m,a]=await Promise.all([supabase.from('commerce_sellers').select('*'),supabase.from('commerce_memberships').select('*'),supabase.from('commerce_accounts').select('*').eq('user_id',userId).maybeSingle()]);
 for(const r of [s,m,a])if(r.error)throw r.error;
 if(!a.data?.enabled)return [];
 return s.data.filter(s=>s.owner_id===userId||m.data.some(m=>m.seller_id===s.id&&m.user_id===userId&&m.active));
}
export async function salesReport(seller,from,to,offset=0){
 const {data,error}=await supabase.rpc('trade_sales_report',{p_seller:seller,p_from:from,p_to:to,p_offset:offset});if(error)throw error;return data;
}
export async function salesOrder(orderId){
 const order=await supabase.from('trade_orders').select('*').eq('id',orderId).single();if(order.error)throw order.error;
 const versions=[];
 for(let offset=0;;offset+=500){const r=await supabase.from('trade_financial_versions').select('*').eq('order_id',orderId).order('version',{ascending:false}).range(offset,offset+499);if(r.error)throw r.error;versions.push(...r.data);if(r.data.length<500)break;}
 return {order:order.data,versions};
}
export async function saveSalesResult(data,operation){
 const r=await supabase.rpc('trade_save_financials',{p_data:data,p_operation_id:operation});if(r.error)throw r.error;return r.data;
}
export const salesError=error=>['42P01','PGRST202','PGRST205'].includes(error?.code)?'Instale a atualização de vendas e resultados para usar este painel.':error?.message||'Não foi possível carregar os resultados. Verifique a conexão.';

export async function productRanking(seller,year,month){const {data,error}=await supabase.rpc("trade_product_ranking",{p_seller:seller,p_year:year,p_month:month});if(error)throw error;return data;}
