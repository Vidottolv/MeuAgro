import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/services/tradePushService.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export ','').replaceAll("import.meta.env.VITE_PUSH_ENABLED","'true'").replace("await import('../js/router.js')",'({navigate})');
function setup(platform='android',permission='granted',configured=true){
 const values=new Map(),listeners={},calls=[],navigation=[];
 const push={addListener:async(k,f)=>{listeners[k]=f;return {remove(){}};},unregister:async()=>calls.push('unregister'),checkPermissions:async()=>({receive:permission}),requestPermissions:async()=>({receive:permission}),createChannel:async()=>{},register:async()=>calls.push('register')};
 const db={rpc:async(name,args)=>{calls.push({name,args});return {error:null,data:{items:[]}};},auth:{getSession:async()=>({data:{session:{user:{id:'u1'}}}})}};
 const api=new Function('Capacitor','PushNotifications','supabase','refreshTradeNotifications','localStorage','document','navigate',source.replace("const configured=()=>\'true\'===\'true\';", 'const configured=()=>'+configured+';')+';return {setPushSession,enableTradePush,disableTradePush,pushStatus};')({getPlatform:()=>platform},push,db,async()=>{}, {getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}, {dispatchEvent(){}},p=>navigation.push(p));
 return {api,calls,listeners,navigation,values};
}
test('Web não tenta registrar push nativo',async()=>{const f=setup('web');f.api.setPushSession({user:{id:'u1'}});await f.api.enableTradePush();assert.equal(f.calls.length,0);assert.equal(f.api.pushStatus().available,false);});
test('Android exige consentimento e salva token para a sessão',async()=>{const f=setup();f.api.setPushSession({user:{id:'u1'}});assert.ok(!f.calls.includes('register'));await f.api.enableTradePush();await f.listeners.registration({value:'token'});assert.ok(f.calls.includes('register'));assert.equal(f.calls.at(-1).name,'trade_register_push');assert.equal(f.api.pushStatus().enabled,true);});
test('Permissão negada não ativa registro',async()=>{const f=setup('android','denied');f.api.setPushSession({user:{id:'u1'}});await f.api.enableTradePush();assert.ok(!f.calls.includes('register'));assert.equal(f.api.pushStatus().enabled,false);});
test('Desativação remove vínculo e preferência',async()=>{const f=setup();f.api.setPushSession({user:{id:'u1'}});await f.api.enableTradePush();await f.listeners.registration({value:'token'});await f.api.disableTradePush();assert.equal(f.api.pushStatus().enabled,false);assert.ok(f.calls.some(c=>c.name==='trade_unregister_push'));});
test('Toque em aviso de outra conta não navega',async()=>{const f=setup();f.api.setPushSession({user:{id:'u1'}});await f.api.enableTradePush();await f.listeners.pushNotificationActionPerformed({notification:{data:{recipient_id:'u2',route:'https://untrusted.test'}}});assert.equal(f.navigation.length,0);});

test('Android sem Firebase configurado permite sair sem chamar o plugin',async()=>{const f=setup('android','granted',false);f.api.setPushSession({user:{id:'u1'}});await f.api.disableTradePush();assert.equal(f.calls.length,0);});
