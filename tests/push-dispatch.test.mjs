import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../supabase/functions/send-trade-push/index.ts',import.meta.url),'utf8').replace(': Record<string,string>','').replace(': {errorCode?:string}','').replace(/^import .*;\r?\n/gm,'').replace(/Deno.env.get\(('SUPABASE_(?:URL|SERVICE_ROLE_KEY)')\)!/g,'Deno.env.get($1)');
function setup(response={ok:true},secret='secret'){
 const calls=[],env={PUSH_DISPATCH_SECRET:secret,FCM_SERVICE_ACCOUNT:JSON.stringify({project_id:'test-project'}),SUPABASE_URL:'test',SUPABASE_SERVICE_ROLE_KEY:'server-key'};
 const job={id:'id',lease:'lease',token:'test-token',notification_id:'notice',recipient_id:'recipient',route:'/compras?request=id',title:'Nova mensagem',body:'Abra a negociação.'};
 let handler;
 const db={rpc:async(name,args)=>{calls.push({name,args});return {data:name==='trade_claim_push'?[job]:null,error:null};}};
 new Function('createClient','GoogleAuth','Deno','fetch',source)(()=>db,class{async getAccessToken(){return 'access';}},{env:{get:k=>env[k]},serve:f=>handler=f},async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {...response,json:async()=>response.body};});
 return {calls,env,run:(key='secret')=>handler(new Request('https://local',{method:'POST',headers:{'x-dispatch-secret':key}}))};
}
test('Dispatcher rejeita chamada sem segredo antes de acessar banco',async()=>{const f=setup();assert.equal((await f.run('wrong')).status,401);assert.equal(f.calls.length,0);});
test('Dispatcher exige credencial antes de reservar fila',async()=>{const f=setup();delete f.env.FCM_SERVICE_ACCOUNT;assert.equal((await f.run()).status,503);assert.equal(f.calls.length,0);});
test('Push contém notification para app fechado, destinatário e etiqueta de deduplicação',async()=>{const f=setup();assert.equal((await f.run()).status,200);const payload=f.calls.find(c=>c.body).body.message;assert.equal(payload.notification.title,'Nova mensagem');assert.equal(payload.data.recipient_id,'recipient');assert.equal(payload.android.notification.tag,'notice');assert.equal(payload.android.notification.icon,'ic_stat_meu_agro');assert.equal(f.calls.at(-1).args.p_outcome,'sent');});
test('Falha temporária volta à fila',async()=>{const f=setup({ok:false,body:{error:{status:'UNAVAILABLE'}}});await f.run();assert.equal(f.calls.at(-1).args.p_outcome,'retry');});
test('Token removido é desativado; erro de configuração não desativa token',async()=>{const f=setup({ok:false,body:{error:{details:[{errorCode:'UNREGISTERED'}]}}});await f.run();assert.equal(f.calls.at(-1).args.p_outcome,'invalid');});
