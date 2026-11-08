import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { profileOnboardingFixture } from './profile-onboarding-fixture.mjs';
import { decimal, schedule } from '../src/modules/lite/liteModel.js';
test('valores brasileiros e parcelas preservam o dia âncora', () => {
  assert.equal(decimal('12,35'), 1235);
  assert.equal(decimal('1,125', 3), 1125);
  assert.throws(() => decimal('1.234,56'));
  assert.throws(() => decimal('1,234'));
  assert.deepEqual(schedule('2028-01-31', 3), ['2028-01-31', '2028-02-29', '2028-03-31']);
});
test('Lite: regras financeiras, autorização, histórico e instalação repetível', async (t) => {
  const f = await profileOnboardingFixture();
  t.after(() => f.db.close());
  await f.db.exec(`reset role;create role authenticator;
    alter table properties enable row level security;
    create policy fixture_own_properties on properties to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
    grant select on properties to authenticated;`);
  const sql = readFileSync(
    new URL('../supabase/stage_59_consultant_lite.sql', import.meta.url),
    'utf8',
  );
  await f.db.exec(sql);
  await f.db.exec(sql);
  const lite = randomUUID();
  await f.db.query('insert into auth.users(id) values($1)', [lite]);
  await f.as(f.user);
  const until = new Date(Date.now() + 86400000 * 30).toISOString();
  await f.rpc('app_lite_admin_assign', [randomUUID(), lite, 0, until, 'Piloto de testes']);
  const today = (await f.db.query("select (now() at time zone 'America/Sao_Paulo')::date::text d"))
    .rows[0].d;
  const month = today.slice(0, 7) + '-01';
  async function request(name, args = [], path = 'rpc/' + name, user = lite) {
    await f.as(user);
    await f.db.exec('begin');
    try {
      await f.db.query("select set_config('request.path',$1,true)", [path]);
      await f.rpc('app_lite_request_guard');
      const result = await f.rpc(name, args);
      await f.db.exec('commit');
      return result;
    } catch (e) {
      await f.db.exec('rollback');
      throw e;
    }
  }
  const command = (action, data, op = randomUUID()) =>
    request('app_lite_command', [op, action, data]);
  const context = () => request('app_lite_context', [month, '', 0]);
  const sale = {
    producer: 'Produtor Teste',
    sold_on: today,
    payment_method: 'pix',
    items: [{ product: 'Fertilizante', quantity: '1.125', unit: 'kg', unit_price_cents: 10001 }],
    commission_type: 'percent',
    commission_rate: 1000,
    dates: [today, today, today],
    note: 'Teste',
  };
  await t.test('Lite exige proteção, bloqueia produtor/RPC e mantém contas completas', async () => {
    assert.equal((await request('app_lite_access')).mode, 'lite');
    assert.equal((await request('app_lite_access')).protected, true);
    await assert.rejects(request('app_lite_access', [], 'properties'), /Lite/);
    await assert.rejects(request('app_lite_access', [], '/rpc/app_onboarding_context'), /Lite/);
    assert.equal(
      (await request('app_lite_access', [], 'rpc/app_lite_access', f.user)).mode,
      'full',
    );
    await f.as(lite);
    await assert.rejects(f.rpc('app_lite_command', [randomUUID(), 'save', sale]), /bloqueio/);
    await assert.rejects(
      f.rpc('app_lite_admin_assign', [randomUUID(), lite, 1, until, 'Indevido']),
      /administrador/,
    );
    await assert.rejects(f.db.query('select * from app_lite_sales'), /permission denied/);
    assert.equal((await f.db.query('select * from properties')).rows.length, 0);
    await f.as(f.user);
    assert.ok((await f.db.query('select * from properties')).rows.length > 0);
  });
  let id;
  await t.test('validação atômica e idempotência com soma exata das parcelas', async () => {
    await assert.rejects(
      command('save', { ...sale, items: [{ ...sale.items[0], quantity: '1.1234' }] }),
      /quantidade/,
    );
    assert.equal((await context()).count, 0);
    const op = randomUUID();
    const a = await command('save', sale, op);
    id = a.id;
    assert.deepEqual(await command('save', sale, op), a);
    await assert.rejects(command('save', { ...sale, producer: 'Outro' }, op), /reutilizado/);
    const c = await context();
    assert.equal(c.summary.count, 1);
    assert.equal(c.summary.sales, 11251);
    assert.equal(c.summary.earned, 1125);
    assert.equal(
      c.sales[0].installments.reduce((s, i) => s + i.commission_cents, 0),
      1125,
    );
    assert.equal(
      c.sales[0].installments.reduce((s, i) => s + i.sale_cents, 0),
      11251,
    );
  });
  let receipt;
  await t.test('editar sem recebimentos exige versão e recalcula parcelas', async () => {
    const x = await command('save', {
      ...sale,
      producer: 'Venda para editar',
      commission_type: 'fixed',
      commission_cents: 1001,
    });
    const c = await context();
    const row = c.sales.find((s) => s.id === x.id);
    assert.equal(
      row.installments.reduce((s, i) => s + i.commission_cents, 0),
      1001,
    );
    await assert.rejects(command('save', { ...sale, id: x.id, version: 99 }), /alterada/);
    await command('save', {
      ...sale,
      id: x.id,
      version: 1,
      commission_type: 'fixed',
      commission_cents: 1002,
    });
    const edited = (await context()).sales.find((s) => s.id === x.id);
    assert.equal(edited.version, 2);
    assert.equal(edited.commission_cents, 1002);
    await command('cancel', { id: x.id, version: 2, reason: 'Encerrando teste de edição' });
  });
  await t.test('recebimento parcial, excedente recusado e recebido pela data real', async () => {
    let c = await context();
    const i = c.sales.find((s) => s.id === id).installments[0];
    const r = await command('receive', {
      installment: i.id,
      amount_cents: 100,
      received_on: today,
    });
    receipt = r.id;
    await assert.rejects(
      command('receive', { installment: i.id, amount_cents: 276, received_on: today }),
      /excede/,
    );
    c = await context();
    assert.equal(c.received, 100);
    assert.equal(c.months.find((x) => x.month === month).expected, 1025);
    await assert.rejects(
      command('cancel', { id, version: 1, reason: 'Cancelamento teste' }),
      /Estorne/,
    );
    await assert.rejects(command('save', { ...sale, id, version: 1 }), /Estorne/);
  });
  await t.test('outra conta não lê ou altera venda alheia', async () => {
    await f.db.exec('reset role');
    await f.db.query(
      "update app_subscriptions set plan_code='lite',manual_until=now()+interval '1 month' where user_id=$1",
      [f.other],
    );
    assert.equal(
      (await request('app_lite_context', [month, '', 0], 'rpc/app_lite_context', f.other)).count,
      0,
    );
    await assert.rejects(
      request(
        'app_lite_command',
        [randomUUID(), 'cancel', { id, version: 1, reason: 'Acesso indevido' }],
        'rpc/app_lite_command',
        f.other,
      ),
      /alterada/,
    );
  });
  await t.test(
    'estorno reabre previsão; cancelamento preserva histórico e retira totais',
    async () => {
      await command('reverse', { receipt, reason: 'Correção de registro' });
      assert.equal((await context()).received, 0);
      await assert.rejects(command('save', { ...sale, id, version: 1 }), /histórico/);
      await command('cancel', { id, version: 1, reason: 'Venda substituída' });
      const c = await context();
      assert.equal(c.summary.count, 0);
      assert.equal(c.count, 2);
      assert.equal(c.sales.find((s) => s.id === id).installments[0].receipts.length, 1);
      assert.equal(c.months.find((x) => x.month === month).expected, 0);
    },
  );
  await t.test(
    'venda de outro mês não altera vendas atuais e recebimento usa a data real',
    async () => {
      const oldDate=new Date(month+'T12:00:00Z');oldDate.setUTCMonth(oldDate.getUTCMonth()-1);
      const old=oldDate.toISOString().slice(0,10);
      const x=await command('save',{...sale,sold_on:old,dates:[old],commission_type:'fixed',commission_cents:100});
      const past=await request('app_lite_context',[old,'',0]);
      const row=past.sales.find(s=>s.id===x.id);
      const r=await command('receive',{installment:row.installments[0].id,amount_cents:100,received_on:today});
      const current=await context();assert.equal(current.summary.count,0);assert.equal(current.summary.earned,0);assert.equal(current.received,100);
      assert.equal((await request('app_lite_context',[old,'',0])).received,0);
      await command('reverse',{receipt:r.id,reason:'Encerrando teste de datas'});
      await command('cancel',{id:x.id,version:1,reason:'Encerrando teste de datas'});
    },
  );
  await t.test(
    'vencimento bloqueia escrita sem liberar modo produtor ou apagar histórico',
    async () => {
      await f.db.exec('reset role');
      await f.db.query(
        "update app_subscriptions set manual_until=now()-interval '1 day' where user_id=$1",
        [lite],
      );
      assert.equal((await context()).access.active, false);
      assert.equal((await context()).access.mode, 'lite');
      await assert.rejects(command('save', sale), /vigência/);
      await assert.rejects(request('app_lite_access', [], 'production_cycles'), /Lite/);
    },
  );
  await t.test('não sobrescreve hook personalizado durante instalação',async()=>{
    await f.db.exec("reset role;alter role authenticator set pgrst.db_pre_request='public.existing_custom_hook'");
    await assert.rejects(f.db.exec(sql),/hook existente/);
    await f.db.exec('rollback');
    const settings=(await f.db.query("select rolconfig from pg_roles where rolname='authenticator'")).rows[0].rolconfig;
    assert.ok(settings.includes('pgrst.db_pre_request=public.existing_custom_hook'));
  });
});
