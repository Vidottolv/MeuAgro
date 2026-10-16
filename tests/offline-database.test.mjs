import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

test('offline RPC commits once, validates ownership and preserves atomic photo/event writes', async (t) => {
  const db = new PGlite();
  const user = randomUUID(),
    other = randomUUID(),
    cycle = randomUUID(),
    foreignCycle = randomUUID(),
    property = randomUUID(),
    area = randomUUID();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth, public to anon, authenticated;
      create table public.production_cycles(id uuid primary key, user_id uuid, property_id uuid, area_id uuid, deleted_at timestamptz);
      create table public.production_events(id uuid primary key, user_id uuid not null, production_cycle_id uuid references public.production_cycles(id), event_type text not null check(event_type in ('photo','observation')), title text not null, description text, notes text, occurred_at timestamptz not null);
      create table public.event_photos(id uuid primary key, user_id uuid not null, property_id uuid, area_id uuid, production_cycle_id uuid references public.production_cycles(id), production_event_id uuid references public.production_events(id), storage_path text not null, description text, captured_at timestamptz not null);
      alter table public.production_events enable row level security;
      alter table public.event_photos enable row level security;`);
    await db.query('insert into auth.users values($1),($2)', [user, other]);
    await db.query('insert into production_cycles values($1,$2,$3,$4,null),($5,$6,$3,$4,null)', [
      cycle,
      user,
      property,
      area,
      foreignCycle,
      other,
    ]);
    const migration = readFileSync(
      new URL('../supabase/stage_31_offline_field.sql', import.meta.url),
      'utf8',
    );
    await db.exec(migration);
    async function as(id, role = 'authenticated') {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || '']);
      await db.exec(`set role ${role}`);
    }
    const sync = async (id, payload, acting = user) =>
      (
        await db.query('select public.sync_field_operation($1,$2,$3::jsonb) result', [
          acting,
          id,
          JSON.stringify(payload),
        ])
      ).rows[0].result;
    const event = (id, cycleId = cycle) => ({
      id,
      user_id: other,
      production_cycle_id: cycleId,
      event_type: 'observation',
      title: 'Praga no talhão',
      occurred_at: '2026-10-15T12:00:00Z',
    });
    const photo = (id, eventId = null) => ({
      id,
      property_id: property,
      area_id: area,
      production_cycle_id: cycle,
      production_event_id: eventId,
      storage_path: `${user}/${property}/${cycle}/${id}.jpg`,
      captured_at: '2026-10-15T12:00:00Z',
    });
    const count = async (table) => {
      await db.exec('reset role');
      const result = Number((await db.query('select count(*) c from public.' + table)).rows[0].c);
      await as(user);
      return result;
    };
    await as(user);
    const id = randomUUID(),
      payload = { kind: 'event', event: event(id) };
    await t.test(
      'same operation and payload is idempotent; forged user field is ignored',
      async () => {
        assert.equal((await sync(id, payload)).synced, true);
        assert.deepEqual(await sync(id, payload), { id, synced: true });
        assert.equal(await count('production_events'), 1);
        await db.exec('reset role');
        assert.equal(
          (await db.query('select user_id from production_events where id=$1', [id])).rows[0]
            .user_id,
          user,
        );
        await as(user);
        await assert.rejects(
          sync(id, { ...payload, event: { ...payload.event, title: 'Overwrite' } }),
          /identificador já foi usado/,
        );
      },
    );
    await t.test('another account cannot replay or write to a foreign cycle', async () => {
      await as(other);
      await assert.rejects(sync(id, payload), /Entre na conta/);
      await as(user);
      const next = randomUUID();
      await assert.rejects(
        sync(next, { kind: 'event', event: event(next, foreignCycle) }),
        /plantio não está mais disponível/,
      );
    });
    await t.test(
      'photo and automatic event commit together and retry does not duplicate either',
      async () => {
        const id = randomUUID(),
          e = randomUUID(),
          p = { kind: 'photo', event: { ...event(e), event_type: 'photo' }, photo: photo(id, e) };
        await sync(id, p);
        await sync(id, p);
        assert.equal(await count('production_events'), 2);
        assert.equal(await count('event_photos'), 1);
      },
    );
    await t.test('a bad photo rolls back its automatic event and ledger', async () => {
      const id = randomUUID(),
        e = randomUUID(),
        before = await count('offline_field_operations');
      await assert.rejects(
        sync(id, {
          kind: 'photo',
          event: event(e),
          photo: { ...photo(id, e), area_id: randomUUID() },
        }),
        /Referências da foto/,
      );
      assert.equal(await count('production_events'), 2);
      assert.equal(await count('offline_field_operations'), before);
    });
    await t.test('a foreign event or storage path cannot be attached', async () => {
      const id = randomUUID();
      await assert.rejects(
        sync(id, { kind: 'photo', photo: photo(id, randomUUID()) }),
        /evento da foto/,
      );
      await assert.rejects(
        sync(id, {
          kind: 'photo',
          photo: { ...photo(id), storage_path: `${other}/${property}/${cycle}/${id}.jpg` },
        }),
        /Referências da foto/,
      );
    });
    await t.test(
      'archived cycles reject new records without acknowledging an operation',
      async () => {
        await db.exec('reset role');
        await db.query('update production_cycles set deleted_at=now() where id=$1', [cycle]);
        await as(user);
        const id = randomUUID();
        await assert.rejects(
          sync(id, { kind: 'event', event: event(id) }),
          /plantio não está mais disponível/,
        );
      },
    );
    await t.test('ledger is read-only and private; anonymous calls are denied', async () => {
      const own = await db.query('select * from offline_field_operations');
      assert.equal(own.rows.length, 2);
      await assert.rejects(db.query('delete from offline_field_operations'), /permission denied/);
      await as(other);
      assert.equal((await db.query('select * from offline_field_operations')).rows.length, 0);
      await as(null, 'anon');
      await assert.rejects(sync(randomUUID(), payload), /permission denied/);
      await as(user);
    });
    await t.test('reapplying migration preserves committed operations', async () => {
      await db.exec('reset role');
      await db.exec(migration);
      await as(user);
      assert.equal((await sync(id, payload)).synced, true);
      assert.equal((await db.query('select * from offline_field_operations')).rows.length, 2);
    });
  } finally {
    await db.close();
  }
});
