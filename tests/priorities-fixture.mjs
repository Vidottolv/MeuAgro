import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
export async function prioritiesFixture() {
  const db = new PGlite();
  const ids = Array.from({ length: 14 }, () => randomUUID()),
    [user, other, property, foreign, season, cycle, input, product, order, seller] = ids;
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;
 create table properties(id uuid primary key,user_id uuid,name text,deleted_at timestamptz);create table seasons(id uuid primary key,user_id uuid,property_id uuid,name text,deleted_at timestamptz);
 create table areas(id uuid primary key,name text);create table crops(id uuid primary key,name text);create table production_cycles(id uuid primary key,user_id uuid,property_id uuid,season_id uuid,area_id uuid,crop_id uuid,planting_date date,deleted_at timestamptz);
 create table agricultural_inputs(id uuid primary key,user_id uuid,name text,brand text,category text,base_unit text,minimum_stock numeric,ideal_stock numeric,active boolean,deleted_at timestamptz);
 create table inventory_transactions(id uuid primary key,user_id uuid,production_cycle_id uuid,transaction_type text,total_cost numeric);create table harvests(id uuid primary key,user_id uuid,production_cycle_id uuid);create table harvest_sales(id uuid primary key,user_id uuid,harvest_id uuid,total_value numeric);
 create table inventory_balances(agricultural_input_id uuid,current_quantity numeric);create table inventory_lots(id uuid primary key,user_id uuid,agricultural_input_id uuid,deleted_at timestamptz);create table inventory_lot_balances(inventory_lot_id uuid,current_quantity numeric,expiration_date date,unit text);
 create table trade_orders(id uuid primary key,buyer_id uuid,state text,quote_snapshot jsonb);create table trade_inventory_links(buyer_id uuid,product_id uuid,agricultural_input_id uuid,primary key(buyer_id,product_id));
 create table commerce_sellers(id uuid primary key,owner_id uuid);create table commerce_memberships(id uuid primary key,seller_id uuid,user_id uuid,active boolean);
 create table storage.objects(id uuid primary key,name text,metadata jsonb,owner_id text);
 create table satellite_entitlements(user_id uuid,requests_month int,pu_month numeric);create table satellite_usage(scope text,month date,requests int,pu numeric);`);
  for (const id of [user, other, ...ids.slice(10)])
    await db.query('insert into auth.users values($1)', [id]);
  await db.query(
    "insert into properties values($1,$2,'Minha propriedade',null),($3,$4,'Outra propriedade',null)",
    [property, user, foreign, other],
  );
  await db.query("insert into seasons values($1,$2,$3,'Safra teste',null)", [
    season,
    user,
    property,
  ]);
  await db.query(
    "insert into production_cycles(id,user_id,property_id,season_id,planting_date) values($1,$2,$3,$4,date '2026-10-01')",
    [cycle, user, property, season],
  );
  await db.query(
    "insert into agricultural_inputs values($1,$2,'Semente','Marca','seeds','kg',10,20,true,null)",
    [input, user],
  );
  await db.query('insert into inventory_balances values($1,5)', [input]);
  const lot = randomUUID();
  await db.query('insert into inventory_lots values($1,$2,$3,null)', [lot, user, input]);
  await db.query("insert into inventory_lot_balances values($1,2,current_date-1,'kg')", [lot]);
  await db.query('insert into commerce_sellers values($1,$2)', [seller, user]);
  for (const file of [
    'stage_43_operating_expenses.sql',
    'stage_44_expense_allocations.sql',
    'stage_45_receivables.sql',
    'stage_46_budgets_procurement.sql',
    'stage_47_weather.sql',
    'stage_48_onboarding_plans.sql',
  ]) {
    const sql = readFileSync(new URL('../supabase/' + file, import.meta.url), 'utf8');
    await db.exec(sql);
    await db.exec(sql);
  }
  const as = async (id = user, role = 'authenticated') => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || '']);
    await db.exec('set role ' + role);
  };
  const rpc = async (name, args = []) =>
    (
      await db.query(
        `select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) r`,
        args,
      )
    ).rows[0].r;
  await as();
  return {
    db,
    ids,
    user,
    other,
    property,
    foreign,
    season,
    cycle,
    input,
    product,
    order,
    seller,
    as,
    rpc,
  };
}
