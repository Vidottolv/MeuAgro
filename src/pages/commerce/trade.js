import { appShell } from '../../components/appShell.js';
import { escapeHtml as e } from '../../js/html.js';
import { navigate } from '../../js/router.js';
import { loadTrade, tradeCommand, tradeError, money, requestStates, eventLabels } from '../../services/tradeService.js';
import { showConfirmModal } from '../../components/confirmModal.js';

let controlSequence=0;
const field=(name,label,value='',extra='',type='text')=>{const id='trade-control-'+(++controlSequence);return `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${name}" type="${type}" value="${e(value)}" ${extra}></div>`;};
const area=(name,label,value='',max=2000)=>{const id='trade-control-'+(++controlSequence);return `<div class="field"><label for="${id}">${label}</label><textarea id="${id}" name="${name}" maxlength="${max}" rows="3">${e(value)}</textarea></div>`;};
const select=(name,label,options,value='')=>{const id='trade-control-'+(++controlSequence);return `<div class="field"><label for="${id}">${label}</label><select id="${id}" name="${name}">${options.map(([id,text])=>`<option value="${e(id)}" ${String(id)===String(value)?'selected':''}>${e(text)}</option>`).join('')}</select></div>`;};
const btn=(label,attrs='',secondary=false)=>`<button class="button button--${secondary?'secondary':'primary'}" ${attrs}>${label}</button>`;
const hidden=(name,value)=>`<input type="hidden" name="${name}" value="${e(value)}">`;
const when=value=>new Date(value).toLocaleString('pt-BR');
const packaging=item=>`${item.package_name} • ${Number(item.package_size).toLocaleString('pt-BR')} ${item.base_unit}`;
const availability={available:'Disponível',on_request:'Sob consulta',unavailable:'Indisponível'};
const deliveryStates={confirmed:'Aguardando entrega',awaiting_receipt:'Aguardando confirmação do produtor',delivery_issue:'Problema na entrega',received:'Recebido e adicionado ao barracão'};
const stockUnit=unit=>({kg:'kg',L:'l',un:'unit'}[unit]);
const terminal=['ordered','declined','cancelled','rejected'];

