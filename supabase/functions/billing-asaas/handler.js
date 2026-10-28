import {
  lifecycleAction,
  subscriptionRead,
  canonicalPayment,
  observeSubscription,
} from './lifecycle.js';
import { checkoutAction } from './checkout.js';
import { commercialAction } from './commercial.js';
export function safeBillingUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      ['www.asaas.com', 'asaas.com', 'sandbox.asaas.com'].includes(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export async function tokenMatches(a, b) {
  if (!a || !b) return false;
  const hash = async (s) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const x = await hash(a),
    y = await hash(b);
  let difference = 0;
  for (let i = 0; i < x.length; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}
export function paymentCents(value) {
  const text = String(value);
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(text)) throw Error('amount');
  const [whole, fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export function createBillingHandler({
  env,
  userClient,
  adminClient,
  fetcher = fetch,
  now = () => new Date(),
}) {
  return async (request) => {
    const origin = request.headers.get('origin') || '',
      allowed = (env('APP_ALLOWED_ORIGINS') || '').split(',').map((s) => s.trim());
    const headers = {
      'content-type': 'application/json',
      'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
      'access-control-allow-methods': 'POST, OPTIONS',
      ...(allowed.includes(origin) ? { 'access-control-allow-origin': origin } : {}),
    };
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
    if (origin && !allowed.includes(origin)) return reply({ error: 'Origem não autorizada.' }, 403);
    if (request.method === 'OPTIONS') return reply({});
    if (request.method !== 'POST') return reply({ error: 'Método inválido.' }, 405);
    let diagnostic = null;
    let stage = 'provider_failed';
    try {
      if (env('BILLING_ENABLED') !== 'true' || !env('ASAAS_API_KEY'))
        return reply({ error: 'Cobrança ainda não ativada pelo administrador.' }, 503);
      const text = await request.text();
      if (text.length > 200000) return reply({ error: 'Evento inválido.' }, 400);
      const body = JSON.parse(text);
      const environment = env('ASAAS_ENV');
      if (!['sandbox', 'production'].includes(environment))
        return reply({ error: 'Ambiente de cobrança inválido.' }, 503);
      const host =
        env('ASAAS_ENV') === 'production'
          ? 'https://api.asaas.com/v3'
          : 'https://api-sandbox.asaas.com/v3';
      const api = async (path, method = 'GET', body = undefined) => {
        const response = await fetcher(host + path, {
          method,
          headers: {
            access_token: env('ASAAS_API_KEY'),
            'content-type': 'application/json',
            'user-agent': 'MeuAgro/1.0',
          },
          signal: AbortSignal.timeout(15000),
          redirect: 'error',
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        if (!response.ok)
          throw Object.assign(Error('provider'), { providerStatus: response.status });
        const raw = await response.text();
        if (raw.length > 100000) throw Error('size');
        return raw.trim() ? JSON.parse(raw) : {};
      };
      const admin = adminClient();
      if (typeof body.action === 'string' && body.action.startsWith('commercial-')) {
        return await commercialAction({
          body,
          request,
          userClient,
          admin,
          api,
          environment,
          reply,
          cents: paymentCents,
          now,
        });
      }
      if (typeof body.action === 'string' && body.action.startsWith('checkout-')) {
        return await checkoutAction({
          body,
          request,
          env,
          userClient,
          admin,
          api,
          reply,
          environment,
          safeUrl: safeBillingUrl,
          cents: paymentCents,
          now,
        });
      }
      if (body.action === 'admin-preview' || body.action === 'admin-link') {
        const client = userClient(request.headers.get('authorization') || '');
        const { data: auth, error } = await client.auth.getUser();
        if (error || !auth.user) return reply({ error: 'Entre na sua conta.' }, 401);
        const access = await client.rpc('app_is_platform_admin');
        if (access.error || access.data !== true)
          return reply({ error: 'Acesso exclusivo da administração do MeuAgro.' }, 403);
        if (
          typeof body.subscription !== 'string' ||
          !/^sub_[A-Za-z0-9]{1,116}$/.test(body.subscription)
        )
          return reply({ error: 'Informe o ID da assinatura iniciado por sub_.' }, 400);
        const subscription = await api('/subscriptions/' + body.subscription);
        if (
          subscription.id !== body.subscription ||
          subscription.deleted ||
          subscription.cycle !== 'MONTHLY' ||
          subscription.status !== 'ACTIVE' ||
          !/^cus_[A-Za-z0-9]+$/.test(subscription.customer || '')
        )
          return reply({ error: 'Use uma assinatura ativa, mensal e com cliente válido.' }, 400);
        const cents = paymentCents(subscription.value);
        if (cents <= 0) return reply({ error: 'Valor da assinatura inválido.' }, 400);
        const canonical = {
          subscription: subscription.id,
          customer: subscription.customer,
          expected_cents: cents,
          environment,
          cycle: subscription.cycle,
        };
        if (body.action === 'admin-preview') return reply(canonical);
        if (
          !/^[0-9a-f-]{36}$/i.test(body.user_id || '') ||
          !/^[0-9a-f-]{36}$/i.test(body.operation || '') ||
          !Number.isInteger(body.version) ||
          body.version < 0 ||
          typeof body.reason !== 'string' ||
          body.reason.trim().length < 5 ||
          body.reason.length > 500
        )
          return reply({ error: 'Confira usuário, versão, operação e motivo.' }, 400);
        // A prévia confirmada precisa coincidir com a nova consulta ao provedor.
        if (
          !body.confirmed ||
          Object.keys(canonical).some((key) => body.confirmed[key] !== canonical[key])
        )
          return reply(
            { error: 'A assinatura mudou. Consulte e confirme a prévia novamente.' },
            409,
          );
        const linked = await admin.rpc('app_admin_link', {
          p_actor: auth.user.id,
          p_operation: body.operation,
          p_data: {
            ...canonical,
            user_id: body.user_id,
            plan_code: body.plan_code,
            version: body.version,
            reason: body.reason.trim(),
          },
        });
        if (linked.error)
          return reply(
            {
              error:
                'Vínculo não salvo. Atualize a conta e confira preço, limite de pessoas, ambiente e assinatura já vinculada.',
            },
            409,
          );
        return reply(linked.data);
      }
      if (body.action === 'cancel' || body.action === 'lifecycle-sync') {
        return await lifecycleAction({
          body,
          request,
          userClient,
          admin,
          api,
          environment,
          reply,
          now,
          cents: paymentCents,
          safeUrl: safeBillingUrl,
        });
      }
      if (
        !(await tokenMatches(request.headers.get('asaas-access-token'), env('ASAAS_WEBHOOK_TOKEN')))
      )
        return reply({ error: 'Evento não autorizado.' }, 401);
      if (
        typeof body.id !== 'string' ||
        body.id.length > 120 ||
        typeof body.event !== 'string' ||
        !(body.event.startsWith('PAYMENT_') || body.event.startsWith('SUBSCRIPTION_'))
      )
        return reply({ ignored: true });
      if (body.event.startsWith('SUBSCRIPTION_')) {
        const id = body.subscription?.id,
          customer = body.subscription?.customer;
        if (!/^sub_[A-Za-z0-9]+$/.test(id || '') || !/^cus_[A-Za-z0-9]+$/.test(customer || ''))
          return reply({ error: 'Evento inválido.' }, 400);
        diagnostic = { environment, event: body.id, payment: null, subscription: id };
        const checked = now().toISOString();
        const s = await subscriptionRead(api, id, customer);
        stage = 'database_failed';
        const result = await observeSubscription(admin, s, environment, checked);
        const logged = await admin.rpc('app_billing_log', {
          p_environment: environment,
          p_event: body.id,
          p_payment: null,
          p_subscription: id,
          p_outcome: result?.ignored ? 'unlinked' : 'processed',
        });
        if (logged.error) throw Error('database');
        return reply(result);
      }
      const id = body.payment?.id;
      if (typeof id !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(id))
        return reply({ error: 'Evento inválido.' }, 400);
      diagnostic = { environment, event: body.id, payment: id, subscription: null };
      const checked = now().toISOString(),
        payment = await api('/payments/' + id);
      if (payment.id !== id) throw Error('identity');
      if (!payment.subscription) {
        await admin.rpc('app_billing_log', {
          p_environment: environment,
          p_event: body.id,
          p_payment: id,
          p_subscription: null,
          p_outcome: 'unsupported',
        });
        return reply({ ignored: true, outcome: 'unsupported' });
      }
      if (!/^sub_[A-Za-z0-9]+$/.test(payment.subscription)) throw Error('subscription');
      diagnostic.subscription = payment.subscription;
      const subscription = await subscriptionRead(api, payment.subscription, payment.customer);
      if (subscription.cycle !== 'MONTHLY' || subscription.customer !== payment.customer) {
        await admin.rpc('app_billing_log', {
          p_environment: environment,
          p_event: body.id,
          p_payment: id,
          p_subscription: payment.subscription,
          p_outcome: 'unsupported',
        });
        return reply({ ignored: true, outcome: 'unsupported' });
      }
      const data = canonicalPayment(payment, environment, checked, paymentCents, safeBillingUrl);
      stage = 'database_failed';
      const result = await admin.rpc('app_billing_apply', { p_event: body.id, p_payment: data });
      if (result.error) throw Error('db');
      return reply(result.data || { ok: true });
    } catch {
      if (diagnostic) {
        try {
          await adminClient().rpc('app_billing_log', {
            p_environment: diagnostic.environment,
            p_event: diagnostic.event,
            p_payment: diagnostic.payment,
            p_subscription: diagnostic.subscription,
            p_outcome: stage,
          });
        } catch {
          /* Não expor segredos ou corpo de erros do provedor. */
        }
      }
      return reply({ error: 'Não foi possível confirmar a operação com o provedor.' }, 502);
    }
  };
}
