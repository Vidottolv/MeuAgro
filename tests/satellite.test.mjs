import test from 'node:test';
import './satellite-provider.test.mjs';
import './satellite-images.test.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { managementFixture } from './management-fixture.mjs';
import { parseCoordinates, normalizeGeometry } from '../src/modules/satellite/geometry.js';
test('coordenadas decimais, UTM, ponto e GeoJSON usam ordem explícita', () => {
  assert.deepEqual(parseCoordinates('-16,0;-48,0').coordinates, [-48, -16]);
  assert.deepEqual(
    parseCoordinates('500000;10000000', 'UTM-WGS84', 23, 'S').coordinates.map((x) => Math.round(x)),
    [-45, 0],
  );
  assert.deepEqual(
    parseCoordinates('500000;10000000', 'UTM-SIRGAS2000', 23, 'S').coordinates.map((x) =>
      Math.round(x),
    ),
    [-45, 0],
  );
  assert.equal(parseCoordinates('-16;-48\n-16;-47.99\n-15.99;-48').coordinates[0].length, 4);
  assert.equal(
    parseCoordinates('-16;-48\n-16;-47.99\n-15.99;-48\n-16;-48').coordinates[0].length,
    4,
  );
  assert.throws(() => parseCoordinates('500000;10000000', 'UTM-WGS84', 0, 'S'));
  assert.throws(() => parseCoordinates('abc;def'));
  assert.throws(() => normalizeGeometry({ type: 'Polygon', coordinates: [] }));
  assert.throws(() => normalizeGeometry({ type: 'Point', coordinates: [0, 90] }));
});
test('mapas: propriedade, proposta, aprovação e franquias de satélite', async (t) => {
  const { db, as, ids, commerce } = await managementFixture();
  const property = '10000000-0000-4000-8000-000000000001',
    area = randomUUID(),
    area2 = randomUUID();
  const rpc = async (name, args = []) =>
    (
      await db.query(
        `select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) r`,
        args,
      )
    ).rows[0].r;
  const polygon = {
    type: 'Polygon',
    coordinates: [
      [
        [-48, -16],
        [-47.99, -16],
        [-47.99, -15.99],
        [-48, -15.99],
        [-48, -16],
      ],
    ],
  };
  let revision, grant;
  const save = (extra = {}) =>
    rpc('geo_command', [
      'save',
      {
        property_id: property,
        area_id: area,
        geometry: polygon,
        source: 'map',
        reference: 'WGS84',
        base_revision: revision,
        ...extra,
      },
    ]);
  const context = (sid = null) => rpc('geo_context', [property, area, sid]);
  try {
    await db.exec(`create table public.areas(id uuid primary key,user_id uuid,property_id uuid,deleted_at timestamptz,name text);
      create table public.crops(id uuid primary key,user_id uuid,is_system boolean,active boolean,name text);
      create table public.production_cycles(id uuid primary key,user_id uuid,property_id uuid,area_id uuid,crop_id uuid,deleted_at timestamptz);
      create table public.production_events(id uuid primary key,user_id uuid,production_cycle_id uuid,title text,description text,occurred_at timestamptz);
      create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      create function storage.foldername(p text) returns text[] language sql immutable as $$select string_to_array(p,'/')$$;`);
    for (const file of [
      'stage_33_technical_visits.sql',
      'stage_34_property_sharing.sql',
      'stage_35_maps_satellite.sql',
      'stage_35_maps_satellite.sql',
    ])
      await db
        .exec(readFileSync(new URL('../supabase/' + file, import.meta.url), 'utf8'))
        .catch((error) => {
          console.error(
            file,
            error.position,
            error.internalPosition,
            error.internalQuery,
            error.where,
          );
          throw error;
        });
    await db.query('insert into areas values($1,$2,$3,null,$4),($5,$2,$3,null,$6)', [
      area,
      ids[3],
      property,
      'Talhão Norte',
      area2,
      'Talhão Sul',
    ]);
    await as(4);
    await t.test('dono salva versões, ponto não é polígono e outra conta não altera', async () => {
      revision = await save({ base_revision: null });
      const current = (await context()).current;
      assert.equal(current.id, revision);
      assert.ok(current.hectares > 100 && current.hectares < 150);
      await assert.rejects(save({ base_revision: null }), /outra pessoa/);
      await assert.rejects(db.query('update geo_current set revision=$1', [randomUUID()]));
      await as(3);
      await assert.rejects(context());
      await assert.rejects(save());
      await as(4);
    });
    await t.test(
      'backend rejeita auto-interseção, coordenadas impossíveis e polígonos degenerados',
      async () => {
        for (const g of [
          {
            type: 'Polygon',
            coordinates: [
              [
                [-48, -16],
                [-47, -15],
                [-48, -15],
                [-47, -16],
                [-48, -16],
              ],
            ],
          },
          { type: 'Point', coordinates: [181, 0] },
          {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 1],
                [2, 2],
                [0, 0],
              ],
            ],
          },
        ])
          await assert.rejects(save({ geometry: g }));
        assert.equal((await context()).current.id, revision);
      },
    );
    await t.test(
      'consultor propõe; somente produtor aprova e versão antiga é bloqueada',
      async () => {
        grant = await rpc('property_share_command', [
          'invite',
          { property_id: property, email: 'user2@example.test' },
        ]);
        await as(2);
        await commerce('enable', { name: 'Consultor Teste' });
        await rpc('property_share_command', ['accept', { id: grant.id }]);
        const proposal = await save({ share_id: grant.id });
        assert.equal((await context(grant.id)).current.id, revision);
        await assert.rejects(
          rpc('geo_command', [
            'approve',
            { property_id: property, area_id: area, share_id: grant.id, id: proposal },
          ]),
        );
        await as(4);
        await rpc('geo_command', [
          'approve',
          { property_id: property, area_id: area, id: proposal },
        ]);
        revision = proposal;
        await as(2);
        const stale = await save({ share_id: grant.id });
        await as(4);
        revision = await save();
        await assert.rejects(
          rpc('geo_command', ['approve', { property_id: property, area_id: area, id: stale }]),
          /antigo/,
        );
        await rpc('property_share_command', ['revoke', { id: grant.id }]);
        await as(2);
        await assert.rejects(context(grant.id));
        await assert.rejects(save({ share_id: grant.id }));
        await as(4);
      },
    );
    await t.test('usuário não ativa plano nem excede limite de talhões', async () => {
      await assert.rejects(rpc('satellite_field', [area, true]), /pacote/);
      await assert.rejects(
        db.query('insert into satellite_entitlements values($1,true,10,10000,1000,1000)', [ids[3]]),
      );
      await as(null, 'postgres');
      await db.query('insert into satellite_entitlements values($1,true,1,200,5,5)', [ids[3]]);
      await db.exec(
        'update satellite_platform_limits set enabled=true,requests_month=3,pu_month=3',
      );
      await as(4);
      const point = await save({
        area_id: area2,
        base_revision: null,
        geometry: { type: 'Point', coordinates: [-48, -16] },
      });
      await assert.rejects(rpc('satellite_field', [area2, true]), /polígono/);
      await rpc('satellite_field', [area, true]);
      const second = await save({ area_id: area2, base_revision: point });
      assert.ok(second);
      await assert.rejects(rpc('satellite_field', [area2, true]), /Limite/);
      const s = await rpc('satellite_status');
      assert.deepEqual(s.fields, [area]);
      assert.equal(s.provider_ready, false);
    });
    await t.test(
      'reservas são exclusivas do backend, idempotentes e limitadas globalmente',
      async () => {
        const reservation = randomUUID();
        const args = [reservation, ids[3], area, revision, 2, 1.5];
        await assert.rejects(rpc('satellite_reserve', args));
        await as(null, 'service_role');
        assert.equal(await rpc('satellite_reserve', args), reservation);
        assert.equal(await rpc('satellite_reserve', args), reservation);
        await assert.rejects(
          rpc('satellite_reserve', [...args.slice(0, 4), 3, 1.5]),
          /já utilizado/,
        );
        await assert.rejects(
          rpc('satellite_reserve', [randomUUID(), ids[3], area, revision, 2, 1.5]),
          /Franquia/,
        );
        await as(null, 'postgres');
        await db.exec('update satellite_platform_limits set requests_month=100,pu_month=100');
        await db.query('update satellite_entitlements set pu_month=1.5 where user_id=$1', [ids[3]]);
        await as(null, 'service_role');
        await assert.rejects(
          rpc('satellite_reserve', [randomUUID(), ids[3], area, revision, 1, 0.5]),
          /Franquia/,
        );
        await as(null, 'postgres');
        assert.equal(
          (await db.query("select requests from satellite_usage where scope='platform'")).rows[0]
            .requests,
          2,
        );
        await as(4);
        const s = await rpc('satellite_status');
        assert.equal(s.usage.requests, 2);
        assert.equal(Number(s.usage.pu), 1.5);
        await rpc('satellite_field', [area, false]);
        await as(null, 'service_role');
        await assert.rejects(
          rpc('satellite_reserve', [randomUUID(), ids[3], area, revision, 1, 0.5]),
          /autorizado/,
        );
        await as(null, 'anon');
        await assert.rejects(context());
        await assert.rejects(rpc('satellite_status'));
      },
    );
  } finally {
    await db.close();
  }
});
