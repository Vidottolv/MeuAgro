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
const {isArchived,title,quantityLabel,fieldsFrom,validatePlanting,plantingPayload,searchPlantings,canHarvest}=await load('../src/modules/plantings/plantingModel.ts');
const properties=[{id:'p',name:'São João',status:'active',deleted_at:null}],crops=[{id:'c',name:'Milho',active:true}];
const links={areas:[{id:'a',property_id:'p',name:'Norte',status:'active',deleted_at:null}],seasons:[{id:'s',property_id:'p',name:'Verão',deleted_at:null}]};
const fields={...fieldsFrom(),propertyId:'p',areaId:'a',seasonId:'s',cropId:'c',plantingDate:'2026-09-01',plantedQuantity:'12,3456',plantedUnit:'kg'};
test('Plantio válido com quantidade decimal normalizada',()=>{assert.equal(validatePlanting(fields,properties,crops,links),'');assert.equal(plantingPayload(fields).plantedQuantity,12.3456);});
for(const change of [{propertyId:'other'},{areaId:'other'},{seasonId:'other'},{cropId:'other'},{plantingDate:''},{plantingDate:'2026-02-30'},{initialHarvestForecast:'2026-08-31'},{currentHarvestForecast:'2026-13-01'},{finalHarvestDate:'2026-08-01'},{plantedQuantity:'-1'},{plantedQuantity:'NaN'},{plantedQuantity:'1e3'},{plantedQuantity:'1,23456'},{plantedQuantity:'1.234,56'},{plantedUnit:''},{plantedUnit:'invalid'},{status:'invalid'},{variety:'x'.repeat(161)},{notes:'x'.repeat(2001)}])test('Rejeita '+JSON.stringify(change).slice(0,55),()=>assert.ok(validatePlanting({...fields,...change},properties,crops,links)));
test('Área e safra não podem pertencer a outra propriedade',()=>{for(const key of ['areas','seasons'])assert.ok(validatePlanting(fields,properties,crops,{...links,[key]:links[key].map(i=>({...i,property_id:'other'}))}));});
test('Área, safra e propriedade arquivadas bloqueadas',()=>{for(const key of ['areas','seasons'])assert.ok(validatePlanting(fields,properties,crops,{...links,[key]:links[key].map(i=>({...i,deleted_at:'2026-09-01'}))}));assert.ok(validatePlanting(fields,[{...properties[0],status:'archived'}],crops,links));});
test('Cultura inativa só pode ser preservada no próprio plantio',()=>{const inactive=[{...crops[0],active:false}];assert.ok(validatePlanting(fields,properties,inactive,links));assert.equal(validatePlanting(fields,properties,inactive,links,'c'),'');assert.ok(validatePlanting(fields,properties,inactive,links,'other'));});
test('Safra opcional',()=>assert.equal(validatePlanting({...fields,seasonId:''},properties,crops,links),''));
test('Quantidade vazia e zero preservados',()=>{assert.equal(plantingPayload({...fields,plantedQuantity:''}).plantedQuantity,'');assert.equal(plantingPayload({...fields,plantedQuantity:'0'}).plantedQuantity,0);assert.equal(validatePlanting({...fields,plantedQuantity:'',plantedUnit:''},properties,crops,links),'');});
test('Edição mantém datas e status',()=>{const f=fieldsFrom({property_id:'p',area_id:'a',crop_id:'c',planting_date:'2026-09-01',status:'closed',planted_quantity:0,current_harvest_forecast:'2026-12-01'});assert.equal(f.status,'closed');assert.equal(f.plantedQuantity,'0');assert.equal(f.currentHarvestForecast,'2026-12-01');});
test('Arquivamento não altera status produtivo',()=>{assert.equal(isArchived({deleted_at:null,status:'closed'}),false);assert.equal(isArchived({deleted_at:'2026-09-01',status:'planted'}),true);});
test('Colheita bloqueada nos estados finais e arquivado',()=>{for(const status of ['harvested','closed','cancelled'])assert.equal(canHarvest({status,deleted_at:null}),false);assert.equal(canHarvest({status:'planted',deleted_at:'2026-09-01'}),false);assert.equal(canHarvest({status:'planted',deleted_at:null}),true);});
test('Busca sem acentos em cultura, variedade, área, safra e observações',()=>{const items=[{crop:{name:'Milho'},variety:'Orgânico',property:properties[0],area:links.areas[0],season:links.seasons[0],notes:'Adubação'}];for(const q of ['MILHO','ORGANICO','SAO JOAO','norte','VERAO','ADUBACAO'])assert.equal(searchPlantings(items,q).length,1);assert.equal(searchPlantings(items,'missing').length,0);});
test('Título e quantidade ausentes/zero',()=>{assert.equal(title({crop:null,variety:null}),'Cultura');assert.equal(quantityLabel({planted_quantity:null,planted_unit:null}),'Não informada');assert.ok(quantityLabel({planted_quantity:0,planted_unit:'kg'}).startsWith('0'));});
