import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { commercialFixture } from './commercial-fixture.mjs';
import { documentHash } from '../supabase/functions/billing-asaas/checkout.js';
import { checkoutFixture } from './checkout-fixture.mjs';
import { readFileSync } from 'node:fs';

test('migração preserva concessão antiga com checkout pendente de outro plano e restaura guard', async () => {
  const f = await checkoutFixture();
  try {
    await f.as(f.user);
    await f.rpc('app_admin_command', [
      randomUUID(),
      'trial',
      {
        user_id: f.other,
        version: 0,
        plan_code: 'company10',
        until: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Concessão anterior à migração',
      },
    ]);
    await f.db.exec('reset role');
    await f.db.exec(
      "update app_plans set monthly_cents=500,published=true where code='independent'",
    );
    const offer = await f.request({
      action: 'checkout-quote',
      operation: randomUUID(),
      plan: 'independent',
      method: 'PIX',
    });
    await f.as('', 'service_role');
    await f.rpc('app_checkout_claim', [
      f.other,
      offer.body.id,
      'sandbox',
      true,
      await documentHash('12345678909'),
      randomUUID(),
    ]);
    await f.db.exec('reset role');
    await f.db.exec(
      readFileSync(new URL('../supabase/stage_51_commercial_rules.sql', import.meta.url), 'utf8'),
    );
    await f.as(f.other);
    assert.equal((await f.rpc('app_commercial_context')).contract.snapshot.code, 'company10');
    await f.db.exec('reset role');
    await assert.rejects(
      f.db.query('update app_subscriptions set expected_cents=1 where user_id=$1', [f.other]),
      /contratação em andamento/,
    );
  } finally {
    await f.db.close();
  }
});

