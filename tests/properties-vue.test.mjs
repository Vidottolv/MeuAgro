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
const {isArchived,validateProperty,validateArea,validateAreaType,propertyPayload,areaPayload,filterProperties,filterAreas,sizeLabel,propertyLocation}=await load('../src/modules/properties/ruralModel.ts');
const fields={name:' Fazenda São João ',description:'',city:'São Paulo',state:'SP',totalArea:'12,3456',areaUnit:'hectare',notes:''};
const area={name:' Talhão Norte ',areaTypeId:'type',description:'',size:'2,3456',unit:'hectare',locationDescription:'Perto da entrada',notes:''};
const types=[{id:'type',name:'Talhão'}];
test('Propriedade válida e decimal com vírgula',()=>{assert.equal(validateProperty(fields),'');assert.equal(propertyPayload(fields).totalArea,12.3456);assert.equal(propertyPayload(fields).name,'Fazenda São João');});
for(const change of [{name:''},{name:'a'},{name:'x'.repeat(121)},{description:'x'.repeat(601)},{notes:'x'.repeat(1501)},{city:'x'.repeat(121)},{state:'XX'},{totalArea:'-1'},{totalArea:'abc'},{totalArea:'1.12345'},{areaUnit:''},{areaUnit:'invalida'}])test(`Propriedade rejeita ${Object.keys(change)[0]} ${String(Object.values(change)[0]).slice(0,12)}`,()=>assert.ok(validateProperty({...fields,...change})));
test('Propriedade vazia distingue área zero',()=>{assert.equal(propertyPayload({...fields,totalArea:''}).totalArea,null);assert.equal(propertyPayload({...fields,totalArea:'0'}).totalArea,0);assert.equal(validateProperty({...fields,totalArea:'0'}),'');});
test('Unidade opcional quando tamanho ausente',()=>assert.equal(validateProperty({...fields,totalArea:'',areaUnit:''}),''));
test('Área válida e decimal com vírgula',()=>{assert.equal(validateArea(area,types),'');assert.equal(areaPayload(area).size,2.3456);assert.equal(areaPayload(area).name,'Talhão Norte');});
for(const change of [{name:'x'},{areaTypeId:'missing'},{size:'-1'},{size:'abc'},{size:'1,12345'},{unit:''},{unit:'invalid'},{locationDescription:'x'.repeat(241)},{description:'x'.repeat(601)},{notes:'x'.repeat(1501)}])test(`Área rejeita ${Object.keys(change)[0]} ${String(Object.values(change)[0]).slice(0,12)}`,()=>assert.ok(validateArea({...area,...change},types)));
test('Área vazia distingue tamanho zero',()=>{assert.equal(areaPayload({...area,size:''}).size,null);assert.equal(areaPayload({...area,size:'0'}).size,0);assert.equal(validateArea({...area,size:'0'},types),'');});
test('Área admite unidades que propriedade não admite',()=>{assert.equal(validateArea({...area,unit:'metro_linear'},types),'');assert.ok(validateProperty({...fields,areaUnit:'metro_linear'}));});
for(const [name,description,valid] of [['Viveiro','',true],['x','',false],['x'.repeat(81),'',false],['Viveiro','x'.repeat(301),false]])test(`Tipo ${name.slice(0,10)}/${description.length}`,()=>assert.equal(validateAreaType(name,description)==='',valid));
test('Arquivado por estado ou data e null',()=>{assert.equal(isArchived(null),false);assert.equal(isArchived({status:'active',deleted_at:null}),false);assert.equal(isArchived({status:'archived',deleted_at:null}),true);assert.equal(isArchived({status:'active',deleted_at:'2026-09-23'}),true);});
test('Busca de propriedades sem acentos e filtro de estado',()=>{const records=[{name:'Fazenda São João',city:'São Paulo',state:'SP'},{name:'Outra',city:'Rio',state:'RJ'}];assert.equal(filterProperties(records,'SAO JOAO','SP').length,1);assert.equal(filterProperties(records,'SAO JOAO','RJ').length,0);assert.equal(filterProperties(records,'RIO','').length,1);});
test('Busca de áreas por tipo e localização',()=>{const records=[{name:'Norte',area_type_id:'t',area_type:{name:'Piquete'},location_description:'Próximo ao açude'}];assert.equal(filterAreas(records,'ACUDE','t').length,1);assert.equal(filterAreas(records,'piquete','other').length,0);});
test('Tamanho vazio, zero e quatro casas decimais',()=>{assert.equal(sizeLabel(null,null),'Não informada');assert.ok(sizeLabel(0,'hectare').startsWith('0 •'));assert.ok(sizeLabel('1.2345','hectare',true).includes('1,2345'));});
test('Localização parcial e ausente',()=>{assert.equal(propertyLocation({city:'Cidade',state:null}),'Cidade');assert.equal(propertyLocation({city:null,state:null}),'Localização não informada');});
