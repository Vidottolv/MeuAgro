import { lifecycleFixture } from './lifecycle-fixture.mjs';
import { readFileSync } from 'node:fs';
export async function profileOnboardingFixture() {
  const f = await lifecycleFixture();
  await f.db.exec('reset role');
  // Minimal prior-domain columns missing from the billing test fixture.
  await f.db.exec(`alter table commerce_sellers add column kind text default 'company';
 alter table commerce_sellers add column name text default 'Empresa de teste';
 alter table commerce_memberships add column management_role text default 'representative';
 create table commerce_accounts(user_id uuid primary key,enabled boolean default true);
 create table technical_visits(id uuid primary key,author_id uuid,seller_id uuid,deleted_at timestamptz);
 create table property_shares(id uuid primary key,property_id uuid,consultant_id uuid,status text);`);
  const sql = readFileSync(
    new URL('../supabase/stage_53_profile_onboarding.sql', import.meta.url),
    'utf8',
  );
  await f.db.exec(sql);
  await f.db.exec(sql);
  return f;
}
