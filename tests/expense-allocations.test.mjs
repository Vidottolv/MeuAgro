import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  allocationPayload,
  equalAllocation,
  costsCsv,
} from '../src/modules/finance/allocationModel.js';
const migration = (n) => readFileSync(new URL('../supabase/' + n, import.meta.url), 'utf8');
test('rateio e resultados: propriedade, safra, concorrência, centavos e histórico', async (t) => {
  const db = new PGlite(),
    u = randomUUID(),
    other = randomUUID(),
    property = randomUUID(),
    foreign = randomUUID(),
    season = randomUUID(),
    s2 = randomUUID(),
    c1 = randomUUID(),
    c2 = randomUUID(),
    c3 = randomUUID(),
    h1 = randomUUID(),
    h2 = randomUUID();
  let expense,
    version = 1,
    allocationOp;
  try {
    await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated;
 create table properties(id uuid primary key,user_id uuid,name text,deleted_at timestamptz);create table seasons(id uuid primary key,user_id uuid,property_id uuid,name text,deleted_at timestamptz);
 create table areas(id uuid primary key,name text);create table crops(id uuid primary key,name text);
 create table production_cycles(id uuid primary key,user_id uuid,property_id uuid,season_id uuid,area_id uuid,crop_id uuid,planting_date date,deleted_at timestamptz);
 create table inventory_transactions(id uuid primary key,user_id uuid,production_cycle_id uuid,transaction_type text,total_cost numeric(14,2));create table harvests(id uuid primary key,user_id uuid,production_cycle_id uuid);create table harvest_sales(id uuid primary key,user_id uuid,harvest_id uuid,total_value numeric(14,2));`);
    await db.query('insert into auth.users values($1),($2)', [u, other]);
    await db.query("insert into properties values($1,$2,'Minha',null),($3,$4,'Outra',null)", [
      property,
      u,
      foreign,
      other,
    ]);
    await db.query(
      "insert into seasons values($1,$2,$3,'Safra A',null),($4,$2,$3,'Safra B',null)",
      [season, u, property, s2],
    );
    await db.query(
      "insert into production_cycles(id,user_id,property_id,season_id,planting_date) values($1,$2,$3,$4,'2026-10-01'),($5,$2,$3,$6,'2026-10-02'),($7,$8,$9,null,'2026-10-03')",
      [c1, u, property, season, c2, s2, c3, other, foreign],
    );
    await db.query(
      "insert into inventory_transactions values($1,$2,$3,'usage',100),($4,$2,$5,'usage',200),($6,$2,$3,'purchase',999)",
      [randomUUID(), u, c1, randomUUID(), c2, randomUUID()],
    );
    await db.query('insert into harvests values($1,$2,$3),($4,$2,$5)', [h1, u, c1, h2, c2]);
    await db.query('insert into harvest_sales values($1,$2,$3,500),($4,$2,$5,400)', [
      randomUUID(),
      u,
      h1,
      randomUUID(),
      h2,
    ]);
    await db.exec(migration('stage_43_operating_expenses.sql'));
    const sql = migration('stage_44_expense_allocations.sql');
    await db.exec(sql);
    await db.exec(sql);
    const as = async (id = u, role = 'authenticated') => {
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
    const allocate = (items, extra = {}, op = randomUUID()) =>
      rpc('expense_allocate', [
        op,
        JSON.stringify({
          id: expense,
          version,
          reason: 'Distribuição revisada',
          allocations: items,
          ...extra,
        }),
      ]);
    const report = (prop = null, saf = null, cyc = null, offset = 0) =>
      rpc('operating_cost_report', [prop, saf, cyc, offset]);
    await as();
    expense = (
      await command('create', {
        property_id: property,
        title: 'Serviço comum',
        category: 'services',
        amount_cents: 10001,
        record_date: '2026-10-01',
        due_date: '2026-11-01',
      })
    ).id;
    await t.test('valida vínculos, total e revisão sem modificar rateio em falhas', async () => {
      const ctx = await rpc('expense_allocation_context', [expense]);
      assert.equal(ctx.version, 44);
      assert.equal(ctx.cycles.length, 2);
      for (const items of [
        [{ cycle_id: c3, amount_cents: 1 }],
        [
          { cycle_id: c1, amount_cents: 5000 },
          { cycle_id: c1, amount_cents: 1 },
        ],
        [{ cycle_id: c1, amount_cents: 10002 }],
        [
          { cycle_id: c1, amount_cents: 6000 },
          { cycle_id: c2, amount_cents: 5000 },
        ],
        [{ cycle_id: c1, amount_cents: 0 }],
        [{ cycle_id: c1, amount_cents: 1.2 }],
      ])
        await assert.rejects(allocate(items));
      await assert.rejects(allocate([], { version: 0 }));
      await assert.rejects(allocate([], { reason: '' }));
      allocationOp = randomUUID();
      const items = [
        { cycle_id: c1, amount_cents: 6000 },
        { cycle_id: c2, amount_cents: 4001 },
      ];
      const result = await allocate(items, {}, allocationOp);
      assert.equal(result.unallocated_cents, 0);
      assert.equal(result.version, 2);
      assert.deepEqual(await allocate(items, {}, allocationOp), result);
      await assert.rejects(allocate([], { version: 1 }, allocationOp));
      version = 2;
      const after = await rpc('expense_allocation_context', [expense]);
      assert.equal(after.allocations.length, 2);
      assert.equal(after.history.length, 1);
      assert.ok(after.history[0].allocations[0].cycle_label);
      await assert.rejects(db.query('select * from expense_allocations'));
    });
    await t.test(
      'resultado usa consumo, vendas e rateio integral, sem pagamentos nem compras',
      async () => {
        let r = await report();
        assert.equal(r.count, 2);
        assert.deepEqual(r.totals, {
          input_cents: 30000,
          operating_cents: 10001,
          revenue_cents: 90000,
          result_cents: 49999,
        });
        assert.equal(r.groups.length, 2);
        await command('pay', { id: expense, version, amount_cents: 100, paid_on: '2026-10-02' });
        version++;
        assert.deepEqual((await report()).totals, r.totals);
        const selected = await report(property, season);
        assert.equal(selected.items.length, 1);
        assert.equal(selected.totals.operating_cents, 6000);
        assert.equal(selected.totals.result_cents, 34000);
        assert.equal((await report(null, null, c2)).count, 1);
      },
    );
    await t.test(
      'outro usuário e anônimo não obtêm histórico nem resultados privados',
      async () => {
        await as(other);
        await assert.rejects(rpc('expense_allocation_context', [expense]));
        await assert.rejects(allocate([]));
        const r = await report(property);
        assert.equal(r.count, 0);
        assert.equal(r.unallocated_cents, 0);
        await as(null, 'anon');
        await assert.rejects(report());
        await assert.rejects(allocate([]));
        await as(null);
        await assert.rejects(report());
        await as();
      },
    );
    await t.test('despesa com safra aceita só plantios dessa safra', async () => {
      const separate = (
        await command('create', {
          property_id: property,
          season_id: season,
          title: 'Energia Safra A',
          category: 'energy',
          amount_cents: 99,
          record_date: '2026-10-01',
          due_date: '2026-11-01',
        })
      ).id;
      const body = {
        id: separate,
        version: 1,
        reason: 'Rateio inicial',
        allocations: [{ cycle_id: c2, amount_cents: 99 }],
      };
      await assert.rejects(rpc('expense_allocate', [randomUUID(), JSON.stringify(body)]));
      assert.equal((await rpc('expense_allocation_context', [separate])).cycles.length, 1);
      assert.equal((await report(property, season)).unallocated_cents, 99);
    });
    await t.test(
      'arquivamento de plantio mantém custo e permite corrigir vínculo anterior',
      async () => {
        await db.exec('reset role');
        await db.query('update production_cycles set deleted_at=now() where id=$1', [c1]);
        await as();
        assert.equal((await report()).items.find((c) => c.id === c1).operating_cents, 6000);
        const r = await allocate([{ cycle_id: c1, amount_cents: 5000 }]);
        version = r.version;
        assert.equal(r.unallocated_cents, 5001);
        assert.equal((await report()).unallocated_cents, 5100);
        const ctx = await rpc('expense_allocation_context', [expense]);
        assert.equal(ctx.cycles.length, 1);
        assert.equal(ctx.allocations[0].cycle_id, c1);
        assert.equal(ctx.history.length, 2);
        await allocate([]);
        version++;
        assert.equal((await rpc('expense_allocation_context', [expense])).allocations.length, 0);
        await assert.rejects(allocate([{ cycle_id: c1, amount_cents: 1 }]));
      },
    );
    await t.test('cancelamento deixa histórico e retira despesas do resultado', async () => {
      await allocate([{ cycle_id: c2, amount_cents: 10001 }]);
      version++;
      let d = await rpc('expense_detail', [expense]);
      await command('reverse', {
        id: expense,
        version,
        payment_id: d.payments[0].id,
        reason: 'Correção de teste',
      });
      version++;
      await command('cancel', { id: expense, version, reason: 'Serviço cancelado' });
      version++;
      const r = await report();
      assert.equal(r.totals.operating_cents, 0);
      assert.equal(r.totals.result_cents, 60000);
      assert.equal((await rpc('expense_allocation_context', [expense])).allocations.length, 1);
      await assert.rejects(allocate([]));
    });
    await t.test('paginação mantém totais e grupos completos', async () => {
      await db.exec('reset role');
      await db.query(
        "insert into production_cycles(id,user_id,property_id,season_id,planting_date) select md5(n::text)::uuid,$1,$2,$3,date '2026-10-01' from generate_series(1,51) n",
        [u, property, season],
      );
      await as();
      const first = await report(),
        second = await report(null, null, null, 50);
      assert.equal(first.count, 53);
      assert.equal(first.items.length, 50);
      assert.equal(second.items.length, 3);
      assert.deepEqual(first.totals, second.totals);
      assert.equal(
        first.groups.reduce((s, g) => s + g.cycles, 0),
        53,
      );
    });
  } finally {
    await db.close();
  }
});
test('divisão igual preserva centavos; CSV protege fórmulas e resultado negativo', () => {
  const items = [{ cycle_id: 'a' }, { cycle_id: 'b' }, { cycle_id: 'c' }];
  const equal = equalAllocation(items, 10001);
  assert.deepEqual(
    equal.map((i) => i.amount),
    ['33,34', '33,34', '33,33'],
  );
  assert.equal(allocationPayload(equal, 10001).remaining, 0);
  assert.equal(items[0].amount, undefined);
  assert.equal(allocationPayload([{ cycle_id: 'a', amount: '1,01' }], 10001).remaining, 9900);
  assert.throws(() =>
    allocationPayload(
      [
        { cycle_id: 'a', amount: '1' },
        { cycle_id: 'a', amount: '1' },
      ],
      1000,
    ),
  );
  assert.throws(() => equalAllocation(items, 2));
  assert.throws(() => allocationPayload([{ cycle_id: 'a', amount: '2' }], 100));
  assert.equal(allocationPayload([], 100).remaining, 100);
  assert.match(
    costsCsv([
      {
        property_name: '=SOMA',
        input_cents: 100,
        operating_cents: 101,
        revenue_cents: 0,
        result_cents: -201,
      },
    ]),
    /"'=SOMA"/,
  );
  assert.match(
    costsCsv([{ input_cents: 100, operating_cents: 101, revenue_cents: 0, result_cents: -201 }]),
    /"'-2,01"/,
  );
});
