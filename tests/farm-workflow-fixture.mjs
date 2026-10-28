import { prioritiesFixture } from './priorities-fixture.mjs';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
export async function farmWorkflowFixture({ install = true } = {}) {
  const f = await prioritiesFixture();
  await f.db.exec('reset role');
  await f.db
    .exec(`alter table production_cycles add column status text default 'developing';alter table production_cycles add column final_harvest_date date;
 create table notification_preferences(user_id uuid,timezone text);
 create table production_events(id uuid primary key default gen_random_uuid(),user_id uuid,production_cycle_id uuid,event_type text,title text,description text,notes text,occurred_at timestamptz);
 alter table harvests add column harvest_date date not null default '2026-10-10';alter table harvests add column quantity numeric not null default 10;alter table harvests add column unit text not null default 'kg';alter table harvests add column destination text not null default 'sale';alter table harvests add column notes text;
 alter table harvest_sales add column quantity numeric not null default 1;alter table harvest_sales add column unit text;alter table harvest_sales add column unit_price numeric not null default 10;alter table harvest_sales add column sale_date date not null default '2026-10-10';
 alter table harvest_sales drop column total_value;alter table harvest_sales add column total_value numeric generated always as (quantity*unit_price) stored;
 alter table production_cycles enable row level security;create policy farm_test_cycles on production_cycles for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
 grant select,insert,update on production_cycles,harvests,harvest_sales,production_events to authenticated;`);
  await f.db.exec(
    readFileSync(new URL('../supabase/stage_21_22_harvests_sales.sql', import.meta.url), 'utf8'),
  );
  const sql = readFileSync(
    new URL('../supabase/stage_55_farm_workflow.sql', import.meta.url),
    'utf8',
  );
  const migrate = async () => {
    await f.db.exec('reset role');
    await f.db.exec(sql);
    await f.db.exec(sql);
  };
  if (install) await migrate();
  await f.as(f.user);
  async function harvest(date = '2026-10-10', quantity = 10, unit = 'kg') {
    const id = randomUUID();
    await f.db.query(
      "insert into harvests(id,user_id,production_cycle_id,harvest_date,quantity,unit,destination) values($1,$2,$3,$4,$5,$6,'sale')",
      [id, f.user, f.cycle, date, quantity, unit],
    );
    return id;
  }
  async function sale(harvest, date = '2026-10-12', quantity = 4, price = 20) {
    const id = randomUUID();
    await f.db.query(
      'insert into harvest_sales(id,user_id,harvest_id,sale_date,quantity,unit_price) values($1,$2,$3,$4,$5,$6)',
      [id, f.user, harvest, date, quantity, price],
    );
    return id;
  }
  return { ...f, migrate, harvest, sale };
}
