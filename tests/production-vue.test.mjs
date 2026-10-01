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
const {localDateTime,validateCrop,validateEvent,quantity,validateUsage,matches}=await load('../src/modules/production/productionModel.ts');
const crop={name:'Milho',category:'Cereal',averageCycleDays:'90',notes:''};
for(const change of [{name:'x'},{name:'x'.repeat(121)},{category:'x'.repeat(101)},{averageCycleDays:'0'},{averageCycleDays:'-1'},{averageCycleDays:'2.5'},{averageCycleDays:'1e3'},{notes:'x'.repeat(1501)}])test('Cultura rejeita '+JSON.stringify(change).slice(0,50),()=>assert.ok(validateCrop({...crop,...change})));
test('Cultura válida e ciclo opcional',()=>{assert.equal(validateCrop(crop),'');assert.equal(validateCrop({...crop,averageCycleDays:''}),'');});
const event={eventType:'observation',title:'Vistoria',occurredAt:'2026-09-25T10:30',description:'',notes:''};
for(const change of [{eventType:'invalid'},{title:'x'},{title:'x'.repeat(181)},{occurredAt:''},{occurredAt:'2026-02-30T10:00'},{occurredAt:'2026-09-25T25:00'},{description:'x'.repeat(1601)},{notes:'x'.repeat(1601)}])test('Evento rejeita '+JSON.stringify(change).slice(0,50),()=>assert.ok(validateEvent({...event,...change})));
test('Evento válido e conversão do horário local',()=>{assert.equal(validateEvent(event),'');assert.equal(localDateTime(event.occurredAt),'2026-09-25T13:30:00.000Z');});
for(const value of ['', 'NaN','-1','1e2','1.234,56','2,12345','Infinity'])test('Quantidade inválida '+value,()=>assert.equal(quantity(value),null));
test('Quantidade com vírgula e zero',()=>{assert.equal(quantity('2,3456'),2.3456);assert.equal(quantity('0'),0);});
const lot={id:'l',agricultural_input_id:'i',deleted_at:null,current_quantity:'5.5'};
test('Uso dentro do saldo e sem tolerância negativa',()=>{assert.equal(validateUsage('i',lot,'5,5',''),'');assert.ok(validateUsage('i',lot,'5,5001',''));assert.ok(validateUsage('i',lot,'0',''));});
test('Uso exige vínculo correto e lote ativo',()=>{assert.ok(validateUsage('x',lot,'1',''));assert.ok(validateUsage('i',{...lot,deleted_at:'2026-09-01'},'1',''));assert.ok(validateUsage('i',undefined,'1',''));assert.ok(validateUsage('i',lot,'1','x'.repeat(1001)));});
test('Busca normalizada',()=>{assert.equal(matches('Milho orgânico','ORGANICO'),true);assert.equal(matches('Milho','soja'),false);});
const {useMutation}=await load('../src/modules/production/useMutation.ts');
test('Gravação duplicada bloqueada enquanto pendente e após sucesso',async()=>{const scope=effectScope();const mutation=scope.run(()=>useMutation());let release,calls=0,saved=0;const work=()=>{calls++;return new Promise(r=>release=r);};const pending=mutation.run(work,()=>saved++);await mutation.run(work,()=>saved++);assert.equal(calls,1);release('ok');await pending;await mutation.run(work,()=>saved++);assert.equal(calls,1);assert.equal(saved,1);scope.stop();});
test('Falha de gravação permite nova tentativa',async()=>{const scope=effectScope();const mutation=scope.run(()=>useMutation());await mutation.run(async()=>{throw Error('falha');},()=>assert.fail());assert.equal(mutation.done.value,false);assert.ok(mutation.error.value);await mutation.run(async()=>1,()=>{});assert.equal(mutation.done.value,true);scope.stop();});
test('Resposta após sair da página não executa callbacks',async()=>{const scope=effectScope();const mutation=scope.run(()=>useMutation());let release;const pending=mutation.run(()=>new Promise(r=>release=r),()=>assert.fail());scope.stop();release(1);await pending;assert.equal(mutation.alive(),false);});
