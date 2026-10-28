// One local draft per backend/account. Optimistic revisions protect other open tabs.
export function createVisitDraft({ store, currentUser }) {
  const user = currentUser(),
    key = `${user}:visit-draft`;
  let revision = null,
    queue = Promise.resolve(),
    sealed = false;
  function account() {
    if (!user || currentUser() !== user) throw Error('A conta mudou. Reabra a visita.');
  }
  function serial(work) {
    const result = queue.then(work);
    queue = result.catch(() => {});
    return result;
  }
  return {
    async load() {
      account();
      const draft = await store.get(key);
      account();
      revision = draft?.revision ?? null;
      return draft || null;
    },
    save(form, attachments) {
      // Capture now; subsequent typing must never change an in-flight snapshot.
      const snapshot = {
        form: JSON.parse(JSON.stringify(form)),
        attachments: attachments.map((a) => ({ file: a.file, description: a.description || '' })),
      };
      return serial(async () => {
        account();
        if (sealed) throw Error('O rascunho está sendo registrado.');
        const next = {
          ...snapshot,
          revision: crypto.randomUUID(),
          updated_at: new Date().toISOString(),
        };
        if (!(await store.batch([[key, next]], [], { key, revision })))
          throw Error(
            'O rascunho mudou em outra aba. Reabra a tela para recuperar a versão salva.',
          );
        revision = next.revision;
        return next;
      });
    },
    discard() {
      return serial(async () => {
        account();
        if (!(await store.batch([], [key], { key, revision })))
          throw Error('O rascunho mudou em outra aba. Reabra a tela antes de descartar.');
        revision = null;
      });
    },
    async seal() {
      await queue;
      account();
      sealed = true;
      return { key, revision };
    },
    resume() {
      sealed = false;
    },
  };
}
