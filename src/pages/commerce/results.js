import {icon} from '../../components/icons.js';
import {appShell} from '../../components/appShell.js';
import {escapeHtml as e} from '../../js/html.js';
import {navigate} from '../../js/router.js';
import {money} from '../../services/tradeService.js';
import {productRanking,salesSellers,salesReport,salesOrder,saveSalesResult,salesError} from '../../services/salesResultService.js';

const status={confirmed:'Aguardando entrega',awaiting_receipt:'Aguardando recebimento',delivery_issue:'Problema na entrega',received:'Recebido'};
const amount=value=>value===null||value===undefined?'Pendente':money(value);
const field=(name,label,value='',type='number',extra='')=>`<div class="field"><label for="sales-${name}">${label}</label><input id="sales-${name}" name="${name}" value="${e(value)}" type="${type}" ${extra}></div>`;
const decimal='required min="0" max="1000000000" step="0.01"';
const when=date=>new Date(date).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});

export async function renderSalesResults({session}){
 const app=document.querySelector('#app'),params=new URLSearchParams(location.search),orderId=params.get('order');
 let disposed=false,busy=false,sellers=[],seller,report,detail,ranking;const retries=new Map();
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const chartYear=Number(params.get('year'))||Number(today.slice(0,4)),chartMonth=Number(params.get('month'))||Number(today.slice(5,7));
 let from=params.get('from')||today.slice(0,7)+'-01',to=params.get('to')||today,offset=Math.max(0,Number(params.get('offset'))||0);
 const url=(extra={})=>'/consultor/resultados?'+new URLSearchParams({seller:seller.id,from,to,year:chartYear,month:chartMonth,...extra});
 const shell=content=>appShell({session,title:'Vendas e resultados',activeNav:'commerce',content:`<div class="commerce-page trade-page">${content}</div>`});
 const feedback=(message,error=false)=>{const node=app.querySelector('#sales-feedback');if(node){node.textContent=message;node.hidden=!message;node.className=error?'form-message form-message--error':'form-message form-message--success';}};

 function rankingHtml(){
  const chart=(title,rows)=>`<section class="commerce-card sales-chart-card"><h3>${title}</h3>${rows.length?`<p class="sales-champion"><span aria-hidden="true">★</span><strong>${rows.filter(p=>p.rank===1).length>1?'Líderes empatados':'Campeão de vendas'}: ${rows.filter(p=>p.rank===1).map(p=>e(p.name)).join(', ')}</strong></p><ol class="sales-chart" aria-label="${title}">${rows.map(p=>`<li><div class="sales-chart-label"><span>${e(p.name)}</span><strong>${money(p.revenue)}</strong></div><small>${p.orders} pedido(s)</small><div class="sales-chart-track" aria-hidden="true"><span class="sales-chart-bar" style="width:${rows[0].revenue>0?Math.max(0,Math.min(100,Number(p.revenue)/Number(rows[0].revenue)*100)):0}%"></span></div></li>`).join('')}</ol>`:'<p>Nenhuma venda recebida neste período.</p>'}</section>`;
  return `<section class="commerce-card sales-ranking"><h2>Produtos campeões de vendas</h2><p>Até 10 produtos por valor vendido após desconto, sem frete. Somente recebimentos confirmados, no horário de Brasília. ${ranking.owner?'Resultados desta atuação.':'Somente vendas atribuídas a você no aceite.'}</p><form data-ranking-filter>${field('year','Ano',chartYear,'number','required min="2000" max="2200" step="1"')}${field('month','Mês (1 a 12)',chartMonth,'number','required min="1" max="12" step="1"')}<button class="button button--secondary" type="submit">Atualizar gráfico</button></form><div class="commerce-grid">${chart('No mês '+String(chartMonth).padStart(2,'0')+'/'+chartYear,ranking.monthly)}${chart('No ano '+chartYear,ranking.annual)}</div></section>`;
 }
 function paint(){
  if(disposed)return;
  let html='<div id="sales-feedback" role="status" hidden></div>';
  if(!seller){app.innerHTML=shell('<section class="commerce-card"><h2>Ative sua atuação comercial</h2><p>Use seu espaço de consultor para cadastrar uma atuação própria ou aceitar o convite de uma empresa.</p><a class="button button--secondary" href="/consultor" data-link>Meu espaço</a></section>');return;}
  if(orderId){
   const {order,versions}=detail,last=versions[0];
   html+=`<a class="button button--secondary" href="${url()}" data-link>← Resultados</a><section class="commerce-card"><h2>Apuração do pedido</h2><p>${e(seller.name)} • ${e(order.buyer_name)}</p><p>Pedido ${e(order.id)} • ${status[order.state]}</p><p>Receita acordada: <strong>${money(order.total)}</strong>. ${order.state==='received'?'Incluída nas vendas concluídas.':'Os valores permanecem previstos até o recebimento.'}</p><p>Informe seus custos como vendedor. Estes dados não são mostrados ao produtor.</p><form data-sales-save>${order.quote_snapshot.items.map(i=>field('cost_'+i.product_id,`Custo por ${e(i.package_name)} de ${e(i.name)} (${Number(i.quantity).toLocaleString('pt-BR')} embalagem/ns)`,last?.items.find(x=>x.product_id===i.product_id)?.unit_cost??'','number',decimal)).join('')}${field('delivery_cost','Custo da entrega para o vendedor (R$)',last?.delivery_cost??0,'number',decimal)}${field('other_cost','Outros custos deste pedido (R$)',last?.other_cost??0,'number',decimal)}${field('commission_percent','Comissão do consultor (%)',last?.commission_percent??0,'number','required min="0" max="100" step="0.01"')}<p>A comissão incide sobre os produtos após desconto, sem o frete. Fica atribuída ao consultor responsável no momento do aceite, mesmo que o atendimento seja transferido depois. Na atuação própria, mantenha 0% se não houver comissão separada.</p>${field('reason',last?'Motivo da correção':'Descrição da apuração',last?'':'Apuração inicial','text','required minlength="5" maxlength="500"')}<p>Cada gravação cria uma versão. Os preços aceitos e o estoque permanecem como foram registrados.</p><button class="button button--primary" type="submit">Salvar apuração</button></form></section>`;
   html+=`<section><h2>Histórico de apurações</h2>${versions.map(v=>`<article class="commerce-card"><h3>Versão ${v.version}${v===last?' • Atual':''}</h3><p>${when(v.created_at)} • ${e(v.reason)}</p>${v.items.map(i=>`<p>${e(i.name)}: ${money(i.unit_cost)} por embalagem • ${money(i.line_cost)} de custo</p>`).join('')}<p>Produtos: ${money(v.product_cost)} • Entrega: ${money(v.delivery_cost)} • Outros: ${money(v.other_cost)}</p><p>Comissão: ${Number(v.commission_percent).toLocaleString('pt-BR')}% = ${money(v.commission_amount)}</p><p><strong>Resultado sobre custos informados: ${money(v.result_amount)}</strong></p></article>`).join('')||'<p>Nenhuma apuração registrada.</p>'}</section>`;
  }else{
   const t=report.totals;
   html+=`<section class="commerce-card sales-filter"><h2>${report.owner?'Resultados do vendedor':'Minhas vendas e comissões'}</h2><form data-sales-filter><div class="field"><label for="sales-seller">Atuação</label><select id="sales-seller" name="seller">${sellers.map(s=>`<option value="${s.id}" ${s.id===seller.id?'selected':''}>${e(s.name)}</option>`).join('')}</select></div>${field('from','Início',from,'date','required')}${field('to','Fim',to,'date','required')}<button type="submit" class="button button--secondary">Atualizar resultados</button></form><p>Vendas pelo dia do recebimento (horário de Brasília). Pedidos em andamento pelo dia de criação. Período de até 366 dias.</p>${!report.owner?'<p>Você vê as vendas atribuídas a você no aceite, mesmo após transferência do atendimento. Custos e resultados da empresa são restritos ao responsável.</p>':''}</section>`;
   const cards=[['Vendas recebidas',money(t.sales_total)],['Pedidos recebidos',t.received_count],['Em andamento',`${t.pending_count} • ${money(t.pending_total)}`],['Comissões das vendas recebidas',amount(t.commission_total)]];
   if(report.owner)cards.push(['Custos informados (sem comissão)',amount(t.cost_total)],['Resultado sobre custos informados',amount(t.result_total)],['Margem sobre a receita',t.margin_percent===null?'Pendente':Number(t.margin_percent).toLocaleString('pt-BR')+'%']);
   html+=`<div class="commerce-grid sales-metrics">${cards.map(([label,value],index)=>`<section class="commerce-card sales-metric ${index===0?'sales-metric--primary':''}"><span class="sales-metric-icon">${icon(index===0?'chart':index===1?'box':index===2?'clock':'briefcase')}</span><h3>${label}</h3><strong>${value}</strong></section>`).join('')}</div>${t.missing_count?`<p role="status">${t.missing_count} venda(s) recebida(s) ainda sem apuração. ${report.owner?'Informe os custos e comissões para concluir os totais.':'Aguarde a apuração pelo responsável.'}</p>`:''}<p>Este painel registra valores; não comprova pagamentos nem inclui despesas ou tributos que você não informou.</p>`;
   html+=rankingHtml();
   html+=`<section class="commerce-card"><h2>Produtos vendidos e recebidos</h2>${report.products.map(p=>`<article class="commerce-row"><div><strong>${e(p.name)}</strong><p>${e(p.package_name)} • ${Number(p.package_size).toLocaleString('pt-BR')} ${e(p.base_unit)}</p><p>${Number(p.packages).toLocaleString('pt-BR')} embalagem(ns) • ${Number(p.base_quantity).toLocaleString('pt-BR')} ${e(p.base_unit)}</p></div></article>`).join('')||'<p>Nenhum produto recebido neste período.</p>'}</section><section class="commerce-card"><h2>Pedidos do período</h2>${report.orders.map(o=>`<article class="commerce-row"><div><strong>${e(o.buyer_name)} • ${money(o.total)}</strong><p>${when(o.date)} • ${status[o.state]}</p><p>Consultor no aceite: ${e(o.agent_name)}</p><p>Comissão ${o.state==='received'?'apurada':'prevista'}: ${amount(o.commission_amount)}${o.commission_percent!==null?' ('+Number(o.commission_percent).toLocaleString('pt-BR')+'%)':''}</p>${report.owner?`<p>Resultado ${o.state==='received'?'apurado':'previsto'}: ${amount(o.result_amount)}</p>`:''}<p>Pedido ${e(o.id)}</p></div><div class="commerce-actions">${o.can_open?`<a class="button button--secondary" href="/consultor/negociacoes?request=${o.request_id}" data-link>Abrir pedido</a>`:''}${report.owner?`<a class="button button--primary" href="${url({order:o.id})}" data-link>${o.version?'Revisar apuração':'Informar custos'}</a>`:''}</div></article>`).join('')||'<p>Nenhum pedido neste período.</p>'}<nav class="commerce-actions" aria-label="Páginas de pedidos">${offset?`<a class="button button--secondary" href="${url({offset:Math.max(0,offset-50)})}" data-link>Anterior</a>`:''}${offset+50<Number(t.order_count)?`<a class="button button--secondary" href="${url({offset:offset+50})}" data-link>Próxima</a>`:''}</nav></section>`;
  }
  app.innerHTML=shell(html);
 }
 const submit=async event=>{
  const form=event.target.closest('form');if(!form)return;event.preventDefault();if(busy||!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));
  if(form.matches('[data-ranking-filter]')){navigate(url(data));return;}
  if(form.matches('[data-sales-filter]')){navigate('/consultor/resultados?'+new URLSearchParams(data));return;}
  if(!form.matches('[data-sales-save]'))return;
  data.order_id=orderId;data.expected_version=detail.versions[0]?.version||0;
  data.items=Object.entries(data).filter(([k])=>k.startsWith('cost_')).map(([k,v])=>({product_id:k.slice(5),unit_cost:v}));
  for(const k of Object.keys(data))if(k.startsWith('cost_'))delete data[k];
  const signature=JSON.stringify(data);if(!retries.has(signature))retries.set(signature,crypto.randomUUID());
  busy=true;form.querySelector('button').disabled=true;let saved=false;feedback('Salvando…');
  try{await saveSalesResult(data,retries.get(signature));saved=true;detail=await salesOrder(orderId);if(!disposed){retries.clear();paint();feedback('Apuração salva.');}}
  catch(error){if(!disposed)feedback(saved?'A apuração foi salva. Reabra a página antes de repetir.':salesError(error),true);}
  finally{busy=false;if(!disposed&&form.isConnected)form.querySelector('button').disabled=false;}
 };
 app.innerHTML=shell('<p role="status">Carregando resultados…</p>');
 try{
  sellers=await salesSellers(session.user.id);seller=sellers.find(s=>s.id===params.get('seller'))||sellers[0];
  if(seller){
   if(orderId){if(seller.owner_id!==session.user.id)throw new Error('Somente o responsável pode acessar esta apuração.');detail=await salesOrder(orderId);if(detail.order.seller_id!==seller.id)throw new Error('O pedido não pertence à atuação selecionada.');}
   else [report,ranking]=await Promise.all([salesReport(seller.id,from,to,offset),productRanking(seller.id,chartYear,chartMonth)]);
  }
  paint();
 }catch(error){if(!disposed)app.innerHTML=shell(`<section class="commerce-card"><h2>Não foi possível carregar resultados</h2><p role="alert">${e(salesError(error))}</p><a class="button button--secondary" href="/consultor" data-link>Voltar ao meu espaço</a></section>`);}
 app.addEventListener('submit',submit);return()=>{disposed=true;app.removeEventListener('submit',submit);};
}
