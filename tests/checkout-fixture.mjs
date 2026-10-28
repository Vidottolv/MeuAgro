import { prioritiesFixture } from './priorities-fixture.mjs';
import { readFileSync } from 'node:fs';
import { createBillingHandler } from '../supabase/functions/billing-asaas/handler.js';
export async function checkoutFixture() {
  const f = await prioritiesFixture();
  await f.db.exec('reset role');
  for (const name of ['stage_49_platform_admin.sql', 'stage_50_self_service_checkout.sql']) {
    const sql = readFileSync(new URL('../supabase/' + name, import.meta.url), 'utf8');
    await f.db.exec(sql);
    await f.db.exec(sql);
  }
  await f.db.query('insert into app_platform_admins(user_id) values($1)', [f.user]);
  await f.db.exec(
    "update app_plans set monthly_cents=1000,published=true where code='company10';update app_checkout_settings set enabled=true;",
  );
  let actor = f.other;
  const variables = {
    BILLING_ENABLED: 'true',
    CHECKOUT_ENABLED: 'true',
    ASAAS_ENV: 'sandbox',
    ASAAS_API_KEY: 'private-server-only',
    ASAAS_WEBHOOK_TOKEN: 'webhook-test',
  };
  let queue = Promise.resolve();
  async function rpc(name, args, role, uid) {
    const run = queue.then(async () => {
      await f.as(uid, role);
      const keys = Object.keys(args || {});
      try {
        return {
          data: (
            await f.db.query(
              'select public.' +
                name +
                '(' +
                keys.map((k, i) => k + '=> $' + (i + 1)).join(',') +
                ') r',
              keys.map((k) =>
                args[k] !== null && typeof args[k] === 'object' ? JSON.stringify(args[k]) : args[k],
              ),
            )
          ).rows[0].r,
        };
      } catch (e) {
        return { error: { message: e.message, code: e.code } };
      }
    });
    queue = run.catch(() => {});
    return run;
  }
  const provider = {
    customers: [],
    subscriptions: [],
    payments: [],
    posts: [],
    failCustomer: null,
    failSubscription: null,
    failGet: false,
    deletes: 0,
    loseDelete: false,
    hideDeleted: false,
    hasMore: false,
  };
  const fetcher = async (url, options) => {
    const parsed = new URL(url),
      path = parsed.pathname.replace('/v3', '');
    if (options.headers.access_token !== variables.ASAAS_API_KEY) throw Error('key');
    if (options.method === 'POST') {
      const body = JSON.parse(options.body);
      provider.posts.push([path, body]);
      if (path === '/customers') {
        if (provider.failCustomer === 'reject') return new Response('{}', { status: 400 });
        const customer = { ...body, id: 'cus_' + (provider.customers.length + 1), deleted: false };
        if (provider.failCustomer !== 'lost_empty') provider.customers.push(customer);
        if (provider.failCustomer?.startsWith('lost')) throw Error('timeout includes secret body');
        return new Response(JSON.stringify(customer));
      }
      if (path === '/subscriptions') {
        if (provider.failSubscription === 'reject') return new Response('{}', { status: 400 });
        const sub = {
          ...body,
          id: 'sub_' + (provider.subscriptions.length + 1),
          deleted: false,
          status: 'ACTIVE',
        };
        if (provider.failSubscription !== 'lost_empty') {
          provider.subscriptions.push(sub);
          provider.payments.push({
            id: 'pay_' + provider.payments.length,
            customer: body.customer,
            subscription: sub.id,
            dueDate: body.nextDueDate,
            value: body.value,
            status: 'PENDING',
            invoiceUrl: 'https://sandbox.asaas.com/i/test',
          });
        }
        if (provider.failSubscription?.startsWith('lost')) throw Error('timeout secret');
        return new Response(JSON.stringify(sub));
      }
      throw Error('unexpected POST');
    }
    if (options.method === 'DELETE') {
      const sub = provider.subscriptions.find((s) => s.id === path.split('/').at(-1));
      if (!sub) return new Response('{}', { status: 404 });
      provider.deletes++;
      sub.deleted = true;
      for (const p of provider.payments)
        if (p.subscription === sub.id && ['PENDING', 'OVERDUE'].includes(p.status))
          p.deleted = true;
      if (provider.loseDelete) throw Error('lost delete response');
      return new Response(null, { status: 204 });
    }
    if (provider.failGet) throw Error('private provider error');
    let data;
    if (path === '/customers')
      data = {
        data: provider.customers.filter(
          (c) => c.externalReference === parsed.searchParams.get('externalReference'),
        ),
        hasMore: false,
      };
    else if (path.startsWith('/customers/'))
      data = provider.customers.find((c) => c.id === path.split('/').at(-1));
    else if (path === '/subscriptions')
      data = {
        data: provider.subscriptions.filter((s) =>
          parsed.searchParams.has('customer')
            ? s.customer === parsed.searchParams.get('customer') && s.deleted
            : s.externalReference === parsed.searchParams.get('externalReference'),
        ),
        hasMore: false,
      };
    else if (path.endsWith('/payments'))
      data = {
        data: provider.payments.filter((p) => p.subscription === path.split('/')[2]),
        hasMore: provider.hasMore,
      };
    else if (path.startsWith('/subscriptions/'))
      data = provider.subscriptions.find(
        (s) => s.id === path.split('/').at(-1) && !(s.deleted && provider.hideDeleted),
      );
    else if (path.startsWith('/payments/'))
      data = provider.payments.find((p) => p.id === path.split('/').at(-1));
    if (!data) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify(data));
  };
  const handler = createBillingHandler({
    env: (k) => variables[k],
    userClient: () => ({
      auth: { getUser: async () => ({ data: { user: actor ? { id: actor } : null } }) },
      rpc: (name, args) => rpc(name, args, 'authenticated', actor),
    }),
    adminClient: () => ({ rpc: (name, args) => rpc(name, args, 'service_role', '') }),
    fetcher,
  });
  const request = async (body) => {
    const response = await handler(
      new Request('https://edge.example', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'asaas-access-token': 'webhook-test' },
        body: JSON.stringify(body),
      }),
    );
    return { status: response.status, body: await response.json() };
  };
  const cool = async () => {
    await queue;
    await f.db.exec('reset role');
    await f.db.exec("update app_checkouts set checked_at=now()-interval '16 seconds';");
  };
  return {
    ...f,
    variables,
    provider,
    request,
    cool,
    asActor: (id) => {
      actor = id;
    },
    drain: () => queue,
    userRpc: (name, args, user = f.user) => rpc(name, args, 'authenticated', user),
  };
}
