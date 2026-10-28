// Não recebe valores financeiros nem referências de cliente do navegador.
export function normalizePayer(value) {
  const name = String(value?.name || '').trim();
  const email = String(value?.email || '')
    .trim()
    .toLowerCase();
  const cpfCnpj = String(value?.document || '')
    .replace(/[.\-/\s]/g, '')
    .toUpperCase();
  if (
    name.length < 2 ||
    name.length > 120 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^(?:\d{11}|[A-Z0-9]{12}\d{2})$/.test(cpfCnpj)
  )
    throw Error('payer');
  return { name, email, cpfCnpj };
}
export async function documentHash(document) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(document)),
  );
  return [...bytes].map((x) => x.toString(16).padStart(2, '0')).join('');
}
const uuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const reference = (kind, env, id) => `meuagro:${kind}:${env}:${id}`;
const publicCheckout = (q) => {
  const {
    document_hash,
    lease_id,
    lease_until,
    customer_attempted,
    subscription_attempted,
    ...safe
  } = q;
  return safe;
};

export async function checkoutAction({
  body,
  request,
  env,
  userClient,
  admin,
  api,
  reply,
  environment,
  safeUrl,
  cents,
  now,
}) {
  const client = userClient(request.headers.get('authorization') || '');
  const auth = await client.auth.getUser();
  if (auth.error || !auth.data?.user) return reply({ error: 'Entre na sua conta.' }, 401);
  const actor = auth.data.user.id;
  const run = async (name, args) => {
    const result = await admin.rpc(name, args);
    if (result.error) throw Object.assign(Error('database'), { database: true });
    return result.data;
  };
  const enabled = env('CHECKOUT_ENABLED') === 'true';
  if (body.action === 'checkout-config') return reply({ enabled, environment });
  if (body.action === 'checkout-quote') {
    if (!enabled) return reply({ error: 'Contratação ainda não liberada.' }, 503);
    if (
      !uuid(body.operation) ||
      typeof body.plan !== 'string' ||
      !['PIX', 'BOLETO'].includes(body.method)
    )
      return reply({ error: 'Selecione plano e forma de pagamento.' }, 400);
    const result = await admin.rpc('app_checkout_quote', {
      p_user: actor,
      p_environment: environment,
      p_plan: body.plan,
      p_method: body.method,
      p_operation: body.operation,
    });
    if (result.error)
      return reply(
        {
          error:
            'Não foi possível reservar a oferta. Atualize a tela e confira plano publicado, equipe e contratação já existente.',
        },
        409,
      );
    return reply(result.data);
  }
  const isAdmin = body.action === 'checkout-admin-refresh';
  if (!['checkout-start', 'checkout-refresh', 'checkout-admin-refresh'].includes(body.action))
    return reply({ error: 'Operação de contratação inválida.' }, 400);
  let user = actor;
  if (isAdmin) {
    const allowed = await client.rpc('app_is_platform_admin');
    if (allowed.error || allowed.data !== true)
      return reply({ error: 'Acesso exclusivo da administração.' }, 403);
    if (!uuid(body.user_id)) return reply({ error: 'Titular inválido.' }, 400);
    user = body.user_id;
  }
  if (!uuid(body.id)) return reply({ error: 'Contratação inválida.' }, 400);
  const start = body.action === 'checkout-start';
  let payer = null,
    hash = null;
  if (start) {
    if (!enabled || body.accepted !== true)
      return reply({ error: 'Confirme as condições antes de contratar.' }, 400);
    try {
      payer = normalizePayer(body.payer);
      hash = await documentHash(payer.cpfCnpj);
    } catch {
      return reply(
        { error: 'Informe nome, e-mail e CPF/CNPJ válidos do responsável pelo pagamento.' },
        400,
      );
    }
  }
  const lease = crypto.randomUUID();
  let q;
  const claim = await admin.rpc('app_checkout_claim', {
    p_user: user,
    p_id: body.id,
    p_environment: environment,
    p_accept: start,
    p_document_hash: hash,
    p_lease: lease,
  });
  if (claim.error)
    return reply(
      {
        error:
          'Atualize a contratação. Confira aceite, documento, ambiente e validade da oferta; aguarde se outra operação estiver em andamento.',
      },
      409,
    );
  q = claim.data;
  const step = async (action, data = {}) => {
    q = await run('app_checkout_step', {
      p_id: q.id,
      p_lease: lease,
      p_action: action,
      p_data: data,
    });
    return q;
  };
  let post = null;
  const find = async (path, expectedReference) => {
    const list = await api(path);
    if (!Array.isArray(list.data) || list.hasMore || list.data.length > 1) throw Error('ambiguous');
    if (list.data.length && list.data[0].externalReference !== expectedReference)
      throw Error('reference');
    return list.data[0] || null;
  };
  const checkCustomer = async (customer) => {
    const doc = String(customer.cpfCnpj || '')
      .replace(/[.\-/\s]/g, '')
      .toUpperCase();
    if (
      !/^cus_[A-Za-z0-9]{1,116}$/.test(customer.id || '') ||
      customer.deleted ||
      (await documentHash(doc)) !== q.document_hash
    )
      throw Error('customer');
    return customer;
  };
  try {
    let customer;
    const mapped = await run('app_checkout_customer', { p_user: user, p_environment: environment });
    if (mapped && mapped.document_hash !== q.document_hash) throw Error('customer');
    if (q.provider_customer || mapped?.provider_customer) {
      customer = await checkCustomer(
        await api('/customers/' + (q.provider_customer || mapped.provider_customer)),
      );
    } else {
      const ref = reference('customer', environment, user);
      customer = await find(
        '/customers?externalReference=' + encodeURIComponent(ref) + '&limit=2',
        ref,
      );
      if (!customer) {
        if (q.customer_attempted || !payer || !enabled) {
          await step('review', { problem: 'customer_unknown' });
          return reply({ checkout: publicCheckout(q), needs_review: true });
        }
        await step('customer_intent');
        post = 'customer';
        customer = await api('/customers', 'POST', {
          ...payer,
          externalReference: ref,
          notificationDisabled: true,
        });
        post = null;
      }
      await checkCustomer(customer);
    }
    await step('customer', { id: customer.id, document_hash: q.document_hash });
    const subRef = reference('subscription', environment, q.id);
    let subscription;
    if (q.provider_subscription)
      subscription = await api('/subscriptions/' + q.provider_subscription);
    else {
      subscription = await find(
        '/subscriptions?externalReference=' +
          encodeURIComponent(subRef) +
          '&limit=2&includeDeleted=true',
        subRef,
      );
      if (!subscription) {
        if (q.subscription_attempted || !enabled) {
          await step('review', { problem: 'subscription_unknown' });
          return reply({ checkout: publicCheckout(q), needs_review: true });
        }
        await step('subscription_intent');
        post = 'subscription';
        subscription = await api('/subscriptions', 'POST', {
          customer: customer.id,
          billingType: q.billing_type,
          cycle: 'MONTHLY',
          value: q.amount_cents / 100,
          nextDueDate: q.due_date,
          description: 'MeuAgro — ' + q.plan_snapshot.name,
          externalReference: subRef,
        });
        post = null;
      }
    }
    if (
      !/^sub_[A-Za-z0-9]{1,116}$/.test(subscription.id || '') ||
      subscription.customer !== customer.id ||
      subscription.externalReference !== subRef ||
      subscription.cycle !== 'MONTHLY' ||
      cents(subscription.value) !== q.amount_cents ||
      subscription.billingType !== q.billing_type ||
      subscription.deleted ||
      subscription.status !== 'ACTIVE'
    )
      throw Error('subscription');
    await step('subscription', { id: subscription.id });
    // Salvar vínculo antes de consultar os pagamentos permite reconciliar webhook antecipado.
    await step('finish');
    const list = await api('/subscriptions/' + subscription.id + '/payments?limit=12');
    if (!Array.isArray(list.data)) throw Error('payments');
    const payments = list.data
      .slice(0, 12)
      .filter((p) => !p.deleted)
      .sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)));
    let invoice = null;
    for (const p of payments) {
      if (
        !/^pay_[A-Za-z0-9]{1,116}$/.test(p.id || '') ||
        p.subscription !== subscription.id ||
        p.customer !== customer.id
      )
        throw Error('payment');
      invoice ||= safeUrl(p.invoiceUrl);
      await run('app_billing_apply', {
        p_event: 'checkout:' + q.id + ':' + p.id,
        p_payment: {
          id: p.id,
          subscription: subscription.id,
          customer: customer.id,
          status: p.status,
          amount_cents: cents(p.value),
          dueDate: p.dueDate,
          invoiceUrl: safeUrl(p.invoiceUrl),
          checked_at: now().toISOString(),
          environment,
        },
      });
    }
    await step('finish', { invoice_url: invoice });
    return reply({ checkout: publicCheckout(q) });
  } catch (e) {
    try {
      if (post && e.providerStatus === 400) await step('rejected');
      else
        await step('review', {
          problem:
            post === 'customer'
              ? 'customer_unknown'
              : post === 'subscription'
                ? 'subscription_unknown'
                : e.database
                  ? 'binding_conflict'
                  : 'provider_mismatch',
        });
    } catch {
      /* Preservar intenções duráveis para conciliação posterior. */
    }
    return reply(
      {
        error:
          'A operação não foi concluída. Use Atualizar contratação para consultar o resultado; não crie outra assinatura. Se persistir, procure o atendimento.',
        checkout: publicCheckout(q),
      },
      502,
    );
  } finally {
    try {
      await step('release');
    } catch {
      /* A reserva expira; nunca repetir POST por isso. */
    }
  }
}
