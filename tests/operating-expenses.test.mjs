import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  parseCents,
  expensePayload,
  expenseState,
  expensesCsv,
  validExpenseDate,
} from '../src/modules/finance/expenseModel.js';
import { localDay } from '../src/modules/visits/visitFollowup.js';
const sql = readFileSync(
  new URL('../supabase/stage_43_operating_expenses.sql', import.meta.url),
  'utf8',
);
test('despesas: isolamento, centavos, parcelas, estorno, cancelamento e reenvio', async (t) => {
  const db = new PGlite(),
    user = randomUUID(),
    other = randomUUID(),
    property = randomUUID(),
    foreign = randomUUID(),
    season = randomUUID();
  try {
    await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   create table public.properties(id uuid primary key,user_id uuid,name text,deleted_at timestamptz);
   create table public.seasons(id uuid primary key,user_id uuid,property_id uuid,name text,deleted_at timestamptz);
   grant usage on schema public,auth to authenticated,anon;`);
    await db.query('insert into auth.users values($1),($2)', [user, other]);
    await db.query("insert into properties values($1,$2,'Sítio',null),($3,$4,'Outro',null)", [
      property,
      user,
      foreign,
      other,
    ]);
    await db.query("insert into seasons values($1,$2,$3,'Safra',null)", [season, user, property]);
    await db.exec(sql);
    await db.exec(sql);
    const as = async (id = user, role = 'authenticated') => {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || '']);
      await db.exec('set role ' + role);
    };
    const rpc = async (name, args = []) =>
      (
        await db.query(
          `select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) r`,
          args,
        )
      ).rows[0].r;
    const command = (action, data, op = randomUUID()) =>
      rpc('expense_command', [op, action, JSON.stringify(data)]);
    const form = {
      property_id: property,
      season_id: season,
      title: 'Serviço de plantio',
      category: 'services',
      amount_cents: 10001,
      record_date: localDay(),
      due_date: '2027-01-06',
    };
    const list = (offset = 0, prop = null, from = null, to = null, state = 'active') =>
      rpc('expense_list', [offset, prop, from, to, state]);
    await as();
    let created, pay;
    await t.test('valida proprietário, safra e valores no servidor', async () => {
      assert.deepEqual(
        (await rpc('expense_context')).properties.map((p) => p.id),
        [property],
      );
      for (const change of [
        { property_id: foreign },
        { season_id: randomUUID() },
        { amount_cents: 0 },
        { amount_cents: -1 },
        { amount_cents: 1.5 },
        { amount_cents: 100000000000 },
        { record_date: '2099-01-01' },
        { due_date: '2026-02-30' },
        { category: 'inputs' },
        { title: 'x' },
        { notes: 'x'.repeat(2001) },
      ])
        await assert.rejects(command('create', { ...form, ...change }));
      await assert.rejects(command('other', form));
      created = await command('create', form);
      assert.equal(created.version, 1);
      const again = await command('create', form, created.id);
      assert.deepEqual(again, created);
      await assert.rejects(command('create', { ...form, title: 'Outra despesa' }, created.id));
      assert.equal((await list()).count, 1);
      await assert.rejects(db.query('select * from operating_expenses'));
    });
    await t.test('pagamento parcial, limite de saldo e controle de versão', async () => {
      const op = randomUUID();
      const body = {
        id: created.id,
        version: 1,
        amount_cents: 3333,
        paid_on: localDay(),
        note: 'Parcela 1',
      };
      pay = await command('pay', body, op);
      assert.equal(pay.version, 2);
      assert.deepEqual(await command('pay', body, op), pay);
      assert.equal((await rpc('expense_detail', [created.id])).payments.length, 1);
      await assert.rejects(command('pay', body));
      await assert.rejects(command('pay', { ...body, version: 2, amount_cents: 6669 }));
      await assert.rejects(command('pay', { ...body, version: 2, paid_on: '2099-01-01' }));
      await assert.rejects(
        command('cancel', { id: created.id, version: 2, reason: 'Erro de cadastro' }),
      );
      const data = await list();
      assert.equal(data.totals.amount_cents, 10001);
      assert.equal(data.totals.paid_cents, 3333);
      assert.equal(data.totals.balance_cents, 6668);
      await command('pay', { ...body, version: 2, amount_cents: 6668 });
      assert.equal((await list(0, null, null, null, 'paid')).count, 1);
      assert.equal((await list(0, null, null, null, 'open')).count, 0);
    });
    await t.test('outro usuário e anônimo não consultam nem comandam despesas', async () => {
      await as(other);
      assert.equal((await list()).count, 0);
      await assert.rejects(rpc('expense_detail', [created.id]));
      await assert.rejects(
        command('reverse', {
          id: created.id,
          version: 3,
          payment_id: randomUUID(),
          reason: 'Outro usuário',
        }),
      );
      await as(null, 'anon');
      await assert.rejects(list());
      await assert.rejects(command('create', form));
      await as(null);
      await assert.rejects(rpc('expense_context'));
      await assert.rejects(list());
      await as();
    });
    await t.test('estorno mantém histórico e cancelamento exige saldo pago zero', async () => {
      let d = await rpc('expense_detail', [created.id]);
      await assert.rejects(
        command('reverse', {
          id: created.id,
          version: 3,
          payment_id: d.payments[0].id,
          reason: 'x',
        }),
      );
      for (const payment of d.payments) {
        await command('reverse', {
          id: created.id,
          version: d.expense.version,
          payment_id: payment.id,
          reason: 'Pagamento lançado por engano',
        });
        d = await rpc('expense_detail', [created.id]);
      }
      assert.equal(d.payments.length, 2);
      assert.ok(d.payments.every((p) => p.reversed_at));
      await assert.rejects(
        command('reverse', {
          id: created.id,
          version: d.expense.version,
          payment_id: d.payments[0].id,
          reason: 'Repetido',
        }),
      );
      await command('cancel', {
        id: created.id,
        version: d.expense.version,
        reason: 'Despesa substituída',
      });
      assert.equal((await list()).count, 0);
      assert.equal((await list(0, null, null, null, 'cancelled')).count, 1);
      assert.equal((await list(0, null, null, null, 'cancelled')).items[0].balance_cents, 0);
      assert.equal((await list(0, null, null, null, 'cancelled')).totals.amount_cents, 0);
      d = await rpc('expense_detail', [created.id]);
      assert.ok(d.expense.cancelled_at);
      await assert.rejects(
        command('pay', {
          id: created.id,
          version: d.expense.version,
          amount_cents: 1,
          paid_on: localDay(),
        }),
      );
    });
    await t.test('paginação não limita totais e filtros usam vencimento', async () => {
      await db.exec('reset role');
      await db.query(
        `insert into operating_expenses(id,user_id,property_id,property_name,title,category,amount_cents,record_date,due_date)
    select md5(n::text)::uuid,$1,$2,'Sítio','Despesa '||n,'other',101,current_date,date '2027-01-07' from generate_series(1,51) n`,
        [user, property],
      );
      await as();
      const first = await list(0, property, '2027-01-07', '2027-01-07');
      assert.equal(first.count, 51);
      assert.equal(first.items.length, 50);
      assert.equal(first.totals.amount_cents, 5151);
      const next = await list(50, property, '2027-01-07', '2027-01-07');
      assert.equal(next.items.length, 1);
      assert.equal(next.totals.amount_cents, 5151);
      assert.equal((await list(0, foreign)).count, 0);
      await assert.rejects(list(-1));
      await assert.rejects(list(0, null, '2027-02-01', '2027-01-01'));
    });
  } finally {
    await db.close();
  }
});
test('formulário financeiro preserva centavos e valida datas, texto e CSV', () => {
  assert.equal(parseCents('1234,56'), 123456);
  assert.equal(parseCents('0.01'), 1);
  assert.equal(parseCents('999999999,99'), 99999999999);
  for (const amount of ['1.234,56', '-1', '1e3', '1,234', '0', 'NaN', '1.2.3'])
    assert.throws(() => parseCents(amount));
  const data = expensePayload({
    property_id: 'p',
    title: ' Frete ',
    category: 'freight',
    amount: '10,01',
    record_date: localDay(),
    due_date: '2027-01-01',
  });
  assert.equal(data.amount_cents, 1001);
  assert.equal(data.title, 'Frete');
  assert.equal(validExpenseDate('2026-02-30'), false);
  assert.equal(
    expenseState({ balance_cents: 10, paid_cents: 1, due_date: '2026-10-19' }, '2026-10-20'),
    'Parcial • vencida',
  );
  assert.equal(expenseState({ balance_cents: 0, cancelled_at: 'today' }), 'Cancelada');
  assert.match(
    expensesCsv([
      { ...data, title: '=SUM(1)', amount_cents: 1001, paid_cents: 1, balance_cents: 1000 },
    ]),
    /"'=SUM\(1\)"/,
  );
  assert.match(
    expensesCsv([{ ...data, amount_cents: 1001, paid_cents: 1, balance_cents: 1000 }]),
    /"10,01";"0,01";"10,00"/,
  );
});
