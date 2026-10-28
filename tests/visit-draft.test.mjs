import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { createOfflineStore } from '../src/offline/store.js';
import { createOfflineEngine } from '../src/offline/engine.js';
import { createVisitDraft } from '../src/modules/visits/visitDraft.js';
function setup() {
  const store = createOfflineStore('drafts', new IDBFactory());
  let user = 'alice';
  const currentUser = () => user;
  return {
    store,
    currentUser,
    session: () => createVisitDraft({ store, currentUser }),
    setUser: (value) => {
      user = value;
    },
  };
}
test('rascunho recupera campos e bytes das fotos, sem URLs temporárias e separado por conta', async () => {
  const f = setup(),
    draft = f.session();
  assert.equal(await draft.load(), null);
  await draft.save({ producer_name: 'João', anamnesis: { reason: 'Em preenchimento' } }, [
    {
      file: new Blob(['foto'], { type: 'image/jpeg' }),
      description: 'Folha',
      preview: 'blob:temporaria',
    },
  ]);
  const restored = await f.session().load();
  assert.equal(restored.form.producer_name, 'João');
  assert.equal(await restored.attachments[0].file.text(), 'foto');
  assert.equal(restored.attachments[0].description, 'Folha');
  assert.equal(Object.hasOwn(restored.attachments[0], 'preview'), false);
  f.setUser('bob');
  assert.equal(await f.session().load(), null);
  await assert.rejects(draft.save({}, []), /conta mudou/);
  f.setUser('alice');
  assert.equal((await f.session().load()).form.producer_name, 'João');
});
test('outra aba não sobrescreve nem descarta uma revisão nova', async () => {
  const f = setup(),
    a = f.session(),
    b = f.session();
  await a.load();
  await b.load();
  await a.save({ producer_name: 'Primeira aba' }, []);
  await assert.rejects(b.save({ producer_name: 'Segunda aba' }, []), /outra aba/);
  await assert.rejects(b.discard(), /outra aba/);
  assert.equal((await f.session().load()).form.producer_name, 'Primeira aba');
  await a.discard();
  assert.equal(await f.session().load(), null);
});
test('registrar grava operação e fotos e remove rascunho atomicamente; conflito não deixa fila parcial', async () => {
  const f = setup(),
    draft = f.session();
  await draft.load();
  await draft.save({ producer_name: 'João' }, []);
  const guard = await draft.seal();
  const engine = createOfflineEngine({
    store: f.store,
    currentUser: f.currentUser,
    online: () => false,
    send: async () => {},
  });
  const operation = {
    id: 'visit1',
    user: 'alice',
    createdAt: 1,
    payload: { kind: 'visit', visit: { id: 'visit1' } },
  };
  await engine.enqueue(
    operation,
    [{ table: 'technical_visits', row: { id: 'visit1' } }],
    [['alice:photo:test', new Blob(['foto'])]],
    guard,
  );
  assert.equal(await f.session().load(), null);
  assert.equal((await engine.operations()).length, 1);
  assert.equal(await (await f.store.get('alice:photo:test')).text(), 'foto');
  await assert.rejects(
    engine.enqueue(
      { ...operation, id: 'visit2' },
      [{ table: 'technical_visits', row: { id: 'visit2' } }],
      [],
      guard,
    ),
    /outra aba/,
  );
  assert.equal((await engine.operations()).length, 1);
  assert.equal((await engine.localRows('technical_visits')).length, 1);
});
test('gravações rápidas preservam a última versão; falha de transação preserva o rascunho', async () => {
  const f = setup(),
    draft = f.session();
  await draft.load();
  await Promise.all([draft.save({ value: 'a' }, []), draft.save({ value: 'b' }, [])]);
  assert.equal((await f.session().load()).form.value, 'b');
  const guard = await draft.seal();
  await assert.rejects(f.store.batch([['invalid', () => {}]], [guard.key], guard));
  assert.equal((await f.session().load()).form.value, 'b');
});
