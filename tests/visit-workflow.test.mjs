import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { managementFixture } from './management-fixture.mjs';
test('vínculo de satélite na visita: integração com permissões e histórico', async (t) => {
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
      'stage_38_visit_satellite.sql',
      'stage_39_technical_tasks.sql',
      'stage_40_task_collaboration.sql',
      'stage_41_visit_observations.sql',
      'stage_41_visit_observations.sql',
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
      'referência canônica, imagem histórica, offline/reenvio e isolamento',
      async () => {
        await as(4);
        const vid = randomUUID();
        const visit = {
          id: vid,
          property_id: property,
          area_id: area,
          producer_name: 'Produtor Teste',
          site_name: 'Sítio Horizonte',
          area_name: 'Talhão Norte',
          crop_name: 'Milho',
          visited_at: '2026-10-20T12:00:00Z',
          next_visit: null,
          priority: 'medium',
          anamnesis: { reason: 'Conferir mancha vista no satélite' },
          satellite_reference: {
            image_id: job.id,
            day: '1900-01-01',
            layer: 'fake',
            note: 'Observar o setor norte',
            storage_path: 'fake',
          },
        };
        const payload = { kind: 'visit', visit, photos: [] };
        const first = await rpc('sync_visit_operation', [ids[3], vid, payload]);
        assert.deepEqual(await rpc('sync_visit_operation', [ids[3], vid, payload]), first);
        const saved = (
          await db.query('select satellite_reference from technical_visits where id=$1', [vid])
        ).rows[0].satellite_reference;
        assert.equal(saved.image_id, job.id);
        assert.equal(saved.day, day);
        assert.equal(saved.layer, 'ndvi');
        assert.equal(saved.note, 'Observar o setor norte');
        assert.equal(saved.storage_path, undefined);
        await assert.rejects(rpc('satellite_image_access', [job.id, null]), /contorno/);
        const invalid = randomUUID();
        await assert.rejects(
          rpc('sync_visit_operation', [
            ids[3],
            invalid,
            {
              kind: 'visit',
              visit: {
                ...visit,
                id: invalid,
                satellite_reference: { image_id: randomUUID(), note: '' },
              },
              photos: [],
            },
          ]),
          /imagem disponível/,
        );
        await as(2);
        const other = randomUUID();
        await assert.rejects(
          rpc('sync_visit_operation', [
            ids[1],
            other,
            {
              kind: 'visit',
              visit: { ...visit, id: other, property_id: null, area_id: null },
              photos: [],
            },
          ]),
          /imagem disponível/,
        );
        await as(4);
        const noRef = randomUUID();
        await rpc('sync_visit_operation', [
          ids[3],
          noRef,
          { kind: 'visit', visit: { ...visit, id: noRef, satellite_reference: null }, photos: [] },
        ]);
        assert.equal(
          (await db.query('select satellite_reference from technical_visits where id=$1', [noRef]))
            .rows[0].satellite_reference,
          null,
        );
      },
    );
    await t.test('modelos privados, versão, arquivamento, limite e reenvio', async () => {
      await as(4);
      const op = randomUUID(),
        data = {
          name: 'Roteiro de milho',
          anamnesis: { reason: 'Conferência de campo', recommendations: 'Verificar cobertura' },
        };
      const command = (action, data, id = randomUUID()) =>
        rpc('visit_template_command', [id, action, data]);
      const saved = await command('create', data, op);
      assert.deepEqual(await command('create', data, op), saved);
      assert.equal((await rpc('visit_template_list')).length, 1);
      await assert.rejects(db.query('select * from visit_templates'), /permission denied/);
      await as(2);
      assert.deepEqual(await rpc('visit_template_list'), []);
      await assert.rejects(
        command('update', { id: saved.id, version: 1, ...data }),
        /indisponível/,
      );
      await as(4);
      await command('update', { id: saved.id, version: 1, ...data, name: 'Roteiro revisado' });
      await assert.rejects(command('update', { id: saved.id, version: 1, ...data }), /mudou/);
      await command('archive', { id: saved.id, version: 2 });
      assert.equal((await rpc('visit_template_list'))[0].active, false);
      await command('restore', { id: saved.id, version: 3 });
      for (let i = 0; i < 19; i++) await command('create', { ...data, name: 'Modelo ' + i });
      await assert.rejects(command('create', data), /20 modelos/);
    });
    await t.test(
      'observações por talhão, nomes canônicos, reenvio e origem da tarefa',
      async () => {
        await as(4);
        const id = randomUUID(),
          obsId = randomUUID();
        const observation = {
          id: obsId,
          area_id: area,
          crop_id: null,
          area_name: 'Nome alterado no cliente',
          crop_name: 'Milho',
          observation: 'Mancha observada no setor norte',
          recommendation: 'Conferir o local',
          priority: 'high',
          next_visit: '2026-10-25',
        };
        const visit = {
          id,
          property_id: property,
          area_id: area,
          producer_name: 'Produtor Teste',
          site_name: 'Sítio Horizonte',
          area_name: 'Norte',
          crop_name: 'Milho',
          visited_at: '2026-10-20T12:00:00Z',
          priority: 'medium',
          anamnesis: { reason: 'Acompanhamento' },
          field_observations: [observation],
        };
        const payload = { kind: 'visit', visit, photos: [] };
        await rpc('sync_visit_workflow_operation', [ids[3], id, payload]);
        await rpc('sync_visit_operation', [ids[3], id, payload]);
        const row = (
          await db.query('select field_observations from technical_visits where id=$1', [id])
        ).rows[0];
        assert.equal(row.field_observations.length, 1);
        assert.equal(row.field_observations[0].area_name, 'Talhão Norte');
        const bad = randomUUID();
        await assert.rejects(
          rpc('sync_visit_operation', [
            ids[3],
            bad,
            {
              ...payload,
              visit: { ...visit, id: bad, field_observations: [observation, observation] },
            },
          ]),
          /duplicado/,
        );
        await assert.rejects(
          rpc('sync_visit_operation', [
            ids[3],
            bad,
            {
              ...payload,
              visit: {
                ...visit,
                id: bad,
                field_observations: [{ ...observation, area_id: randomUUID() }],
              },
            },
          ]),
          /Talhão/,
        );
        await assert.rejects(
          rpc('sync_visit_operation', [
            ids[3],
            bad,
            {
              ...payload,
              visit: {
                ...visit,
                id: bad,
                field_observations: [{ ...observation, next_visit: '2026-10-19' }],
              },
            },
          ]),
          /retorno/,
        );
        const task = await rpc('technical_task_command', [
          randomUUID(),
          'create',
          {
            visit_id: id,
            observation_id: obsId,
            title: 'Conferir setor norte',
            description: 'Conferir o local',
            due_date: '2026-10-25',
            priority: 'high',
          },
        ]);
        const tasks = await rpc('technical_task_list', [id]);
        assert.equal(tasks.items[0].id, task.id);
        assert.equal(tasks.items[0].observation_id, obsId);
        assert.equal(tasks.items[0].area_name, 'Talhão Norte');
        await assert.rejects(
          rpc('technical_task_command', [
            randomUUID(),
            'create',
            {
              visit_id: id,
              observation_id: randomUUID(),
              title: 'Inválida',
              due_date: '2026-10-25',
              priority: 'high',
            },
          ]),
          /Observação/,
        );
      },
    );
    await t.test(
      'endpoint novo recusa confirmação de servidor antigo sem perder dados',
      async () => {
        await as(null, 'postgres');
        await db.exec(
          readFileSync(
            new URL('../supabase/stage_38_visit_satellite.sql', import.meta.url),
            'utf8',
          ),
        );
        await as(4);
        const id = randomUUID();
        const payload = {
          kind: 'visit',
          visit: {
            id,
            producer_name: 'Produtor Teste',
            site_name: 'Sítio Horizonte',
            area_name: 'Norte',
            crop_name: 'Milho',
            visited_at: '2026-10-20T12:00:00Z',
            priority: 'medium',
            anamnesis: { reason: 'Acompanhamento' },
            field_observations: [
              {
                id: randomUUID(),
                area_name: 'Setor norte',
                crop_name: 'Milho',
                observation: 'Verificar cobertura',
                recommendation: 'Conferir',
                priority: 'medium',
                next_visit: null,
              },
            ],
          },
          photos: [],
        };
        await assert.rejects(
          rpc('sync_visit_workflow_operation', [ids[3], id, payload]),
          /não foram confirmadas/,
        );
        assert.equal(
          (await db.query('select id from technical_visits where id=$1', [id])).rows.length,
          0,
        );
        await as(null, 'postgres');
        await db.exec(
          readFileSync(
            new URL('../supabase/stage_41_visit_observations.sql', import.meta.url),
            'utf8',
          ),
        );
        await as(4);
        await rpc('sync_visit_workflow_operation', [ids[3], id, payload]);
        assert.equal(
          (await db.query('select field_observations from technical_visits where id=$1', [id]))
            .rows[0].field_observations.length,
          1,
        );
      },
    );
  } finally {
    await db.close();
  }
});

