// Only canonical provider reads can change a financial observation.
export async function subscriptionRead(api, id, customer) {
  try {
    const s = await api('/subscriptions/' + id);
    if (s.id !== id || (customer && s.customer !== customer)) throw Error('binding');
    return s;
  } catch (e) {
    if (e.providerStatus !== 404 || !/^cus_[A-Za-z0-9]+$/.test(customer || '')) throw e;
    // A 404 alone does not prove cancellation. Match the deleted record explicitly.
    const page = await api('/subscriptions?customer=' + customer + '&deletedOnly=true&limit=100');
    const s = page.data?.find(
      (item) => item.id === id && item.customer === customer && item.deleted,
    );
    if (!s) throw Error('unverified deletion');
    return s;
  }
}
export function canonicalPayment(payment, environment, checked, cents, safeUrl) {
  if (!/^pay_[A-Za-z0-9]+$/.test(payment.id || '')) throw Error('payment');
  const partial = payment.status === 'PARTIALLY_REFUNDED';
  return {
    id: payment.id,
    subscription: payment.subscription,
    customer: payment.customer,
    status: payment.deleted ? 'DELETED' : partial ? 'RECEIVED' : payment.status,
    amount_cents: cents(payment.value),
    dueDate: payment.dueDate,
    invoiceUrl: safeUrl(payment.invoiceUrl),
    checked_at: checked,
    environment,
    refund_review: partial || (Array.isArray(payment.refunds) && payment.refunds.length > 0),
  };
}
export async function observeSubscription(admin, s, environment, checked) {
  if (
    s.cycle !== 'MONTHLY' ||
    !/^sub_[A-Za-z0-9]+$/.test(s.id || '') ||
    !/^cus_[A-Za-z0-9]+$/.test(s.customer || '')
  )
    throw Error('subscription');
  const result = await admin.rpc('app_lifecycle_observe', {
    p_subscription: s.id,
    p_customer: s.customer,
    p_environment: environment,
    p_status: s.deleted ? 'DELETED' : s.status,
    p_checked: checked,
  });
  if (result.error) throw Error('database');
  return result.data;
}
export async function lifecycleAction({
  body,
  request,
  userClient,
  admin,
  api,
  environment,
  reply,
  now,
  cents,
  safeUrl,
}) {
  const client = userClient(request.headers.get('authorization') || '');
  const { data: auth, error } = await client.auth.getUser();
  if (error || !auth.user) return reply({ error: 'Entre na sua conta.' }, 401);
  const cancelling = body.action === 'cancel';
  if (cancelling && body.confirmed !== true)
    return reply({ error: 'Confirme os efeitos do cancelamento.' }, 400);
  const begun = await client.rpc('app_lifecycle_begin', { p_cancel: cancelling });
  if (begun.error)
    return reply({ error: begun.error.message || 'Aguarde um minuto e atualize.' }, 409);
  const ref = begun.data;
  if (ref.environment !== environment)
    return reply({ error: 'O ambiente da assinatura difere do servidor.' }, 409);
  let checked = now().toISOString();
  let s = await subscriptionRead(api, ref.subscription, ref.customer);
  if (s.cycle !== 'MONTHLY') throw Error('cycle');
  if (cancelling && !s.deleted) {
    // Never mark cancellation locally until a canonical read proves deletion.
    await api('/subscriptions/' + ref.subscription, 'DELETE');
    checked = now().toISOString();
    s = await subscriptionRead(api, ref.subscription, ref.customer);
    if (!s.deleted) throw Error('not deleted');
  }
  const page = await api('/subscriptions/' + ref.subscription + '/payments?limit=100');
  if (!Array.isArray(page.data) || page.hasMore || page.data.length > 100)
    return reply(
      {
        error:
          'Histórico acima de 100 cobranças. Use os webhooks e a conciliação assistida; atualização completa não confirmada.',
      },
      409,
    );
  // Validate all identities before writing any receipt.
  if (page.data.some((p) => p.customer !== ref.customer || p.subscription !== ref.subscription))
    throw Error('binding');
  const payments = page.data.map((p) => canonicalPayment(p, environment, checked, cents, safeUrl));
  for (const p of payments) {
    const result = await admin.rpc('app_billing_apply', {
      p_event: 'sync_' + ref.token + '_' + p.id,
      p_payment: p,
    });
    if (result.error || result.data?.outcome !== 'processed') throw Error('payment database');
  }
  await observeSubscription(admin, s, environment, checked);
  const done = await admin.rpc('app_lifecycle_finish', {
    p_user: auth.user.id,
    p_token: ref.token,
    p_subscription: ref.subscription,
  });
  if (done.error) throw Error('database');
  return reply({ ok: true, payments: payments.length, cancelled: !!s.deleted });
}
