import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {tradeFixture} from './trade-fixture.mjs';

test('Pedidos e mensagens: integridade e autorização',async t=>{
 const f=await tradeFixture(true);const {db,ids,as,commerce,command,rows}=f;
 try {
  await t.test('Migração reaplicável',async()=>db.exec(f.migration));
  await as(1);await commerce('enable',{name:'Responsável'});
  const seller=(await commerce('create_company',{name:'Loja Teste'})).seller_id;
  for(const n of [2,3]){
   await commerce('invite',{seller_id:seller,email:`user${n}@example.test`});
   const inv=(await rows('commerce_invitations')).find(i=>i.email===`user${n}@example.test`);
   await as(n);await commerce('enable',{name:'Consultor '+n});await commerce('accept_invite',{token:inv.token});await as(1);
  }
  const productData={seller_id:seller,name:'Adubo',package_name:'Saco',package_size:25,base_unit:'kg',availability:'available',reference_price:100};
  const product=(await command('save_product',productData)).id;
  await as(2);await command('invite_buyer',{seller_id:seller,email:'user4@example.test'});
  const inv=(await rows('trade_invitations'))[0];
  await as(4);const connection=(await command('accept_connection',{token:inv.token,name:'Produtor'})).id;
  const makeRequest=async()=>{await as(4);return (await command('create_request',{connection_id:connection,delivery_address:'Fazenda Teste, 100',items:[{product_id:product,quantity:2}]})).id;};
  const request=await makeRequest();
  const messageOp=randomUUID(),message={request_id:request,message:'Olá, entregar pelo portão azul?'};
  await t.test('Mensagem do produtor fica vinculada à negociação',async()=>{
   await command('send_message',{...message,sender_id:ids[0],sender_role:'seller'},messageOp);
   const m=(await rows('trade_messages'))[0];assert.equal(m.sender_id,ids[3]);assert.equal(m.sender_role,'buyer');
  });
  await t.test('Reenvio de mensagem é idempotente',async()=>{
   await command('send_message',{...message,sender_id:ids[0],sender_role:'seller'},messageOp);assert.equal((await rows('trade_messages')).length,1);
   await assert.rejects(command('send_message',{...message,message:'Alterada'},messageOp));
  });
  await t.test('Mensagem vazia ou longa é rejeitada',async()=>{
   for(const message of ['   ','\n\t ','a'.repeat(2001)])await assert.rejects(command('send_message',{request_id:request,message}));
  });
  await as(3);
  await t.test('Outro representante não lê nem envia mensagens',async()=>{
   assert.equal((await rows('trade_messages')).length,0);await assert.rejects(command('send_message',message));
  });
  await as(5);
  await t.test('Outro produtor não lê ou envia mensagens',async()=>{assert.equal((await rows('trade_messages')).length,0);await assert.rejects(command('send_message',message));});
  await as(2);
  await t.test('Consultor atribuído responde com autoria própria',async()=>{
   await command('send_message',{request_id:request,message:'Sim, combinado.'});const m=(await rows('trade_messages')).find(m=>m.sender_id===ids[1]);assert.equal(m.sender_role,'seller');
  });
  const quoteData={request_id:request,items:[{product_id:product,unit_price:110}],discount:10,freight:20,valid_until:new Date(Date.now()+86400000).toISOString(),delivery_days:3,payment_terms:'Na entrega'};
  const first=(await command('send_quote',quoteData)).id;
  const accept={request_id:request,quote_id:first};
  await t.test('Consultor não aceita pelo produtor',async()=>assert.rejects(command('accept_quote',accept)));
  await as(4);
  await t.test('Aceite exige a proposta exata',async()=>{
   await assert.rejects(command('accept_quote',{request_id:request}));await assert.rejects(command('accept_quote',{...accept,quote_id:randomUUID()}));
  });
  await command('request_revision',{...accept,message:'Pode reduzir?'});
  await t.test('Proposta em revisão não pode ser aceita',async()=>assert.rejects(command('accept_quote',accept)));
  await as(2);const second=(await command('send_quote',{...quoteData,items:[{product_id:product,unit_price:105}]})).id;
  await as(4);
  await t.test('Proposta substituída não cria pedido',async()=>assert.rejects(command('accept_quote',accept)));
  await db.exec('reset role');await db.query("update public.trade_quotes set valid_until=now()-interval '1 second' where id=$1",[second]);await as(4);
  await t.test('Proposta expirada não cria pedido',async()=>assert.rejects(command('accept_quote',{...accept,quote_id:second})));
  await db.exec('reset role');await db.query("update public.trade_quotes set valid_until=now()+interval '1 day' where id=$1",[second]);await as(4);
  const op=randomUUID(),payload={request_id:request,quote_id:second,total:1,buyer_id:ids[4]};
  await t.test('Conexão desativada impede aceite',async()=>{
   await db.exec('reset role');await db.query('update public.trade_connections set active=false where id=$1',[connection]);await as(4);
   await assert.rejects(command('accept_quote',payload));
   await db.exec('reset role');await db.query('update public.trade_connections set active=true where id=$1',[connection]);await as(4);
  });
  await t.test('Representante removido impede aceite até transferir atendimento',async()=>{
   await db.exec('reset role');await db.query('update public.commerce_memberships set active=false where seller_id=$1 and user_id=$2',[seller,ids[1]]);await as(4);
   await assert.rejects(command('accept_quote',payload));
   await db.exec('reset role');await db.query('update public.commerce_memberships set active=true where seller_id=$1 and user_id=$2',[seller,ids[1]]);await as(4);
  });
  await t.test('Aceite exige e-mail confirmado',async()=>{
   await db.exec('reset role');await db.query('update auth.users set email_confirmed_at=null where id=$1',[ids[3]]);await as(4);
   await assert.rejects(command('accept_quote',payload));
   await db.exec('reset role');await db.query('update auth.users set email_confirmed_at=now() where id=$1',[ids[3]]);await as(4);
  });
  let orderId;
  await t.test('Aceite cria pedido com cópia exata dos valores e destino',async()=>{
   orderId=(await command('accept_quote',payload,op)).id;
   const o=(await rows('trade_orders'))[0];assert.equal(o.id,orderId);assert.equal(Number(o.total),220);assert.equal(o.buyer_id,ids[3]);assert.equal(o.quote_id,second);
   assert.equal(o.quote_snapshot.items[0].name,'Adubo');assert.equal(o.delivery_snapshot.address,'Fazenda Teste, 100');assert.equal(o.agent_at_acceptance,ids[1]);
   assert.equal((await rows('trade_requests'))[0].state,'ordered');assert.equal((await rows('trade_quotes')).find(q=>q.id===second).status,'accepted');
  });
  await t.test('Repetir aceite não duplica pedido ou atividade',async()=>{
   assert.equal((await command('accept_quote',payload,op)).id,orderId);
   await assert.rejects(command('accept_quote',payload));assert.equal((await rows('trade_orders')).length,1);
   assert.equal((await rows('trade_events')).filter(e=>e.action==='accept_quote').length,1);
  });
  await t.test('Após aceite, produtor não revisa, recusa ou cancela solicitação',async()=>{
   for(const action of ['request_revision','decline_quote','cancel_request'])await assert.rejects(command(action,{...payload,message:'Tentar alterar'}));
  });
  await as(2);
  await t.test('Após aceite, consultor não muda proposta nem encerra solicitação',async()=>{
   await assert.rejects(command('send_quote',quoteData));await assert.rejects(command('reject_request',{request_id:request,message:'Encerrar'}));
  });
  await t.test('Conversa continua depois do aceite',async()=>{await command('send_message',{request_id:request,message:'Vamos combinar a entrega.'});assert.equal((await rows('trade_messages')).length,3);});
  await as(1);await command('save_product',{...productData,product_id:product,name:'Adubo novo',package_size:50});
  await t.test('Mudança no catálogo não altera pedido confirmado',async()=>{const o=(await rows('trade_orders'))[0];assert.equal(o.quote_snapshot.items[0].name,'Adubo');assert.equal(Number(o.quote_snapshot.items[0].package_size),25);});
  await t.test('Escrita direta, edição e exclusão das novas tabelas são negadas',async()=>{
   for(const table of ['trade_orders','trade_messages']){
    await assert.rejects(db.exec(`delete from public.${table}`));await assert.rejects(db.exec(`update public.${table} set id=id`));await assert.rejects(db.exec(`insert into public.${table} default values`));
   }
  });
  await command('assign_agent',{connection_id:connection,agent_id:ids[2]});
  await as(2);
  await t.test('Transferência retira acesso do antigo representante',async()=>{assert.equal((await rows('trade_orders')).length,0);assert.equal((await rows('trade_messages')).length,0);await assert.rejects(command('send_message',message));});
  await as(3);
  await t.test('Novo representante recebe histórico sem mudar autoria original',async()=>{assert.equal((await rows('trade_orders')).length,1);assert.equal((await rows('trade_messages')).length,3);assert.equal((await rows('trade_orders'))[0].agent_at_acceptance,ids[1]);await command('send_message',{request_id:request,message:'Sou o novo responsável.'});});
  await as(4);
  await t.test('Produtor mantém acesso após transferência',async()=>assert.equal((await rows('trade_orders')).length,1));
  const cancelled=await makeRequest();await command('cancel_request',{request_id:cancelled,message:'Adiar'});
  await t.test('Conversa encerrada não recebe mensagens',async()=>assert.rejects(command('send_message',{request_id:cancelled,message:'Teste'})));
  await as(5);
  await t.test('Outro produtor não lê pedido',async()=>assert.equal((await rows('trade_orders')).length,0));
  await as(null,'anon');
  await t.test('Anônimo não acessa pedidos ou conversa',async()=>{
   await assert.rejects(rows('trade_orders'));await assert.rejects(rows('trade_messages'));await assert.rejects(command('accept_quote',payload));
  });
  await db.exec('reset role');
  await t.test('Reaplicar migração preserva pedido e conversa',async()=>{await db.exec(f.migration);assert.equal((await rows('trade_orders')).length,1);assert.equal((await rows('trade_messages')).length,4);});
 }finally{await db.close();}
});