test('payload de referência não guarda imagens/URLs e recusa mudança de talhão', async () => {
  const { visitSatelliteReference } = await import('../src/modules/visits/visitSatellite.js');
  const property = randomUUID(),
    area = randomUUID();
  const ref = {
    image_id: randomUUID(),
    property_id: property,
    area_id: area,
    day: '2026-10-07',
    layer: 'ndvi',
    note: '  Conferir setor norte  ',
    storage_path: 'secret',
    signed_url: 'secret',
    blob: 'secret',
  };
  const result = visitSatelliteReference(ref, property, area);
  assert.equal(result.note, 'Conferir setor norte');
  assert.equal(result.storage_path, undefined);
  assert.equal(result.signed_url, undefined);
  assert.equal(result.blob, undefined);
  assert.throws(() => visitSatelliteReference(ref, property, randomUUID()));
  assert.throws(() => visitSatelliteReference({ ...ref, note: 'x'.repeat(2001) }, property, area));
  assert.throws(() => visitSatelliteReference({ ...ref, day: '2026-02-30' }, property, area));
  assert.equal(visitSatelliteReference(null, property, area), null);
});

test('modelos preenchem só vazios e exportação de observações protege fórmulas', async () => {
  const { templatePayload, applyEmptyTemplate } =
    await import('../src/modules/visits/visitTemplates.js');
  const { visitObservations, observationsCsv } =
    await import('../src/modules/visits/visitObservations.js');
  const model = templatePayload('Roteiro', { reason: 'Modelo', symptoms: 'Observar sinais' });
  const applied = applyEmptyTemplate({ reason: 'Motivo já preenchido', symptoms: '' }, model);
  assert.equal(applied.data.reason, 'Motivo já preenchido');
  assert.equal(applied.data.symptoms, 'Observar sinais');
  assert.equal(applied.filled, 1);
  assert.equal(model.site_name, undefined);
  assert.throws(() => templatePayload('Roteiro', {}));
  const item = {
    id: randomUUID(),
    area_name: 'Norte',
    crop_name: 'Milho',
    observation: '=Fórmula',
    recommendation: 'Conferir',
    priority: 'high',
    next_visit: '2026-10-25',
  };
  assert.equal(visitObservations([item], null, '2026-10-20').length, 1);
  assert.throws(() => visitObservations([item, item], null, '2026-10-20'));
  assert.throws(() =>
    visitObservations([{ ...item, next_visit: '2026-02-30' }], null, '2026-10-20'),
  );
  assert.match(observationsCsv({ id: randomUUID(), field_observations: [item] }), /"'=Fórmula"/);
});
