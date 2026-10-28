import { managementFixture } from './management-fixture.mjs';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
export async function permissionsFixture({ install = true } = {}) {
  const f = await managementFixture();
  const sql = readFileSync(
    new URL('../supabase/stage_54_permissions_isolation.sql', import.meta.url),
    'utf8',
  );
  const rpc = async (name, args = []) =>
    (
      await f.db.query(
        'select public.' + name + '(' + args.map((_, i) => '$' + (i + 1)).join(',') + ') r',
        args,
      )
    ).rows[0].r;
  await f.db.exec(
    readFileSync(new URL('../supabase/stage_32_company_team.sql', import.meta.url), 'utf8'),
  );
  await f.as(1);
  await f.commerce('enable', { name: 'Responsável' });
  const seller = (await f.commerce('create_company', { name: 'Empresa principal' })).seller_id;
  for (const n of [2, 3]) {
    await f.as(1);
    const invited = await rpc('management_team_command', [
      'invite',
      {
        seller_id: seller,
        email: `user${n}@example.test`,
        role: n === 2 ? 'manager' : 'representative',
        finance: false,
      },
      randomUUID(),
    ]);
    const invitation = (
      await f.db.query('select token from commerce_invitations where id=$1', [invited.id])
    ).rows[0];
    await f.as(n);
    await f.commerce('enable', { name: n === 2 ? 'Gerente operacional' : 'Representante' });
    await f.commerce('accept_invite', { token: invitation.token });
  }
  await f.as(5);
  await f.commerce('enable', { name: 'Consultor independente' });
  const foreignSeller = (await f.commerce('create_company', { name: 'Empresa isolada' })).seller_id;
  await f.db.exec('reset role');
  await f.db
    .exec(`create table areas(id uuid primary key,user_id uuid,property_id uuid,deleted_at timestamptz,name text);
 create table crops(id uuid primary key,user_id uuid,is_system boolean,active boolean,name text);
 create table production_cycles(id uuid primary key,user_id uuid,property_id uuid,area_id uuid,crop_id uuid,deleted_at timestamptz,variety text,status text,planting_date date);
 create table production_events(id uuid primary key,user_id uuid,production_cycle_id uuid,title text,description text,occurred_at timestamptz);
 create schema storage;grant usage on schema storage to authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;grant select,insert on storage.objects to authenticated;
 create function storage.foldername(p text) returns text[] language sql immutable as $$select string_to_array(p,'/')$$;`);
  for (const file of ['stage_33_technical_visits.sql', 'stage_34_property_sharing.sql'])
    await f.db.exec(readFileSync(new URL('../supabase/' + file, import.meta.url), 'utf8'));
  async function migrate() {
    await f.db.exec('reset role');
    await f.db.exec(sql);
    await f.db.exec(sql);
  }
  if (install) await migrate();
  const role = async (n, finance) => {
    await f.as(1);
    const m = (
      await f.db.query(
        'select id,management_role,can_view_finance from commerce_memberships where seller_id=$1 and user_id=$2',
        [seller, f.ids[n - 1]],
      )
    ).rows[0];
    return rpc('management_team_command', [
      'set_role',
      {
        seller_id: seller,
        membership_id: m.id,
        expected_role: m.management_role,
        expected_finance: m.can_view_finance,
        role: 'manager',
        finance,
      },
      randomUUID(),
    ]);
  };
  async function sale(agent = 2) {
    await f.as(1);
    const product = (
      await f.command('save_product', {
        seller_id: seller,
        name: 'Adubo',
        package_name: 'Saco',
        base_unit: 'kg',
        package_size: 25,
        reference_price: 100,
        availability: 'available',
      })
    ).id;
    await f.as(agent);
    await f.command('invite_buyer', { seller_id: seller, email: 'user4@example.test' });
    const invitation = (await f.rows('trade_invitations')).find(
      (i) => i.email === 'user4@example.test',
    );
    await f.as(4);
    const connection = (
      await f.command('accept_connection', { token: invitation.token, name: 'Produtor' })
    ).id;
    const request = (
      await f.command('create_request', {
        connection_id: connection,
        delivery_address: 'Sítio Teste',
        items: [{ product_id: product, quantity: 1 }],
      })
    ).id;
    await f.as(agent);
    const quote = (
      await f.command('send_quote', {
        request_id: request,
        items: [{ product_id: product, unit_price: 100 }],
        discount: 0,
        freight: 0,
        valid_until: new Date(Date.now() + 86400000).toISOString(),
        delivery_days: 2,
        payment_terms: 'Na entrega',
      })
    ).id;
    await f.as(4);
    const order = (await f.command('accept_quote', { request_id: request, quote_id: quote })).id;
    await f.db.exec('reset role');
    await f.db.query("update trade_orders set state='received',received_at=now() where id=$1", [
      order,
    ]);
    await f.as(1);
    await f.save({
      order_id: order,
      expected_version: 0,
      items: [{ product_id: product, unit_cost: 40 }],
      delivery_cost: 0,
      other_cost: 0,
      commission_percent: 10,
      reason: 'Apuração para validar permissões',
    });
    return { order, request, product };
  }
  const property = '10000000-0000-4000-8000-000000000001';
  async function visit(n, company = false) {
    await f.as(n);
    const id = randomUUID();
    await rpc('sync_visit_operation', [
      f.ids[n - 1],
      id,
      {
        kind: 'visit',
        visit: {
          id,
          seller_id: company ? seller : null,
          producer_name: 'Produtor',
          site_name: 'Sítio Teste',
          visited_at: new Date().toISOString(),
          priority: 'medium',
          anamnesis: { reason: 'Observação privada' },
        },
        photos: [],
      },
    ]);
    return id;
  }
  return { ...f, rpc, seller, foreignSeller, migrate, role, sale, property, visit };
}
