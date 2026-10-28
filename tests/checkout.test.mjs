import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { checkoutFixture } from './checkout-fixture.mjs';
import { documentHash, normalizePayer } from '../supabase/functions/billing-asaas/checkout.js';
const payer = { name: 'Pagador de teste', email: 'payer@example.test', document: '123.456.789-09' };
const quote = async (f, extra = {}) =>
  f.request({
    action: 'checkout-quote',
    operation: randomUUID(),
    plan: 'company10',
    method: 'PIX',
    ...extra,
  });
const start = (f, id, extra = {}) =>
  f.request({ action: 'checkout-start', id, accepted: true, payer, ...extra });

test('limite de pessoas continua protegido durante a criação da assinatura', async () => {
  const f = await checkoutFixture();
  try {
    f.asActor(f.user);
    const offer = await quote(f);
    await f.as('', 'service_role');
    const lease = randomUUID();
    await f.rpc('app_checkout_claim', [
      f.user,
      offer.body.id,
      'sandbox',
      true,
      await documentHash('12345678909'),
      lease,
    ]);
    await f.db.exec('reset role');
    const reps = Array.from({ length: 11 }, () => randomUUID());
    for (let i = 0; i < 11; i++)
      await f.db.query('insert into auth.users(id) values($1)', [reps[i]]);
    for (let i = 0; i < 10; i++)
      await f.db.query(
        'insert into commerce_memberships(id,seller_id,user_id,active) values($1,$2,$3,true)',
        [randomUUID(), f.seller, reps[i]],
      );
    await assert.rejects(
      f.db.query(
        'insert into commerce_memberships(id,seller_id,user_id,active) values($1,$2,$3,true)',
        [randomUUID(), f.seller, reps[10]],
      ),
      /limite da contratação/,
    );
    const second = randomUUID();
    await f.db.query('insert into commerce_sellers(id,owner_id) values($1,$2)', [second, f.user]);
    await f.db.query(
      'insert into commerce_memberships(id,seller_id,user_id,active) values($1,$2,$3,true)',
      [randomUUID(), second, reps[0]],
    );
  } finally {
    await f.db.close();
  }
});

test('checkout completo: preço do servidor, aceite, vínculo, pagamento e privacidade', async (t) => {
  const f = await checkoutFixture();
  try {
    f.asActor(null);
    assert.equal((await quote(f)).status, 401);
    f.asActor(f.other);
    f.variables.CHECKOUT_ENABLED = 'false';
    assert.equal((await quote(f)).status, 503);
    f.variables.CHECKOUT_ENABLED = 'true';
    assert.equal((await quote(f, { plan: 'producer' })).status, 409);
    const id = randomUUID();
    const offer = await quote(f, { operation: id, value: 0.01, customer: 'cus_forged' });
    assert.equal(offer.status, 200);
    assert.equal(offer.body.amount_cents, 1000);
    assert.equal(offer.body.status, 'quoted');
    assert.equal((await quote(f, { operation: id })).body.id, id);
    assert.equal((await quote(f)).status, 409);
    assert.equal(f.provider.posts.length, 0);
    assert.equal((await start(f, id, { accepted: false })).status, 400);
    f.asActor(f.user);
    assert.equal((await start(f, id)).status, 409);
    f.asActor(f.other);
    const result = await start(f, id, { amount_cents: 1, customer: 'cus_forged' });
    assert.equal(result.status, 200);
    assert.equal(result.body.checkout.status, 'awaiting_payment');
    assert.equal(result.body.checkout.invoice_url, 'https://sandbox.asaas.com/i/test');
    assert.equal(f.provider.posts.length, 2);
    assert.equal(f.provider.posts[0][1].notificationDisabled, true);
    assert.equal(f.provider.posts[1][1].value, 10);
    assert.equal(f.provider.posts[1][1].cycle, 'MONTHLY');
    assert.equal('document_hash' in result.body.checkout, false);
    assert.equal('lease_id' in result.body.checkout, false);
    await f.as(f.other);
    let context = await f.rpc('app_checkout_context');
    assert.equal(context.valid_until, null);
    assert.equal(context.has_subscription, true);
    assert.equal(JSON.stringify(context).includes('12345678909'), false);
    assert.equal(JSON.stringify(context).includes('payer@example'), false);
    assert.equal((await quote(f)).status, 409);
    await t.test('webhook e reenvio ativam somente a licença correta', async () => {
      f.provider.payments[0].status = 'RECEIVED';
      const evt = {
        id: 'evt_checkout',
        event: 'PAYMENT_RECEIVED',
        payment: { id: f.provider.payments[0].id },
      };
      assert.equal((await f.request(evt)).body.outcome, 'processed');
      await f.request(evt);
      await f.as(f.other);
      context = await f.rpc('app_checkout_context');
      assert.equal(context.checkouts[0].status, 'completed');
      assert.ok(context.valid_until);
      assert.equal((await f.rpc('app_account_context')).invoices.length, 1);
    });
    await f.cool();
    await f.request({ action: 'checkout-refresh', id });
    assert.equal(f.provider.posts.length, 2);
    f.provider.payments[0].status = 'REFUNDED';
    await f.request({
      id: 'evt_refund',
      event: 'PAYMENT_REFUNDED',
      payment: { id: f.provider.payments[0].id },
    });
    await f.as(f.other);
    assert.equal((await f.rpc('app_checkout_context')).valid_until, null);
  } finally {
    await f.db.close();
  }
});

