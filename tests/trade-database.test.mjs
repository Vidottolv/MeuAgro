import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { tradeFixture } from './trade-fixture.mjs';

test('Catálogo, conexões e propostas em PostgreSQL',async t=>{
 const f=await tradeFixture(true);const {db,ids,as,commerce,command,rows}=f;
 try{
  await t.test('Migration reaplicável',async()=>db.exec(f.migration));
  await as(1);await commerce('enable',{name:'Vendedor Um'});
  const seller=(await commerce('create_company',{name:'Empresa Um'})).seller_id;
  const seller2=(await commerce('create_company',{name:'Empresa Dois'})).seller_id;
  for(const n of [2,3]){
   await commerce('invite',{seller_id:seller,email:`user${n}@example.test`});
   const inv=(await rows('commerce_invitations')).find(i=>i.email===`user${n}@example.test`);
   await as(n);await commerce('enable',{name:'Representante '+n});await commerce('accept_invite',{token:inv.token});await as(1);
  }
  const payload={seller_id:seller,name:'Adubo Teste',brand:'Marca',category:'Nutrição',description:'Produto de teste',package_name:'Saco',base_unit:'kg',package_size:25,reference_price:100,availability:'available'};
  const op=randomUUID();const product=(await command('save_product',payload,op)).id;
  await t.test('Repetição da mesma operação não duplica produto',async()=>{assert.equal((await command('save_product',payload,op)).id,product);assert.equal((await rows('trade_products')).length,1);});
  await t.test('Chave repetida com dados diferentes é rejeitada',async()=>assert.rejects(command('save_product',{...payload,name:'Outro'},op)));
  await t.test('Rejeita valores, unidades e conteúdo inválidos',async()=>{
   for(const delta of [{package_size:0},{base_unit:'ton'},{reference_price:-1},{package_size:1.0001},{reference_price:1.001},{availability:'maybe'}])await assert.rejects(command('save_product',{...payload,...delta}));
  });
  const otherProduct=(await command('save_product',{...payload,seller_id:seller2})).id;
  await as(2);
  await t.test('Representante lê catálogo, mas não o altera',async()=>{assert.equal((await rows('trade_products')).length,1);await assert.rejects(command('save_product',{...payload,product_id:product}));});
  await command('invite_buyer',{seller_id:seller,email:'user4@example.test'});
  const invite=(await rows('trade_invitations'))[0];
  await t.test('Convite pendente duplicado é rejeitado',async()=>assert.rejects(command('invite_buyer',{seller_id:seller,email:'USER4@example.test'})));
  await as(5);
  await t.test('Terceiro não acessa catálogo nem usa convite alheio',async()=>{assert.equal((await rows('trade_products')).length,0);await assert.rejects(command('accept_connection',{token:invite.token,name:'Intruso'}));});
  await as(4);const connection=(await command('accept_connection',{token:invite.token,name:'Produtor Quatro'})).id;
  await t.test('Conexão libera somente catálogo autorizado',async()=>assert.equal((await rows('trade_products')).length,1));
  await t.test('Código de conexão é de uso único',async()=>assert.rejects(command('accept_connection',{token:invite.token,name:'Produtor Quatro'})));
  const requestData={connection_id:connection,delivery_address:'Estrada da Fazenda, 100',property_id:'10000000-0000-4000-8000-000000000001',notes:'Entregar pela manhã',items:[{product_id:product,quantity:2}]};
  await t.test('Não permite inserir produtos de outro vendedor',async()=>assert.rejects(command('create_request',{...requestData,items:[{product_id:otherProduct,quantity:1}]})));
  await t.test('Valida duplicados, quantidade e propriedade',async()=>{
   await assert.rejects(command('create_request',{...requestData,items:[{product_id:product,quantity:0}]}));
   await assert.rejects(command('create_request',{...requestData,items:[{product_id:product,quantity:1},{product_id:product,quantity:1}]}));
   await assert.rejects(command('create_request',{...requestData,property_id:ids[0]}));
  });
  const requestOp=randomUUID();const request=(await command('create_request',requestData,requestOp)).request_id;
  await t.test('Reenvio da solicitação não duplica registro ou evento',async()=>{await command('create_request',requestData,requestOp);assert.equal((await rows('trade_requests')).length,1);assert.equal((await rows('trade_events')).length,1);});
  await as(3);
  await t.test('Outro representante da empresa não lê o cliente',async()=>{assert.equal((await rows('trade_requests')).length,0);assert.equal((await rows('trade_connections')).length,0);});
  const qdata={request_id:request,items:[{product_id:product,unit_price:110}],discount:10,freight:20,valid_until:new Date(Date.now()+86400000).toISOString(),delivery_days:3,payment_terms:'Pagamento na entrega',message:'Primeira proposta',total:1};
  await t.test('Outro representante não envia proposta',async()=>assert.rejects(command('send_quote',qdata)));
  await as(2);
  await command('ask_clarification',{request_id:request,message:'Qual é a referência do acesso?'});
  await t.test('Não envia proposta antes do esclarecimento',async()=>assert.rejects(command('send_quote',qdata)));
  await as(4);await command('answer_clarification',{request_id:request,message:'Portão azul'});
  await as(2);
  await t.test('Rejeita preços negativos, desconto excessivo e validade passada',async()=>{
   for(const patch of [{discount:999},{valid_until:new Date(Date.now()-1000).toISOString()},{items:[{product_id:product,unit_price:-2}]}])await assert.rejects(command('send_quote',{...qdata,...patch}));
  });
  const quoteOp=randomUUID();const first=(await command('send_quote',qdata,quoteOp)).id;
  await t.test('Totais são calculados no banco, sem confiar no cliente',async()=>{const q=(await rows('trade_quotes'))[0];assert.equal(Number(q.total),230);assert.equal(Number(q.subtotal),220);assert.equal(Number(q.items[0].quantity),2);});
  await t.test('Repetição de envio não cria nova versão',async()=>{await command('send_quote',qdata,quoteOp);assert.equal((await rows('trade_quotes')).length,1);});
  await t.test('Nova versão exige resposta do produtor',async()=>assert.rejects(command('send_quote',qdata)));
  await as(4);
  await t.test('Produtor não pode precificar a proposta',async()=>assert.rejects(command('send_quote',qdata)));
  await command('request_revision',{request_id:request,quote_id:first,message:'Pode reduzir o preço?'});
  await as(1);await command('save_product',{...payload,product_id:product,name:'Novo nome do catálogo',package_size:50,reference_price:999});
  await as(2);const second=(await command('send_quote',{...qdata,items:[{product_id:product,unit_price:105}],message:'Segunda proposta'})).id;
  await t.test('Versões preservam nome, embalagem, quantidades e valores',async()=>{
   const q=(await rows('trade_quotes')).sort((a,b)=>a.version-b.version);
   assert.equal(q.length,2);assert.equal(q[0].status,'superseded');assert.equal(q[0].items[0].name,'Adubo Teste');assert.equal(q[1].items[0].package_size,25);assert.equal(Number(q[0].total),230);assert.equal(Number(q[1].total),220);
  });
  await as(4);
  await t.test('Resposta a uma versão antiga é rejeitada',async()=>assert.rejects(command('decline_quote',{request_id:request,quote_id:first,message:'Antiga'})));
  await command('decline_quote',{request_id:request,quote_id:second,message:'Não vou comprar agora'});
  await as(2);
  await t.test('Solicitação encerrada não recebe novas propostas',async()=>assert.rejects(command('send_quote',qdata)));
  await t.test('Proposta recusada não pode ser aceita',async()=>assert.rejects(command('accept_quote',{request_id:request,quote_id:second})));
  await as(4);
  const toCancel=(await command('create_request',requestData)).request_id;
  await t.test('Produtor pode cancelar antes do pedido',async()=>{
    await command('cancel_request',{request_id:toCancel,message:'Não preciso mais'});
    assert.equal((await rows('trade_requests')).find(r=>r.id===toCancel).state,'cancelled');
  });
  const toReject=(await command('create_request',requestData)).request_id;
  await as(2);
  await t.test('Consultor pode recusar atendimento com motivo',async()=>{
    await command('reject_request',{request_id:toReject,message:'Não atendemos essa região'});
    assert.equal((await rows('trade_requests')).find(r=>r.id===toReject).state,'rejected');
  });
  await as(1);await command('archive_product',{seller_id:seller,product_id:product});
  await as(4);
  await t.test('Arquivar esconde produto e preserva orçamentos',async()=>{assert.equal((await rows('trade_products')).length,0);assert.equal((await rows('trade_quotes')).length,2);await assert.rejects(command('create_request',requestData));});
  await as(1);const member=(await rows('commerce_memberships')).find(m=>m.user_id===ids[1]);await commerce('end_membership',{membership_id:member.id});
  await as(2);
  await t.test('Representante revogado perde acesso às negociações',async()=>{assert.equal((await rows('trade_requests')).length,0);assert.equal((await rows('trade_quotes')).length,0);await assert.rejects(command('invite_buyer',{seller_id:seller,email:'user5@example.test'}));});
  await as(1);await command('assign_agent',{connection_id:connection,agent_id:ids[2]});
  await as(3);
  await t.test('Responsável transfere atendimento e histórico a representante ativo',async()=>assert.equal((await rows('trade_requests')).length,3));
  await t.test('Representante não transfere atendimento',async()=>assert.rejects(command('assign_agent',{connection_id:connection,agent_id:ids[1]})));
  await t.test('Escrita direta e leitura de recibos internos negadas',async()=>{
   await assert.rejects(db.query("update public.trade_quotes set total=0"));await assert.rejects(rows('trade_operations'));await assert.rejects(db.query('delete from public.trade_events'));
  });
  await as(5);
  await t.test('Terceiro não vê propostas ou eventos',async()=>{assert.equal((await rows('trade_quotes')).length,0);assert.equal((await rows('trade_events')).length,0);});
  await as(1);await command('invite_buyer',{seller_id:seller,email:'user6@example.test'});
  const unconfirmed=(await rows('trade_invitations')).find(i=>i.email==='user6@example.test');
  await as(6);
  await t.test('Conexão exige e-mail confirmado',async()=>assert.rejects(command('accept_connection',{token:unconfirmed.token,name:'Sem confirmação'})));
  await as(1);await command('revoke_connection_invite',{invitation_id:unconfirmed.id});
  await as(6);
  await t.test('Convite cancelado não conecta o produtor',async()=>assert.rejects(command('accept_connection',{token:unconfirmed.token,name:'Cancelado'})));
  await as(3);await command('invite_buyer',{seller_id:seller,email:'user5@example.test'});
  const pending=(await rows('trade_invitations')).find(i=>i.email==='user5@example.test');
  await as(1);const m3=(await rows('commerce_memberships')).find(m=>m.user_id===ids[2]);await commerce('end_membership',{membership_id:m3.id});
  await as(5);
  await t.test('Convite de representante revogado não pode ser aceito',async()=>assert.rejects(command('accept_connection',{token:pending.token,name:'Produtor Cinco'})));
  await db.exec('reset role');await db.query("update public.trade_invitations set expires_at=now()-interval '1 day' where id=$1",[pending.id]);await as(5);
  await t.test('Convite expirado não conecta o produtor',async()=>assert.rejects(command('accept_connection',{token:pending.token,name:'Produtor Cinco'})));
  await as(null,'anon');
  await t.test('Anônimo não lê tabelas nem executa operações',async()=>{await assert.rejects(rows('trade_products'));await assert.rejects(command('save_product',payload));});
 }finally{await db.close();}
});
