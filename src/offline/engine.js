import { syncFailure, pendingArchive } from './syncRecovery.js';
export function createOfflineEngine({
  store,
  send,
  currentUser,
  online,
  changed = () => {},
  now = Date.now,
  canReconcile = () => true,
}) {
  let running;
  const prefix = (user, type) => `${user}:${type}:`;
  const recordKey = (user, table, id) => `${prefix(user, 'record')}${table}:${id}`;
  async function operations(user = currentUser()) {
    const items = user
      ? (await store.all(prefix(user, 'operation'))).sort(
          (a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id),
        )
      : [];
    const events = new Map(
      items
        .filter((o) => o.payload.event || o.payload.visit)
        .map((o) => [(o.payload.event || o.payload.visit).id, o]),
    );
    const ordered = [],
      visited = new Set();
    function visit(item) {
      if (visited.has(item.id)) return;
      visited.add(item.id);
      const dependency = events.get(
        item.payload.photo?.production_event_id || item.payload.photo?.visit_id,
      );
      if (dependency && dependency.id !== item.id) visit(dependency);
      ordered.push(item);
    }
    items.forEach(visit);
    return ordered;
  }
  async function enqueue(operation, records, assets = [], draft = null) {
    const user = currentUser();
    if (!user || operation.user !== user) throw Error('Entre novamente antes de salvar.');
    if (draft && (draft.key !== `${user}:visit-draft` || !draft.revision))
      throw Error('Rascunho inválido para esta conta.');
    const saved = await store.batch(
      [
        [`${prefix(user, 'operation')}${operation.id}`, operation],
        ...records.map(({ table, row }) => [
          recordKey(user, table, row.id),
          { table, row, operationId: operation.id },
        ]),
        ...assets,
      ],
      draft ? [draft.key] : [],
      draft,
    );
    if (saved === false)
      throw Error('O rascunho mudou em outra aba. Reabra a visita antes de registrar.');
    changed();
  }
  async function localRows(table) {
    const user = currentUser();
    if (!user) return [];
    return (await store.all(prefix(user, 'record')))
      .filter((r) => r.table === table)
      .map((r) => r.row);
  }
  async function merge(table, remote, matches = () => true, authoritative = false) {
    const user = currentUser();
    if (!user) return remote;
    const records = (await store.all(prefix(user, 'record'))).filter((r) => r.table === table);
    const pending = new Set((await operations(user)).map((op) => op.id));
    const prune = authoritative && canReconcile(table);
    if (prune) {
      await store.batch(
        [],
        records
          .filter((r) => matches(r.row) && !pending.has(r.operationId))
          .map((r) => recordKey(user, table, r.row.id)),
      );
    }
    const map = new Map(remote.map((r) => [r.id, r]));
    for (const r of records) {
      if (
        matches(r.row) &&
        (!authoritative || (!prune && !map.has(r.row.id)) || pending.has(r.operationId))
      )
        map.set(r.row.id, { ...r.row, offline_pending: pending.has(r.operationId) });
    }
    if (user !== currentUser()) throw Error('A conta mudou. Abra a página novamente.');
    return [...map.values()];
  }
  async function drain(manual = false) {
    const user = currentUser();
    if (!user || !online()) return;
    const queue = await operations(user),
      pending = new Set(queue.map((op) => op.id));
    const parents = new Map(
      queue
        .filter((op) => op.payload.event || op.payload.visit)
        .map((op) => [(op.payload.event || op.payload.visit).id, op.id]),
    );
    for (const operation of queue) {
      if (!online() || user !== currentUser()) break;
      const parent =
        operation.payload.photo?.production_event_id || operation.payload.photo?.visit_id;
      const dependency = parents.get(parent);
      if (dependency && dependency !== operation.id && pending.has(dependency)) continue;
      if (operation.syncState === 'review' || (!manual && operation.nextAttemptAt > now()))
        continue;
      try {
        await send(operation, () => user === currentUser());
        // A late response must never remove another account's queue.
        await store.batch([], [`${prefix(user, 'operation')}${operation.id}`]);
        pending.delete(operation.id);
      } catch (error) {
        const failure = syncFailure(error),
          attempts = (operation.attempts || 0) + 1;
        await store.batch([
          [
            `${prefix(user, 'operation')}${operation.id}`,
            {
              ...operation,
              error: failure.message,
              errorCode: failure.code,
              syncState: failure.state,
              attempts,
              lastAttemptAt: now(),
              nextAttemptAt:
                failure.state === 'retry'
                  ? now() + Math.min(900000, 30000 * 2 ** Math.min(attempts - 1, 5))
                  : null,
            },
          ],
        ]);
        // A blocked parent keeps its photos pending, without freezing unrelated visits.
        if (
          failure.code === 'SESSION_REQUIRED' ||
          String(error.status || error.statusCode) === '401'
        )
          break;
      } finally {
        changed();
      }
    }
  }
  function sync({ manual = false } = {}) {
    return (running ||= (
      globalThis.navigator?.locks
        ? navigator.locks.request('meu-agro-offline-sync', () => drain(manual))
        : drain(manual)
    ).finally(() => {
      running = null;
    }));
  }
  async function retry(id) {
    if (running) throw Error('Aguarde a sincronização atual terminar.');
    const work = async () => {
      const user = currentUser();
      if (!user) throw Error('Entre na sua conta.');
      const key = `${prefix(user, 'operation')}${id}`,
        op = await store.get(key);
      if (!op || op.user !== user || user !== currentUser())
        throw Error('Pendência indisponível nesta conta.');
      await store.batch([
        [key, { ...op, syncState: 'retry', nextAttemptAt: 0, error: null, errorCode: null }],
      ]);
      changed();
    };
    running = (
      globalThis.navigator?.locks ? navigator.locks.request('meu-agro-offline-sync', work) : work()
    ).finally(() => {
      running = null;
    });
    return running;
  }
  async function backup() {
    const user = currentUser(),
      queue = await operations(user),
      ids = new Set(queue.map((op) => op.id));
    const records = (await store.all(prefix(user, 'record'))).filter((r) => ids.has(r.operationId));
    return pendingArchive(user, queue, records, currentUser, now);
  }
  return { enqueue, operations, localRows, merge, sync, retry, backup };
}
