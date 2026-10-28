import test from 'node:test';
import assert from 'node:assert/strict';
import { lifecycleFixture as fixture } from './lifecycle-fixture.mjs';
test('renovação, atraso, reembolso e contestação usam pagamentos canônicos sem somar duplicatas', async () => {
  const f = await fixture();
  try {
    const initial = await f.context();
    assert.equal(initial.active, true);
    const p = f.provider.payments[0];
    const future = (await f.db.query("select (current_date+interval '1 month')::date::text d"))
      .rows[0].d;
    f.provider.payments.push({ ...p, id: 'pay_next', dueDate: future, status: 'OVERDUE' });
    assert.equal((await f.event('pay_next', 'PAYMENT_OVERDUE')).status, 200);
    assert.equal((await f.context()).valid_until, initial.valid_until);
    f.provider.payments[1].status = 'RECEIVED';
    f.provider.payments[1].value = 0.01;
    await f.event('pay_next');
    assert.equal((await f.context()).valid_until, initial.valid_until);
    f.provider.payments[1].value = 10;
    await f.event('pay_next');
    const renewed = await f.context();
    assert.ok(new Date(renewed.valid_until) > new Date(initial.valid_until));
    await f.event('pay_next');
    assert.equal((await f.context()).valid_until, renewed.valid_until);
    // A late event label does not overwrite the current provider state.
    await f.event('pay_next', 'PAYMENT_OVERDUE');
    assert.equal((await f.context()).payments.find((p) => p.id === 'pay_next').status, 'RECEIVED');
    f.provider.payments[1].status = 'REFUNDED';
    await f.event('pay_next', 'PAYMENT_REFUNDED');
    assert.equal((await f.context()).valid_until, initial.valid_until);
    p.status = 'CHARGEBACK_REQUESTED';
    await f.event();
    assert.equal((await f.context()).active, false);
    p.status = 'RECEIVED';
    p.refunds = [{ status: 'DONE', value: 2 }];
    await f.event('pay_manual', 'PAYMENT_PARTIALLY_REFUNDED');
    assert.equal(
      (await f.context()).payments.find((p) => p.id === 'pay_manual').refund_review,
      true,
    );
    assert.equal((await f.context()).active, true);
  } finally {
    await f.db.close();
  }
});
test('atraso não renova período vencido; atualização recupera webhook perdido e limita repetição', async () => {
  const f = await fixture();
  try {
    await f.db.exec(
      "reset role;update app_billing_payments set valid_until=now()-interval '1 second';",
    );
    f.provider.payments[0].status = 'OVERDUE';
    await f.event();
    assert.equal((await f.context()).active, false);
    f.provider.payments[0].status = 'RECEIVED';
    let r = await f.request({ action: 'lifecycle-sync' });
    assert.equal(r.status, 200, JSON.stringify(r));
    assert.equal((await f.context()).active, true);
    assert.equal((await f.context()).sync.provider_status, 'ACTIVE');
    assert.equal((await f.request({ action: 'lifecycle-sync' })).status, 409);
    await f.coolLifecycle();
    f.provider.hasMore = true;
    assert.equal((await f.request({ action: 'lifecycle-sync' })).status, 409);
    assert.equal((await f.context()).sync.finished_at, null);
  } finally {
    await f.db.close();
  }
});
test('cancelamento exige confirmação e recupera resposta perdida sem segunda exclusão ou reembolso', async () => {
  const f = await fixture();
  try {
    const initial = await f.context();
    assert.equal((await f.request({ action: 'cancel' })).status, 400);
    f.provider.loseDelete = true;
    assert.equal((await f.request({ action: 'cancel', confirmed: true })).status, 502);
    assert.equal(f.provider.deletes, 1);
    assert.equal((await f.context()).sync.cancel_pending, true);
    await f.coolLifecycle();
    f.provider.hideDeleted = true;
    const r = await f.request({ action: 'lifecycle-sync' });
    assert.equal(r.status, 200, JSON.stringify(r));
    const c = await f.context();
    assert.equal(c.sync.provider_status, 'DELETED');
    assert.equal(c.sync.cancel_pending, false);
    assert.equal(c.valid_until, initial.valid_until);
    assert.equal(f.provider.deletes, 1);
    f.provider.payments[0].status = 'REFUNDED';
    assert.equal((await f.event('pay_manual', 'PAYMENT_REFUNDED')).status, 200);
    assert.equal((await f.context()).active, false);
    assert.equal(f.provider.posts.length, 0);
  } finally {
    await f.db.close();
  }
});
test('estado de assinatura não libera licença; isolamento e observações antigas são protegidos', async () => {
  const f = await fixture();
  try {
    const body = {
      id: 'evt_subscription',
      event: 'SUBSCRIPTION_INACTIVATED',
      subscription: { id: 'sub_manual', customer: 'cus_manual' },
    };
    f.provider.subscriptions[0].status = 'INACTIVE';
    assert.equal((await f.request(body)).status, 200);
    const initial = await f.context();
    assert.equal(initial.sync.provider_status, 'INACTIVE');
    await f.as('', 'service_role');
    await f.rpc('app_lifecycle_observe', [
      'sub_manual',
      'cus_manual',
      'sandbox',
      'ACTIVE',
      '2000-01-01T00:00:00Z',
    ]);
    assert.equal((await f.context()).sync.provider_status, 'INACTIVE');
    await f.as(f.user);
    assert.equal((await f.rpc('app_lifecycle_context')).payments.length, 0);
    await assert.rejects(
      f.rpc('app_lifecycle_observe', [
        'sub_manual',
        'cus_manual',
        'sandbox',
        'ACTIVE',
        new Date().toISOString(),
      ]),
    );
    await assert.rejects(f.db.query('select * from app_billing_sync'));
    f.asActor(f.user);
    assert.equal((await f.request({ action: 'cancel', confirmed: true })).status, 409);
    assert.equal(f.provider.deletes, 0);
    await f.as('', 'service_role');
    await f.db.exec("reset role;update app_billing_payments set status='REFUNDED'");
    f.provider.subscriptions[0].status = 'ACTIVE';
    await f.request({ ...body, id: 'evt_sub_active', event: 'SUBSCRIPTION_UPDATED' });
    assert.equal((await f.context()).active, false);
    await f.db.exec(
      "reset role;update app_subscriptions set manual_until=now()+interval '2 days' where provider_subscription='sub_manual';",
    );
    assert.equal((await f.context()).active, true);
  } finally {
    await f.db.close();
  }
});
test('cancelamento confirmado aceita DELETE vazio e não duplica exclusão em nova tentativa', async () => {
  const f = await fixture();
  try {
    const r = await f.request({ action: 'cancel', confirmed: true });
    assert.equal(r.status, 200, JSON.stringify(r));
    assert.equal(r.body.cancelled, true);
    assert.equal(f.provider.deletes, 1);
    await f.coolLifecycle();
    assert.equal((await f.request({ action: 'cancel', confirmed: true })).status, 200);
    assert.equal(f.provider.deletes, 1);
    assert.equal((await f.context()).active, true);
  } finally {
    await f.db.close();
  }
});
