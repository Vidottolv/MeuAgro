import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { managementFixture } from './management-fixture.mjs';

test('compartilhamento: consentimento, escopo, relatório explícito e revogação', async (t) => {
  const { db, as, ids, commerce } = await managementFixture();
  const property = '10000000-0000-4000-8000-000000000001'; // belongs to user4
  const rpc = async (name, values = []) =>
    (
      await db.query(
        `select public.${name}(${values.map((_, i) => '$' + (i + 1)).join(',')}) r`,
        values,
      )
    ).rows[0].r;
  const command = (action, data) => rpc('property_share_command', [action, data]);
  let grant, visit;
  try {
    await db.exec(`create table public.areas(id uuid primary key,user_id uuid,property_id uuid,deleted_at timestamptz,name text);
      create table public.crops(id uuid primary key,user_id uuid,is_system boolean,active boolean,name text);
      create table public.production_cycles(id uuid primary key,user_id uuid,property_id uuid,area_id uuid,crop_id uuid,deleted_at timestamptz,variety text,status text,planting_date date);
      create table public.production_events(id uuid primary key,user_id uuid,production_cycle_id uuid,title text,description text,occurred_at timestamptz);
      create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      create function storage.foldername(p text) returns text[] language sql immutable as $$select string_to_array(p,'/')$$;`);
    await db.exec(
      readFileSync(new URL('../supabase/stage_33_technical_visits.sql', import.meta.url), 'utf8'),
    );
    const migration = readFileSync(
      new URL('../supabase/stage_34_property_sharing.sql', import.meta.url),
      'utf8',
    );
    await db.exec(migration);
    await db.exec(migration);
    const area = randomUUID(),
      crop = randomUUID(),
      cycle = randomUUID();
    await db.query('insert into areas(id,user_id,property_id,name) values($1,$2,$3,$4)', [
      area,
      ids[3],
      property,
      'Talhão Norte',
    ]);
    await db.query('insert into crops values($1,null,true,true,$2)', [crop, 'Milho']);
    await db.query(
      "insert into production_cycles values($1,$2,$3,$4,$5,null,'Doce','planted','2026-10-01')",
      [cycle, ids[3], property, area, crop],
    );
    await db.query(
      "insert into production_events values($1,$2,$3,'Vistoria','Folhas observadas',now())",
      [randomUUID(), ids[3], cycle],
    );
    await as(2);
    await commerce('enable', { name: 'Consultor Teste' });
    await as(4);
    await t.test('somente dono convida, sem conceder leitura antes do aceite', async () => {
      grant = await command('invite', { property_id: property, email: ' User2@Example.Test ' });
      assert.equal(
        (await command('invite', { property_id: property, email: 'user2@example.test' })).id,
        grant.id,
      );
      await assert.rejects(rpc('property_share_detail', [grant.id]));
      await as(3);
      assert.deepEqual(await rpc('property_share_list'), []);
      await assert.rejects(
        command('invite', { property_id: property, email: 'user2@example.test' }),
      );
      await assert.rejects(command('accept', { id: grant.id }));
      await as(2);
      assert.equal((await rpc('property_share_list')).length, 1);
      await assert.rejects(rpc('property_share_detail', [grant.id]));
    });
    await t.test(
      'aceite vincula a conta, mantém tabelas próprias isoladas e devolve somente campos permitidos',
      async () => {
        assert.equal((await command('accept', { id: grant.id })).status, 'active');
        assert.equal((await command('accept', { id: grant.id })).status, 'active');
        assert.deepEqual(
          (await db.query('select * from properties where id=$1', [property])).rows,
          [],
        );
        const detail = await rpc('property_share_detail', [grant.id]);
        assert.equal(detail.property.name, 'Fazenda do produtor');
        assert.equal(detail.areas[0].name, 'Talhão Norte');
        assert.equal(detail.cycles[0].crop, 'Milho');
        assert.equal(detail.events[0].description, 'Folhas observadas');
        assert.equal(Object.hasOwn(detail.property, 'notes'), false);
        assert.equal(Object.hasOwn(detail, 'inventory'), false);
        await assert.rejects(db.query('select * from property_shares'));
      },
    );
    await t.test(
      'ficha permanece privada até autorização explícita e pode ser retirada',
      async () => {
        visit = randomUUID();
        await rpc('sync_visit_operation', [
          ids[1],
          visit,
          {
            kind: 'visit',
            visit: {
              id: visit,
              producer_name: 'Produtor Teste',
              site_name: 'Fazenda do produtor',
              visited_at: '2026-10-16T12:00:00Z',
              priority: 'medium',
              anamnesis: { reason: 'Manchas nas folhas' },
            },
            photos: [],
          },
        ]);
        await as(4);
        assert.equal((await rpc('property_share_detail', [grant.id])).reports.length, 0);
        assert.deepEqual(
          (await db.query('select * from technical_visits where id=$1', [visit])).rows,
          [],
        );
        await assert.rejects(command('share_report', { id: grant.id, visit_id: visit }));
        await as(2);
        await command('share_report', { id: grant.id, visit_id: visit });
        await command('share_report', { id: grant.id, visit_id: visit });
        await as(4);
        const detail = await rpc('property_share_detail', [grant.id]);
        assert.equal(detail.reports[0].anamnesis.reason, 'Manchas nas folhas');
        assert.equal(Object.hasOwn(detail.reports[0], 'photos'), false);
        assert.equal(detail.audit.filter((a) => a.action === 'share_report').length, 1);
        await as(2);
        await command('unshare_report', { id: grant.id, visit_id: visit });
        assert.equal((await rpc('property_share_detail', [grant.id])).reports.length, 0);
      },
    );
    await t.test('troca de dono do e-mail não revela vínculo já aceito', async () => {
      await as(null, 'postgres');
      await db.query('update auth.users set email=$1 where id=$2', [
        'novo-consultor@example.test',
        ids[1],
      ]);
      await db.query('update auth.users set email=$1 where id=$2', ['user2@example.test', ids[2]]);
      await as(3);
      assert.deepEqual(await rpc('property_share_list'), []);
      await assert.rejects(command('accept', { id: grant.id }));
      await assert.rejects(rpc('property_share_detail', [grant.id]));
      await as(null, 'postgres');
      await db.query('update auth.users set email=$1 where id=$2', ['user3@example.test', ids[2]]);
      await db.query('update auth.users set email=$1 where id=$2', ['user2@example.test', ids[1]]);
    });
    await t.test('conta alheia e escritas diretas não contornam permissões', async () => {
      await as(3);
      await assert.rejects(rpc('property_share_detail', [grant.id]));
      await assert.rejects(command('revoke', { id: grant.id }));
      await assert.rejects(command('share_report', { id: grant.id, visit_id: visit }));
      await assert.rejects(
        db.query('insert into property_share_audit(share_id,actor_id,action) values($1,$2,$3)', [
          grant.id,
          ids[2],
          'accept',
        ]),
      );
      await assert.rejects(
        db.query("update property_shares set status='active' where id=$1", [grant.id]),
      );
      await as(null, 'postgres');
      await db.query('update properties set deleted_at=now() where id=$1', [property]);
      await as(2);
      await assert.rejects(rpc('property_share_detail', [grant.id]));
      await as(null, 'postgres');
      await db.query('update properties set deleted_at=null where id=$1', [property]);
      await db.query('update commerce_accounts set enabled=false where user_id=$1', [ids[1]]);
      await as(2);
      await assert.rejects(rpc('property_share_detail', [grant.id]));
      await as(null, 'postgres');
      await db.query('update commerce_accounts set enabled=true where user_id=$1', [ids[1]]);
    });
    await t.test(
      'revogação bloqueia nova consulta e não pode ser desfeita por aceite antigo',
      async () => {
        await as(4);
        await command('revoke', { id: grant.id });
        await command('revoke', { id: grant.id });
        await assert.rejects(rpc('property_share_detail', [grant.id]));
        await as(2);
        await assert.rejects(rpc('property_share_detail', [grant.id]));
        await assert.rejects(command('accept', { id: grant.id }));
        await assert.rejects(command('share_report', { id: grant.id, visit_id: visit }));
      },
    );
    await t.test('expiração, recusa e conta sem consultoria não concedem acesso', async () => {
      await as(4);
      const expired = await command('invite', {
        property_id: property,
        email: 'user2@example.test',
      });
      await as(null, 'postgres');
      await db.query("update property_shares set expires_at=now()-interval '1 day' where id=$1", [
        expired.id,
      ]);
      await as(2);
      await assert.rejects(command('accept', { id: expired.id }));
      await as(4);
      const fresh = await command('invite', { property_id: property, email: 'user2@example.test' });
      assert.notEqual(fresh.id, expired.id);
      await as(2);
      await command('decline', { id: fresh.id });
      await assert.rejects(command('accept', { id: fresh.id }));
      await as(4);
      const noConsultant = await command('invite', {
        property_id: property,
        email: 'user3@example.test',
      });
      await as(3);
      await assert.rejects(command('accept', { id: noConsultant.id }));
      await as(null, 'anon');
      await assert.rejects(rpc('property_share_list'));
      await assert.rejects(command('accept', { id: noConsultant.id }));
    });
  } finally {
    await db.close();
  }
});
