import test from 'node:test';
import './visit-followup.test.mjs';
import './property-sharing.test.mjs';
import './visit-draft.test.mjs';
import './satellite.test.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { managementFixture } from './management-fixture.mjs';
import { visitPayload } from '../src/modules/visits/visitModel.js';
const form = () => ({
  producer_name: 'Produtor Teste',
  site_name: 'Sítio Horizonte',
  area_name: 'Talhão 2',
  crop_name: 'Milho',
  visited_at: '2026-10-15T09:30',
  next_visit: '2026-10-20',
  priority: 'medium',
  anamnesis: {
    reason: 'Manchas nas folhas',
    symptoms: 'Lesões observadas',
    recommendations: 'Coletar amostra para análise',
  },
});
test('anamnese valida datas, limites e campos obrigatórios sem perder a estrutura', () => {
  const result = visitPayload(form());
  assert.equal(result.site_name, 'Sítio Horizonte');
  assert.equal(result.anamnesis.reason, 'Manchas nas folhas');
  assert.equal(result.seller_id, null);
  for (const change of [
    { producer_name: '' },
    { site_name: 'x' },
    { visited_at: '2026-02-30T09:30' },
    { visited_at: '2026-10-15T25:00' },
    { next_visit: '2026-10-14' },
    { next_visit: '2026-02-30' },
    { priority: 'fake' },
    { anamnesis: { reason: '' } },
    { anamnesis: { reason: 'x'.repeat(4001) } },
  ])
    assert.throws(() => visitPayload({ ...form(), ...change }));
});
test('visitas técnicas: propriedade, empresa, fotos e reenvio seguro', async (t) => {
  const f = await managementFixture(),
    { db, as, commerce, ids } = f;
  const rpc = async (name, args) =>
    (
      await db.query(
        `select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) r`,
        args,
      )
    ).rows[0].r;
  let company;
  const property = randomUUID(),
    foreignProperty = randomUUID(),
    area = randomUUID(),
    crop = randomUUID(),
    cycle = randomUUID();
  const sync = (id, payload, user = ids[2]) => rpc('sync_visit_operation', [user, id, payload]);
  const visit = (id, extra = {}) => ({ id, author_id: ids[0], ...visitPayload(form()), ...extra });
  const migration = readFileSync(
    new URL('../supabase/stage_33_technical_visits.sql', import.meta.url),
    'utf8',
  );
  const count = async (table) =>
    Number((await db.query('select count(*) c from public.' + table)).rows[0].c);
  try {
    await db.exec(`create table public.areas(id uuid primary key,user_id uuid,property_id uuid,deleted_at timestamptz);
      create table public.crops(id uuid primary key,user_id uuid,is_system boolean,active boolean);
      create table public.production_cycles(id uuid primary key,user_id uuid,property_id uuid,area_id uuid,crop_id uuid,deleted_at timestamptz);
      create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      create function storage.foldername(p text) returns text[] language sql immutable as $$ select string_to_array(p,'/') $$;
      alter table storage.objects enable row level security;grant usage on schema storage to authenticated,anon;grant select,insert on storage.objects to authenticated;`);
    await db.exec(migration);
    await db.exec(migration);
    await db.query('insert into properties(id,user_id,name) values($1,$2,$3),($4,$5,$6)', [
      property,
      ids[2],
      'Minha propriedade',
      foreignProperty,
      ids[3],
      'Propriedade do cliente',
    ]);
    await db.query('insert into areas values($1,$2,$3,null)', [area, ids[2], property]);
    await db.query('insert into crops values($1,null,true,true)', [crop]);
    await db.query('insert into production_cycles values($1,$2,$3,$4,$5,null)', [
      cycle,
      ids[2],
      property,
      area,
      crop,
    ]);
    await as(1);
    await commerce('enable', { name: 'Dono' });
    company = (await commerce('create_company', { name: 'Empresa de visitas' })).seller_id;
    for (const n of [2, 3]) {
      await as(1);
      await commerce('invite', { seller_id: company, email: `user${n}@example.test` });
      const i = (
        await db.query('select token from commerce_invitations where email=$1', [
          `user${n}@example.test`,
        ])
      ).rows[0];
      await as(n);
      await commerce('enable', { name: 'Profissional ' + n });
      await commerce('accept_invite', { token: i.token });
    }
    await as(1);
    await rpc('management_command', [
      'grant',
      { seller_id: company, agent_id: ids[1], role: 'manager', finance: false },
      randomUUID(),
    ]);
    let personal, shared, photo;
    await t.test(
      'visita pessoal aceita vínculo agrícola autorizado e reenvio não duplica',
      async () => {
        await as(3);
        personal = randomUUID();
        const p = {
          kind: 'visit',
          visit: visit(personal, {
            property_id: property,
            area_id: area,
            crop_id: crop,
            production_cycle_id: cycle,
          }),
          photos: [],
        };
        await sync(personal, p);
        await sync(personal, p);
        assert.equal(await count('technical_visits'), 1);
        assert.equal(
          (await db.query('select author_id from technical_visits')).rows[0].author_id,
          ids[2],
        );
        await assert.rejects(
          sync(personal, { ...p, visit: { ...p.visit, site_name: 'Tentativa de sobrescrita' } }),
          /outros dados/,
        );
      },
    );
    await t.test(
      'não permite referenciar propriedade de cliente nem talhão incompatível',
      async () => {
        const id = randomUUID();
        await assert.rejects(
          sync(id, {
            kind: 'visit',
            visit: visit(id, { property_id: foreignProperty }),
            photos: [],
          }),
          /Propriedade indisponível/,
        );
        await assert.rejects(
          sync(id, { kind: 'visit', visit: visit(id, { area_id: area }), photos: [] }),
          /Talhão inválido/,
        );
        await assert.rejects(
          sync(id, {
            kind: 'visit',
            visit: visit(id, { property_id: property, crop_id: crop, production_cycle_id: cycle }),
            photos: [],
          }),
          /Plantio incompatível/,
        );
      },
    );
    await t.test(
      'permite nomes de local externo sem conceder acesso ao banco do produtor',
      async () => {
        shared = randomUUID();
        await sync(shared, {
          kind: 'visit',
          visit: visit(shared, { seller_id: company, site_name: 'Sítio do cliente' }),
          photos: [],
        });
        assert.equal(await count('technical_visits'), 2);
        assert.equal(
          (await db.query('select count(*) c from properties where id=$1', [foreignProperty]))
            .rows[0].c,
          0,
        );
      },
    );
    await t.test('gerente e dono veem visitas da empresa mas não fichas pessoais', async () => {
      for (const n of [1, 2]) {
        await as(n);
        const rows = (await db.query('select id from technical_visits')).rows;
        assert.deepEqual(
          rows.map((r) => r.id),
          [shared],
        );
      }
      await as(4);
      assert.equal(await count('technical_visits'), 0);
      await as(5);
      assert.equal(await count('technical_visits'), 0);
      await assert.rejects(
        sync(randomUUID(), { kind: 'visit', visit: visit(randomUUID()) }),
        /Entre na conta/,
      );
      await as(3);
    });
    await t.test(
      'foto exige upload, autor correto e caminho exclusivo; reenvio é idempotente',
      async () => {
        photo = { id: randomUUID(), visit_id: shared, description: 'Manchas na folha' };
        photo.storage_path = `${ids[2]}/${shared}/${photo.id}.jpg`;
        const p = { kind: 'visit_photo', photo };
        await assert.rejects(sync(photo.id, p), /Envie a foto/);
        await db.query('insert into storage.objects(bucket_id,name) values($1,$2)', [
          'meu-agro-visit-photos',
          photo.storage_path,
        ]);
        await sync(photo.id, p);
        await sync(photo.id, p);
        assert.equal(await count('technical_visit_photos'), 1);
        await as(2);
        assert.equal(await count('technical_visit_photos'), 1);
        assert.equal((await db.query('select name from storage.objects')).rows.length, 1);
        const id = randomUUID();
        await assert.rejects(
          sync(id, { kind: 'visit_photo', photo: { ...photo, id } }, ids[1]),
          /Somente o autor/,
        );
        await as(3);
      },
    );
    await t.test('falha em foto anexa desfaz a visita e o recibo da operação', async () => {
      const id = randomUUID(),
        p = { ...photo, id: randomUUID(), visit_id: id };
      p.storage_path = `${ids[2]}/${id}/${p.id}.jpg`;
      const before = await count('technical_visits');
      await assert.rejects(
        sync(id, { kind: 'visit', visit: visit(id), photos: [p] }),
        /Envie a foto/,
      );
      assert.equal(await count('technical_visits'), before);
      await assert.rejects(
        sync(id, {
          kind: 'visit',
          visit: visit(id),
          photos: [{ ...p, storage_path: `${ids[0]}/${id}/${p.id}.jpg` }],
        }),
        /Dados da foto/,
      );
      await assert.rejects(
        db.query('insert into storage.objects(bucket_id,name) values($1,$2)', [
          'meu-agro-visit-photos',
          `${ids[0]}/${id}/${p.id}.jpg`,
        ]),
        /row-level security/,
      );
    });
    await t.test(
      'rejeita campos não previstos, ficha incompleta e datas de retorno anteriores',
      async () => {
        for (const extra of [
          { anamnesis: { reason: 'x', unknown: 'x' } },
          { anamnesis: { reason: '' } },
          { next_visit: '2026-10-14' },
        ]) {
          const id = randomUUID();
          await assert.rejects(sync(id, { kind: 'visit', visit: visit(id, extra), photos: [] }));
        }
      },
    );
    await t.test('revogar gerente remove leitura da ficha e de suas fotos', async () => {
      await as(1);
      await rpc('management_command', [
        'grant',
        { seller_id: company, agent_id: ids[1], role: 'representative', finance: false },
        randomUUID(),
      ]);
      await as(2);
      assert.equal(await count('technical_visits'), 0);
      assert.equal(await count('technical_visit_photos'), 0);
      assert.equal((await db.query('select name from storage.objects')).rows.length, 0);
      await as(1);
      const m = (await db.query('select id from commerce_memberships where user_id=$1', [ids[2]]))
        .rows[0];
      await commerce('end_membership', { membership_id: m.id });
      await as(3);
      assert.equal(await count('technical_visits'), 1);
      assert.equal((await db.query('select name from storage.objects')).rows.length, 0);
      const id = randomUUID();
      await assert.rejects(
        sync(id, { kind: 'visit', visit: visit(id, { seller_id: company }), photos: [] }),
        /vínculo com esta empresa/,
      );
    });
    await t.test(
      'tabelas e recibos recusam escrita direta; anônimos não executam sincronização',
      async () => {
        await assert.rejects(db.exec('delete from technical_visits'), /permission denied/);
        await assert.rejects(
          db.exec('select * from technical_visit_operations'),
          /permission denied/,
        );
        await as(null, 'anon');
        await assert.rejects(sync(randomUUID(), { kind: 'visit' }), /permission denied/);
        await db.exec('reset role');
        await db.exec(migration);
        assert.equal(await count('technical_visits'), 2);
      },
    );
  } finally {
    await db.close();
  }
});
