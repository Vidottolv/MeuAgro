import {Capacitor} from '@capacitor/core';
import {PushNotifications} from '@capacitor/push-notifications';
import {supabase} from '../js/supabase.js';
import {refreshTradeNotifications} from './tradeNotificationService.js';

const supported=()=>Capacitor.getPlatform()==='android';
const configured=()=>import.meta.env.VITE_PUSH_ENABLED==='true';
let user=null,token=null,handles=[],generation=0,initializing=null;
let message='';
const preference=id=>'meuagro.push.'+id;
const emit=()=>document.dispatchEvent(new CustomEvent('trade-push-updated'));
export function pushStatus(){return {available:supported()&&configured(),enabled:!!user&&localStorage.getItem(preference(user))==='true',message:message||(!supported()?'Os avisos permanecem disponíveis nesta central. Ative os alertas do celular no aplicativo Android.':!configured()?'Os alertas do celular ainda não foram ativados pelo responsável pelo aplicativo.':'Ative os alertas para acompanhar mensagens, propostas e entregas com o aplicativo fechado.')};}
async function listen(){
 if(handles.length)return;
 if(initializing)return initializing;
 initializing=(async()=>{
  handles.push(await PushNotifications.addListener('registration',async value=>{
   const active=user,version=generation;if(!active||localStorage.getItem(preference(active))!=='true')return;
   token=value.value;
   try{
    const result=await supabase.rpc('trade_register_push',{p_token:token});if(result.error)throw result.error;
    if(active!==user||version!==generation)return;
    message='Alertas do celular ativados.';
   }catch{if(active===user&&version===generation)message='Não foi possível registrar os alertas. Confira a conexão e tente ativar novamente.';}
   emit();
  }));
  handles.push(await PushNotifications.addListener('registrationError',()=>{message='Não foi possível ativar os alertas. Confira a configuração e tente novamente.';emit();}));
  handles.push(await PushNotifications.addListener('pushNotificationReceived',()=>void refreshTradeNotifications()));
  handles.push(await PushNotifications.addListener('pushNotificationActionPerformed',async event=>{
   const data=event.notification.data;
   // Always use the signed-in recipient and a route resolved through current RLS.
   const session=(await supabase.auth.getSession()).data.session;
   if(!session||session.user.id!==data?.recipient_id)return;
   const {data:inbox,error}=await supabase.rpc('trade_notification_inbox');
   const item=inbox?.items?.find(n=>n.id===data.notification_id);
   const {navigate}=await import('../js/router.js');
   if(!error&&item&&/^\/(compras|consultor\/negociacoes)\?request=[0-9a-f-]+$/.test(item.route))navigate(item.route);
   else navigate('/notificacoes/compras');
  }));
 })().finally(()=>{initializing=null;});return initializing;
}
export async function enableTradePush(){
 if(!user||!supported()||!configured())return;
 await listen();
 const current=user;
 let permission=await PushNotifications.checkPermissions();
 if(permission.receive==='prompt'||permission.receive==='prompt-with-rationale')permission=await PushNotifications.requestPermissions();
 if(user!==current)return;
 if(permission.receive!=='granted'){message='Permita notificações nas configurações do Android para receber alertas.';emit();return;}
 localStorage.setItem(preference(user),'true');
 await PushNotifications.createChannel({id:'trade_updates',name:'Compras e conversas',description:'Mensagens, propostas e entregas',importance:4,visibility:0});
 message='Ativando alertas…';emit();await PushNotifications.register();
}
export async function disableTradePush({forget=true}={}){
 if(!supported()||!configured())return;
 const active=user;
 // Deleting the native FCM token also prevents delivery if the server is unreachable.
 const results=await Promise.allSettled([token?supabase.rpc('trade_unregister_push',{p_token:token}).then(r=>{if(r.error)throw r.error;}):Promise.resolve(),PushNotifications.unregister()]);
 if((!token&&results[1].status==='rejected')||results.every(r=>r.status==='rejected'))throw new Error('Não foi possível desativar os alertas. Confira a conexão e tente novamente.');
 if(forget&&active)localStorage.removeItem(preference(active));
 token=null;message='Alertas do celular desativados.';emit();
}
export function setPushSession(session){
 const next=session?.user?.id||null;if(next===user)return;
 user=next;generation++;token=null;message='';
 if(!supported()||!configured())return;
 if(!user){void PushNotifications.unregister().catch(()=>{});return;}
 if(localStorage.getItem(preference(user))==='true')void enableTradePush().catch(()=>{message='Não foi possível retomar os alertas. Tente ativá-los novamente.';emit();});
 else void PushNotifications.unregister().catch(()=>{});
}
