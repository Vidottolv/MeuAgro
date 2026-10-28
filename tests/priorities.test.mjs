import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prioritiesFixture } from './priorities-fixture.mjs';
import { parseInputCsv } from '../src/modules/onboarding/onboardingModel.js';
import { plannedLine, budgetPayload } from '../src/modules/planning/planningModel.js';
test('prioridades: orçamento, reposição, clima, implantação e licenças', async (t) => {
  const f = await prioritiesFixture(),
    { db, user, other, property, foreign, cycle, input, product, order, seller, as, rpc } = f;
  let budget,
    version = 1,
    siteJob;
  const budgetOp = (action, data, op = randomUUID()) =>
    rpc('budget_command', [op, action, JSON.stringify(data)]);
  const rainOp = (action, data, op = randomUUID()) =>
    rpc('weather_command', [op, action, JSON.stringify(data)]);
  const today = (await db.query('select current_date::text as d')).rows[0].d;
  const items = [
    {
      id: randomUUID(),
      label: 'Semear',
      category: 'input',
      input_id: input,
      quantity: '30',
      unit: 'kg',
      unit_cents: 100,
      due_date: today,
      completed: false,
    },
    {
      id: randomUUID(),
      label: 'Serviço',
      category: 'services',
      quantity: '1.005',
      unit: 'hora',
      unit_cents: 100,
      due_date: today,
      completed: false,
    },
  ];
  try {
    await t.test(
      'orçamento valida insumo, arredonda centavos, revisa e aprova um por plantio',
      async () => {
        const ctx = await rpc('budget_context');
        assert.equal(ctx.cycles.length, 1);
        assert.equal(ctx.inputs.length, 1);
        const op = randomUUID(),
          body = { cycle_id: cycle, name: 'Plano inicial', items };
        budget = (await budgetOp('create', body, op)).id;
        assert.equal(budget, op);
        assert.equal((await budgetOp('create', body, op)).version, 1);
        await assert.rejects(budgetOp('create', { ...body, name: 'Outro' }, op));
        const list = await rpc('budget_list', [0]);
        assert.equal(list.items[0].planned_cents, 3101);
        assert.equal(list.items[0].items[1].total_cents, 101);
        await assert.rejects(budgetOp('update', { id: budget, version: 0, name: 'Errado', items }));
        await assert.rejects(
          budgetOp('update', {
            id: budget,
            version,
            name: 'Errado',
            items: [{ ...items[0], input_id: randomUUID() }],
          }),
        );
        await budgetOp('update', { id: budget, version, name: 'Plano atualizado', items });
        version++;
        await budgetOp('status', { id: budget, version, status: 'approved' });
        version++;
        const otherBudget = await budgetOp('create', body);
        await assert.rejects(
          budgetOp('status', { id: otherBudget.id, version: 1, status: 'approved' }),
        );
        assert.equal((await rpc('budget_actual', [budget])).variance_cents, -3101);
      },
    );
    await t.test(
      'reposição inclui demanda, retira vencidos e só abate pedido vinculado',
      async () => {
        await db.exec('reset role');
        await db.query("insert into trade_orders values($1,$2,'confirmed',$3)", [
          order,
          user,
          JSON.stringify({
            items: [
              {
                product_id: product,
                name: 'Semente pedido',
                base_unit: 'kg',
                quantity: 2,
                package_size: 2,
              },
            ],
          }),
        ]);
        await as();
        let r = await rpc('procurement_report', [today, 0]);
        assert.equal(r.items[0].demand, 30);
        assert.equal(r.items[0].usable, 3);
        assert.equal(r.items[0].suggested, 37);
        assert.equal(r.unmapped.length, 1);
        const op = randomUUID();
        await rpc('procurement_link', [op, product, input]);
        await rpc('procurement_link', [op, product, input]);
        r = await rpc('procurement_report', [today, 0]);
        assert.equal(r.items[0].incoming, 4);
        assert.equal(r.items[0].suggested, 33);
        assert.equal(r.unmapped.length, 0);
        await budgetOp('update', {
          id: budget,
          version,
          name: 'Execução registrada',
          items: items.map((i) => ({ ...i, completed: true })),
        });
        version++;
        r = await rpc('procurement_report', [today, 0]);
        assert.equal(r.items[0].demand, 0);
        assert.equal(r.items[0].suggested, 13);
        await db.exec('reset role');
        await db.query("update trade_orders set state='received' where id=$1", [order]);
        await as();
        assert.equal((await rpc('procurement_report', [today, 0])).items[0].incoming, 0);
        await budgetOp('update', { id: budget, version, name: 'Plano ativo', items });
        version++;
        assert.equal((await rpc('procurement_report', [today, 0])).items[0].demand, 30);
        await db.exec('reset role');
        await db.query('update production_cycles set deleted_at=now() where id=$1', [cycle]);
        await as();
        assert.equal((await rpc('procurement_report', [today, 0])).items[0].demand, 0);
        await db.exec('reset role');
        await db.query('update production_cycles set deleted_at=null where id=$1', [cycle]);
        await as();
      },
    );
    await t.test(
      'chuva tem estação/dia únicos, anulação auditada e localização versionada',
      async () => {
        const body = { property_id: property, version: 0, latitude: '-23.55', longitude: '-46.63' };
        await rainOp('site', body);
        await assert.rejects(rainOp('site', body));
        await assert.rejects(rainOp('site', { ...body, property_id: foreign }));
        const reading = await rainOp('rain', {
          property_id: property,
          station: 'Principal',
          day: today,
          millimeters: '0',
          note: 'Medição sem chuva',
        });
        await assert.rejects(
          rainOp('rain', {
            property_id: property,
            station: 'principal',
            day: today,
            millimeters: '10',
          }),
        );
        let ctx = await rpc('weather_context', [property, 'Principal', today, today]);
        assert.equal(ctx.rain_days, 1);
        assert.equal(ctx.rain_total, 0);
        await rainOp('void', { id: reading.id, reason: 'Pluviômetro incorreto' });
        ctx = await rpc('weather_context', [property, 'Principal', today, today]);
        assert.equal(ctx.rain_total, null);
        assert.equal(ctx.rain.length, 1);
        assert.ok(ctx.rain[0].voided_at);
        await rainOp('rain', {
          property_id: property,
          station: 'Principal',
          day: today,
          millimeters: '12.5',
        });
        await rainOp('rain', {
          property_id: property,
          station: 'Outro',
          day: today,
          millimeters: '99',
        });
        assert.equal(
          (await rpc('weather_context', [property, 'Principal', today, today])).rain_total,
          12.5,
        );
        const job = await rpc('weather_prepare', [property]);
        siteJob = job.id;
        await assert.rejects(rpc('weather_prepare', [property]));
        await assert.rejects(rpc('weather_complete', [job.id, JSON.stringify({ days: [] })]));
        await as(user, 'service_role');
        await rpc('weather_complete', [
          job.id,
          JSON.stringify({ source: 'Open-Meteo', timezone: 'America/Sao_Paulo', days: [] }),
        ]);
        await as();
        assert.equal((await rpc('weather_prepare', [property])).cached, true);
      },
    );
    await t.test('importação é atômica, idempotente e não cria saldo', async () => {
      const row = {
          name: 'Novo insumo',
          brand: 'Marca',
          category: 'seeds',
          base_unit: 'kg',
          minimum_stock: '1',
          ideal_stock: '3',
        },
        op = randomUUID();
      await assert.rejects(
        rpc('onboarding_import', [
          randomUUID(),
          JSON.stringify([row, { ...row, name: 'Inválido', ideal_stock: '0' }]),
        ]),
      );
      await db.exec('reset role');
      assert.equal(
        (await db.query("select count(*)::int n from agricultural_inputs where name='Novo insumo'"))
          .rows[0].n,
        0,
      );
      await as();
      assert.equal((await rpc('onboarding_import', [op, JSON.stringify([row])])).imported, 1);
      assert.equal((await rpc('onboarding_import', [op, JSON.stringify([row])])).imported, 1);
      await assert.rejects(rpc('onboarding_import', [randomUUID(), JSON.stringify([row])]));
      assert.equal((await rpc('app_account_context')).steps.inputs, 2);
      const req = randomUUID();
      await rpc('app_plan_request', [req, 'company10']);
      await rpc('app_plan_request', [req, 'company10']);
      await assert.rejects(rpc('app_plan_request', [randomUUID(), 'company20']));
    });
    await t.test(
      'licença limita pessoas, mantém cobrança privada e tolera eventos fora de ordem',
      async () => {
        await db.exec('reset role');
        await db.exec(
          "update app_plans set seat_limit=2,monthly_cents=10000 where code='company10'",
        );
        await db.query(
          "insert into app_subscriptions(user_id,plan_code,provider_customer,provider_subscription,manual_until) values($1,'company10','cus_test','sub_test',now()+interval '1 day')",
          [user],
        );
        await db.query('insert into commerce_memberships values($1,$2,$3,true)', [
          randomUUID(),
          seller,
          f.ids[10],
        ]);
        await assert.rejects(
          db.query('insert into commerce_memberships values($1,$2,$3,true)', [
            randomUUID(),
            seller,
            f.ids[11],
          ]),
        );
        await as();
        const ctx = await rpc('app_account_context');
        assert.equal(ctx.usage.people, 2);
        await assert.rejects(rpc('app_billing_apply', ['evt_1', '{}']));
        await as(user, 'service_role');
        const paid = {
          id: 'pay_test',
          subscription: 'sub_test',
          customer: 'cus_test',
          status: 'CONFIRMED',
          amount_cents: 10000,
          dueDate: today,
          checked_at: new Date().toISOString(),
          invoiceUrl: 'https://www.asaas.com/i/test',
        };
        await rpc('app_billing_apply', ['evt_1', JSON.stringify(paid)]);
        await rpc('app_billing_apply', ['evt_1', JSON.stringify(paid)]);
        await rpc('app_billing_apply', [
          'evt_old',
          JSON.stringify({ ...paid, status: 'OVERDUE', checked_at: '2020-01-01T00:00:00Z' }),
        ]);
        await as();
        assert.equal((await rpc('app_account_context')).invoices[0].status, 'CONFIRMED');
        await as(user, 'service_role');
        await rpc('app_billing_apply', [
          'evt_refund',
          JSON.stringify({
            ...paid,
            status: 'REFUNDED',
            checked_at: new Date(Date.now() + 1000).toISOString(),
          }),
        ]);
        await as();
        assert.equal((await rpc('app_account_context')).invoices[0].status, 'REFUNDED');
      },
    );
    await t.test(
      'plano vencido bloqueia novas gravações e preserva consulta/exportação',
      async () => {
        await db.exec('reset role');
        await db.query(
          "update app_subscriptions set manual_until=now()-interval '1 day' where user_id=$1",
          [user],
        );
        await as();
        await assert.rejects(budgetOp('create', { cycle_id: cycle, name: 'Novo plano', items }));
        assert.ok((await rpc('budget_list', [0])).count > 0);
        assert.ok((await rpc('app_account_context')).invoices.length > 0);
        await db.exec('reset role');
        await db.query(
          "update app_subscriptions set manual_until=now()+interval '1 day' where user_id=$1",
          [user],
        );
        await as();
      },
    );
    await t.test('contas a receber e fluxo usam baixas, não vencimento', async () => {
      const create = (name, value) =>
        rpc(name, [
          randomUUID(),
          'create',
          JSON.stringify({
            property_id: property,
            title: 'Registro financeiro',
            category: 'services',
            amount_cents: value,
            record_date: today,
            due_date: '2027-01-01',
          }),
        ]);
      const receivable = await create('receivable_command', 10000),
        expense = await create('expense_command', 5000);
      await rpc('receivable_command', [
        randomUUID(),
        'pay',
        JSON.stringify({ id: receivable.id, version: 1, amount_cents: 3333, paid_on: today }),
      ]);
      await rpc('expense_command', [
        randomUUID(),
        'pay',
        JSON.stringify({ id: expense.id, version: 1, amount_cents: 1234, paid_on: today }),
      ]);
      const report = await rpc('cash_flow_report', [today, today]);
      assert.equal(report.incoming, 3333);
      assert.equal(report.outgoing, 1234);
      assert.equal(report.net, 2099);
    });
    await t.test(
      'outros usuários e anônimos não acessam registros nem funções administrativas',
      async () => {
        await as(other);
        assert.equal((await rpc('budget_list', [0])).count, 0);
        await assert.rejects(rpc('budget_actual', [budget]));
        await assert.rejects(rpc('weather_context', [property, 'Principal', today, today]));
        assert.equal((await rpc('app_account_context')).invoices.length, 0);
        await assert.rejects(rpc('procurement_link', [randomUUID(), product, input]));
        await as(null, 'anon');
        for (const name of ['budget_context', 'app_account_context'])
          await assert.rejects(rpc(name));
        await assert.rejects(rpc('weather_complete', [siteJob, null]));
      },
    );
  } finally {
    await db.close();
  }
});
test('modelo de orçamento usa centavos exatos e CSV valida limites/aspas', () => {
  assert.equal(plannedLine({ quantity: '1,005', price: '1' }).total_cents, 101);
  assert.equal(plannedLine({ quantity: '0.1', price: '0' }).total_cents, 0);
  assert.throws(() => plannedLine({ quantity: '1e3', price: '1' }));
  const header = 'name;brand;category;base_unit;minimum_stock;ideal_stock\r\n';
  const rows = parseInputCsv(header + '"Semente; teste";Marca;seeds;kg;1,5;2\r\n');
  assert.equal(rows[0].name, 'Semente; teste');
  assert.equal(rows[0].minimum_stock, '1.5');
  assert.throws(() => parseInputCsv(header + 'Semente;Marca;seeds;kg;5;2'));
  assert.throws(() => parseInputCsv(header + '"Aberto;Marca;seeds;kg;1;2'));
});
