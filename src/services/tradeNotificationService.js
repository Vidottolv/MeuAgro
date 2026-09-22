import {supabase} from '../js/supabase.js';

let userId=null,generation=0,timer=null,pending=false,loaded=false;
let inbox={items:[],unread_count:0},lastError='';
export const tradeUnreadCount=()=>inbox.unread_count;
export const tradeInbox=()=>({...inbox,error:lastError,loaded});
function paintCount(){
 for(const el of document.querySelectorAll('[data-trade-unread]')){el.textContent=inbox.unread_count>99?'99+':inbox.unread_count?String(inbox.unread_count):'';el.closest('.trade-bell')?.setAttribute('aria-label','Avisos de compras'+(inbox.unread_count?', '+inbox.unread_count+' não lidos':''));}
 document.dispatchEvent(new CustomEvent('trade-notifications-updated'));
}
function toast(title){
 document.querySelector('#trade-toast')?.remove();
 const el=document.createElement('aside');el.id='trade-toast';el.className='trade-toast';el.setAttribute('role','status');
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Fechar aviso');close.onclick=()=>el.remove();
 const text=document.createElement('p');text.textContent=title;
 const link=document.createElement('a');link.href='/notificacoes/compras';link.dataset.link='';link.className='button button--secondary';link.textContent='Ver avisos';link.onclick=()=>el.remove();
 el.append(close,text,link);document.body.append(el);
 window.setTimeout(()=>el.remove(),12000);
}
export async function refreshTradeNotifications(){
 if(!supabase||!userId||pending)return;
 const current=generation;pending=true;
 try{
  const {data,error}=await supabase.rpc('trade_notification_inbox');
  if(current!==generation)return;
  if(error)throw error;
  const previous=new Set(inbox.items.map(n=>n.id));
  const next={items:Array.isArray(data?.items)?data.items:[],unread_count:Number(data?.unread_count)||0};
  const latest=Math.max(0,...inbox.items.map(n=>new Date(n.created_at).getTime()));
  const fresh=loaded?next.items.filter(n=>!n.read_at&&!previous.has(n.id)&&new Date(n.created_at).getTime()>=latest):[];
  inbox=next;lastError='';loaded=true;paintCount();
  if(fresh.length)toast(fresh.length>1?`${fresh.length} novas atualizações de compras`:fresh[0].title);
 }catch(error){
  if(current===generation){lastError=['42P01','PGRST202','PGRST205'].includes(error?.code)?'Instale a atualização de entregas e avisos para ativar esta central.':'Não foi possível atualizar os avisos. Verifique sua conexão.';paintCount();}
 }finally{if(current===generation)pending=false;}
}
export function setTradeNotificationSession(session){
 const next=session?.user?.id||null;
 if(next===userId)return;
 userId=next;generation++;pending=false;loaded=false;lastError='';inbox={items:[],unread_count:0};
 clearInterval(timer);timer=null;document.querySelector('#trade-toast')?.remove();paintCount();
 if(userId){void refreshTradeNotifications();timer=setInterval(()=>{if(!document.hidden)void refreshTradeNotifications();},15000);}
}
export async function readTradeNotification(id){
 if(!supabase||!userId)return;
 const current=generation;
 const {error}=await supabase.rpc('trade_mark_notification_read',{p_id:id});
 if(error)throw error;
 if(current===generation)await refreshTradeNotifications();
}
window.addEventListener('focus',()=>void refreshTradeNotifications());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshTradeNotifications();});
