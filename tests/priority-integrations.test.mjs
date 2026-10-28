import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWeatherHandler,
  normalizeForecast,
} from '../supabase/functions/weather-forecast/handler.js';
import {
  createBillingHandler,
  paymentCents,
  tokenMatches,
  safeBillingUrl,
} from '../supabase/functions/billing-asaas/handler.js';
const weather = {
  timezone: 'America/Sao_Paulo',
  daily: {
    time: Array.from({ length: 7 }, (_, i) => '2026-10-' + (21 + i)),
    temperature_2m_min: [10, 11, 12, 13, 14, 15, null],
    temperature_2m_max: [20, 21, 22, 23, 24, 25, null],
    precipitation_sum: [0, 1, 2, 3, 4, 5, null],
    wind_speed_10m_max: [10, 11, 12, 13, 14, 15, null],
  },
};
test('clima: autenticação, cache, dados válidos e segredo somente no servidor', async () => {
  const calls = [];
  const vars = {
    APP_ALLOWED_ORIGINS: 'https://app.example',
    WEATHER_ENABLED: 'true',
    OPEN_METEO_API_KEY: 'server-test-key',
  };
  let cached = false,
    authorized = true,
    fail = false;
  const handler = createWeatherHandler({
    env: (k) => vars[k],
    userClient: () => ({
      auth: {
        getUser: async () => ({
          data: { user: authorized ? { id: 'user' } : null },
          error: authorized ? null : Error(),
        }),
      },
      rpc: async (name, args) => {
        calls.push([name, args]);
        return {
          data: cached
            ? { cached: true, data: normalizeForecast(weather) }
            : { cached: false, id: 'job', latitude: -23, longitude: -46 },
        };
      },
    }),
    adminClient: () => ({
      rpc: async (name, args) => {
        calls.push([name, args]);
        return {};
      },
    }),
    fetcher: async (url) => {
      assert.equal(url.hostname, 'customer-api.open-meteo.com');
      assert.equal(url.searchParams.get('apikey'), 'server-test-key');
      if (fail) throw Error('private provider body');
      return new Response(JSON.stringify(weather));
    },
  });
  const request = () =>
    new Request('https://edge.example', {
      method: 'POST',
      headers: { origin: 'https://app.example', 'content-type': 'application/json' },
      body: JSON.stringify({ property_id: '11111111-1111-4111-8111-111111111111' }),
    });
  let response = await handler(request());
  assert.equal(response.status, 200);
  assert.ok(!JSON.stringify(await response.json()).includes('server-test-key'));
  assert.equal(calls.at(-1)[0], 'weather_complete');
  cached = true;
  const count = calls.length;
  assert.equal((await handler(request())).status, 200);
  assert.equal(calls.length, count + 1);
  authorized = false;
  assert.equal((await handler(request())).status, 401);
  authorized = true;
  cached = false;
  fail = true;
  response = await handler(request());
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /private provider body/);
  assert.equal(calls.at(-1)[1].p_data, null);
  assert.throws(() => normalizeForecast({ ...weather, daily: { ...weather.daily, time: [] } }));
});
test('cobrança: autentica webhook e consulta estado canônico antes de liberar plano', async () => {
  const vars = {
      APP_ALLOWED_ORIGINS: 'https://app.example',
      BILLING_ENABLED: 'true',
      ASAAS_API_KEY: 'server-secret',
      ASAAS_WEBHOOK_TOKEN: 'webhook-secret',
      ASAAS_ENV: 'sandbox',
    },
    calls = [];
  const handler = createBillingHandler({
    env: (k) => vars[k],
    userClient: () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) },
      rpc: async () => ({
        data: { subscription: 'sub_test', customer: 'cus_test', environment: 'sandbox' },
      }),
    }),
    adminClient: () => ({
      rpc: async (name, args) => {
        calls.push([name, args]);
        return {};
      },
    }),
    fetcher: async (url, options) => {
      assert.ok(url.startsWith('https://api-sandbox.asaas.com/v3/'));
      assert.equal(options.headers.access_token, 'server-secret');
      if (url.includes('/payments/'))
        return new Response(
          JSON.stringify({
            id: 'pay_test',
            subscription: 'sub_test',
            customer: 'cus_test',
            status: 'CONFIRMED',
            value: 100.01,
            dueDate: '2026-10-21',
            invoiceUrl: 'https://evil.example/',
          }),
        );
      return new Response(
        JSON.stringify({ id: 'sub_test', customer: 'cus_test', cycle: 'MONTHLY', deleted: false }),
      );
    },
  });
  const request = (
    token = 'webhook-secret',
    body = {
      id: 'evt_test',
      event: 'PAYMENT_OVERDUE',
      payment: { id: 'pay_test', status: 'OVERDUE' },
    },
  ) =>
    new Request('https://edge.example', {
      method: 'POST',
      headers: { 'asaas-access-token': token, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  assert.equal((await handler(request('wrong'))).status, 401);
  assert.equal(calls.length, 0);
  assert.equal((await handler(request())).status, 200);
  assert.equal(calls[0][1].p_payment.status, 'CONFIRMED');
  assert.equal(calls[0][1].p_payment.amount_cents, 10001);
  assert.equal(calls[0][1].p_payment.invoiceUrl, null);
  assert.equal((await handler(request('', { action: 'cancel' }))).status, 400);
  assert.equal(calls.at(-1)[0], 'app_billing_apply');
  assert.equal(await tokenMatches('same', 'same'), true);
  assert.equal(await tokenMatches('a', 'b'), false);
  assert.equal(paymentCents(0.01), 1);
  assert.throws(() => paymentCents(1.001));
  assert.equal(safeBillingUrl('https://www.asaas.com/i/test'), 'https://www.asaas.com/i/test');
  assert.equal(safeBillingUrl('javascript:alert(1)'), null);
});
