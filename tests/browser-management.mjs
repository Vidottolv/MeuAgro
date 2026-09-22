import {managementFixture} from './management-fixture.mjs';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
mkdirSync('validation-artifacts',{recursive:true});
const f=await managementFixture(),{db,ids,as,commerce}=f;
await as(1);await commerce('enable',{name:'Consultor Teste'});const seller=(await commerce('create_company',{name:'Agro Teste'})).seller_id;
const browser=await chromium.launch({channel:'chrome',headless:true});let queue=Promise.resolve(),missing=false;const errors=[];
async function makePage(n){
 const user={id:ids[n-1],email:`user${n}@example.test`,aud:'authenticated',role:'authenticated',user_metadata:{full_name:n===1?'Consultor Teste':'Produtor Teste'},app_metadata:{},created_at:new Date().toISOString()};
 const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:Math.floor(Date.now()/1000)+7200},'mock'].map((v,i)=>i===2?v:Buffer.from(JSON.stringify(v)).toString('base64url')).join('.');
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(({user,token})=>localStorage.setItem('sb-trade-test-auth-token',JSON.stringify({access_token:token,refresh_token:'mock',token_type:'bearer',expires_in:7200,expires_at:Math.floor(Date.now()/1000)+7200,user})),{user,token});
 await context.route('https://trade-test.supabase.co/**',route=>{
  const task=async()=>{
   const url=new URL(route.request().url());if(url.pathname.startsWith('/auth/'))return route.fulfill({json:user});
   const table=url.pathname.split('/').pop();
   if(!/^(management_|commerce_|trade_|fulfillment_|agricultural_inputs$|properties$)/.test(table))return route.fulfill({json:[]});
   if(missing&&table.startsWith('trade_'))return route.fulfill({status:404,json:{code:'PGRST205'}});
   try{
    await as(n);let data;
    if(table==='trade_command'||table==='fulfillment_command'||table==='management_command'){
      const b=route.request().postDataJSON();data=(await db.query('select public.'+table+'($1,$2::jsonb,$3::uuid) r',[b.p_action,JSON.stringify(b.p_data),b.p_operation_id])).rows[0].r;
    }else if(table.startsWith('management_')){
      const b=route.request().postDataJSON()||{};
      const specs={management_companies:[],management_report:['p_seller','p_from','p_to','p_filter','p_offset'],management_wallet:['p_seller','p_search','p_offset'],management_workspace:['p_request']};
      assert.ok(table in specs);const args=specs[table].map(k=>b[k]);data=(await db.query('select public.'+table+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') r',args)).rows[0].r;
    }else if(table==='trade_product_ranking'){const b=route.request().postDataJSON();data=(await db.query('select public.trade_product_ranking($1,$2,$3) r',[b.p_seller,b.p_year,b.p_month])).rows[0].r;
    }else if(table==='trade_sales_report'){const b=route.request().postDataJSON();data=(await db.query('select public.trade_sales_report($1,$2::date,$3::date,$4) r',[b.p_seller,b.p_from,b.p_to,b.p_offset])).rows[0].r;
    }else if(table==='trade_save_financials'){const b=route.request().postDataJSON();data=(await db.query('select public.trade_save_financials($1::jsonb,$2::uuid) r',[JSON.stringify(b.p_data),b.p_operation_id])).rows[0].r;
    }else if(table==='trade_notification_inbox'){data=(await db.query('select public.trade_notification_inbox() r')).rows[0].r;
    }else if(table==='trade_mark_notification_read'){data=(await db.query('select public.trade_mark_notification_read($1) r',[route.request().postDataJSON().p_id])).rows[0].r;
    }else{
      const allowed=['commerce_accounts','commerce_sellers','commerce_memberships','trade_products','trade_connections','trade_invitations','trade_requests','trade_quotes','trade_events','trade_orders','trade_messages','trade_inventory_links','trade_receipt_items','trade_financial_versions','agricultural_inputs','properties','commerce_invitations'];assert.ok(allowed.includes(table));
      const parts=url.searchParams.get('order')?.split('.');if(parts)assert.match(parts[0],/^[a-z_]+$/);data=(await db.query('select * from public.'+table+(parts?' order by '+parts[0]+(parts[1]==='desc'?' desc':' asc'):''))).rows;
      if(table==='properties')data=data.filter(p=>!p.deleted_at);
      data=data.slice(Number(url.searchParams.get('offset')||0),Number(url.searchParams.get('offset')||0)+Number(url.searchParams.get('limit')||1000));
      if((route.request().headers().accept||'').includes('vnd.pgrst.object'))data=data[0]||null;
    }
    await route.fulfill({json:data});
   }catch(err){await route.fulfill({status:400,json:{message:err.message,code:err.code}});}
  };queue=queue.then(task);return queue;
 });
 const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));return page;
}
let owner,buyer;
try{
 owner=await makePage(1);buyer=await makePage(4);
 await owner.goto('http://127.0.0.1:5191/consultor/negociacoes?seller='+seller);
 await owner.getByRole('button',{name:'Ir para produtor',exact:true}).waitFor();
 assert.equal(await owner.locator('.trade-bell svg').count(),1);
 assert.equal(await owner.locator('.trade-bell').innerText(),'');
 await owner.getByLabel('Nome do produto',{exact:true}).fill('Adubo Teste');
 await owner.getByLabel('Embalagem (ex.: saco, frasco, unidade)',{exact:true}).fill('Saco');
 await owner.getByLabel('Conteúdo de cada embalagem',{exact:true}).fill('25');
 await owner.getByLabel('Preço de referência por embalagem (opcional)',{exact:true}).fill('100');
 await owner.getByLabel('Disponibilidade',{exact:true}).selectOption('available');
 await owner.getByRole('button',{name:'Salvar produto',exact:true}).click();
 await owner.getByText('Adubo Teste',{exact:true}).waitFor();
 await owner.getByLabel('E-mail do produtor',{exact:true}).fill('user4@example.test');
 await owner.getByRole('button',{name:'Gerar código',exact:true}).click();
 const code=owner.getByLabel('Código para user4@example.test',{exact:true});await code.waitFor();const token=await code.inputValue();assert.match(token,/^\d{16}$/);
 await owner.setViewportSize({width:360,height:900});
 assert.equal(await code.evaluate(el=>el.scrollWidth>el.clientWidth),false);
 assert.ok(await code.evaluate(el=>el.getBoundingClientRect().width>=el.closest('.commerce-row').getBoundingClientRect().width-2));
 await code.scrollIntoViewIfNeeded();await owner.screenshot({path:'validation-artifacts/management-invite.png'});

 await buyer.goto('http://127.0.0.1:5191/compras');
 await buyer.getByRole('button',{name:'Ir para consultor',exact:true}).waitFor();
 await buyer.getByLabel('Código recebido',{exact:true}).fill(token);await buyer.getByRole('button',{name:'Conectar',exact:true}).click();
 await buyer.getByRole('heading',{name:'Solicitar orçamento',exact:true}).waitFor();
 await buyer.getByLabel(/Adubo Teste — Saco/).fill('2');
 await buyer.getByLabel('Endereço ou instruções de entrega',{exact:true}).fill('Estrada da Fazenda, 100');
 await buyer.getByLabel('Propriedade de destino (opcional)',{exact:true}).selectOption('10000000-0000-4000-8000-000000000001');
 await buyer.getByRole('button',{name:'Enviar solicitação',exact:true}).click();
 await buyer.getByText('Aguardando orçamento',{exact:true}).waitFor();
 await owner.reload();await owner.getByRole('link',{name:'Abrir',exact:true}).click();
 await owner.getByLabel(/Preço de Adubo Teste/).fill('110');
 await owner.getByLabel('Desconto total (R$)',{exact:true}).fill('10');await owner.getByLabel('Frete (R$)',{exact:true}).fill('20');
 await owner.getByLabel('Sua mensagem',{exact:true}).fill('Estou preparando sua proposta.');
 await owner.getByRole('button',{name:'Enviar mensagem',exact:true}).click();
 await owner.getByText('Estou preparando sua proposta.',{exact:true}).waitFor();
 assert.equal(await owner.getByLabel(/Preço de Adubo Teste/).inputValue(),'110');
 assert.equal(await owner.getByLabel('Frete (R$)',{exact:true}).inputValue(),'20');
 await owner.getByLabel('Condições de pagamento',{exact:true}).fill('Na entrega');
 await owner.getByRole('button',{name:'Enviar orçamento',exact:true}).click();
 await owner.getByText('Versão 1 • R$ 230,00',{exact:true}).waitFor();
 await buyer.reload();await buyer.getByLabel('Motivo da revisão ou recusa',{exact:true}).fill('Pode melhorar o preço?');
 await buyer.getByRole('button',{name:'Pedir revisão',exact:true}).click();
 await buyer.locator('.commerce-badge').filter({hasText:'Revisão solicitada'}).waitFor();
 await owner.reload();await owner.getByLabel(/Preço de Adubo Teste/).fill('105');await owner.getByLabel('Condições de pagamento',{exact:true}).fill('Na entrega');
 await owner.getByRole('button',{name:'Enviar orçamento',exact:true}).click();
 await owner.getByText('Versão 2 • R$ 220,00',{exact:true}).waitFor();
 await buyer.reload();await buyer.getByText('Versão 1 • R$ 230,00',{exact:true}).waitFor();
 for(const width of [320,360,1280])for(const theme of ['light','dark']){
  await buyer.setViewportSize({width,height:900});await buyer.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await buyer.waitForTimeout(250); assert.equal(await buyer.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const duplicates=await buyer.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return ids.filter((v,i)=>ids.indexOf(v)!==i);});assert.deepEqual(duplicates,[]);
  if(width===360&&theme==='dark')await buyer.screenshot({path:'validation-artifacts/management-dark.png',fullPage:true});
 }
 await buyer.getByRole('button',{name:'Aceitar proposta e criar pedido',exact:true}).click();
 await buyer.getByRole('button',{name:'Confirmar pedido',exact:true}).click();
 await buyer.getByRole('heading',{name:'Pedido confirmado',exact:true}).waitFor();
 assert.equal(await buyer.getByRole('button',{name:'Pedir revisão',exact:true}).count(),0);
 const text='<img src=x onerror="window.injected=true"> Entregar pelo portão azul.';
 await buyer.getByLabel('Sua mensagem',{exact:true}).fill(text);
 await buyer.getByRole('button',{name:'Enviar mensagem',exact:true}).click();
 await buyer.getByText(text,{exact:true}).waitFor();
 assert.equal(await buyer.evaluate(()=>window.injected),undefined);
 await owner.reload();await owner.getByRole('heading',{name:'Pedido confirmado',exact:true}).waitFor();
 assert.equal(await owner.getByRole('button',{name:'Enviar orçamento',exact:true}).count(),0);
 await owner.getByText(text,{exact:true}).waitFor();
 await owner.getByLabel('Sua mensagem',{exact:true}).fill('Sim, vou combinar o horário com você.');
 await owner.getByRole('button',{name:'Enviar mensagem',exact:true}).click();
 await owner.getByText('Sim, vou combinar o horário com você.',{exact:true}).waitFor();
 await buyer.getByLabel('Sua mensagem',{exact:true}).fill('Rascunho');
 await buyer.getByRole('button',{name:'Atualizar conversa',exact:true}).click();
 assert.equal(await buyer.getByLabel('Sua mensagem',{exact:true}).inputValue(),'Rascunho');
 await buyer.getByLabel('Sua mensagem',{exact:true}).fill('');
 await buyer.getByRole('button',{name:'Atualizar conversa',exact:true}).click();
 await buyer.getByText('Sim, vou combinar o horário com você.',{exact:true}).waitFor();
 for(const width of [320,360,1280])for(const theme of ['light','dark']){
  await buyer.setViewportSize({width,height:900});await buyer.evaluate(t=>document.documentElement.dataset.theme=t,theme);await buyer.waitForTimeout(250);
  assert.equal(await buyer.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(width===360)await buyer.screenshot({path:'validation-artifacts/management-'+theme+'.png',fullPage:true});
 }

 await owner.getByRole('button',{name:'Informar que entreguei',exact:true}).click();
 await owner.getByRole('button',{name:'Sim, entreguei',exact:true}).click();
 await owner.getByText('Aguardando confirmação do produtor',{exact:true}).waitFor();
 await buyer.getByRole('button',{name:'Atualizar conversa',exact:true}).click();
 await buyer.getByRole('heading',{name:'Conferir recebimento',exact:true}).waitFor();
 await buyer.getByLabel('Problema encontrado',{exact:true}).fill('Faltou um saco.');
 await buyer.getByRole('button',{name:'Informar problema na entrega',exact:true}).click();
 await buyer.getByRole('heading',{name:'Entrega em ajuste',exact:true}).waitFor();
 await owner.getByRole('button',{name:'Atualizar conversa',exact:true}).click();
 await owner.getByRole('button',{name:'Informar que entreguei',exact:true}).click();
 await owner.getByRole('button',{name:'Sim, entreguei',exact:true}).click();
 await owner.getByText('Aguardando confirmação do produtor',{exact:true}).waitFor();
 await buyer.getByRole('button',{name:'Atualizar conversa',exact:true}).click();
 await buyer.getByRole('button',{name:'Confirmar recebimento integral',exact:true}).click();
 await buyer.getByRole('button',{name:'Sim, recebi tudo',exact:true}).click();
 await buyer.getByRole('heading',{name:'Recebimento concluído',exact:true}).waitFor();
 const lotLink=buyer.getByRole('link',{name:'Ver lote no barracão',exact:true});assert.match(await lotLink.getAttribute('href'),/^\/inventory\/[0-9a-f-]+\/lots\/[0-9a-f-]+$/);
 queue=queue.then(async()=>{await as(4);const entries=await f.rows('inventory_transactions');assert.equal(entries.length,1);assert.equal(Number(entries[0].quantity),50);});await queue;
 await buyer.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await buyer.waitForFunction(()=>Number(document.querySelector('[data-trade-unread]')?.textContent)>0);
 for(const width of [320,360,1280])for(const theme of ['light','dark']){
  await buyer.setViewportSize({width,height:900});await buyer.evaluate(t=>document.documentElement.dataset.theme=t,theme);await buyer.waitForTimeout(250);
  assert.equal(await buyer.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(width===360)await buyer.screenshot({path:'validation-artifacts/management-received-'+theme+'.png',fullPage:true});
 }
 await buyer.goto('http://127.0.0.1:5191/notificacoes/compras');
 await buyer.getByRole('heading',{name:'Entrega informada: confirme o recebimento',exact:true}).first().waitFor();
 const notification=buyer.locator('article').filter({hasText:'Entrega informada: confirme o recebimento'}).first();
 await notification.getByRole('link',{name:'Abrir negociação',exact:true}).click();
 await buyer.getByRole('heading',{name:'Recebimento concluído',exact:true}).waitFor();
 await owner.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await owner.goto('http://127.0.0.1:5191/notificacoes/compras');
 await owner.getByRole('heading',{name:'Recebimento confirmado',exact:true}).waitFor();
 await owner.screenshot({path:'validation-artifacts/management-inbox.png',fullPage:true});


 await owner.goto('http://127.0.0.1:5191/consultor/resultados?seller='+seller);
 await owner.getByText(/venda\(s\) recebida\(s\) ainda sem apuração/).waitFor();
 await owner.getByRole('link',{name:'Informar custos',exact:true}).click();
 await owner.getByLabel(/Custo por Saco de Adubo Teste/).fill('60');
 await owner.getByLabel('Custo da entrega para o vendedor (R$)',{exact:true}).fill('10');
 await owner.getByLabel('Outros custos deste pedido (R$)',{exact:true}).fill('5');
 await owner.getByLabel('Comissão do consultor (%)',{exact:true}).fill('10');
 await owner.getByRole('button',{name:'Salvar apuração',exact:true}).click();
 await owner.getByRole('heading',{name:'Versão 1 • Atual',exact:true}).waitFor();
 await owner.getByText('Resultado sobre custos informados: R$ 65,00',{exact:true}).waitFor();
 await owner.getByLabel('Comissão do consultor (%)',{exact:true}).fill('12.5');
 await owner.getByLabel('Motivo da correção',{exact:true}).fill('Percentual revisado com consultor');
 await owner.getByRole('button',{name:'Salvar apuração',exact:true}).click();
 await owner.getByRole('heading',{name:'Versão 2 • Atual',exact:true}).waitFor();
 await owner.getByRole('heading',{name:'Versão 1',exact:true}).waitFor();
 await owner.getByRole('link',{name:'← Resultados',exact:true}).click();
 await owner.getByRole('heading',{name:'Resultados do vendedor',exact:true}).waitFor();
 await owner.getByRole('heading',{name:'Produtos campeões de vendas',exact:true}).waitFor();
 assert.equal(await owner.locator('.sales-chart').count(),2);
 const summary=owner.locator('section').filter({has:owner.getByRole('heading',{name:'Resultado sobre custos informados',exact:true})});
 assert.match(await summary.textContent(),/60,00/);
 for(const width of [320,360,1280])for(const theme of ['light','dark']){
  await owner.setViewportSize({width,height:900});await owner.evaluate(t=>document.documentElement.dataset.theme=t,theme);await owner.waitForTimeout(250);
  assert.equal(await owner.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const duplicates=await owner.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return ids.filter((v,i)=>ids.indexOf(v)!==i);});assert.deepEqual(duplicates,[]);
  if(width===1280)await owner.screenshot({path:'validation-artifacts/management-results-desktop-'+theme+'.png',fullPage:true});
 if(width===360)await owner.screenshot({path:'validation-artifacts/management-results-'+theme+'.png',fullPage:true});
 }
 await buyer.goto('http://127.0.0.1:5191/consultor/resultados?seller='+seller);
 await buyer.getByRole('heading',{name:'Ative sua atuação comercial',exact:true}).waitFor();
 assert.equal(await buyer.getByRole('link',{name:'Revisar apuração',exact:true}).count(),0);


 await owner.goto('http://127.0.0.1:5191/consultor');
 await owner.getByRole('heading',{name:'Seu negócio, em um só lugar',exact:true}).waitFor();
 for(const theme of ['light','dark']){
  await owner.setViewportSize({width:390,height:900});await owner.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  assert.equal(await owner.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await owner.screenshot({path:'validation-artifacts/management-home-'+theme+'.png',fullPage:true});
 }
 await owner.getByRole('button',{name:'Ir para produtor',exact:true}).click();
 await owner.getByRole('button',{name:'Ir para consultor',exact:true}).waitFor();
 await owner.getByRole('button',{name:'Ir para consultor',exact:true}).click();
 await owner.getByRole('heading',{name:'Seu negócio, em um só lugar',exact:true}).waitFor();
 assert.equal(await owner.locator('.commerce-nav [aria-current="page"]').count(),1);

 await owner.getByRole('link',{name:'Gestão da empresa',exact:true}).click();
 await owner.getByRole('heading',{name:'Uma visão da sua equipe',exact:true}).waitFor();
 await owner.getByLabel('Valor da meta (R$)',{exact:true}).fill('10000');
 await owner.getByRole('button',{name:'Salvar meta',exact:true}).click();
 await owner.getByText('Alteração salva.',{exact:true}).waitFor();
 assert.match(await owner.locator('.manager-page').innerText(),/10.000,00/);
 await owner.getByLabel('Desconto sem aprovação (%)',{exact:true}).fill('10');
 await owner.getByRole('button',{name:'Salvar limites',exact:true}).click();
 await owner.getByText('Alteração salva.',{exact:true}).waitFor();
 await owner.getByLabel('Situação',{exact:true}).selectOption('received');
 await owner.getByRole('button',{name:'Filtrar negociações',exact:true}).click();
 await owner.getByRole('link',{name:'Acompanhamento interno',exact:true}).waitFor();
 assert.match(await owner.locator('.manager-page').innerText(),/Resultado do produto: R\$\s80,00/);
 for(const width of [320,360,1280])for(const theme of ['light','dark']){
  await owner.setViewportSize({width,height:900});await owner.evaluate(t=>document.documentElement.dataset.theme=t,theme);await owner.waitForTimeout(200);
  assert.equal(await owner.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Gestão não deve ultrapassar a tela '+width);
  const duplicates=await owner.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return ids.filter((v,i)=>ids.indexOf(v)!==i);});assert.deepEqual(duplicates,[]);
  if(width===360||width===1280)await owner.screenshot({path:'validation-artifacts/management-panel-'+width+'-'+theme+'.png',fullPage:true});
 }
 await owner.getByRole('link',{name:'Acompanhamento interno',exact:true}).click();
 await owner.getByRole('heading',{name:'Somente para a equipe',exact:true}).waitFor();
 const internal='<img src=x onerror="window.injected=true"> Nota só para equipe.';
 await owner.getByLabel('Nova nota interna',{exact:true}).fill(internal);
 await owner.getByRole('button',{name:'Adicionar nota',exact:true}).click();
 await owner.getByText(internal,{exact:true}).waitFor();assert.equal(await owner.evaluate(()=>window.injected),undefined);
 await owner.getByLabel('Próxima ação',{exact:true}).fill('Pós-venda');
 await owner.getByLabel('Data e hora do retorno',{exact:true}).fill('2026-10-05T10:00');
 await owner.getByRole('button',{name:'Salvar próxima ação',exact:true}).click();
 await owner.getByText('Acompanhamento salvo.',{exact:true}).waitFor();
 const workspaceUrl=owner.url();await buyer.goto(workspaceUrl);await buyer.getByText('Acompanhamento interno indisponível.',{exact:true}).waitFor();
 await buyer.goto('http://127.0.0.1:5191/consultor/gestao?seller='+seller);
 await buyer.getByText('Esta área é exclusiva do dono e dos gestores autorizados de uma empresa. Seu acesso de consultor continua disponível.',{exact:true}).waitFor();


 let approvalRequest;
 queue=queue.then(async()=>{
  for(const n of [2,3]){await as(1);await commerce('invite',{seller_id:seller,email:`user${n}@example.test`});const inv=(await f.rows('commerce_invitations')).find(i=>i.email===`user${n}@example.test`);await as(n);await commerce('enable',{name:n===2?'Gestor Teste':'Representante Teste'});await commerce('accept_invite',{token:inv.token});}
  await as(1);const c=(await f.rows('trade_connections'))[0],p=(await f.rows('trade_products'))[0];await db.query('select public.management_command($1,$2,$3)',['transfer',{seller_id:seller,connection_id:c.id,expected_agent:ids[0],agent_id:ids[2],reason:'Distribuir atendimento'},crypto.randomUUID()]);
  await as(4);approvalRequest=(await f.command('create_request',{connection_id:c.id,delivery_address:'Estrada da Fazenda, 100',items:[{product_id:p.id,quantity:2}]})).id;
 });await queue;
 await owner.goto('http://127.0.0.1:5191/consultor/gestao?seller='+seller);
 await owner.getByLabel('Representante para alterar acesso',{exact:true}).selectOption(ids[1]);
 await owner.getByLabel('Papel',{exact:true}).selectOption('manager');
 await owner.getByRole('button',{name:'Salvar permissões',exact:true}).click();await owner.getByText('Alteração salva.',{exact:true}).waitFor();
 const rep=await makePage(3),manager=await makePage(2);
 await rep.goto('http://127.0.0.1:5191/consultor/negociacoes?request='+approvalRequest);
 await rep.getByLabel(/Preço de Adubo Teste/).fill('100');await rep.getByLabel('Desconto total (R$)',{exact:true}).fill('50');await rep.getByLabel('Condições de pagamento',{exact:true}).fill('Na entrega');
 await rep.getByRole('button',{name:'Enviar orçamento',exact:true}).click();await rep.getByText('Proposta enviada para aprovação interna. O produtor receberá a proposta após a aprovação.',{exact:true}).waitFor();
 await manager.goto('http://127.0.0.1:5191/consultor');await manager.getByRole('link',{name:'Gestão da empresa',exact:true}).click();
 await manager.getByText('Seu acesso é operacional. Custos, comissões e resultados financeiros privados não são exibidos.',{exact:true}).waitFor();assert.equal(await manager.getByRole('heading',{name:'Permissões e limites',exact:true}).count(),0);
 await manager.getByLabel('Justificativa',{exact:true}).fill('Desconto autorizado pela gestão');await manager.getByRole('button',{name:'Aprovar e enviar proposta',exact:true}).click();await manager.getByText('Proposta aprovada e enviada ao produtor.',{exact:true}).waitFor();
 await buyer.goto('http://127.0.0.1:5191/compras?request='+approvalRequest);await buyer.getByText('Versão 1 • R$ 150,00',{exact:true}).waitFor();assert.equal(await buyer.getByRole('link',{name:'Acompanhamento interno',exact:true}).count(),0);

 missing=true;await buyer.goto('http://127.0.0.1:5191/compras');await buyer.getByText('A atualização de entregas e avisos ainda não foi instalada pelo responsável pelo sistema.',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);console.log('PASS: melhorias e fluxo comercial integrados, recebimento, avisos, custos, comissão, revisão sem duplicação, painel de resultados, isolamento do produtor e layouts claro/escuro.');
}catch(err){if(owner)await owner.screenshot({path:'validation-artifacts/management-owner-failure.png',fullPage:true});if(buyer)await buyer.screenshot({path:'validation-artifacts/management-failure.png',fullPage:true});throw err;}finally{await browser.close();await db.close();}




