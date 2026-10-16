export function createOfflineEngine({ store, send, currentUser, online, changed = () => {} }) {
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
  async function enqueue(operation, records, assets = []) {
    const user = currentUser();
    if (!user || operation.user !== user) throw Error('Entre novamente antes de salvar.');
    await store.batch([
      [`${prefix(user, 'operation')}${operation.id}`, operation],
      ...records.map(({ table, row }) => [
        recordKey(user, table, row.id),
        { table, row, operationId: operation.id },
      ]),
      ...assets,
    ]);
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
    const pending = new Set((await operations(user)).map((op) => op.id));
    const records = (await store.all(prefix(user, 'record'))).filter((r) => r.table === table);
    if (authoritative) {
      const ids = new Set(remote.map((r) => r.id));
      await store.batch(
        [],
        records
          .filter((r) => ids.has(r.row.id) && !pending.has(r.operationId))
          .map((r) => recordKey(user, table, r.row.id)),
      );
    }
    const map = new Map(remote.map((r) => [r.id, r]));
    for (const r of records) {
      if (matches(r.row) && (!authoritative || !map.has(r.row.id) || pending.has(r.operationId)))
        map.set(r.row.id, { ...r.row, offline_pending: pending.has(r.operationId) });
    }
    if (user !== currentUser()) throw Error('A conta mudou. Abra a página novamente.');
    return [...map.values()];
  }
  async function drain() {
    const user = currentUser();
    if (!user || !online()) return;
    for (const operation of await operations(user)) {
      if (!online() || user !== currentUser()) break;
      try {
        await send(operation, () => user === currentUser());
        // A late response must never remove another account's queue.
        await store.batch([], [`${prefix(user, 'operation')}${operation.id}`]);
      } catch (error) {
        await store.batch([
          [
            `${prefix(user, 'operation')}${operation.id}`,
            {
              ...operation,
              error: error.message || 'Falha ao enviar. Tente novamente.',
              attempts: (operation.attempts || 0) + 1,
            },
          ],
        ]);
        break; // Preserve dependencies: a photo may reference the preceding event.
      } finally {
        changed();
      }
    }
  }
  function sync() {
    return (running ||= (
      globalThis.navigator?.locks
        ? navigator.locks.request('meu-agro-offline-sync', drain)
        : drain()
    ).finally(() => {
      running = null;
    }));
  }
  return { enqueue, operations, localRows, merge, sync };
}
