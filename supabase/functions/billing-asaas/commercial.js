export async function commercialAction({
  body,
  request,
  userClient,
  admin,
  api,
  environment,
  reply,
  cents,
  now,
}) {
  const client = userClient(request.headers.get('authorization') || '');
  const auth = await client.auth.getUser();
  if (auth.error || !auth.data?.user) return reply({ error: 'Entre na sua conta.' }, 401);
  const access = await client.rpc('app_is_platform_admin');
  if (access.error || access.data !== true)
    return reply({ error: 'Acesso exclusivo da administração.' }, 403);
  const valid = (value) =>
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  if (!['commercial-preview', 'commercial-apply'].includes(body.action) || !valid(body.id))
    return reply({ error: 'Solicitação inválida.' }, 400);
  const found = await admin.rpc('app_change_reference', { p_id: body.id });
  const ref = found.data;
  if (
    found.error ||
    !ref ||
    ref.environment !== environment ||
    !/^sub_[A-Za-z0-9]+$/.test(ref.subscription || '') ||
    !/^cus_[A-Za-z0-9]+$/.test(ref.customer || '')
  )
    return reply({ error: 'Vínculo não encontrado neste ambiente.' }, 409);
  if (body.action === 'commercial-apply' && ref.change.status === 'applied')
    return reply({ ok: true, already_applied: true });
  if (ref.change.status !== 'accepted')
    return reply({ error: 'Aguarde o aceite atual do titular.' }, 409);
  const subscription = await api('/subscriptions/' + ref.subscription);
  if (
    subscription.id !== ref.subscription ||
    subscription.customer !== ref.customer ||
    subscription.cycle !== 'MONTHLY' ||
    subscription.deleted ||
    subscription.status !== 'ACTIVE'
  )
    return reply(
      { error: 'A assinatura do provedor não está ativa ou não corresponde ao contrato.' },
      409,
    );
  const invoices = await api('/subscriptions/' + ref.subscription + '/payments?limit=100');
  if (!Array.isArray(invoices.data) || invoices.hasMore || invoices.data.length > 100)
    return reply(
      { error: 'Histórico extenso ou inconclusivo. Revise as cobranças antes de aplicar.' },
      409,
    );
  const expected = ref.change.target_snapshot.monthly_cents;
  const outstanding = invoices.data.filter(
    (p) => !p.deleted && !['RECEIVED', 'CONFIRMED', 'REFUNDED', 'DELETED'].includes(p.status),
  );
  const compatible = outstanding.every(
    (p) =>
      p.subscription === ref.subscription &&
      p.customer === ref.customer &&
      cents(p.value) === expected,
  );
  const canonical = {
    subscription: subscription.id,
    customer: subscription.customer,
    environment,
    cycle: 'MONTHLY',
    amount_cents: cents(subscription.value),
    open_invoices_compatible: compatible,
    verified_at: now().toISOString(),
  };
  const preview = {
    ...canonical,
    matches_offer: canonical.amount_cents === expected && compatible,
    expected_cents: expected,
    change_version: ref.change.version,
    effective_at: ref.change.effective_at,
  };
  if (body.action === 'commercial-preview') return reply(preview);
  if (
    !valid(body.operation) ||
    typeof body.reason !== 'string' ||
    body.reason.trim().length < 5 ||
    body.reason.length > 500 ||
    body.version !== ref.change.version ||
    !preview.matches_offer ||
    !body.confirmed ||
    [
      'subscription',
      'customer',
      'environment',
      'amount_cents',
      'change_version',
      'effective_at',
    ].some((key) => body.confirmed[key] !== preview[key])
  )
    return reply({ error: 'Revise a prévia, o aceite, a data e as cobranças pendentes.' }, 409);
  const result = await admin.rpc('app_change_apply', {
    p_actor: auth.data.user.id,
    p_operation: body.operation,
    p_id: body.id,
    p_version: body.version,
    p_canonical: canonical,
    p_reason: body.reason.trim(),
  });
  if (result.error)
    return reply(
      {
        error:
          'Troca não aplicada. Confira a data acordada, vigência, equipe e contrato atual; pode ser necessário emitir nova proposta.',
      },
      409,
    );
  return reply(result.data);
}
