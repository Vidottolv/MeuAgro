import { lifecycleFixture } from './lifecycle-fixture.mjs';
import { readFileSync } from 'node:fs';
export async function operationsFixture() {
  const f = await lifecycleFixture();
  await f.as(null, 'postgres');
  await f.db
    .exec(`create table satellite_images(id uuid primary key default gen_random_uuid(),user_id uuid,status text,created_at timestamptz default now());
  create table satellite_searches(id uuid primary key default gen_random_uuid(),user_id uuid,status text,created_at timestamptz default now());`);
  const sql = readFileSync(
    new URL('../supabase/stage_57_operations_privacy.sql', import.meta.url),
    'utf8',
  );
  await f.db.exec(sql);
  await f.db.exec(sql);
  await f.as(f.other);
  return f;
}
