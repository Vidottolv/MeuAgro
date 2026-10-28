import { checkoutFixture } from './checkout-fixture.mjs';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
export async function commercialFixture() {
  const f = await checkoutFixture();
  await f.db.exec('reset role');
  const sql = readFileSync(
    new URL('../supabase/stage_51_commercial_rules.sql', import.meta.url),
    'utf8',
  );
  await f.db.exec(sql);
  await f.db.exec(sql);
  const plan = async (code) => {
    await f.as(f.user);
    return (await f.rpc('app_admin_context')).plans.find((p) => p.code === code);
  };
  async function configure(code, changes = {}) {
    const old = await plan(code);
    const data = {
      name: old.name,
      monthly_cents: String(old.monthly_cents || 2000),
      seat_limit: String(old.seat_limit),
      storage_bytes: old.storage_bytes,
      published: true,
      trial_days: String(old.trial_days),
      change_policy: old.change_policy,
      change_cooldown_days: String(old.change_cooldown_days),
      ...changes,
    };
    await f.rpc('app_commercial_plan_save', [
      randomUUID(),
      old,
      data,
      'Configuração comercial de teste',
    ]);
    return plan(code);
  }
  async function bind({ expired = false } = {}) {
    f.provider.customers.push({ id: 'cus_manual', cpfCnpj: '12345678909', deleted: false });
    f.provider.subscriptions.push({
      id: 'sub_manual',
      customer: 'cus_manual',
      cycle: 'MONTHLY',
      status: 'ACTIVE',
      value: 10,
      deleted: false,
    });
    await f.as('', 'service_role');
    await f.rpc('app_admin_link', [
      f.user,
      randomUUID(),
      {
        user_id: f.other,
        plan_code: 'company10',
        version: 0,
        customer: 'cus_manual',
        subscription: 'sub_manual',
        expected_cents: 1000,
        environment: 'sandbox',
        reason: 'Vínculo de teste comercial',
      },
    ]);
    const date = (
      await f.db.query(expired ? 'select (current_date-32)::text d' : 'select current_date::text d')
    ).rows[0].d;
    f.provider.payments.push({
      id: 'pay_manual',
      customer: 'cus_manual',
      subscription: 'sub_manual',
      value: 10,
      status: 'RECEIVED',
      dueDate: date,
      invoiceUrl: 'https://sandbox.asaas.com/i/test',
    });
    await f.request({ id: 'evt_manual', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_manual' } });
  }
  return { ...f, plan, configure, bind };
}
