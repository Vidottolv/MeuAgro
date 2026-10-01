import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve,dirname,extname} from 'node:path';
import ts from 'typescript';
import {effectScope} from 'vue';
process.env.TZ='America/Sao_Paulo';
const cache=new Map();
async function moduleUrl(path) {
 if(cache.has(path))return cache.get(path);
 let code=ts.transpileModule(await readFile(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const imports=[...code.matchAll(/from ['"]([^'"]+)['"]/g)];
 for(const match of imports) {
  const spec=match[1];let url;
  if(spec.startsWith('.')) {let dependency=resolve(dirname(path),spec);if(!extname(dependency))dependency+='.ts';url=await moduleUrl(dependency);}
  else url=import.meta.resolve(spec);
  code=code.replace(match[0],`from '${url}'`);
 }
 const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(path,url);return url;
}
async function load(relative){return import(await moduleUrl(fileURLToPath(new URL(relative,import.meta.url))));}

const {validateHarvest,validateSale,remaining}=await load('../src/modules/harvests/harvestModel.ts');
const cycle={id:'c',status:'planted',planting_date:'2026-09-01',deleted_at:null};
const harvest={id:'h',quantity:100,unit:'kg',destination:'sale',harvest_date:'2026-09-20',production_cycle:cycle,sales:[{id:'s',quantity:10},{id:'other',quantity:20}]};
const hf={cycleId:'c',harvestDate:'2026-09-20',quantity:'100',unit:'kg',destination:'sale',qualityClassification:'Boa',notes:''};
const sf={harvestId:'h',buyer:'Mercado',quantity:'70',unitPrice:'12,5',saleDate:'2026-09-21',paymentMethod:'pix',notes:''};
test('Colheita válida e quantidade com vírgula',()=>{assert.equal(validateHarvest(hf,cycle),'');assert.equal(validateHarvest({...hf,quantity:'12,5'},cycle),'')});
for(const f of [{harvestDate:'2026-02-30'},{harvestDate:'2026-08-31'},{quantity:'0'},{quantity:'1e2'},{unit:'invalid'},{destination:'invalid'}])test('Colheita rejeita '+JSON.stringify(f),()=>assert.ok(validateHarvest({...hf,...f},cycle)));
test('Colheita respeita situação do plantio',()=>{assert.ok(validateHarvest(hf,{...cycle,deleted_at:'2026-09-01'}));assert.ok(validateHarvest(hf,{...cycle,status:'closed'}));assert.equal(validateHarvest(hf,{...cycle,status:'harvested'},harvest),'')});
test('Colheita com vendas preserva unidade, destino e quantidade comprometida',()=>{assert.ok(validateHarvest({...hf,quantity:'29'},cycle,harvest));assert.ok(validateHarvest({...hf,unit:'t'},cycle,harvest));assert.ok(validateHarvest({...hf,destination:'donation'},cycle,harvest));assert.equal(validateHarvest({...hf,quantity:'30'},cycle,harvest),'')});
test('Saldo da edição exclui somente a venda atual',()=>{assert.equal(remaining(harvest),70);assert.equal(remaining(harvest,'s'),80);assert.equal(validateSale({...sf,quantity:'80'},harvest,'s'),'');assert.ok(validateSale({...sf,quantity:'80'},harvest))});
for(const f of [{quantity:'70.0001'},{quantity:'0'},{unitPrice:'-1'},{unitPrice:'Infinity'},{saleDate:'2026-09-19'},{paymentMethod:'invalid'}])test('Venda rejeita '+JSON.stringify(f),()=>assert.ok(validateSale({...sf,...f},harvest)));
test('Preço zero permitido; colheita arquivada e destino incompatível bloqueados',()=>{assert.equal(validateSale({...sf,unitPrice:'0'},harvest),'');assert.ok(validateSale(sf,{...harvest,destination:'donation'}));assert.ok(validateSale(sf,{...harvest,production_cycle:{...cycle,deleted_at:'x'}}))});
const {useCommand}=await import('../src/modules/commerce/useCommand.js');
test('Comando comercial reutiliza chave após falha; clique repetido não duplica',async()=>{const scope=effectScope(),calls=[];let fail=true,release;const cmd=scope.run(()=>useCommand(async(a,d,key)=>{calls.push(key);if(fail)throw Error('offline');await new Promise(r=>release=r);return{ok:true}},async()=>{},e=>e.message));await cmd.run('send',{text:'a'});fail=false;const pending=cmd.run('send',{text:'a'});await cmd.run('send',{text:'a'});release();await pending;assert.equal(calls.length,2);assert.equal(calls[0],calls[1]);scope.stop()});
test('Gravação confirmada com falha de atualização bloqueia reenvio até recarregar',async()=>{const scope=effectScope();let calls=0,fail=true;const cmd=scope.run(()=>useCommand(async()=>{calls++;return{}},async()=>{if(fail)throw Error('refresh failed')},e=>e.message));await cmd.run('save',{a:1});assert.equal(cmd.committed.value,true);await cmd.run('save',{a:1});assert.equal(calls,1);fail=false;await cmd.refresh();assert.equal(cmd.committed.value,false);scope.stop()});
test('Comando concluído depois de sair não recarrega a página',async()=>{const scope=effectScope();let release,reloads=0;const cmd=scope.run(()=>useCommand(()=>new Promise(r=>release=r),async()=>reloads++,e=>e.message));const pending=cmd.run('save',{});scope.stop();release({});await pending;assert.equal(reloads,0)});
const {commandPayload}=await import('../src/modules/commerce/tradeModel.js');
test('Solicitação contém somente produtos escolhidos',()=>{assert.deepEqual(commandPayload('create_request',{qty_a:'2',qty_b:'0',connection_id:'c'}),{connection_id:'c',items:[{product_id:'a',quantity:2}]});assert.throws(()=>commandPayload('create_request',{qty_a:'0'}))});
test('Orçamento converte validade local e valores por produto',()=>{assert.deepEqual(commandPayload('send_quote',{price_a:'12.50',valid_until:'2026-09-30T10:30'}),{items:[{product_id:'a',unit_price:12.5}],valid_until:'2026-09-30T13:30:00.000Z'});assert.throws(()=>commandPayload('send_quote',{valid_until:'invalid'}))});
test('Recebimento preserva vínculo de insumo e versão de entrega',()=>assert.deepEqual(commandPayload('confirm_receipt',{input_a:'i',delivery_version:2,order_id:'o'}),{items:[{product_id:'a',input_id:'i'}],delivery_version:2,order_id:'o'}));
