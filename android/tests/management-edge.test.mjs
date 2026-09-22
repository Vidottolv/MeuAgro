import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {managementFixture} from './management-fixture.mjs';

test('Gestão: isolamento entre empresas e revisões de aprovação',async t=>{
 const f=await managementFixture(),{db,ids,as,commerce,command,rows}=f;
 const rpc=async(name,args=[]) =>(await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) r`,args)).rows[0].r;
 let seller,connection,product,request;
 const manage=(a,d,op=randomUUID())=>rpc('management_command',[a,{seller_id:seller,...d},op]);
 const report=()=>rpc('management_report',[seller,'2026-09-01','2026-09-30']);
 const quote=(discount=30)=>({request_id:request,items:[{product_id:product,unit_price:100}],discount,freight:10,valid_until:new Date(Date.now()+86400000).toISOString(),delivery_days:3,payment_terms:'Na entrega'});
 const newRequest=async()=>{await as(4);request=(await command('create_request',{connection_id:connection,delivery_address:'Fazenda teste',items:[{product_id:product,quantity:2}]})).id;await as(3);};
 try{
  await as(1);await commerce('enable',{name:'Dono'});seller=(await commerce('create_company',{name:'Empresa A'})).seller_id;
  for(const n of [2,3]){await as(1);await commerce('invite',{seller_id:seller,email:`user${n}@example.test`});const inv=(await rows('commerce_invitations')).find(i=>i.email===`user${n}@example.test`);await as(n);await commerce('enable',{name:'Consultor '+n});await commerce('accept_invite',{token:inv.token});}
  await as(1);await manage('grant',{agent_id:ids[1],role:'manager',finance:false});await manage('settings',{discount_limit:10,stale_hours:48});
  product=(await command('save_product',{seller_id:seller,name:'Adubo',package_name:'Saco',base_unit:'kg',package_size:25,reference_price:100,availability:'available'})).id;
  await as(3);await command('invite_buyer',{seller_id:seller,email:'user4@example.test'});const inv=(await rows('trade_invitations'))[0];await as(4);connection=(await command('accept_connection',{token:inv.token,name:'Produtor'})).id;
  await newRequest();let approval=await command('send_quote',quote());
  await t.test('Nova proposta invalida aprovação antiga',async()=>{const next=await command('send_quote',quote(40));await as(2);await assert.rejects(manage('approve',{approval_id:approval.id,reason:'Aprovar antiga'}),/resolvida/);assert.equal((await report()).approvals.length,1);approval=next;});
  await t.test('Recusa fica interna e permite nova solicitação',async()=>{await manage('reject',{approval_id:approval.id,reason:'Desconto muito alto'});await as(4);assert.equal((await rows('trade_quotes')).length,0);assert.equal((await rows('trade_notifications')).length,0);await as(3);assert.equal((await rpc('management_workspace',[request])).approvals[0].status,'rejected');approval=await command('send_quote',quote());});
  await t.test('Proposta dentro do limite é publicada e substitui pendência',async()=>{const q=await command('send_quote',quote(20));assert.ok(!q.approval_pending);await as(2);assert.equal((await report()).approvals.length,0);await assert.rejects(manage('approve',{approval_id:approval.id,reason:'Já substituída'}));});
  await newRequest();approval=await command('send_quote',quote());
  await t.test('Transferência invalida aprovação pendente',async()=>{await as(2);await manage('transfer',{connection_id:connection,expected_agent:ids[2],agent_id:ids[1],reason:'Nova carteira'});await assert.rejects(manage('approve',{approval_id:approval.id,reason:'Equipe mudou'}));await manage('transfer',{connection_id:connection,expected_agent:ids[1],agent_id:ids[2],reason:'Retorno à carteira'});});
  await newRequest();approval=await command('send_quote',quote());
  await t.test('Proposta vencida não pode ser aprovada',async()=>{await db.exec('reset role');await db.query("update management_approvals set payload=jsonb_set(payload,'{valid_until}',to_jsonb('2020-01-01T00:00:00Z'::text)) where id=$1",[approval.id]);await as(2);await assert.rejects(manage('approve',{approval_id:approval.id,reason:'Validade vencida'}));await manage('reject',{approval_id:approval.id,reason:'Solicitar nova validade'});});
  await as(5);await commerce('enable',{name:'Dono externo'});const other=(await commerce('create_company',{name:'Empresa B'})).seller_id;
  await t.test('Dono de outra empresa não consulta nem modifica Empresa A',async()=>{await assert.rejects(report());await assert.rejects(manage('transfer',{connection_id:connection,expected_agent:ids[2],agent_id:ids[4],reason:'Tentativa externa'}));await assert.rejects(manage('note',{request_id:request,body:'Outra empresa'}));await assert.rejects(rpc('management_command',['transfer',{seller_id:other,connection_id:connection,agent_id:ids[4],expected_agent:ids[2],reason:'Empresa errada'},randomUUID()]));});
  await newRequest();await command('send_quote',quote());await as(2);approval=(await report()).approvals[0];const q=await manage('approve',{approval_id:approval.id,reason:'Aprovado para venda'});await as(4);const order=(await command('accept_quote',{request_id:request,quote_id:q.id})).id;
  await db.exec('reset role');await db.query("update trade_orders set state='received',received_at='2026-09-15T14:00:00Z' where id=$1",[order]);await as(1);
  await f.save({order_id:order,expected_version:0,items:[{product_id:product,unit_cost:60}],delivery_cost:10,other_cost:5,commission_percent:10,reason:'Apuração gerencial'});
  await t.test('Apuração usa custos e comissão efetivos',async()=>{const r=await report();assert.equal(r.totals.sales_total,180);assert.equal(r.totals.cost,135);assert.equal(r.totals.commission,17);assert.equal(r.totals.result,28);assert.equal(r.products[0].product_result,50);assert.equal(r.team.find(a=>a.id===ids[2]).commission,17);});
  await t.test('Resposta operacional omite valores financeiros mesmo com apuração',async()=>{await as(2);const r=await report();assert.ok(!('result' in r.totals));assert.ok(!('product_result' in r.products[0]));assert.ok(r.team.every(a=>!('commission' in a)));assert.equal((await rows('trade_financial_versions')).length,0);});
  await t.test('Equipe com mais de dez consultores permanece completa',async()=>{
   for(let n=7;n<=17;n++){const id=randomUUID();ids[n-1]=id;await db.exec('reset role');await db.query('insert into auth.users values($1,$2,now())',[id,`user${n}@example.test`]);await as(1);await commerce('invite',{seller_id:seller,email:`user${n}@example.test`});const inv=(await rows('commerce_invitations')).find(i=>i.email===`user${n}@example.test`);await as(n);await commerce('enable',{name:'Consultor '+n});await commerce('accept_invite',{token:inv.token});}
   await as(1);const r=await report();assert.equal(r.team.length,14);assert.equal(r.totals.sales_total,180);
  });
  await t.test('Reaplicar migração preserva notas e vendas',async()=>{await db.exec('reset role');await db.exec(f.migration);await as(1);assert.equal((await report()).totals.sales_total,180);});
 }finally{await db.close();}
});
