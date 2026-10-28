import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { createOfflineStore } from '../src/offline/store.js';
import { createOfflineEngine } from '../src/offline/engine.js';
import { createCachedFetch } from '../src/offline/readCache.js';
function fixture(send = async () => {}) {
  const factory = new IDBFactory(),
    store = createOfflineStore('test', factory);
  let user = 'alice',
    connected = false;
  const options = { store, send, currentUser: () => user, online: () => connected };
  return {
    store,
    factory,
    options,
    engine: createOfflineEngine(options),
    user: (value) => {
      user = value;
    },
    online: (value) => {
      connected = value;
    },
  };
}
function event(id = 'event-1') {
  return {
    id,
    user: 'alice',
    createdAt: 1,
    payload: {
      kind: 'event',
      event: { id, production_cycle_id: 'cycle-1', title: 'Praga encontrada' },
    },
  };
}
const record = (op) => [{ table: 'production_events', row: op.payload.event }];

test('IndexedDB persists operations, field rows and photo bytes across engine reloads', async () => {
  const f = fixture(),
    op = event();
  op.file = new Blob(['photo'], { type: 'image/jpeg' });
  await f.engine.enqueue(op, record(op));
  const reloaded = createOfflineEngine({
    ...f.options,
    store: createOfflineStore('test', f.factory),
  });
  assert.equal((await reloaded.operations()).length, 1);
  assert.equal(await (await reloaded.operations())[0].file.text(), 'photo');
  assert.equal((await reloaded.localRows('production_events'))[0].title, 'Praga encontrada');
});
test('an aborted local transaction does not show success or leave a partial queue', async () => {
  const f = fixture(),
    op = event();
  await assert.rejects(f.engine.enqueue(op, record(op), [[null, { bad: true }]]));
  assert.deepEqual(await f.engine.operations(), []);
  assert.deepEqual(await f.engine.localRows('production_events'), []);
});
test('retry after response loss keeps the same operation ID and never drops pending data', async () => {
  const seen = [],
    committed = new Set();
  let fail = true;
  const f = fixture(async (op) => {
    seen.push(op.id);
    committed.add(op.id);
    if (fail) throw Error('Conexão perdida após gravar');
  });
  const op = event();
  await f.engine.enqueue(op, record(op));
  f.online(true);
  await f.engine.sync();
  assert.equal((await f.engine.operations())[0].error, 'Conexão perdida após gravar');
  fail = false;
  await f.engine.sync({manual:true});
  assert.deepEqual(seen, ['event-1', 'event-1']);
  assert.equal(committed.size, 1);
  assert.equal((await f.engine.operations()).length, 0);
  f.online(false);
  const rows = await f.engine.merge('production_events', []);
  assert.equal(rows[0].id, op.id);
  assert.equal(rows[0].offline_pending, false);
  f.online(true);
  await f.engine.merge(
    'production_events',
    [{ ...op.payload.event, title: 'Server canonical' }],
    () => true,
    true,
  );
  assert.equal((await f.engine.localRows('production_events')).length, 0);
});
test('queued photos follow their parent events, even with identical timestamps', async () => {
  const order = [],
    f = fixture(async (op) => {
      order.push(op.id);
    });
  const op = event('z-event');
  await f.engine.enqueue(op, record(op));
  await f.engine.enqueue(
    {
      id: 'a-photo',
      user: 'alice',
      createdAt: 1,
      payload: { kind: 'photo', photo: { production_event_id: 'z-event' } },
    },
    [],
  );
  f.online(true);
  await Promise.all([f.engine.sync(), f.engine.sync()]);
  assert.deepEqual(order, ['z-event', 'a-photo']);
});
test('account switch isolates field records and queues; late responses cannot send next operation', async () => {
  let release,
    calls = 0;
  const f = fixture(() => {
    calls++;
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  const a = event(),
    b = event('event-2');
  await f.engine.enqueue(a, record(a));
  await f.engine.enqueue(b, record(b));
  f.online(true);
  const syncing = f.engine.sync();
  while (!release) await new Promise((resolve) => setTimeout(resolve, 0));
  f.user('bob');
  assert.deepEqual(await f.engine.operations(), []);
  assert.deepEqual(await f.engine.localRows('production_events'), []);
  await assert.rejects(f.engine.enqueue(event('forged'), []));
  release();
  await syncing;
  assert.equal(calls, 1);
  f.user('alice');
  assert.equal((await f.engine.operations()).length, 1);
});
test('permission failure preserves dependent photo and stops automatic retries in this run', async () => {
  const f = fixture(async () => {
    throw Error('Plantio arquivado');
  });
  const a = event();
  await f.engine.enqueue(a, record(a));
  await f.engine.enqueue(
    {
      id: 'photo',
      user: 'alice',
      createdAt: 2,
      payload: { kind: 'photo', photo: { production_event_id: a.id } },
    },
    [],
  );
  f.online(true);
  await f.engine.sync();
  assert.equal((await f.engine.operations()).length, 2);
  assert.equal((await f.engine.operations())[0].attempts, 1);
});

test('cache survives reload, separates accounts and variants, and rejects writes offline', async () => {
  const f = fixture();
  f.online(true);
  let count = 0;
  const options = {
    ...f.options,
    origin: 'https://db.test',
    fetcher: async () =>
      new Response(JSON.stringify([{ id: ++count }]), {
        headers: { 'content-type': 'application/json' },
      }),
  };
  const cached = createCachedFetch(options),
    url = 'https://db.test/rest/v1/properties?select=*';
  assert.deepEqual(await (await cached(url)).json(), [{ id: 1 }]);
  f.online(false);
  const reload = createCachedFetch({ ...options, store: createOfflineStore('test', f.factory) });
  assert.deepEqual(await (await reload(url)).json(), [{ id: 1 }]);
  await assert.rejects(reload(url, { headers: { range: '0-2' } }), /Dados indisponíveis/);
  await assert.rejects(reload(url, { method: 'POST', body: '{}' }), /precisa de conexão/);
  await assert.rejects(
    reload('https://db.test/rest/v1/commerce_memberships'),
    /precisa de conexão/,
  );
  f.user('bob');
  await assert.rejects(reload(url), /Dados indisponíveis/);
});
test('offline count responses keep Content-Range without an illegal HEAD body', async () => {
  const f = fixture();
  f.online(true);
  const cached = createCachedFetch({
    ...f.options,
    origin: 'https://db.test',
    fetcher: async () => new Response(null, { headers: { 'content-range': '*/3' } }),
  });
  const url = 'https://db.test/rest/v1/areas?select=id';
  await cached(url, { method: 'HEAD' });
  f.online(false);
  const response = await cached(url, { method: 'HEAD' });
  assert.equal(response.headers.get('content-range'), '*/3');
  assert.equal(await response.text(), '');
});
test('network errors use downloaded reads; 401/403 never fall back to stale authorization', async () => {
  const f = fixture();
  f.online(true);
  let response = new Response('[]');
  const cached = createCachedFetch({
    ...f.options,
    origin: 'https://db.test',
    fetcher: async () => {
      if (!response) throw TypeError('offline');
      return response.clone();
    },
  });
  const url = 'https://db.test/rest/v1/production_cycles?select=*';
  await cached(url);
  response = null;
  assert.equal((await cached(url)).status, 200);
  response = new Response('forbidden', { status: 403 });
  assert.equal((await cached(url)).status, 403);
  f.online(false);
  await assert.rejects(cached(url), /Dados indisponíveis/);
});
test('a failed background cache write does not fail an online query', async () => {
  const cached = createCachedFetch({
    store: {
      batch: async () => {
        throw Error('Quota');
      },
    },
    origin: 'https://db.test',
    currentUser: () => 'alice',
    online: () => true,
    fetcher: async () => new Response('[]'),
  });
  assert.deepEqual(await (await cached('https://db.test/rest/v1/properties')).json(), []);
});
test('preparation requires fresh responses and successful durable cache writes', async () => {
  const f = fixture();
  f.online(true);
  let failNetwork = false,
    strict = false;
  const options = {
    ...f.options,
    origin: 'https://db.test',
    strict: () => strict,
    fetcher: async () => {
      if (failNetwork) throw TypeError('offline');
      return new Response('[]');
    },
  };
  const cached = createCachedFetch(options),
    url = 'https://db.test/rest/v1/properties';
  await cached(url);
  strict = true;
  failNetwork = true;
  await assert.rejects(cached(url), /conexão falhou durante o preparo/);
  const full = createCachedFetch({
    ...options,
    fetcher: async () => new Response('[]'),
    store: {
      batch: async () => {
        throw Error('Quota');
      },
    },
  });
  await assert.rejects(full(url), /Libere espaço/);
});
test('a visit with several photos is durable and precedes additional photos in the outbox', async () => {
  const order = [],
    f = fixture(async (op) => order.push(op.id));
  const visit = {
    id: 'z-visit',
    user: 'alice',
    createdAt: 1,
    payload: { kind: 'visit', visit: { id: 'z-visit' } },
    files: [{ file: new Blob(['one']) }, { file: new Blob(['two']) }],
  };
  await f.engine.enqueue(visit, [{ table: 'technical_visits', row: { id: 'z-visit' } }]);
  await f.engine.enqueue(
    {
      id: 'a-photo',
      user: 'alice',
      createdAt: 1,
      payload: { kind: 'visit_photo', photo: { id: 'a-photo', visit_id: 'z-visit' } },
    },
    [],
  );
  const restored = createOfflineEngine({
    ...f.options,
    store: createOfflineStore('test', f.factory),
  });
  assert.equal(await (await restored.operations())[0].files[1].file.text(), 'two');
  f.online(true);
  await restored.sync();
  assert.deepEqual(order, ['z-visit', 'a-photo']);
});
test('only author-filtered visit queries can be served from the offline cache', async () => {
  const f = fixture();
  f.online(true);
  const cached = createCachedFetch({
    ...f.options,
    origin: 'https://db.test',
    fetcher: async () => new Response('[]'),
  });
  const own = 'https://db.test/rest/v1/technical_visits?author_id=eq.alice',
    team = 'https://db.test/rest/v1/technical_visits?select=*';
  await cached(own);
  await cached(team);
  f.online(false);
  assert.deepEqual(await (await cached(own)).json(), []);
  await assert.rejects(cached(team), /precisa de conexão/);
});
