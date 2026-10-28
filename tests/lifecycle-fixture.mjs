import { readFileSync } from 'node:fs';
import { commercialFixture } from './commercial-fixture.mjs';
export async function lifecycleFixture() {
  const f = await commercialFixture();
  await f.db.exec('reset role');
  const sql = readFileSync(
    new URL('../supabase/stage_52_subscription_lifecycle.sql', import.meta.url),
    'utf8',
  );
  await f.db.exec(sql);
  await f.db.exec(sql);
  await f.bind();
  const context = async () => {
    await f.as(f.other);
    return f.rpc('app_lifecycle_context');
  };
  const cool = async () => {
    await f.drain();
    await f.db.exec(
      "reset role;update app_billing_sync set started_at=now()-interval '61 seconds';",
    );
  };
  const event = async (id = 'pay_manual', event = 'PAYMENT_RECEIVED') =>
    f.request({ id: 'evt_' + crypto.randomUUID(), event, payment: { id } });
  return { ...f, context, coolLifecycle: cool, event };
}
