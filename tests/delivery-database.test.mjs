import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {deliveryFixture} from './delivery-fixture.mjs';

test('Entrega, barracão e avisos',async t=>{
 const f=await deliveryFixture();const {db,ids,as,commerce,command,rows,fulfillment,inbox}=f;
 try{
  await t.test('Migração reaplicável',async()=>db.exec(f.migration));
  await as(1);await commerce('enable',{name:'Consultor'});const seller=(await commerce('create_company',{name:'Loja Agro'})).seller_id;
  const p={seller_id:seller,name:'Adubo',brand:'Teste',package_name:'Saco',package_size:25,base_unit:'kg',availability:'available',reference_price:100};
  const product=(await command('save_product',p)).id;
  const liquid=(await command('save_product',{...p,name:'Líquido',package_name:'Frasco',package_size:5,base_unit:'L'})).id;
  const unit=(await command('save_product',{...p,name:'Unidade',package_name:'Caixa',package_size:12,base_unit:'un'})).id;
  await command('invite_buyer',{seller_id:seller,email:'user4@example.test'});const inv=(await rows('trade_invitations'))[0];
  await as(4);const connection=(await command('accept_connection',{token:inv.token,name:'Produtor'})).id;
  const products=[product,liquid,unit];
  const createOrder=async()=>{
   await as(4);const rid=(await command('create_request',{connection_id:connection,delivery_address:'Fazenda, portão 100',items:products.map(product_id=>({product_id,quantity:2}))})).id;
   await as(1);const q=(await command('send_quote',{request_id:rid,items:products.map(product_id=>({product_id,unit_price:100})),discount:10,freight:20,valid_until:new Date(Date.now()+86400000).toISOString(),delivery_days:3,payment_terms:'Na entrega'})).id;
   await as(4);return {id:(await command('accept_quote',{request_id:rid,quote_id:q})).id,request_id:rid};
  };
  const order=await createOrder();
  const data={order_id:order.id,delivery_version:1,items:products.map(product_id=>({product_id,input_id:''}))};
  await t.test('Produtor recebe aviso da proposta, sem autoaviso do próprio aceite',async()=>{const n=await inbox();assert.equal(n.unread_count,1);assert.equal(n.items[0].kind,'send_quote');assert.match(n.items[0].route,/^\/compras/);});
  await t.test('Antes da entrega, não confirma nem recebe estoque',async()=>{await assert.rejects(fulfillment('confirm_receipt',data));assert.equal((await rows('inventory_lots')).length,0);});
  await t.test('Produtor não se passa pelo consultor na entrega',async()=>assert.rejects(fulfillment('mark_delivery',{order_id:order.id})));
  await as(5);
  await t.test('Terceiro não acessa avisos nem altera entrega',async()=>{assert.equal((await inbox()).items.length,0);await assert.rejects(fulfillment('mark_delivery',{order_id:order.id}));});
  await as(1);let deliveryOp=randomUUID();
  await t.test('Avisos do consultor incluem solicitação e aceite',async()=>{const n=await inbox();assert.equal(n.unread_count,2);assert.ok(n.items.every(i=>i.route.startsWith('/consultor/negociacoes')));});
  await fulfillment('mark_delivery',{order_id:order.id,message:'Entregue na porteira'},deliveryOp);
  await t.test('Entrega não gera estoque; consultor não pode confirmar recebimento',async()=>{assert.equal((await rows('inventory_lots')).length,0);await assert.rejects(fulfillment('confirm_receipt',data));});
  await t.test('Repetir entrega não duplica evento ou aviso',async()=>{await fulfillment('mark_delivery',{order_id:order.id,message:'Entregue na porteira'},deliveryOp);assert.equal((await rows('trade_events')).filter(e=>e.action==='mark_delivery').length,1);});
  await as(4);
  await t.test('Produtor é avisado para conferir recebimento',async()=>assert.ok((await inbox()).items.some(n=>n.kind==='mark_delivery')));
  await t.test('Mensagem gera aviso uma única vez ao outro lado',async()=>{const op=randomUUID();const m={request_id:order.request_id,message:'Faltou uma caixa.'};await command('send_message',m,op);await command('send_message',m,op);await as(1);assert.equal((await inbox()).items.filter(n=>n.kind==='send_message').length,1);await as(4);});
  await t.test('Problema exige motivo',async()=>assert.rejects(fulfillment('report_delivery_issue',{...data,message:' '})));
  await fulfillment('report_delivery_issue',{...data,message:'Faltou uma caixa.'});
  await t.test('Divergência mantém estoque vazio',async()=>{assert.equal((await rows('trade_orders'))[0].state,'delivery_issue');assert.equal((await rows('inventory_lots')).length,0);await assert.rejects(fulfillment('confirm_receipt',data));});
  await as(1);await fulfillment('mark_delivery',{order_id:order.id,message:'Entrega corrigida'});await as(4);
  await t.test('Resposta antiga não confirma uma nova tentativa',async()=>assert.rejects(fulfillment('confirm_receipt',data)));
  data.delivery_version=2;
  await db.exec('reset role');
  const otherInput=(await db.query("insert into public.agricultural_inputs(user_id,name,category,base_unit) values($1,'Privado','other','kg') returning id",[ids[4]])).rows[0].id;
  const ownInput=(await db.query("insert into public.agricultural_inputs(user_id,name,category,base_unit) values($1,'Adubo existente','other','kg') returning id",[ids[3]])).rows[0].id;
  await as(4);
  await t.test('Insumo alheio e unidade incorreta são rejeitados sem entrada parcial',async()=>{
   await assert.rejects(fulfillment('confirm_receipt',{...data,items:[data.items[0],{product_id:liquid,input_id:otherInput},data.items[2]]}));
   await assert.rejects(fulfillment('confirm_receipt',{...data,items:[data.items[0],{product_id:liquid,input_id:ownInput},data.items[2]]}));
   assert.equal((await rows('inventory_lots')).length,0);assert.equal((await rows('trade_receipt_items')).length,0);
   assert.equal((await rows('agricultural_inputs')).length,1);
  });
  await t.test('Itens faltantes e repetidos são rejeitados',async()=>{await assert.rejects(fulfillment('confirm_receipt',{...data,items:[]}));await assert.rejects(fulfillment('confirm_receipt',{...data,items:[data.items[0],data.items[0],data.items[2]]}));});
  data.items[0].input_id=ownInput;const receiptOp=randomUUID();
  await t.test('Custo incompatível no gatilho do barracão desfaz todo o recebimento',async()=>{
   await db.exec('reset role');await db.exec("create function public.test_bad_cost() returns trigger language plpgsql as $$begin new.total_cost:=0;return new;end$$;create trigger test_bad_cost before insert on public.inventory_transactions for each row execute function public.test_bad_cost();");
   await as(4);await assert.rejects(fulfillment('confirm_receipt',data),/não preservou/);assert.equal((await rows('inventory_lots')).length,0);
   await db.exec('reset role');await db.exec('drop trigger test_bad_cost on public.inventory_transactions;drop function public.test_bad_cost();');await as(4);
  });
  await fulfillment('confirm_receipt',data,receiptOp);
  await t.test('Recebimento converte embalagens e usa insumo existente',async()=>{
   const receipt=await rows('trade_receipt_items');assert.equal(receipt.length,3);
   const kg=receipt.find(i=>i.product_id===product),l=receipt.find(i=>i.product_id===liquid),u=receipt.find(i=>i.product_id===unit);
   assert.equal(Number(kg.quantity),50);assert.equal(kg.agricultural_input_id,ownInput);assert.equal(Number(l.quantity),10);assert.equal(l.unit,'l');assert.equal(Number(u.quantity),24);assert.equal(u.unit,'unit');
   assert.equal((await rows('trade_orders'))[0].state,'received');assert.equal((await rows('inventory_transactions')).length,3);
  });
  await t.test('Frete e desconto são rateados sem perder centavos',async()=>{
   assert.equal((await rows('inventory_lots')).reduce((n,l)=>n+Math.round(Number(l.total_price)*100),0),61000);
   assert.equal((await rows('trade_receipt_items')).reduce((n,i)=>n+Math.round(Number(i.total_cost)*100),0),61000);
  });
  await t.test('Reenvio ou novo clique não duplica estoque',async()=>{await fulfillment('confirm_receipt',data,receiptOp);await assert.rejects(fulfillment('confirm_receipt',data));assert.equal((await rows('inventory_transactions')).length,3);});
  await t.test('Não pode contestar recebimento já confirmado',async()=>assert.rejects(fulfillment('report_delivery_issue',{...data,message:'Alterar'})));
  await t.test('Leitura de aviso altera somente aviso próprio',async()=>{
   const n=(await inbox()).items[0];await db.query('select public.trade_mark_notification_read($1)',[n.id]);assert.ok((await inbox()).items.find(i=>i.id===n.id).read_at);
   await as(5);await db.query('select public.trade_mark_notification_read($1)',[n.id]);assert.equal((await inbox()).items.length,0);await as(4);
  });
  await t.test('Escrita direta nas tabelas de recebimento e avisos é bloqueada',async()=>{
   for(const table of ['trade_receipt_items','trade_inventory_links','trade_notifications']){await assert.rejects(db.exec(`delete from public.${table}`));await assert.rejects(db.exec(`insert into public.${table} default values`));}
  });
  await as(1);
  await t.test('Consultor recebe confirmação, sem ver lotes privados do produtor',async()=>{assert.ok((await inbox()).items.some(n=>n.kind==='confirm_receipt'));assert.equal((await rows('trade_receipt_items')).length,0);assert.equal((await rows('inventory_lots')).length,0);});
  const next=await createOrder();await as(1);await fulfillment('mark_delivery',{order_id:next.id});await as(4);await fulfillment('confirm_receipt',{order_id:next.id,delivery_version:1,items:products.map(product_id=>({product_id,input_id:''}))});
  await t.test('Próxima compra reaproveita vínculos e acrescenta saldo',async()=>{assert.equal((await rows('agricultural_inputs')).length,3);assert.equal((await rows('inventory_lots')).length,6);assert.equal((await rows('inventory_transactions')).filter(i=>i.agricultural_input_id===ownInput).reduce((n,i)=>n+Number(i.quantity),0),100);});
  await as(1);await commerce('invite',{seller_id:seller,email:'user2@example.test'});const repInvite=(await rows('commerce_invitations'))[0];
  await as(2);await commerce('enable',{name:'Representante'});await commerce('accept_invite',{token:repInvite.token});
  await as(1);await command('assign_agent',{connection_id:connection,agent_id:ids[1]});
  await as(4);await command('send_message',{request_id:order.request_id,message:'Conversa com novo consultor'});
  await t.test('Aviso chega ao representante atual e ao responsável, sem duplicatas',async()=>{
   await as(2);assert.equal((await inbox()).items.length,1);assert.equal((await inbox()).items[0].kind,'send_message');
   await as(1);assert.equal((await inbox()).items.filter(i=>i.kind==='send_message').length,2);
  });
  await command('assign_agent',{connection_id:connection,agent_id:ids[0]});
  await t.test('Antigo representante perde acesso também aos avisos históricos',async()=>{await as(2);assert.equal((await inbox()).items.length,0);assert.equal((await rows('trade_notifications')).length,0);});
  await as(null,'anon');
  await t.test('Anônimo não acessa RPCs de entrega e avisos',async()=>{await assert.rejects(inbox());await assert.rejects(fulfillment('confirm_receipt',data));});
  await db.exec('reset role');
  await t.test('Mais de 100 avisos continuam acessíveis ao ler os primeiros',async()=>{
   await db.query("insert into public.trade_notifications(recipient_id,request_id,source_id,kind,title,body,created_at) select $1,$2,gen_random_uuid(),'send_message','Histórico','Teste',now()-interval '1 day' from generate_series(1,140)",[ids[3],order.request_id]);
   await as(4);const before=await inbox();assert.equal(before.items.length,100);assert.ok(before.items.every(i=>!i.read_at));
   await db.query('select public.trade_mark_notification_read($1)',[before.items[0].id]);const after=await inbox();
   assert.equal(after.unread_count,before.unread_count-1);assert.ok(after.items.some(i=>!before.items.some(old=>old.id===i.id)));
   await db.exec('reset role');
  });
  await t.test('Reaplicação não repete estoque ou avisos',async()=>{const count=(await rows('trade_notifications')).length;await db.exec(f.migration);assert.equal((await rows('inventory_lots')).length,6);assert.equal((await rows('trade_notifications')).length,count);});
 }finally{await db.close();}
});
