import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

test('Fluxo comercial e isolamento por usuário em PostgreSQL', async t => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,public to authenticated,anon;
      grant execute on function auth.uid() to authenticated,anon;`);
    const ids = [1,2,3,4].map(n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`);
    for (let n=0;n<ids.length;n++) await db.query('insert into auth.users values($1,$2,$3)', [ids[n],`user${n+1}@example.test`,n===3?null:new Date()]);
    const sql = fs.readFileSync(new URL('../supabase/stage_25_commerce_foundation.sql',import.meta.url),'utf8');
    await db.exec(sql);
    await t.test('Migration pode ser reaplicada', async () => { await db.exec(sql); });
    const as = async (n,role='authenticated') => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[n?ids[n-1]:'']); await db.exec(`set role ${role}`); };
    const command = async (action,data={}) => (await db.query('select public.commerce_command($1,$2::jsonb) as result',[action,JSON.stringify(data)])).rows[0].result;
    const rows = async table => (await db.query(`select * from public.${table}`)).rows;
    const fails = async promise => assert.rejects(promise);
    await as(1);
    await t.test('Exige ativação antes de criar empresa', async () => fails(command('create_company',{name:'Empresa A'})));
    await command('enable',{name:'Consultor Um'});
    await t.test('Ativação repetida preserva uma identidade própria', async () => { await command('enable',{name:'Consultor Um'}); assert.equal((await rows('commerce_sellers')).length,1); });
    const personal=(await rows('commerce_sellers'))[0].id;
    await t.test('Edição da atuação própria atualiza nome profissional', async () => {
      await command('update_seller',{seller_id:personal,name:'Consultor Atualizado'});
      assert.equal((await rows('commerce_accounts'))[0].display_name,'Consultor Atualizado');
    });
    const company=(await command('create_company',{name:'Empresa A',email:'contato@example.test',phone:'123'})).seller_id;
    await t.test('Empresa criada pertence à sessão; owner enviado é ignorado', async () => { const c=await command('create_company',{name:'Empresa extra',owner_id:ids[1]}); assert.equal((await rows('commerce_sellers')).find(s=>s.id===c.seller_id).owner_id,ids[0]); });
    await t.test('Não permite convidar em identidade pessoal', async () => fails(command('invite',{seller_id:personal,email:'user2@example.test'})));
    await command('invite',{seller_id:company,email:' USER2@example.test '});
    const invitation=(await rows('commerce_invitations'))[0];
    await t.test('Impede convite pendente duplicado', async () => fails(command('invite',{seller_id:company,email:'user2@example.test'})));
    await t.test('Escrita direta de tabelas é negada', async () => {
      await fails(db.query("insert into public.commerce_sellers(owner_id,kind,name) values($1,'company','Intrusa')",[ids[0]]));
      await fails(db.query('update public.commerce_accounts set enabled=false'));
      await fails(db.query('delete from public.commerce_audit'));
    });
    await as(2); await command('enable',{name:'Representante Dois'});
    await t.test('Empresa não é visível antes de aceitar', async () => assert.equal((await rows('commerce_sellers')).filter(s=>s.id===company).length,0));
    await t.test('Representante não lê códigos de convite', async () => assert.equal((await rows('commerce_invitations')).length,0));
    await command('accept_invite',{token:invitation.token});
    const membership=(await rows('commerce_memberships'))[0];
    await t.test('Aceite cria vínculo e libera seleção', async () => { await command('select_seller',{seller_id:company}); assert.equal((await rows('commerce_accounts'))[0].active_seller_id,company); });
    await t.test('Convite só pode ser usado uma vez', async () => fails(command('accept_invite',{token:invitation.token})));
    await t.test('Representante não edita nem convida pela empresa', async () => {
      await fails(command('update_seller',{seller_id:company,name:'Invadida'}));
      await fails(command('invite',{seller_id:company,email:'user3@example.test'}));
      await fails(command('revoke_invite',{invitation_id:invitation.id}));
    });
    await as(3); await command('enable',{name:'Terceiro'});
    await t.test('Terceiro não lê empresa, vínculos ou auditoria alheios', async () => {
      assert.equal((await rows('commerce_sellers')).filter(s=>s.id===company).length,0);
      assert.equal((await rows('commerce_memberships')).length,0);
      assert.ok((await rows('commerce_audit')).every(a=>a.actor_id===ids[2]));
      await fails(command('select_seller',{seller_id:company}));
      await fails(command('end_membership',{membership_id:membership.id}));
    });
    await as(1); await command('invite',{seller_id:company,email:'user3@example.test'});
    const third=(await rows('commerce_invitations')).find(i=>i.email==='user3@example.test');
    await as(2);
    await t.test('Código não autoriza outro e-mail', async () => fails(command('accept_invite',{token:third.token})));
    await as(1); await command('revoke_invite',{invitation_id:third.id});
    await as(3);
    await t.test('Convite cancelado não pode ser aceito', async () => fails(command('accept_invite',{token:third.token})));
    await as(1); await command('invite',{seller_id:company,email:'user4@example.test'});
    const fourth=(await rows('commerce_invitations')).find(i=>i.email==='user4@example.test');
    await as(4); await command('enable',{name:'Sem confirmação'});
    await t.test('Exige e-mail confirmado', async () => fails(command('accept_invite',{token:fourth.token})));
    await as(1); await command('end_membership',{membership_id:membership.id});
    await as(2);
    await t.test('Revogação preserva histórico e bloqueia seleção', async () => {
      assert.equal((await rows('commerce_memberships'))[0].active,false);
      assert.equal((await rows('commerce_accounts'))[0].active_seller_id,null);
      assert.ok((await rows('commerce_sellers')).some(s=>s.id===company));
      await fails(command('select_seller',{seller_id:company}));
    });
    await as(1); await command('invite',{seller_id:company,email:'user2@example.test'});
    const reinvite=(await rows('commerce_invitations')).find(i=>i.email==='user2@example.test'&&i.status==='pending');
    await as(2); await command('accept_invite',{token:reinvite.token});
    await t.test('Novo convite reativa o mesmo vínculo sem duplicar', async () => assert.equal((await rows('commerce_memberships')).length,1));
    await command('end_membership',{membership_id:membership.id});
    await t.test('Representante pode sair da empresa', async () => assert.equal((await rows('commerce_memberships'))[0].active,false));
    await as(1);
    const company2=(await rows('commerce_sellers')).find(s=>s.name==='Empresa extra').id;
    await command('invite',{seller_id:company,email:'user2@example.test'});
    await command('invite',{seller_id:company2,email:'user2@example.test'});
    const multiple=(await rows('commerce_invitations')).filter(i=>i.status==='pending'&&i.email==='user2@example.test');
    await as(2);
    for (const inv of multiple) await command('accept_invite',{token:inv.token});
    await t.test('Atuação própria e múltiplas empresas coexistem', async () => {
      assert.equal((await rows('commerce_memberships')).filter(m=>m.active).length,2);
      assert.equal((await rows('commerce_sellers')).length,3);
      await command('select_seller',{seller_id:company2});
    });
    await as(1); await command('end_membership',{membership_id:membership.id}); await as(2);
    await t.test('Encerrar uma empresa não revoga outra atuação', async () => {
      assert.equal((await rows('commerce_accounts'))[0].active_seller_id,company2);
      await command('select_seller',{seller_id:company2});
    });
    await db.exec('reset role'); await db.query("update public.commerce_invitations set expires_at=now()-interval '1 day' where id=$1",[fourth.id]);
    await as(4);
    await t.test('Convite expirado é rejeitado', async () => fails(command('accept_invite',{token:fourth.token})));
    await as(null,'anon');
    await t.test('Anônimo não lê nem executa comandos', async () => { await fails(rows('commerce_sellers')); await fails(command('enable',{name:'Anônimo'})); });
    await as(null);
    await t.test('Sessão sem usuário é rejeitada', async () => fails(command('enable',{name:'Ausente'})));
  } finally { await db.close(); }
});
