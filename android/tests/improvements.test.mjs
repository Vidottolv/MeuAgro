import test from 'node:test';
import assert from 'node:assert/strict';
import {improvementsFixture} from './improvements-fixture.mjs';

test('Convites, ranking e fila push',async t=>{
 const f=await improvementsFixture(),{db,as,commerce,command,rows,ids}=f;
 const rpc=async(name,args=[],types=[]) =>(await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)+(types[i]?'::'+types[i]:'')).join(',')}) r`,args)).rows[0].r;
 const token='device-token-test-1234567890';
 try{
  await t.test('Migrações reaplicáveis',async()=>{await db.exec(f.commerceMigration);await db.exec(f.pushMigration);});
  await as(1);await commerce('enable',{name:'Consultor'});const seller=(await commerce('create_company',{name:'Empresa'})).seller_id;
  await t.test('Geração de códigos de 16 dígitos sem duplicação na amostra',async()=>{await db.exec('reset role');const codes=(await db.query('select public.commerce_invite_code() code from generate_series(1,1000)')).rows.map(r=>r.code);assert.ok(codes.every(c=>/^\d{16}$/.test(c)));assert.equal(new Set(codes).size,1000);await as(1);});

  await t.test('Convite do representante também usa código curto',async()=>{
   await commerce('invite',{seller_id:seller,email:'user2@example.test'});const i=(await rows('commerce_invitations'))[0];assert.match(i.token,/^\d{16}$/);
   await as(2);await commerce('enable',{name:'Representante'});await commerce('accept_invite',{token:i.token});await as(1);
  });
  await t.test('Convites UUID antigos continuam sendo aceitos',async()=>{
   await command('invite_buyer',{seller_id:seller,email:'user5@example.test'});
   await db.exec('reset role');await db.query("update trade_invitations set token=$1 where email='user5@example.test'",['11111111-1111-4111-8111-111111111111']);
   await as(5);assert.ok((await command('accept_connection',{token:'11111111-1111-4111-8111-111111111111',name:'Cliente antigo'})).id);await as(1);
  });
  await command('invite_buyer',{seller_id:seller,email:'user4@example.test'});const invite=(await rows('trade_invitations')).find(i=>i.email==='user4@example.test');
  await t.test('Convite novo usa 16 dígitos',()=>assert.match(invite.token,/^\d{16}$/));
  await as(4);const conn=(await command('accept_connection',{token:invite.token,name:'Produtor'})).id;
  await t.test('Token curto conecta o destinatário correto',()=>assert.ok(conn));
  await as(1);const product=(await command('save_product',{seller_id:seller,name:'Adubo',package_name:'Saco',base_unit:'kg',package_size:25,reference_price:100,availability:'available'})).id;
  await t.test('Dispositivo pode registrar e atualizar sem duplicar',async()=>{await rpc('trade_register_push',[token]);await rpc('trade_register_push',[token]);await db.exec('reset role');assert.equal((await rows('trade_push_devices')).length,1);await as(1);});
  await t.test('Usuários não leem tokens nem a fila e não disparam envios',async()=>{await assert.rejects(rows('trade_push_devices'));await assert.rejects(rows('trade_push_queue'));await assert.rejects(rpc('trade_claim_push'));});
  await as(4);const req=(await command('create_request',{connection_id:conn,delivery_address:'Fazenda 100',items:[{product_id:product,quantity:2}]})).id;
  let jobs;
  await t.test('Solicitação gera fila para a outra parte',async()=>{await as(null,'service_role');jobs=await rpc('trade_claim_push');assert.equal(jobs.length,1);assert.equal(jobs[0].recipient_id,ids[0]);assert.equal(jobs[0].route,'/consultor/negociacoes?request='+req);});
  await t.test('Reserva impede envio simultâneo duplicado',async()=>assert.equal((await rpc('trade_claim_push')).length,0));
  await t.test('Falha transitória agenda nova tentativa',async()=>{await rpc('trade_finish_push',[jobs[0].id,jobs[0].lease,'retry',token]);await db.exec('reset role');const q=(await rows('trade_push_queue'))[0];assert.equal(q.finished_at,null);assert.equal(q.attempts,1);assert.ok(new Date(q.next_at)>new Date());});
  await t.test('Token inválido é desativado',async()=>{await db.exec('reset role');await db.exec('update trade_push_queue set next_at=now()');await as(null,'service_role');const [job]=await rpc('trade_claim_push');await rpc('trade_finish_push',[job.id,job.lease,'invalid',token]);await db.exec('reset role');assert.equal((await rows('trade_push_devices'))[0].enabled,false);});
  await as(1);await rpc('trade_register_push',[token]);
  const quote=(await command('send_quote',{request_id:req,items:[{product_id:product,unit_price:100}],discount:20,freight:30,valid_until:new Date(Date.now()+86400000).toISOString(),delivery_days:2,payment_terms:'Na entrega'})).id;
  await as(4);const order=(await command('accept_quote',{request_id:req,quote_id:quote})).id;
  await t.test('Troca de conta no dispositivo descarta aviso do dono anterior',async()=>{await rpc('trade_register_push',[token]);await as(null,'service_role');assert.equal((await rpc('trade_claim_push')).length,0);});
  await as(1);
  const rank=()=>rpc('trade_product_ranking',[seller,2026,9]);
  await t.test('Pedidos sem recebimento não entram no ranking',async()=>assert.equal((await rank()).annual.length,0));
  await db.exec('reset role');await db.query("update trade_orders set state='received',received_at='2026-10-01T01:00:00Z' where id=$1",[order]);await as(1);
  await t.test('Ranking usa recebimento de Brasília e exclui desconto e frete',async()=>{const r=await rank();assert.equal(r.monthly[0].revenue,180);assert.equal(r.annual[0].product_id,product);assert.equal(r.monthly[0].rank,1);assert.equal((await rpc('trade_product_ranking',[seller,2026,10])).monthly.length,0);});
  await t.test('Períodos inválidos são rejeitados',async()=>{await assert.rejects(rpc('trade_product_ranking',[seller,2026,13]));await assert.rejects(rpc('trade_product_ranking',[seller,null,1]));});
  await as(2);await t.test('Representante não vê ranking de vendas de outro consultor',async()=>assert.equal((await rank()).annual.length,0));
  await as(4);await t.test('Produtor não acessa o ranking privado',async()=>assert.rejects(rank()));
  await t.test('Desativar afeta apenas o próprio dispositivo',async()=>{await rpc('trade_unregister_push',[token]);await db.exec('reset role');assert.equal((await rows('trade_push_devices'))[0].enabled,false);});
  await as(null,'anon');await t.test('Anônimo não registra dispositivo',async()=>assert.rejects(rpc('trade_register_push',[token])));
 }finally{await db.close();}
});
