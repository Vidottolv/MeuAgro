import { ref, onScopeDispose } from 'vue';
// A retry of the same operation reuses its key. A committed mutation is never replayed to refresh the screen.
export function useCommand(command, reload, errorMessage) {
  const busy = ref(false),
    error = ref(''),
    message = ref(''),
    committed = ref(false);
  let alive = true;
  const keys = new Map();
  onScopeDispose(() => (alive = false));
  async function refresh() {
    if (!alive) return;
    await reload();
    if (alive) committed.value = false;
  }
  async function run(action, data = {}) {
    if (busy.value || committed.value || !alive) return;
    busy.value = true;
    error.value = '';
    message.value = '';
    const signature = JSON.stringify([action, data]);
    if (!keys.has(signature)) keys.set(signature, crypto.randomUUID());
    try {
      const result = await command(action, data, keys.get(signature));
      if (!alive) return;
      committed.value = true;
      keys.delete(signature);
      message.value = 'Alteração salva.';
      await refresh();
      return result;
    } catch (e) {
      if (alive)
        error.value = committed.value
          ? 'A alteração foi salva. Atualize a tela antes de fazer outra alteração.'
          : errorMessage(e);
    } finally {
      if (alive) busy.value = false;
    }
  }
  return { busy, error, message, committed, run, refresh };
}
