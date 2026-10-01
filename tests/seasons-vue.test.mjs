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
const {isArchived,validDate,dateLabel,periodLabel,validateSeason,seasonFields,searchSeasons}=await load('../src/modules/seasons/seasonModel.ts');
const properties=[{id:'p',name:'Fazenda São João',deleted_at:null}];
const fields={propertyId:'p',name:'Verão 2026',startDate:'2026-09-01',endDate:'2027-01-31',status:'planned',description:''};
test('Safra válida, períodos opcionais e propriedades ativas',()=>{assert.equal(validateSeason(fields,properties),'');assert.equal(validateSeason({...fields,startDate:'',endDate:''},properties),'');assert.ok(validateSeason(fields,[{...properties[0],deleted_at:'2026-01-01'}]));});
for(const change of [{propertyId:''},{propertyId:'other'},{name:' '},{name:'x'},{name:'x'.repeat(121)},{description:'x'.repeat(801)},{startDate:'2026-02-30'},{endDate:'2026-13-01'},{endDate:'2026-08-01'},{status:'archived'}])test('Rejeita '+JSON.stringify(change).slice(0,55),()=>assert.ok(validateSeason({...fields,...change},properties)));
for(const [date,valid] of [['2024-02-29',true],['2026-02-29',false],['2026-04-31',false],['2026-12-31',true],['2026-9-1',false],['2026-09-01T12:00:00Z',false],['0000-01-01',false],['',false]])test('Valida data '+date,()=>assert.equal(validDate(date),valid));
test('Data sem deslocamento de fuso',()=>assert.equal(dateLabel('2026-09-01'),'01/09/2026'));
test('Períodos completos, parciais e ausentes',()=>{assert.equal(periodLabel({start_date:null,end_date:null}),'Período não informado');assert.equal(periodLabel({start_date:'2026-09-01',end_date:null}),'A partir de 01/09/2026');assert.equal(periodLabel({start_date:null,end_date:'2026-09-01'}),'Até 01/09/2026');assert.equal(periodLabel({start_date:'2026-09-01',end_date:'2026-10-01'}),'01/09/2026 — 01/10/2026');});
test('Arquivamento independente do status produtivo',()=>{for(const status of ['planned','active','closed','cancelled']){assert.equal(isArchived({status,deleted_at:null}),false);assert.equal(isArchived({status,deleted_at:'2026-09-01'}),true);}});
test('Busca sem acentos, cidade, descrição e propriedade ausente',()=>{const items=[{name:'Verão',description:'Milho',property:properties[0]},{name:'Inverno',description:null,property:null}];assert.equal(searchSeasons(items,'VERAO').length,1);assert.equal(searchSeasons(items,'SAO JOAO').length,1);assert.equal(searchSeasons(items,'milho').length,1);assert.equal(searchSeasons(items,'').length,2);assert.equal(searchSeasons(items,'ausente').length,0);});
test('Edição prevalece sobre propriedade sugerida na URL',()=>{assert.equal(seasonFields({property_id:'original',name:'Teste',status:'closed'},'query').propertyId,'original');assert.equal(seasonFields(null,'query').propertyId,'query');assert.equal(seasonFields().status,'planned');});
test('Datas iguais permitidas e status produtivos válidos',()=>{for(const status of ['planned','active','closed','cancelled'])assert.equal(validateSeason({...fields,status,endDate:fields.startDate},properties),'');});