test('catálogo versionado não altera contrato e preserva pagamentos já confirmados', async () => {
  const f = await commercialFixture();
  try {
    await f.bind();
    await f.as(f.other);
    const original = (await f.rpc('app_commercial_context')).contract;
    assert.equal(original.snapshot.monthly_cents, 1000);
    assert.equal(original.snapshot.seat_limit, 11);
    const date = (await f.db.query('select current_date::text d')).rows[0].d;
    f.provider.payments.push({
      id: 'pay_under',
      customer: 'cus_manual',
      subscription: 'sub_manual',
      value: 5,
      status: 'RECEIVED',
      dueDate: date,
    });
    await f.request({ id: 'evt_under', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_under' } });
    await f.configure('company10', {
      name: 'Empresa nova',
      monthly_cents: '5000',
      seat_limit: '2',
      trial_days: '14',
      storage_bytes: '1073741824',
    });
    await f.as(f.other);
    const current = (await f.rpc('app_account_context')).subscription;
    assert.equal(current.commercial_snapshot.monthly_cents, 1000);
    assert.equal(current.commercial_snapshot.seat_limit, 11);
    assert.equal(current.valid_until, original.valid_until);
    await f.db.exec('reset role');
    const seller = randomUUID();
    await f.db.query('insert into commerce_sellers values($1,$2)', [seller, f.other]);
    for (const rep of [f.user, f.ids[10], f.ids[11]])
      await f.db.query('insert into commerce_memberships values($1,$2,$3,true)', [
        randomUUID(),
        seller,
        rep,
      ]);
    await f.db.query('update app_subscriptions set expected_cents=5000 where user_id=$1', [
      f.other,
    ]);
    await f.as(f.other);
    assert.equal(
      (await f.rpc('app_account_context')).subscription.valid_until,
      original.valid_until,
    );
    f.provider.payments[1].value = 15;
    await f.request({
      id: 'evt_under_revised',
      event: 'PAYMENT_RECEIVED',
      payment: { id: 'pay_under' },
    });
    await f.db.exec('reset role');
    assert.equal(
      (await f.db.query("select required_cents from app_billing_payments where id='pay_under'"))
        .rows[0].required_cents,
      5000,
    );
    await f.as(f.user);
    const history = await f.rpc('app_commercial_admin_context');
    assert.ok(history.versions.filter((v) => v.plan_code === 'company10').length >= 2);
    await f.as('', 'service_role');
    await assert.rejects(
      f.rpc('app_admin_link', [
        f.user,
        randomUUID(),
        {
          user_id: f.other,
          plan_code: 'company20',
          version: 1,
          expected_cents: 2000,
          customer: 'cus_manual',
          subscription: 'sub_manual',
          environment: 'sandbox',
          reason: 'Tentativa de troca sem aceite',
        },
      ]),
      /troca comercial/,
    );
  } finally {
    await f.db.close();
  }
});

test('teste público é configurável, único por conta, sem cobrança e expira sem renovar', async () => {
  const f = await commercialFixture();
  try {
    let p = await f.plan('company10');
    await f.as(f.other);
    await assert.rejects(f.rpc('app_trial_start', [randomUUID(), p, true]), /indisponível/);
    p = await f.configure('company10', { trial_days: '14' });
    await assert.rejects(f.configure('company10', { trial_days: '31' }), /Revise/);
    await f.as(f.other);
    await assert.rejects(f.rpc('app_trial_start', [randomUUID(), p, false]), /Confirme/);
    const operation = randomUUID();
    const result = await f.rpc('app_trial_start', [operation, p, true]);
    assert.equal((await f.rpc('app_trial_start', [operation, p, true])).ends_at, result.ends_at);
    await assert.rejects(f.rpc('app_trial_start', [randomUUID(), p, true]), /já foi utilizado/);
    let context = await f.rpc('app_commercial_context');
    assert.equal(context.trial_used, true);
    assert.ok(context.contract.valid_until);
    assert.equal(context.contract.has_provider, false);
    assert.equal(f.provider.posts.length, 0);
    await f.db.exec('reset role');
    await f.db.query(
      "update app_subscriptions set trial_ends_at=now()-interval '1 second' where user_id=$1",
      [f.other],
    );
    await f.as(f.other);
    context = await f.rpc('app_commercial_context');
    assert.ok(new Date(context.contract.valid_until) < new Date());
    assert.equal(f.provider.posts.length, 0);
    await assert.rejects(f.rpc('app_trial_start', [randomUUID(), p, true]), /já foi utilizado/);
  } finally {
    await f.db.close();
  }
});

test('oferta de checkout mantém limites e preço aceitos após edição do catálogo', async () => {
  const f = await commercialFixture();
  try {
    const id = randomUUID();
    const offer = await f.request({
      action: 'checkout-quote',
      operation: id,
      plan: 'company10',
      method: 'PIX',
    });
    assert.equal(offer.status, 200);
    await f.as('', 'service_role');
    const lease = randomUUID();
    await f.rpc('app_checkout_claim', [
      f.other,
      id,
      'sandbox',
      true,
      await documentHash('12345678909'),
      lease,
    ]);
    await f.rpc('app_checkout_step', [id, lease, 'release', {}]);
    await f.cool();
    await f.configure('company10', { monthly_cents: '5000', seat_limit: '1' });
    const result = await f.request({
      action: 'checkout-start',
      id,
      accepted: true,
      payer: { name: 'Teste', email: 'test@example.test', document: '12345678909' },
    });
    assert.equal(result.status, 200);
    await f.as(f.other);
    const contract = (await f.rpc('app_commercial_context')).contract;
    assert.equal(contract.snapshot.monthly_cents, 1000);
    assert.equal(contract.snapshot.seat_limit, 11);
    assert.equal(f.provider.subscriptions[0].value, 10);
  } finally {
    await f.db.close();
  }
});

test('troca assistida: pedido, proposta, aceite, data, validação do Asaas, aplicação e intervalo', async () => {
  const f = await commercialFixture();
  try {
    await f.bind({ expired: true });
    const target = await f.configure('company20', {
      monthly_cents: '2000',
      change_cooldown_days: '7',
    });
    await f.as(f.other);
    const id = randomUUID();
    await f.rpc('app_change_request', [id, target]);
    await f.rpc('app_change_request', [id, target]);
    await assert.rejects(f.rpc('app_change_request', [randomUUID(), target]), /andamento/);
    await f.as(f.user);
    let c = (await f.rpc('app_commercial_admin_context')).changes[0];
    const date = new Date(Date.now() + 2500).toISOString();
    await f.rpc('app_change_offer', [
      randomUUID(),
      id,
      c.version,
      'offer',
      date,
      'Troca no próximo período sem prorrata',
    ]);
    await f.as(f.other);
    c = (await f.rpc('app_commercial_context')).changes[0];
    await f.rpc('app_change_reply', [randomUUID(), id, c.version, 'accept']);
    c = (await f.rpc('app_commercial_context')).changes[0];
    f.asActor(f.other);
    assert.equal((await f.request({ action: 'commercial-preview', id })).status, 403);
    f.asActor(f.user);
    let preview = (await f.request({ action: 'commercial-preview', id })).body;
    assert.equal(preview.matches_offer, false);
    f.provider.subscriptions[0].value = 20;
    f.provider.payments.push({
      id: 'pay_open',
      customer: 'cus_manual',
      subscription: 'sub_manual',
      value: 10,
      status: 'PENDING',
      dueDate: '2026-10-25',
    });
    preview = (await f.request({ action: 'commercial-preview', id })).body;
    assert.equal(preview.open_invoices_compatible, false);
    f.provider.payments[1].value = 20;
    preview = (await f.request({ action: 'commercial-preview', id })).body;
    assert.equal(preview.matches_offer, true);
    const body = {
      action: 'commercial-apply',
      id,
      version: c.version,
      operation: randomUUID(),
      confirmed: preview,
      reason: 'Preço e cobranças conferidos no provedor',
    };
    assert.equal((await f.request(body)).status, 409);
    await new Promise((done) => setTimeout(done, 2700));
    assert.equal((await f.request(body)).status, 200);
    assert.equal((await f.request(body)).body.already_applied, true);
    await f.as(f.other);
    const context = await f.rpc('app_commercial_context');
    assert.equal(context.contract.snapshot.code, 'company20');
    assert.equal(context.contract.snapshot.monthly_cents, 2000);
    assert.equal(context.changes[0].status, 'applied');
    const old = await f.plan('company10');
    await f.as(f.other);
    await assert.rejects(f.rpc('app_change_request', [randomUUID(), old]), /intervalo/);
    assert.equal(f.provider.posts.length, 0);
  } finally {
    await f.db.close();
  }
});

test('downgrade exige reduzir equipe e proposta não pode antecipar vigência paga', async () => {
  const f = await commercialFixture();
  try {
    await f.db.exec('reset role');
    const seller = randomUUID();
    await f.db.query('insert into commerce_sellers values($1,$2)', [seller, f.other]);
    await f.db.query('insert into commerce_memberships values($1,$2,$3,true)', [
      randomUUID(),
      seller,
      f.user,
    ]);
    await f.bind();
    const target = await f.configure('independent', { monthly_cents: '500' });
    await f.as(f.other);
    await assert.rejects(f.rpc('app_change_request', [randomUUID(), target]), /Reduza/);
    await f.db.exec('reset role');
    await f.db.query('update commerce_memberships set active=false where seller_id=$1', [seller]);
    await f.as(f.other);
    const id = randomUUID();
    await f.rpc('app_change_request', [id, target]);
    await f.as(f.user);
    const c = (await f.rpc('app_commercial_admin_context')).changes[0];
    await assert.rejects(
      f.rpc('app_change_offer', [
        randomUUID(),
        id,
        c.version,
        'offer',
        new Date(Date.now() + 50000).toISOString(),
        'Não antecipar período já pago',
      ]),
      /preservar/,
    );
  } finally {
    await f.db.close();
  }
});

test('permissões, políticas bloqueadas, motivo, conflito e concessão manual anterior', async () => {
  const f = await commercialFixture();
  try {
    const p = await f.plan('company10');
    await f.as(f.other);
    await assert.rejects(f.rpc('app_commercial_admin_context'), /exclusivo/);
    await assert.rejects(
      f.rpc('app_commercial_plan_save', [randomUUID(), p, {}, 'Alteração indevida']),
      /exclusivo/,
    );
    await assert.rejects(
      f.rpc('app_change_apply', [f.user, randomUUID(), randomUUID(), 1, {}, 'Aplicação indevida']),
      /permission denied/,
    );
    await assert.rejects(f.db.exec('select * from app_plan_versions'), /permission denied/);
    await f.as(f.user);
    await assert.rejects(f.rpc('app_commercial_plan_save', [randomUUID(), p, {}, '']), /Motivo/);
    await f.configure('company10', { trial_days: '7', change_policy: 'blocked' });
    await assert.rejects(
      f.rpc('app_commercial_plan_save', [randomUUID(), p, {}, 'Edição desatualizada']),
      /mudou/,
    );
    await f.bind();
    const target = await f.configure('company20');
    await f.as(f.other);
    await assert.rejects(
      f.rpc('app_change_request', [randomUUID(), target]),
      /atendimento específico/,
    );
    const manualUser = f.ids[10];
    await f.as(f.user);
    await f.rpc('app_admin_command', [
      randomUUID(),
      'trial',
      {
        user_id: manualUser,
        version: 0,
        plan_code: 'company10',
        until: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Teste manual anterior',
      },
    ]);
    const current = await f.plan('company10');
    await f.as(manualUser);
    await assert.rejects(
      f.rpc('app_trial_start', [randomUUID(), current, true]),
      /teste concedido/,
    );
  } finally {
    await f.db.close();
  }
});
