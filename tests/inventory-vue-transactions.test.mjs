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
const {validateTransaction,projectedBalance,filterHistory,periodError,localDay}=await load('../src/modules/inventory/transactions/transactionModel.ts');
const {filterLots}=await load('../src/modules/inventory/lots/lotFilters.ts');
const {useResource}=await load('../src/modules/inventory/shared/useResource.ts');
const lot={id:'l1',agricultural_input_id:'i1',current_quantity:'10.0000',unit_price:3,unit:'kg',expiration_date:'2099-01-01',batch_number:'A',supplier:'João',notes:'Seco'};
const fields={inputId:'i1',lotId:'l1',transactionType:'negative_adjustment',quantity:'1,2345',occurredAt:'2026-09-23T09:30',productionCycleId:'',productionEventId:'',notes:''};
for(const type of ['negative_adjustment','positive_adjustment','loss','expiration','return'])test(`Aceita tipo manual ${type}`,()=>assert.equal(validateTransaction({...fields,transactionType:type},lot,[],[]),''));
for(const change of [{inputId:''},{lotId:'other'},{transactionType:'entry'},{transactionType:'usage'},{transactionType:'unknown'},{quantity:'0'},{quantity:'NaN'},{quantity:'-1'},{quantity:'10.0001'},{quantity:'1.12345'},{occurredAt:''},{occurredAt:'2026-02-30T12:00'},{occurredAt:'2026-09-23T25:00'},{notes:'x'.repeat(1501)},{productionCycleId:'missing'},{productionEventId:'orphan'}])test(`Rejeita ${Object.keys(change)[0]} ${String(Object.values(change)[0]).slice(0,25)}`,()=>assert.ok(validateTransaction({...fields,...change},lot,[],[])));
test('Não movimenta lote de outro insumo',()=>assert.ok(validateTransaction(fields,{...lot,agricultural_input_id:'other'},[],[])));
test('Baixa integral permitida',()=>assert.equal(validateTransaction({...fields,quantity:'10'},lot,[],[]),''));
test('Ajuste positivo aceita lote vazio',()=>assert.equal(validateTransaction({...fields,transactionType:'positive_adjustment'},{...lot,current_quantity:0},[],[]),''));
test('Evento precisa pertencer ao ciclo',()=>{const data={...fields,productionCycleId:'c',productionEventId:'e'};assert.ok(validateTransaction(data,lot,[{id:'c'}],[{id:'e',production_cycle_id:'other'}]));assert.equal(validateTransaction(data,lot,[{id:'c'}],[{id:'e',production_cycle_id:'c'}]),'');});
test('Prévia positiva, negativa, zero e inválida',()=>{assert.equal(projectedBalance(lot,'1,2345','negative_adjustment'),8.7655);assert.equal(projectedBalance(lot,'2','return'),12);assert.equal(projectedBalance(lot,'10','loss'),0);assert.equal(projectedBalance(lot,'bad','loss'),null);});
test('Data local respeita mudança de dia UTC',()=>assert.equal(localDay('2026-09-24T01:00:00Z'),'2026-09-23'));
test('Período inválido e invertido',()=>{assert.ok(periodError('2026-02-30',''));assert.ok(periodError('2026-09-24','2026-09-23'));assert.equal(periodError('2026-09-23','2026-09-23'),'');});
const records=[{id:'t1',occurred_at:'2026-09-23T12:00:00Z',agricultural_input:{name:'Adubação'},notes:'João',inventory_lot:{batch_number:'A'}},{id:'t2',occurred_at:'2026-09-24T12:00:00Z',agricultural_input:{name:'Outro'},notes:'',inventory_lot:{batch_number:'B'}}];
test('Busca sem acentos e período inclusivo',()=>{assert.deepEqual(filterHistory(records,{search:'ADUBACAO',from:'2026-09-23',to:'2026-09-23'}).map(x=>x.id),['t1']);assert.equal(filterHistory(records,{search:'joao',from:'',to:''}).length,1);assert.equal(filterHistory(records,{search:'',from:'2026-09-24',to:''}).length,1);});
test('Lotes: busca sem acentos, vencido e sem saldo distintos',()=>{const items=[lot,{...lot,id:'l2',current_quantity:0,expiration_date:'2000-01-01'},{...lot,id:'l3',expiration_date:'2000-01-01'}];assert.equal(filterLots(items,'JOAO','','purchase').length,3);assert.deepEqual(filterLots(items,'','empty','purchase').map(x=>x.id),['l2']);assert.deepEqual(filterLots(items,'','expired','purchase').map(x=>x.id),['l3']);});
test('Ordenação de validade não altera lista original',()=>{const items=[{...lot,id:'a',expiration_date:null},{...lot,id:'b',expiration_date:'2027-01-01'}];assert.equal(filterLots(items,'','','expiration')[0].id,'b');assert.equal(items[0].id,'a');});
test('Resposta antiga não sobrescreve consulta nova',async()=>{let first,second,count=0;const scope=effectScope();const resource=scope.run(()=>useResource(()=>new Promise(r=>{if(count++===0)first=r;else second=r;}),[],false));const a=resource.reload(),b=resource.reload();second(['new']);await b;first(['old']);await a;assert.deepEqual(resource.data.value,['new']);scope.stop();});
test('Resposta após desmontagem é ignorada',async()=>{let done;const scope=effectScope();const resource=scope.run(()=>useResource(()=>new Promise(r=>done=r),[],false));const task=resource.reload();scope.stop();done(['late']);await task;assert.deepEqual(resource.data.value,[]);});
test('Falha de leitura é erro, não lista vazia bem-sucedida',async()=>{const scope=effectScope();let fail=true;const resource=scope.run(()=>useResource(async()=>{if(fail)throw new Error('network');return ['ok'];},[],false));await resource.reload();assert.ok(resource.error.value);fail=false;await resource.reload();assert.equal(resource.error.value,'');assert.deepEqual(resource.data.value,['ok']);scope.stop();});