test('oferta: expiração, mudança de preço/termos, publicação e desistência sem cobrança', async () => {
  const f = await checkoutFixture();
  try {
    let offer = await quote(f);
    await f.db.exec('reset role');
    await f.db.exec("update app_plans set monthly_cents=2000 where code='company10'");
    assert.equal((await start(f, offer.body.id)).status, 409);
    assert.equal(f.provider.posts.length, 0);
    await f.as(f.other);
    await f.rpc('app_checkout_discard', [randomUUID(), offer.body.id]);
    offer = await quote(f);
    assert.equal(offer.body.amount_cents, 2000);
    await f.db.exec('reset role');
    await f.db.query("update app_checkouts set expires_at=now()-interval '1 minute' where id=$1", [
      offer.body.id,
    ]);
    assert.equal((await start(f, offer.body.id)).status, 409);
    offer = await quote(f);
    assert.equal(offer.status, 200);
    await f.db.exec('reset role');
    await f.db.exec(
      "update app_checkout_settings set conditions=conditions||' Condição atualizada.',terms_version='2'",
    );
    assert.equal((await start(f, offer.body.id)).status, 409);
    await f.as(f.other);
    await f.rpc('app_checkout_discard', [randomUUID(), offer.body.id]);
    f.variables.ASAAS_ENV = 'production';
    assert.equal((await quote(f)).status, 409);
    assert.equal(f.provider.posts.length, 0);
  } finally {
    await f.db.close();
  }
});

for (const step of ['Customer', 'Subscription']) {
  test(`resposta perdida após criar ${step}: concilia referência e nunca repete POST`, async () => {
    const f = await checkoutFixture();
    try {
      const offer = await quote(f);
      f.provider['fail' + step] = 'lost_saved';
      const first = await start(f, offer.body.id);
      assert.equal(first.status, 502);
      assert.equal(first.body.error.includes('secret'), false);
      await f.cool();
      f.provider['fail' + step] = null;
      const recovered = await f.request({ action: 'checkout-refresh', id: offer.body.id });
      assert.equal(recovered.status, 200);
      assert.equal(recovered.body.checkout.status, 'awaiting_payment');
      assert.equal(f.provider.posts.filter((p) => p[0] === '/customers').length, 1);
      assert.equal(f.provider.posts.filter((p) => p[0] === '/subscriptions').length, 1);
    } finally {
      await f.db.close();
    }
  });
  test(`resposta inconclusiva sem ${step}: mantém revisão, sem nova criação`, async () => {
    const f = await checkoutFixture();
    try {
      const offer = await quote(f);
      f.provider['fail' + step] = 'lost_empty';
      await start(f, offer.body.id);
      await f.cool();
      f.provider['fail' + step] = null;
      const recovered = await f.request({ action: 'checkout-refresh', id: offer.body.id });
      assert.equal(recovered.body.needs_review, true);
      assert.equal(recovered.body.checkout.status, 'review');
      assert.equal(
        f.provider.posts.filter(
          (p) => p[0] === (step === 'Customer' ? '/customers' : '/subscriptions'),
        ).length,
        1,
      );
      await f.as(f.other);
      await assert.rejects(
        f.rpc('app_checkout_discard', [randomUUID(), offer.body.id]),
        /provedor/,
      );
      assert.equal((await quote(f)).status, 409);
    } finally {
      await f.db.close();
    }
  });
}

