import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { managementFixture } from './management-fixture.mjs';
test('imagens: cache, reserva única, acesso privado e revogação', async (t) => {
  const { db, as, ids, commerce } = await managementFixture();
  const property = '10000000-0000-4000-8000-000000000001',
    area = randomUUID();
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
  const rpc = async (name, args = []) =>
    (
      await db.query(
        `select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) r`,
        args,
      )
    ).rows[0].r;
  let revision, job, share;
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const day = yesterday.toISOString().slice(0, 10);
  const claim = () => rpc('satellite_image_claim', [ids[3], area, day, 'ndvi']);
  try {
    await db.exec(`create table public.areas(id uuid primary key,user_id uuid,property_id uuid,deleted_at timestamptz,name text);
      create table public.crops(id uuid primary key,user_id uuid,is_system boolean,active boolean,name text);
      create table public.production_cycles(id uuid primary key,user_id uuid,property_id uuid,area_id uuid,crop_id uuid,deleted_at timestamptz);
      create table public.production_events(id uuid primary key,user_id uuid,production_cycle_id uuid,title text,description text,occurred_at timestamptz);
      create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      create function storage.foldername(p text) returns text[] language sql immutable as $$select string_to_array(p,'/')$$;
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated,anon;grant select,insert on storage.objects to authenticated;
      create policy broad_storage on storage.objects for all to authenticated using(true) with check(true);`);
    for (const file of [
      'stage_33_technical_visits.sql',
      'stage_34_property_sharing.sql',
      'stage_35_maps_satellite.sql',
      'stage_36_satellite_imagery.sql',
      'stage_37_satellite_scenes.sql',
      'stage_37_satellite_scenes.sql',
      'stage_56_satellite_budget.sql',
      'stage_56_satellite_budget.sql',
    ])
      await db.exec(readFileSync(new URL('../supabase/' + file, import.meta.url), 'utf8'));
    await db.query('insert into areas values($1,$2,$3,null,$4)', [
      area,
      ids[3],
      property,
      'Talhão Norte',
    ]);
    await db.query('insert into satellite_entitlements values($1,true,5,1000,20,100)', [ids[3]]);
    await db.exec(
      'update satellite_platform_limits set enabled=true,requests_month=100,pu_month=1000',
    );
    await as(4);
    revision = await rpc('geo_command', [
      'save',
      {
        property_id: property,
        area_id: area,
        geometry: polygon,
        source: 'map',
        reference: 'WGS84',
      },
    ]);
    await rpc('satellite_field', [area, true]);
    await t.test(
      'cliente não executa worker; cache impede nova reserva e corrida duplicada',
      async () => {
        await assert.rejects(claim());
        await assert.rejects(db.query('select * from satellite_images'));
        await as(null, 'service_role');
        job = await claim();
        assert.equal(job.claimed, true);
        const second = await claim();
        assert.equal(second.claimed, false);
        assert.equal(second.id, job.id);
        await as(4);
        const status = await rpc('satellite_status');
        assert.equal(status.usage.requests, 2);
        assert.equal(Number(status.usage.pu), 10);
        await as(3);
        await assert.rejects(rpc('satellite_image_list', [property, area, null]));
        await as(4);
      },
    );
    await t.test(
      'conclusão exige lease e arquivo privado; header observado não reduz reserva',
      async () => {
        const finish = (lease = job.lease) =>
          rpc('satellite_image_finish', [
            job.id,
            lease,
            'ready',
            { bounds: [-48, -16, -47.99, -15.99] },
            2,
            1.51,
          ]);
        await as(null, 'service_role');
        await assert.rejects(finish(randomUUID()));
        await assert.rejects(finish());
        await as(null, 'postgres');
        await db.query('insert into storage.objects(bucket_id,name) values($1,$2)', [
          'meuagro-satellite',
          ids[3] + '/' + job.id + '.png',
        ]);
        await as(null, 'service_role');
        await finish();
        await assert.rejects(finish());
        await as(4);
        const list = await rpc('satellite_image_list', [property, area, null]);
        assert.equal(list[0].status, 'ready');
        assert.equal(Number(list[0].actual_pu), 1.51);
        assert.equal((await rpc('satellite_status')).usage.requests, 2);
        assert.deepEqual(
          (await db.query("select * from storage.objects where bucket_id='meuagro-satellite'"))
            .rows,
          [],
        );
        await assert.rejects(
          db.query(
            "insert into storage.objects(bucket_id,name) values('meuagro-satellite','fake')",
          ),
        );
      },
    );
    await t.test(
      'consultor recebe somente imagem autorizada; revogação bloqueia lista e leitura',
      async () => {
        share = await rpc('property_share_command', [
          'invite',
          { property_id: property, email: 'user2@example.test' },
        ]);
        await as(2);
        await commerce('enable', { name: 'Consultor Imagens' });
        await rpc('property_share_command', ['accept', { id: share.id }]);
        assert.equal((await rpc('satellite_image_list', [property, area, share.id]))[0].id, job.id);
        assert.ok((await rpc('satellite_image_access', [job.id, share.id])).storage_path);
        await as(4);
        await rpc('property_share_command', ['revoke', { id: share.id }]);
        await as(2);
        await assert.rejects(rpc('satellite_image_access', [job.id, share.id]));
        await assert.rejects(rpc('satellite_image_list', [property, area, share.id]));
        await as(4);
      },
    );
    await t.test(
      'contorno alterado invalida leitura da imagem anterior e nova consulta reserva novamente',
      async () => {
        revision = await rpc('geo_command', [
          'save',
          {
            property_id: property,
            area_id: area,
            base_revision: revision,
            geometry: polygon,
            source: 'map',
            reference: 'WGS84',
          },
        ]);
        assert.deepEqual(await rpc('satellite_image_list', [property, area, null]), []);
        await assert.rejects(rpc('satellite_image_access', [job.id, null]));
        await as(null, 'service_role');
        await assert.rejects(claim(), /minuto/);
        await as(null, 'postgres');
        await db.exec("update satellite_images set created_at=now()-interval '2 minutes'");
        await as(null, 'service_role');
        const newer = await claim();
        assert.equal(newer.claimed, true);
        assert.notEqual(newer.id, job.id);
        await rpc('satellite_image_finish', [
          newer.id,
          newer.lease,
          'failed',
          { observed_pu_lower_bound: 12 },
          1,
          12,
        ]);
        assert.equal((await claim()).status, 'failed');
        assert.equal((await claim()).claimed, false);
        await as(4);
        assert.equal((await rpc('satellite_status')).usage.requests, 4);
        assert.equal(Number((await rpc('satellite_status')).usage.pu), 22);
        assert.equal((await rpc('satellite_status')).provider_ready, false);
        await as(null, 'anon');
        await assert.rejects(rpc('satellite_image_access', [job.id, null]));
      },
    );
    await t.test(
      'busca privada: reserva única, cena validada, expiração e isolamento',
      async () => {
        await as(null, 'postgres');
        await db.exec('update satellite_platform_limits set enabled=true');
        await db.exec("update satellite_images set created_at=now()-interval '2 minutes'");
        await as(4);
        await assert.rejects(
          rpc('satellite_search_claim', [ids[3], area, day, day]),
          /permission denied/,
        );
        await assert.rejects(db.query('select * from satellite_searches'), /permission denied/);
        await as(null, 'service_role');
        await assert.rejects(rpc('satellite_search_claim', [ids[3], area, '2020-01-01', day]));
        const found = await rpc('satellite_search_claim', [ids[3], area, day, day]);
        assert.equal(found.claimed, true);
        const pending = await rpc('satellite_search_claim', [ids[3], area, day, day]);
        assert.equal(pending.claimed, false);
        assert.equal(pending.id, found.id);
        const scene = {
          id: 'S2-cache',
          properties: { datetime: day + 'T13:00:00Z', 'eo:cloud_cover': 5 },
        };
        await assert.rejects(
          rpc('satellite_search_finish', [
            found.id,
            randomUUID(),
            'ready',
            { scenes: [scene] },
            0.01,
          ]),
        );
        await rpc('satellite_search_finish', [
          found.id,
          found.lease,
          'ready',
          {
            scenes: [
              scene,
              { id: 'cloudy', properties: { datetime: day + 'T14:00:00Z', 'eo:cloud_cover': 90 } },
            ],
            truncated: false,
          },
          0.01,
        ]);
        const cached = await rpc('satellite_search_claim', [ids[3], area, day, day]);
        assert.equal(cached.claimed, false);
        assert.equal(cached.result.scenes[0].id, scene.id);
        await assert.rejects(
          rpc('satellite_scene_image_claim', [ids[1], area, found.id, scene.id, 'rgb']),
        );
        await assert.rejects(
          rpc('satellite_scene_image_claim', [ids[3], area, found.id, 'fake', 'rgb']),
        );
        await assert.rejects(
          rpc('satellite_scene_image_claim', [ids[3], area, found.id, 'cloudy', 'rgb']),
        );
        const image = await rpc('satellite_scene_image_claim', [
          ids[3],
          area,
          found.id,
          scene.id,
          'rgb',
        ]);
        assert.equal(image.claimed, true);
        assert.deepEqual(image.scene, scene);
        const repeat = await rpc('satellite_scene_image_claim', [
          ids[3],
          area,
          found.id,
          scene.id,
          'rgb',
        ]);
        assert.equal(repeat.claimed, false);
        assert.equal(repeat.id, image.id);
        await as(null, 'postgres');
        const reservations = await db.query(
          'select count(*)::int n from satellite_reservations where id=$1',
          [found.id],
        );
        assert.equal(reservations.rows[0].n, 1);
        const budget = await db.query(
          'select requests,pu from satellite_reservations where id=$1',
          [image.id],
        );
        assert.equal(budget.rows[0].requests, 1);
        assert.equal(Number(budget.rows[0].pu), 10);
        await db.exec("update satellite_searches set expires_at=now()-interval '1 second'");
        await as(null, 'service_role');
        await assert.rejects(
          rpc('satellite_scene_image_claim', [ids[3], area, found.id, scene.id, 'rgb']),
          /expirada/,
        );
      },
    );
    await t.test(
      'conferência privada, custo desconhecido e pausa por mínimo observado acima da reserva',
      async () => {
        await as(null, 'postgres');
        const search = (await db.query('select * from satellite_searches limit 1')).rows[0];
        // Representa execução antiga: não inventa custo nem requisições observadas.
        await as(4);
        const report = await rpc('satellite_budget_report');
        assert.ok(report.pu_unknown >= 1);
        assert.ok(report.requests_unknown >= 1);
        assert.equal((await rpc('satellite_status')).budget.jobs, report.jobs);
        await as(2);
        assert.equal((await rpc('satellite_budget_report')).jobs, 0);
        await as(null, 'anon');
        await assert.rejects(rpc('satellite_budget_report'), /permission denied/);
        await as(null, 'postgres');
        await db.query("update satellite_searches set status='processing' where id=$1", [
          search.id,
        ]);
        await as(null, 'service_role');
        await rpc('satellite_search_finish', [
          search.id,
          search.lease,
          'failed',
          { actual_requests: 1, observed_pu_lower_bound: 0.3 },
          null,
        ]);
        await assert.rejects(
          rpc('satellite_search_finish', [search.id, search.lease, 'failed', {}, 0]),
          /encerrada/,
        );
        await as(4);
        const after = await rpc('satellite_status');
        assert.equal(after.provider_ready, false);
        assert.ok(after.budget.pu_lower_bound >= 12.3);
        assert.ok(after.budget.requests_observed >= 4);
        assert.equal(after.budget.failed, 2);
        // O mês pertence à reserva, não à data da imagem nem ao fechamento.
        await as(null, 'postgres');
        await db.query(
          "update satellite_reservations set month=date_trunc('month',now() at time zone 'UTC')::date-interval '1 month' where id=$1",
          [search.id],
        );
        await as(4);
        assert.equal((await rpc('satellite_budget_report')).jobs, after.budget.jobs - 1);
      },
    );
  } finally {
    await db.close();
  }
});
