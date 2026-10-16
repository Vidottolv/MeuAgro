// One transaction commits an operation and its visible records together.
export function createOfflineStore(name, indexedDB = globalThis.indexedDB) {
  let opening;
  function open() {
    if (!indexedDB) throw Error('Este dispositivo não oferece armazenamento offline.');
    return (opening ||= new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore('entries', { keyPath: 'key' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        opening = null;
        reject(request.error);
      };
      request.onblocked = () => {
        opening = null;
        reject(Error('Feche outras abas para preparar o armazenamento offline.'));
      };
    }));
  }
  async function transaction(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () =>
        reject(
          tx.error ||
            Error('Não foi possível salvar no dispositivo. Libere espaço e tente novamente.'),
        );
      try {
        action(tx.objectStore('entries'), (value) => {
          result = value;
        });
      } catch (error) {
        tx.abort();
        reject(error);
      }
    });
  }
  return {
    removePrefix: (prefix) =>
      transaction('readwrite', (store) => {
        const r = store.openCursor();
        r.onsuccess = () => {
          const cursor = r.result;
          if (!cursor) return;
          if (cursor.key.startsWith(prefix)) cursor.delete();
          cursor.continue();
        };
      }),
    get: (key) =>
      transaction('readonly', (store, done) => {
        const r = store.get(key);
        r.onsuccess = () => done(r.result?.value);
      }),
    all: (prefix) =>
      transaction('readonly', (store, done) => {
        const r = store.getAll();
        r.onsuccess = () =>
          done(r.result.filter((row) => row.key.startsWith(prefix)).map((row) => row.value));
      }),
    batch: (puts = [], deletes = []) =>
      transaction('readwrite', (store) => {
        for (const [key, value] of puts) store.put({ key, value });
        for (const key of deletes) store.delete(key);
      }),
  };
}
