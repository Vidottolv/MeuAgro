import {pushStatus,enableTradePush,disableTradePush} from '../../services/tradePushService.js';
import {appShell} from '../../components/appShell.js';
import {escapeHtml as e} from '../../js/html.js';
import {navigate} from '../../js/router.js';
import {tradeInbox,refreshTradeNotifications,readTradeNotification} from '../../services/tradeNotificationService.js';

export async function renderTradeNotifications({session}){
 const app=document.querySelector('#app');let disposed=false;
 const paint=()=>{
  if(disposed)return;
  const data=tradeInbox(),push=pushStatus();
  app.innerHTML=appShell({session,title:'Avisos de compras',activeNav:'more',content:`<div class="commerce-page trade-page"><section class="commerce-card"><h2>Compras e conversas</h2><p>${data.unread_count} aviso(s) não lido(s). Até 100 avisos por vez, priorizando os não lidos.</p><p>${e(push.message)}</p>${push.available?`<div class="commerce-actions"><button type="button" class="button button--primary" data-enable-push>${push.enabled?'Reativar alertas do celular':'Ativar alertas do celular'}</button>${push.enabled?'<button type="button" class="button button--secondary" data-disable-push>Desativar alertas do celular</button>':''}</div>`:''}<button type="button" class="button button--secondary" data-update-inbox>Atualizar avisos</button>${data.error?`<p role="alert">${e(data.error)}</p>`:''}</section>${data.items.map(n=>`<article class="commerce-card ${!n.read_at?'trade-unread':''}"><h3>${e(n.title)}</h3><p>${e(n.body)}</p><p>${new Date(n.created_at).toLocaleString('pt-BR')} • ${n.read_at?'Lido':'Não lido'}</p><a class="button button--secondary" href="${e(n.route)}" data-notification="${n.id}">Abrir negociação</a></article>`).join('')||'<p>Nenhum aviso de compra disponível.</p>'}</div>`});
 };
 const click=async event=>{
  const pushButton=event.target.closest('[data-enable-push],[data-disable-push]');
  if(pushButton){pushButton.disabled=true;try{await (pushButton.matches('[data-enable-push]')?enableTradePush():disableTradePush());}catch{pushButton.textContent='Não foi possível concluir. Tentar novamente';}finally{pushButton.disabled=false;}return;}
  if(event.target.closest('[data-update-inbox]')){void refreshTradeNotifications();return;}
  const link=event.target.closest('[data-notification]');if(!link)return;event.preventDefault();
  const notification=tradeInbox().items.find(n=>n.id===link.dataset.notification);if(!notification)return;
  try{await readTradeNotification(notification.id);}catch{/* A leitura pode ser tentada novamente pela central. */}
  if(!disposed&&/^\/(compras|consultor\/negociacoes)\?request=[0-9a-f-]+$/.test(notification.route))navigate(notification.route);
 };
 document.addEventListener('trade-push-updated',paint);document.addEventListener('trade-notifications-updated',paint);app.addEventListener('click',click);paint();void refreshTradeNotifications();
 return()=>{disposed=true;document.removeEventListener('trade-push-updated',paint);document.removeEventListener('trade-notifications-updated',paint);app.removeEventListener('click',click);};
}

