import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createBillingHandler } from '../supabase/functions/billing-asaas/handler.js';

test('admin Edge: autentica antes do provedor, revalida prévia e usa referências canônicas', async () => {
  let allowed = false,
    authenticated = true,
    value = 10,
    cycle = 'MONTHLY',
    calls = 0;
  const mutations = [];
  const environment = {
    ASAAS_ENV: 'sandbox',
    BILLING_ENABLED: 'true',
    ASAAS_API_KEY: 'private',
    ASAAS_WEBHOOK_TOKEN: 'token',
  };
  const handler = createBillingHandler({
    env: (k) => environment[k],
    userClient: () => ({
      auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'actor' } : null } }) },
      rpc: async () => ({ data: allowed }),
    }),
    adminClient: () => ({
      rpc: async (name, args) => {
        mutations.push([name, args]);
        return { data: { ok: true } };
      },
    }),
    fetcher: async (url) => {
      calls++;
      assert.equal(url, 'https://api-sandbox.asaas.com/v3/subscriptions/sub_verified');
      return new Response(
        JSON.stringify({
          id: 'sub_verified',
          customer: 'cus_canonical',
          status: 'ACTIVE',
          cycle,
          value,
        }),
      );
    },
  });
  const request = (body) =>
    new Request('https://edge.example', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  const body = { action: 'admin-preview', subscription: 'sub_verified' };
  assert.equal((await handler(request(body))).status, 403);
  assert.equal(calls, 0);
  authenticated = false;
  assert.equal((await handler(request(body))).status, 401);
  assert.equal(calls, 0);
  authenticated = true;
  allowed = true;
  const confirmed = await (await handler(request(body))).json();
  assert.equal(confirmed.customer, 'cus_canonical');
  assert.equal(confirmed.expected_cents, 1000);
  assert.equal(mutations.length, 0);
  const link = {
    ...body,
    action: 'admin-link',
    confirmed,
    operation: randomUUID(),
    user_id: randomUUID(),
    plan_code: 'company10',
    version: 0,
    reason: 'Assinatura verificada',
    customer: 'cus_forged',
    expected_cents: 1,
  };
  assert.equal((await handler(request(link))).status, 200);
  assert.equal(mutations[0][0], 'app_admin_link');
  assert.equal(mutations[0][1].p_actor, 'actor');
  assert.equal(mutations[0][1].p_data.customer, 'cus_canonical');
  assert.equal(mutations[0][1].p_data.expected_cents, 1000);
  value = 20;
  assert.equal((await handler(request(link))).status, 409);
  cycle = 'YEARLY';
  assert.equal((await handler(request(body))).status, 400);
  assert.equal(mutations.length, 1);
});

test('webhook: retorna diagnóstico persistido sem fingir conciliação; falhas sem segredos', async () => {
  let fail = false;
  const logged = [];
  const handler = createBillingHandler({
    env: (k) =>
      ({
        ASAAS_ENV: 'sandbox',
        BILLING_ENABLED: 'true',
        ASAAS_API_KEY: 'private',
        ASAAS_WEBHOOK_TOKEN: 'token',
      })[k],
    userClient: () => {
      throw Error('not a user action');
    },
    adminClient: () => ({
      rpc: async (name, args) => {
        logged.push([name, args]);
        return { data: { ok: false, outcome: 'unlinked' } };
      },
    }),
    fetcher: async (url) => {
      if (fail) throw Error('secret key and provider body');
      return new Response(
        JSON.stringify(
          url.includes('/payments/')
            ? {
                id: 'pay_test',
                subscription: 'sub_test',
                customer: 'cus_test',
                value: 10,
                status: 'RECEIVED',
                dueDate: '2026-10-23',
              }
            : { id: 'sub_test', customer: 'cus_test', cycle: 'MONTHLY' },
        ),
      );
    },
  });
  const req = () =>
    new Request('https://edge.example', {
      method: 'POST',
      headers: { 'asaas-access-token': 'token' },
      body: JSON.stringify({
        id: 'evt_test',
        event: 'PAYMENT_RECEIVED',
        payment: { id: 'pay_test' },
      }),
    });
  const result = await handler(req());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: false, outcome: 'unlinked' });
  assert.equal(logged[0][1].p_payment.environment, 'sandbox');
  fail = true;
  const failed = await handler(req());
  assert.equal(failed.status, 502);
  assert.equal((await failed.text()).includes('secret'), false);
  assert.equal(logged.at(-1)[1].p_outcome, 'provider_failed');
});
