import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { farmWorkflowFixture } from './farm-workflow-fixture.mjs';
test('colheita respeita vendas anteriores, saldo, unidade e encerramento pelo último lote', async () => {
  const f = await farmWorkflowFixture();
  try {
    const first = await f.harvest();
    await f.sale(first);
    await assert.rejects(
      f.db.query("update harvests set harvest_date='2026-10-15' where id=$1", [first]),
      /depois de uma venda/,
    );
    await assert.rejects(f.sale(first, '2026-10-12', 7), /ultrapassar/);
    await assert.rejects(
      f.db.query('update harvests set quantity=3 where id=$1', [first]),
      /menor/,
    );
    await assert.rejects(
      f.db.query("update harvests set unit='saca' where id=$1", [first]),
      /unidade/,
    );
    const last = await f.harvest('2026-10-20', 6, 'saca');
    const report = await f.rpc('app_farm_workflow');
    assert.equal(report.checks[0].harvests, 2);
    assert.equal(report.checks[0].sales, 1);
    assert.equal(report.checks[0].events, 2);
    assert.equal(report.totals.revenue_cents, 8000);
    await f.rpc('finalize_cycle_from_harvest', [first]);
    await assert.rejects(
      f.db.query("update production_cycles set final_harvest_date='2026-10-10' where id=$1", [
        f.cycle,
      ]),
      /última colheita/,
    );
    const c = (
      await f.db.query(
        'select status,final_harvest_date::text d from production_cycles where id=$1',
        [f.cycle],
      )
    ).rows[0];
    assert.equal(c.status, 'harvested');
    assert.equal(c.d, '2026-10-20');
    await assert.rejects(f.harvest('2026-10-21'), /encerrado/);
    await assert.rejects(
      f.db.query("update harvests set harvest_date='2026-10-22' where id=$1", [last]),
      /encerramento/,
    );
  } finally {
    await f.db.close();
  }
});
test('conferência combina receita, consumo e rateio sem considerar compra como consumo', async () => {
  const f = await farmWorkflowFixture();
  try {
    const h = await f.harvest();
    await f.sale(h, '2026-10-12', 5, 40);
    await f.db.exec('reset role');
    await f.db.query(
      "insert into inventory_transactions values($1,$2,$3,'usage',30),($4,$2,$3,'purchase',900)",
      [randomUUID(), f.user, f.cycle, randomUUID()],
    );
    await f.as(f.user);
    const created = await f.rpc('expense_command', [
      randomUUID(),
      'create',
      {
        property_id: f.property,
        season_id: f.season,
        title: 'Serviço de campo',
        category: 'services',
        amount_cents: '5000',
        record_date: '2026-10-10',
        due_date: '2026-10-20',
        notes: '',
      },
    ]);
    await f.rpc('expense_allocate', [
      randomUUID(),
      {
        id: created.id,
        version: created.version,
        reason: 'Rateio da rotina agrícola',
        allocations: [{ cycle_id: f.cycle, amount_cents: '4000' }],
      },
    ]);
    const r = await f.rpc('app_farm_workflow');
    assert.equal(r.totals.revenue_cents, 20000);
    assert.equal(r.totals.input_cents, 3000);
    assert.equal(r.totals.operating_cents, 4000);
    assert.equal(r.totals.result_cents, 13000);
    assert.equal(r.unallocated_cents, 1000);
    assert.equal(r.checks[0].usages, 1);
  } finally {
    await f.db.close();
  }
});
test('inconsistências legadas são apontadas sem reescrever histórico; titular e anônimo isolados', async () => {
  const f = await farmWorkflowFixture({ install: false });
  try {
    const h = await f.harvest();
    await f.sale(h);
    await f.db.query("update harvests set harvest_date='2026-10-15' where id=$1", [h]);
    await f.migrate();
    await f.as(f.user);
    let report = await f.rpc('app_farm_workflow');
    assert.equal(report.checks[0].issues, 1);
    assert.equal(
      (await f.db.query('select harvest_date::text d from harvests where id=$1', [h])).rows[0].d,
      '2026-10-15',
    );
    await f.as(f.other);
    await assert.rejects(f.rpc('app_farm_workflow', [f.cycle, 0]), /indisponível/);
    await assert.rejects(f.rpc('finalize_cycle_from_harvest', [h]));
    assert.equal((await f.rpc('app_farm_workflow')).totals.revenue_cents, 0);
    await f.as('', 'anon');
    await assert.rejects(f.rpc('app_farm_workflow'));
  } finally {
    await f.db.close();
  }
});