test('recusa definitiva, dados inválidos e uma operação concorrente não criam duplicatas', async () => {
  const f = await checkoutFixture();
  try {
    const offer = await quote(f);
    assert.equal(
      (await start(f, offer.body.id, { payer: { name: '', email: 'bad', document: '1' } })).status,
      400,
    );
    await f.as('', 'service_role');
    const lease = randomUUID();
    await f.rpc('app_checkout_claim', [
      f.other,
      offer.body.id,
      'sandbox',
      true,
      await documentHash('12345678909'),
      lease,
    ]);
    assert.equal((await start(f, offer.body.id)).status, 409);
    assert.equal(f.provider.posts.length, 0);
    await f.rpc('app_checkout_step', [offer.body.id, lease, 'release', {}]);
    await f.cool();
    f.provider.failCustomer = 'reject';
    assert.equal((await start(f, offer.body.id)).status, 502);
    await f.as(f.other);
    assert.equal((await f.rpc('app_checkout_context')).checkouts[0].status, 'rejected');
    assert.equal((await quote(f)).status, 200);
  } finally {
    await f.db.close();
  }
});

test('permissões, condições auditadas, preço aceito e diagnóstico administrativo', async () => {
  const f = await checkoutFixture();
  try {
    await f.as(f.other);
    await assert.rejects(f.rpc('app_checkout_admin_context'), /exclusivo/);
    await assert.rejects(
      f.rpc('app_checkout_quote', [f.other, 'sandbox', 'company10', 'PIX', randomUUID()]),
      /permission denied/,
    );
    await assert.rejects(
      f.rpc('app_checkout_step', [randomUUID(), randomUUID(), 'finish', {}]),
      /permission denied/,
    );
    await assert.rejects(f.db.exec('select * from app_checkouts'), /permission denied/);
    await f.as(f.user);
    const settings = (await f.rpc('app_checkout_admin_context')).settings;
    const modified = { ...settings, merchant_name: 'MeuAgro Teste', terms_version: 'piloto-2' };
    const operation = randomUUID();
    await f.rpc('app_checkout_settings_save', [
      operation,
      settings,
      modified,
      'Identificação do fornecedor',
    ]);
    await f.rpc('app_checkout_settings_save', [
      operation,
      settings,
      modified,
      'Identificação do fornecedor',
    ]);
    await assert.rejects(
      f.rpc('app_checkout_settings_save', [
        randomUUID(),
        settings,
        modified,
        'Oferta desatualizada',
      ]),
      /mudaram/,
    );
    await assert.rejects(
      f.rpc('app_checkout_settings_save', [
        randomUUID(),
        modified,
        { ...modified, terms_url: 'javascript:bad' },
        'Link malicioso recusado',
      ]),
      /HTTPS/,
    );
    const offer = await quote(f);
    const id = offer.body.id;
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
    await f.db.exec('reset role');
    await f.db.exec(
      "update app_plans set monthly_cents=5000,published=false where code='company10'",
    );
    assert.equal((await start(f, id)).status, 200);
    assert.equal(f.provider.subscriptions[0].value, 10);
    f.asActor(f.other);
    assert.equal(
      (await f.request({ action: 'checkout-admin-refresh', id, user_id: f.other })).status,
      403,
    );
    assert.equal(normalizePayer(payer).cpfCnpj, '12345678909');
  } finally {
    await f.db.close();
  }
});
