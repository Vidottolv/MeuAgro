import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { createOfflineStore } from '../src/offline/store.js';
import { createOfflineEngine } from '../src/offline/engine.js';
function fixture(send) {
  const store = createOfflineStore('recovery', new IDBFactory());
  let user = 'alice',
    time = 100000;
  const engine = createOfflineEngine({
    store,
    send,
    currentUser: () => user,
    online: () => true,
    now: () => time,
  });
  const add = async (id, payload = { kind: 'visit', visit: { id } }) =>
    engine.enqueue(
      { id, user, createdAt: time, payload },
      payload.visit ? [{ table: 'technical_visits', row: payload.visit }] : [],
    );
  return { engine, store, add, user: (v) => (user = v), time: (v) => (time = v) };
}
test('permissão revogada pausa visita e fotos, mas outras visitas continuam; nova tentativa é explícita', async () => {
  let allowed = false;
  const sent = [];
  const f = fixture(async (op) => {
    sent.push(op.id);
    if (op.id === 'visit-a' && !allowed)
      throw Object.assign(Error('Vínculo revogado'), { code: '42501' });
  });
  await f.add('visit-a');
  await f.add('photo-a', { kind: 'visit_photo', photo: { visit_id: 'visit-a' } });
  await f.add('visit-b');
  await f.engine.sync();
  assert.deepEqual(sent, ['visit-a', 'visit-b']);
  assert.equal((await f.engine.operations())[0].syncState, 'review');
  await f.engine.sync({ manual: true });
  assert.deepEqual(sent, ['visit-a', 'visit-b']);
  allowed = true;
  await f.engine.retry('visit-a');
  await f.engine.sync();
  assert.deepEqual(sent, ['visit-a', 'visit-b', 'visit-a', 'photo-a']);
  assert.equal((await f.engine.operations()).length, 0);
});
test('rede instável usa espera progressiva persistida, com repetição manual sem mudar identificador', async () => {
  let calls = 0,
    fail = true;
  const f = fixture(async () => {
    calls++;
    if (fail) throw Error('Conexão caiu');
  });
  await f.add('visit');
  await f.engine.sync();
  const op = (await f.engine.operations())[0];
  assert.equal(op.nextAttemptAt, 130000);
  await f.engine.sync();
  assert.equal(calls, 1);
  f.time(130000);
  await f.engine.sync();
  assert.equal(calls, 2);
  assert.equal((await f.engine.operations())[0].nextAttemptAt, 190000);
  fail = false;
  await f.engine.sync({ manual: true });
  assert.equal(calls, 3);
  assert.equal((await f.engine.operations()).length, 0);
});
test('conflito de foto mantém bytes e backup inclui somente a conta atual', async () => {
  const f = fixture(async () => {
    throw Object.assign(Error('Arquivo diferente'), { code: 'LOCAL_FILE_CONFLICT' });
  });
  const file = new Blob(['foto original'], { type: 'image/jpeg' });
  await f.engine.enqueue(
    {
      id: 'photo',
      user: 'alice',
      createdAt: 1,
      payload: { kind: 'photo', photo: { id: 'photo' } },
      file,
    },
    [],
  );
  await f.engine.sync();
  assert.equal((await f.engine.operations())[0].syncState, 'review');
  const backup = await f.engine.backup();
  assert.equal(backup.format, 'meuagro-pending');
  assert.equal(backup.operations[0].file.base64, btoa('foto original'));
  assert.equal(await (await f.engine.operations())[0].file.text(), 'foto original');
  f.user('bob');
  assert.equal((await f.engine.backup()).operations.length, 0);
  await assert.rejects(f.engine.retry('photo'));
});
test('leitura autoritativa remove ponte local confirmada ausente, preservando visita pendente', async () => {
  let fail = false;
  const f = fixture(async () => {
    if (fail) throw Error('Sem rede');
  });
  await f.add('confirmed');
  await f.engine.sync();
  fail = true;
  await f.add('pending');
  await f.engine.sync();
  let merged = await f.engine.merge('technical_visits', [], () => true, true);
  assert.deepEqual(
    merged.map((r) => r.id),
    ['pending'],
  );
  assert.deepEqual(
    (await f.engine.localRows('technical_visits')).map((r) => r.id),
    ['pending'],
  );
});
test('dependência usa o evento embutido na operação de foto, e não apenas o ID da operação', async () => {
  const sent = [];
  const f = fixture(async (op) => {
    sent.push(op.id);
    throw Object.assign(Error('Conflito'), { code: '23505' });
  });
  await f.add('photo-parent', {
    kind: 'photo',
    event: { id: 'embedded-event' },
    photo: { production_event_id: 'embedded-event' },
  });
  await f.add('photo-child', { kind: 'photo', photo: { production_event_id: 'embedded-event' } });
  await f.engine.sync();
  assert.deepEqual(sent, ['photo-parent']);
  assert.equal((await f.engine.operations()).length, 2);
});
test('fallback de cache não elimina ponte confirmada até recuperar leituras confiáveis', async () => {
  const store = createOfflineStore('fallback', new IDBFactory());
  let fresh = false;
  const engine = createOfflineEngine({
    store,
    send: async () => {},
    currentUser: () => 'alice',
    online: () => true,
    canReconcile: () => fresh,
  });
  await engine.enqueue(
    {
      id: 'visit',
      user: 'alice',
      createdAt: 1,
      payload: { kind: 'visit', visit: { id: 'visit' } },
    },
    [{ table: 'technical_visits', row: { id: 'visit' } }],
  );
  await engine.sync();
  assert.equal((await engine.merge('technical_visits', [], () => true, true)).length, 1);
  fresh = true;
  assert.equal((await engine.merge('technical_visits', [], () => true, true)).length, 0);
});