export async function renderTradePage({session}) {
  const app=document.querySelector('#app'), uid=session.user.id;
  const commercial=window.location.pathname.startsWith('/consultor');
  const base=commercial?'/consultor/negociacoes':'/compras';
  const params=new URLSearchParams(window.location.search);
  const requestId=params.get('request'), selected=params.get('seller');
  let state,busy=false,disposed=false;
  const retries=new Map();
  const shell=content=>appShell({session,title:commercial?'Catálogo e propostas':'Minhas compras',activeNav:commercial?'commerce':'more',content:`<div class="commerce-page trade-page">${content}</div>`});
  app.innerHTML=shell('<p role="status">Carregando negociações…</p>');
  const notice=(text,error=false)=>{const el=app.querySelector('#trade-feedback');if(el){el.textContent=text;el.hidden=!text;el.className=`form-message form-message--${error?'error':'success'}`;}};
  const owns=s=>s.owner_id===uid;
  const acts=s=>owns(s)||state.commerce_memberships.some(m=>m.user_id===uid&&m.seller_id===s.id&&m.active);
  const sellerName=id=>state.commerce_sellers.find(s=>s.id===id)?.name||'Vendedor';
  const link=(label,query='')=>`<a class="button button--secondary" href="${base}${query}" data-link>${label}</a>`;

  function quoteCard(q) {
    const expired=new Date(q.valid_until)<=new Date();
    return `<details class="commerce-card trade-quote" open><summary><strong>Versão ${q.version} • ${money(q.total)}</strong> — ${q.status==='accepted'?'Aceita':q.status==='superseded'?'Substituída':q.status==='declined'?'Recusada':expired?'Validade encerrada':'Enviada'}</summary><p>${e(q.seller_name)} • ${when(q.created_at)}</p>${q.items.map(i=>`<div class="commerce-row"><div><strong>${e(i.name)}</strong><p>${e(packaging(i))} × ${Number(i.quantity).toLocaleString('pt-BR')}</p><p>${money(i.unit_price)} por embalagem</p></div><strong>${money(i.line_total)}</strong></div>`).join('')}<dl class="trade-totals"><dt>Produtos</dt><dd>${money(q.subtotal)}</dd><dt>Desconto</dt><dd>${money(q.discount)}</dd><dt>Frete</dt><dd>${money(q.freight)}</dd><dt>Total</dt><dd><strong>${money(q.total)}</strong></dd></dl><p>Válida até ${when(q.valid_until)}. Entrega estimada: ${q.delivery_days} dia(s) após confirmação do pedido.</p><p>Pagamento: ${e(q.payment_terms)}</p>${q.notes?`<p>Observações: ${e(q.notes)}</p>`:''}</details>`;
  }
  function requestDetail() {
    const r=state.trade_requests.find(x=>x.id===requestId);
    if(!r)return '<section class="commerce-card"><h2>Solicitação indisponível</h2><p>Atualize a página ou verifique seu acesso.</p></section>';
    const connection=state.trade_connections.find(c=>c.id===r.connection_id);
    const buyer=connection?.buyer_id===uid;
    const quotes=state.trade_quotes.filter(q=>q.request_id===r.id).sort((a,b)=>b.version-a.version);
    const last=quotes[0];
    const order=state.trade_orders.find(o=>o.request_id===r.id);
    let html=`${link('← Negociações')}<section class="commerce-card"><span class="commerce-badge">${requestStates[r.state]}</span><h2>${e(sellerName(connection?.seller_id))}</h2><p>Solicitação ${e(r.id.slice(0,8))} • ${when(r.created_at)}</p><p>Produtor: ${e(connection?.buyer_name||'Produtor')}</p><p>Destino: ${e(r.delivery_address)}${r.property_name?' • '+e(r.property_name):''}</p>${r.desired_date?`<p>Data desejada: ${e(r.desired_date.split('-').reverse().join('/'))}</p>`:''}<p>${e(r.notes)}</p>${r.items.map(i=>`<div class="commerce-row"><div><strong>${e(i.name)}</strong><p>${e(packaging(i))}</p></div><strong>${Number(i.quantity).toLocaleString('pt-BR')} embalagem(ns)</strong></div>`).join('')}</section>`;
    if(!buyer)html+=`<a class="button button--secondary" href="/consultor/acompanhamento?request=${e(r.id)}" data-link>Acompanhamento interno</a>`;
    if(!terminal.includes(r.state)) {
      if(!buyer&&['awaiting','revision_requested'].includes(r.state)) {
        const valid=new Date(Date.now()+7*86400000);const local=new Date(valid.getTime()-valid.getTimezoneOffset()*60000).toISOString().slice(0,16);
        html+=`<section class="commerce-card"><h3>Enviar ${last?'nova versão do':'o'} orçamento</h3><p>Os valores são por embalagem. Cada proposta fica registrada no histórico.</p><form data-command="send_quote">${hidden('request_id',r.id)}${r.items.map(i=>{
          const old=last?.items.find(x=>x.product_id===i.product_id);const product=state.trade_products.find(x=>x.id===i.product_id);
          return field('price_'+i.product_id,`Preço de ${e(i.name)} (${e(packaging(i))})`,old?.unit_price??product?.reference_price??'','required min="0" max="1000000000" step="0.01"','number');
        }).join('')}${field('discount','Desconto total (R$)',last?.discount??0,'min="0" step="0.01"','number')}${field('freight','Frete (R$)',last?.freight??0,'min="0" max="1000000000" step="0.01"','number')}${field('valid_until','Validade da proposta',local,'required','datetime-local')}${field('delivery_days','Prazo de entrega após confirmação (dias)',last?.delivery_days??3,'required min="0" max="365" step="1"','number')}${field('payment_terms','Condições de pagamento',last?.payment_terms||'','required maxlength="500"')}${area('message','Observações do orçamento',last?.notes||'')}${btn('Enviar orçamento','type="submit"')}</form></section>`;
      }
      if(buyer&&r.state==='quoted'&&last) html+=`<section class="commerce-card"><h3>Responder à proposta</h3><p>${new Date(last.valid_until)<=new Date()?'A validade terminou. Solicite uma nova versão se desejar continuar.':'Confira os produtos e as condições antes de continuar.'}</p><form data-command="request_revision">${hidden('request_id',r.id)}${hidden('quote_id',last.id)}${area('message','Motivo da revisão ou recusa')}<div class="commerce-actions">${btn('Pedir revisão','type="submit"')}${btn('Recusar proposta','type="submit" data-command="decline_quote"',true)}</div></form>${new Date(last.valid_until)>new Date()?`<form data-command="accept_quote">${hidden('request_id',r.id)}${hidden('quote_id',last.id)}<p>Ao aceitar, você confirma o pedido de ${money(last.total)} conforme esta proposta. Nenhum pagamento será realizado pelo app.</p>${btn('Aceitar proposta e criar pedido','type="submit"')}</form>`:''}</section>`;
      if((!buyer&&['awaiting','revision_requested'].includes(r.state))||(buyer&&r.state==='awaiting_buyer')) html+=`<section class="commerce-card"><h3>${buyer?'Responder ao consultor':'Pedir esclarecimento'}</h3><form data-command="${buyer?'answer_clarification':'ask_clarification'}">${hidden('request_id',r.id)}${area('message','Esclarecimento')}${btn(buyer?'Enviar resposta':'Solicitar esclarecimento','type="submit"',true)}</form></section>`;
      html+=`<details class="commerce-card"><summary>Encerrar solicitação</summary><form data-command="${buyer?'cancel_request':'reject_request'}">${hidden('request_id',r.id)}${area('message','Motivo do encerramento')}${btn(buyer?'Cancelar solicitação':'Recusar atendimento','type="submit"',true)}</form></details>`;
    }
    if(order) html+=`<section class="commerce-card"><h3>Pedido confirmado</h3><strong>${deliveryStates[order.state]}</strong><p>Número do pedido: <strong>${e(order.id)}</strong></p><p>Confirmado em ${when(order.created_at)} por ${e(order.buyer_name)}</p><p>Vendedor: ${e(order.seller_name)}</p><p>Total confirmado: <strong>${money(order.total)}</strong></p><p>Pagamento: ${e(order.quote_snapshot.payment_terms)}</p><p>Destino: ${e(order.delivery_snapshot.address)}</p><p>Prazo combinado: ${order.quote_snapshot.delivery_days} dia(s) após a confirmação.</p><p>Os produtos e valores estão na proposta aceita abaixo. Combine o pagamento e a entrega diretamente com o consultor. O estoque só entra no barracão depois que o produtor confirmar o recebimento integral.</p></section>`;
    if(order&&!buyer&&['confirmed','delivery_issue'].includes(order.state)) html+=`<section class="commerce-card"><h3>Informar entrega</h3><p>Informe somente após entregar todos os produtos. O produtor ainda deverá confirmar o recebimento.</p><form data-command="mark_delivery">${hidden('order_id',order.id)}${area('message','Observações da entrega')}${btn('Informar que entreguei','type="submit"')}</form></section>`;
    if(order&&buyer&&order.state==='awaiting_receipt') html+=`<section class="commerce-card"><h3>Conferir recebimento</h3><p>Confira todos os itens antes de confirmar. Se faltou algo, informe um problema: nenhuma quantidade entrará no barracão.</p><form data-command="confirm_receipt">${hidden('order_id',order.id)}${hidden('delivery_version',order.delivery_version)}${order.quote_snapshot.items.map(item=>{
      const inputs=state.agricultural_inputs.filter(i=>i.active&&!i.deleted_at&&i.base_unit===stockUnit(item.base_unit));
      const linked=state.trade_inventory_links.find(l=>l.product_id===item.product_id)?.agricultural_input_id;
      return `<p><strong>${e(item.name)}</strong>: ${Number(item.quantity).toLocaleString('pt-BR')} × ${Number(item.package_size).toLocaleString('pt-BR')} ${e(item.base_unit)} = ${(Number(item.quantity)*Number(item.package_size)).toLocaleString('pt-BR',{maximumFractionDigits:6})} ${e(item.base_unit)}</p>`+select('input_'+item.product_id,'Destino de '+e(item.name),[['','Vincular automaticamente'],...inputs.map(i=>[i.id,i.name])],inputs.some(i=>i.id===linked)?linked:'');
    }).join('')}<p>A vinculação automática reutiliza um vínculo anterior válido ou cadastra um insumo na categoria Outros. Escolha um insumo existente para evitar duplicatas.</p>${btn('Confirmar recebimento integral','type="submit"')}</form><form data-command="report_delivery_issue">${hidden('order_id',order.id)}${hidden('delivery_version',order.delivery_version)}${area('message','Problema encontrado')}${btn('Informar problema na entrega','type="submit"',true)}</form></section>`;
    if(order?.state==='delivery_issue') html+=`<section class="commerce-card"><h3>Entrega em ajuste</h3><p>Consulte o problema no histórico e combine a solução na conversa. Nenhuma entrada no barracão foi feita. O consultor deve informar a entrega novamente após resolver.</p></section>`;
    if(order?.state==='received') html+=`<section class="commerce-card"><h3>Recebimento concluído</h3><p>Confirmado pelo produtor em ${when(order.received_at)}.</p>${buyer?state.trade_receipt_items.filter(i=>i.order_id===order.id).map(i=>`<p>${Number(i.quantity).toLocaleString('pt-BR')} ${e(i.unit)} • ${money(i.total_cost)} <a class="button button--secondary" href="/inventory/${i.agricultural_input_id}/lots/${i.inventory_lot_id}" data-link>Ver lote no barracão</a></p>`).join(''):'<p>O produtor confirmou o recebimento dos produtos.</p>'}</section>`;
    const messages=state.trade_messages.filter(m=>m.request_id===r.id).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)||a.id.localeCompare(b.id));
    html+=`<section class="commerce-card"><h3>Conversa da negociação</h3><p>Use Atualizar conversa para buscar novas mensagens. As mensagens ficam registradas e não podem ser editadas.</p><button class="button button--secondary" type="button" data-refresh>Atualizar conversa</button><div class="trade-messages">${messages.map(m=>`<article class="trade-message ${m.sender_id===uid?'trade-message--own':''}"><strong>${m.sender_id===uid?'Você':m.sender_role==='buyer'?'Produtor':'Equipe do vendedor'}</strong><time>${when(m.created_at)}</time><p>${e(m.body)}</p></article>`).join('')||'<p>Nenhuma mensagem nesta conversa.</p>'}</div>${!['declined','cancelled','rejected'].includes(r.state)&&connection?.active?`<form data-command="send_message">${hidden('request_id',r.id)}${area('message','Sua mensagem')}${btn('Enviar mensagem','type="submit"')}</form>`:'<p>Conversa encerrada. O histórico permanece disponível.</p>'}</section>`;
    html+=`<section><h3 class="trade-section-title">Histórico de orçamentos</h3>${quotes.length?quotes.map(quoteCard).join(''):'<p>Nenhum orçamento enviado.</p>'}</section><section class="commerce-card"><h3>Atividades da negociação</h3>${state.trade_events.filter(x=>x.request_id===r.id).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).map(x=>`<article class="commerce-row"><div><strong>${eventLabels[x.action]||'Atualização'}</strong><p>${when(x.created_at)}</p><p>${e(x.message)}</p></div></article>`).join('')}</section>`;
    return html;
  }
  function catalog(seller) {
    const owner=owns(seller), products=state.trade_products.filter(p=>p.seller_id===seller.id);
    const editing=products.find(p=>p.id===params.get('product'));
    let html=`<section class="commerce-card"><h3>Catálogo de ${e(seller.name)}</h3>${products.filter(p=>commercial||!p.archived).map(p=>`<article class="commerce-row"><div><strong>${e(p.name)}</strong><p>${e(p.category)}${p.brand?' • '+e(p.brand):''}</p><p>${e(packaging(p))}</p><p>${p.archived?'Arquivado':availability[p.availability]}${p.reference_price!==null?' • Referência: '+money(p.reference_price):''}</p>${p.description?`<p>${e(p.description)}</p>`:''}</div>${owner&&commercial&&!p.archived?`<div class="commerce-actions">${link('Editar',`?seller=${seller.id}&product=${p.id}`)}${btn('Arquivar',`type="button" data-action="archive_product" data-id="${p.id}" data-seller="${seller.id}"`,true)}</div>`:''}</article>`).join('')||'<p>Nenhum produto cadastrado.</p>'}</section>`;
    if(commercial&&owner) html+=`<section class="commerce-card"><h3>${editing?'Editar produto':'Novo produto'}</h3><form data-command="save_product">${hidden('seller_id',seller.id)}${hidden('product_id',editing?.id||'')}${field('name','Nome do produto',editing?.name||'','required minlength="2" maxlength="120"')}${field('category','Categoria',editing?.category||'','maxlength="80"')}${field('brand','Marca',editing?.brand||'','maxlength="80"')}${area('description','Descrição',editing?.description||'')}${field('package_name','Embalagem (ex.: saco, frasco, unidade)',editing?.package_name||'','required maxlength="60"')}${field('package_size','Conteúdo de cada embalagem',editing?.package_size||1,'required min="0.001" max="1000000" step="0.001"','number')}${select('base_unit','Unidade do conteúdo',[['kg','Quilogramas (kg)'],['L','Litros (L)'],['un','Unidades']],editing?.base_unit||'kg')}${field('reference_price','Preço de referência por embalagem (opcional)',editing?.reference_price??'','min="0" max="1000000000" step="0.01"','number')}${select('availability','Disponibilidade',Object.entries(availability),editing?.availability||'on_request')}${btn('Salvar produto','type="submit"')}</form></section>`;
    if(!commercial) {
      const c=state.trade_connections.find(c=>c.seller_id===seller.id&&c.buyer_id===uid&&c.active);
      const available=products.filter(p=>!p.archived&&p.availability!=='unavailable');
      if(c&&available.length) html+=`<section class="commerce-card"><h3>Solicitar orçamento</h3><p>Informe a quantidade de embalagens de cada produto desejado. Deixe os demais em zero.</p><form data-command="create_request">${hidden('connection_id',c.id)}${available.map(p=>field('qty_'+p.id,`${e(p.name)} — ${e(packaging(p))}`,0,'min="0" max="1000000" step="0.001"','number')).join('')}${select('property_id','Propriedade de destino (opcional)',[['','Outro local'],...state.properties.map(p=>[p.id,p.name])])}${area('delivery_address','Endereço ou instruções de entrega','',500)}${field('desired_date','Data desejada (opcional)','','','date')}${area('notes','Observações')}${btn('Enviar solicitação','type="submit"')}</form></section>`;
    }
    return html;
  }
  function overview() {
    const sellers=state.commerce_sellers.filter(s=>commercial?acts(s):state.trade_connections.some(c=>c.seller_id===s.id&&c.buyer_id===uid&&c.active));
    const seller=sellers.find(s=>s.id===selected)||sellers.find(s=>s.id===state.commerce_accounts[0]?.active_seller_id)||sellers[0];
    let html=`<section class="page-heading"><div><h2>${commercial?'Atenda seus clientes':'Consulte produtos e preços'}</h2><p>${commercial?'Escolha o vendedor para gerenciar catálogo e negociações.':'Conecte-se ao consultor pelo código recebido para acessar o catálogo.'}</p></div></section><nav class="commerce-actions" aria-label="Vendedores">${sellers.map(s=>link(e(s.name),`?seller=${s.id}`)).join('')}</nav>`;
    if(seller) {
      html+=`<section class="commerce-card"><h3>${e(seller.name)}</h3><p>${commercial?(owns(seller)?'Você é responsável pelo catálogo.':'Você atende seus clientes; alterações de catálogo são feitas pelo responsável.'):'Vendedor conectado'}</p></section>`;
      const connections=state.trade_connections.filter(c=>c.seller_id===seller.id&&(commercial?c.buyer_id!==uid:c.buyer_id===uid));
      const visible=new Set(connections.map(c=>c.id));
      const requests=state.trade_requests.filter(r=>visible.has(r.connection_id)).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      html+=`<section class="commerce-card"><h3>Solicitações, propostas e pedidos</h3>${requests.length?requests.map(r=>`<article class="commerce-row"><div><strong>${commercial?e(connections.find(c=>c.id===r.connection_id)?.buyer_name):'Solicitação '+r.id.slice(0,8)}</strong><p>${requestStates[r.state]} • ${when(r.created_at)}</p></div>${link('Abrir',`?request=${r.id}`)}</article>`).join(''):'<p>Nenhuma solicitação para este vendedor.</p>'}</section>`;
      html+=catalog(seller);
      if(commercial) {
        html+=`<section class="commerce-card"><h3>Convidar produtor</h3><p>O código conecta o produtor a este vendedor e a você como consultor responsável. Compartilhe-o com a pessoa; nenhum e-mail é enviado.</p><form data-command="invite_buyer">${hidden('seller_id',seller.id)}${field('email','E-mail do produtor','','required maxlength="254"','email')}${btn('Gerar código','type="submit"')}</form>${state.trade_invitations.filter(i=>i.seller_id===seller.id).map(i=>{
          const pending=i.status==='pending'&&new Date(i.expires_at)>new Date();
          return `<article class="commerce-row"><div class="commerce-invite-code"><strong>${e(i.email)}</strong><p>${i.status==='accepted'?'Aceito':i.status==='revoked'?'Cancelado':pending?'Válido até '+when(i.expires_at):'Expirado'}</p>${pending?`<label class="commerce-code-label">Código para o produtor<input class="commerce-code" readonly value="${e(i.token)}" aria-label="Código para ${e(i.email)}"></label>`:''}</div>${pending?btn('Cancelar convite',`type="button" data-action="revoke_connection_invite" data-id="${i.id}"`,true):''}</article>`;
        }).join('')}</section><section class="commerce-card"><h3>Clientes conectados</h3>${connections.map(c=>`<article class="commerce-row"><div><strong>${e(c.buyer_name)}</strong><p>${c.agent_id===uid?'Atendimento sob sua responsabilidade':'Atendimento por representante'}</p></div>${owns(seller)?`<form data-command="assign_agent">${hidden('connection_id',c.id)}${select('agent_id','Responsável por '+e(c.buyer_name),[[seller.owner_id,'Responsável pela empresa'],...state.commerce_memberships.filter(m=>m.seller_id===seller.id&&m.active).map(m=>[m.user_id,m.representative_name])],c.agent_id)}${btn('Transferir atendimento','type="submit"',true)}</form>`:''}</article>`).join('')||'<p>Nenhum cliente conectado.</p>'}</section>`;
      }
    } else if(commercial) html+='<section class="commerce-card"><p>Ative seu perfil e cadastre uma atuação própria ou aceite um convite de empresa.</p><a class="button button--secondary" href="/consultor" data-link>Meu espaço de consultor</a></section>';
    if(!commercial) html+=`<section class="commerce-card"><h3>Conectar a um consultor</h3><form data-command="accept_connection">${field('name','Seu nome de contato',session.user.user_metadata?.full_name||'','required minlength="2" maxlength="120"')}${field('token','Código recebido','','required maxlength="36" autocomplete="off"')}${btn('Conectar','type="submit"')}</form></section>`;
    return html;
  }
  function paint(message='') {
    if(disposed)return;
    app.innerHTML=shell(`<div id="trade-feedback" role="status" aria-live="polite" hidden></div>${requestId?requestDetail():overview()}`);
    notice(message);
  }
  function captureDrafts() {
    return [...app.querySelectorAll('form[data-command]')].filter(f=>f.dataset.command!=='send_message').map(f=>({command:f.dataset.command,fields:[...f.elements].filter(el=>el.name&&el.type!=='hidden').map(el=>[el.name,el.value])}));
  }
  function restoreDrafts(drafts) {
    if(disposed)return;
    for(const draft of drafts) {
      const form=[...app.querySelectorAll('form[data-command]')].find(f=>f.dataset.command===draft.command);
      if(form)for(const [name,value] of draft.fields){const input=form.elements.namedItem(name);if(input)input.value=value;}
    }
  }
  async function run(action,data) {
    if(busy||disposed)return;
    const signature=JSON.stringify([action,data]);
    if(!retries.has(signature))retries.set(signature,crypto.randomUUID());
    busy=true;const buttons=[...app.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);notice('Salvando…');
    const drafts=action==='send_message'?captureDrafts():[];
    let saved=false;
    try {
      const result=await tradeCommand(action,data,retries.get(signature));saved=true;
      if(disposed)return;
      if(action==='create_request'){navigate(`${base}?request=${result.request_id}`);return;}
      state=await loadTrade();retries.clear();paint(result.approval_pending?'Proposta enviada para aprovação interna. O produtor receberá a proposta após a aprovação.':action==='send_message'?'Mensagem enviada.':'Alteração salva.');restoreDrafts(drafts);
    }catch(error){if(!disposed)notice(saved?'A alteração foi salva. Reabra a página para atualizar os dados antes de repetir.':tradeError(error),true);}
    finally{busy=false;if(!disposed)buttons.forEach(b=>b.disabled=false);}
  }
  const submit=async event=>{
    const form=event.target.closest('form[data-command]');if(!form)return;event.preventDefault();
    if(busy||!form.reportValidity())return;
    const action=event.submitter?.dataset.command||form.dataset.command;
    const data=Object.fromEntries(new FormData(form));
    if(action==='create_request') {
      data.items=Object.entries(data).filter(([k,v])=>k.startsWith('qty_')&&Number(v)>0).map(([k,v])=>({product_id:k.slice(4),quantity:Number(v)}));
      for(const k of Object.keys(data))if(k.startsWith('qty_'))delete data[k];
      if(!data.items.length){notice('Escolha ao menos um produto com quantidade maior que zero.',true);return;}
    }
    if(action==='send_quote') {
      data.items=Object.entries(data).filter(([k])=>k.startsWith('price_')).map(([k,v])=>({product_id:k.slice(6),unit_price:Number(v)}));
      for(const k of Object.keys(data))if(k.startsWith('price_'))delete data[k];
      data.valid_until=new Date(data.valid_until).toISOString();
    }
    if(data.token)data.token=data.token.trim();
    if(action==='confirm_receipt') {
      data.items=Object.entries(data).filter(([k])=>k.startsWith('input_')).map(([k,v])=>({product_id:k.slice(6),input_id:v}));
      for(const k of Object.keys(data))if(k.startsWith('input_'))delete data[k];
      if(!await showConfirmModal({title:'Recebeu todos os produtos?',message:'As quantidades serão adicionadas ao seu barracão. Confirme somente após conferir a entrega completa e os insumos escolhidos.',confirmLabel:'Sim, recebi tudo'}))return;
    }
    if(action==='mark_delivery'&&!await showConfirmModal({title:'Todos os produtos foram entregues?',message:'O produtor será avisado para conferir e confirmar o recebimento.',confirmLabel:'Sim, entreguei'}))return;
    if(action==='accept_quote') {
      const quote=state.trade_quotes.find(q=>q.id===data.quote_id);
      if(!quote)return;
      if(!await showConfirmModal({title:'Confirmar este pedido?',message:`Você está aceitando a proposta de ${money(quote.total)}. Confira os produtos, o endereço e as condições de pagamento. O app não cobra nem transfere dinheiro.`,confirmLabel:'Confirmar pedido'}))return;
    }
    if(['cancel_request','decline_quote','reject_request'].includes(action)) {
      if(!await showConfirmModal({title:'Encerrar esta negociação?',message:'O histórico será preservado. Para retomar depois, será necessário criar outra solicitação.',confirmLabel:'Confirmar',danger:true}))return;
    }
    if(!disposed)await run(action,data);
  };
  const click=async event=>{
    if(event.target.closest('[data-refresh]')){
      if(busy)return;
      if(app.querySelector('form[data-command="send_message"] textarea')?.value.trim()){
        notice('Envie sua mensagem ou limpe o rascunho antes de atualizar.',true);return;
      }
      const drafts=captureDrafts();busy=true;notice('Atualizando…');
      try{state=await loadTrade();paint('Conversa atualizada.');restoreDrafts(drafts);}catch(error){if(!disposed)notice(tradeError(error),true);}finally{busy=false;}
      return;
    }
    const b=event.target.closest('[data-action]');if(!b||busy)return;
    const {action,id,seller}=b.dataset;
    if(!await showConfirmModal({title:action==='archive_product'?'Arquivar produto?':'Cancelar convite?',message:action==='archive_product'?'O produto sairá das novas solicitações. As propostas anteriores serão preservadas.':'O código deixará de funcionar.',confirmLabel:'Confirmar',danger:true}))return;
    if(!disposed)await run(action,action==='archive_product'?{seller_id:seller,product_id:id}:{invitation_id:id});
  };
  try{state=await loadTrade();paint();}catch(error){app.innerHTML=shell('<section class="commerce-card"><h2>Não foi possível carregar negociações</h2><p id="trade-load-error" role="alert"></p><a class="button button--secondary" href="/more" data-link>Voltar</a></section>');app.querySelector('#trade-load-error').textContent=tradeError(error);}
  app.addEventListener('submit',submit);app.addEventListener('click',click);
  return()=>{disposed=true;app.removeEventListener('submit',submit);app.removeEventListener('click',click);};
}

