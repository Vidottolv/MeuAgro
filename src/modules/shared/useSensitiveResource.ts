import { onMounted, onScopeDispose } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { offlineUserId, isOnline } from '../../offline/runtime.js';

/** Online company data is scoped to the session and never retained after a failed refresh. */
export function useSensitiveResource<T>(fetcher: () => Promise<T>, initial: T) {
  let epoch = 0,
    disposed = false;
  const ready = () => !!offlineUserId() && isOnline() && !document.hidden;
  const key = () => `${offlineUserId() || ''}:${isOnline()}:${document.hidden}`;
  let last = key();
  const resource = useResource(
    async () => {
      const user = offlineUserId(),
        revision = epoch;
      if (!ready()) throw Error('Conecte-se e entre na sua conta para consultar esta área.');
      const result = await fetcher();
      if (disposed || revision !== epoch || user !== offlineUserId() || !ready())
        throw Error('A conta ou conexão mudou. Atualize a tela.');
      return result;
    },
    initial,
    false,
  );
  function reset() {
    epoch++;
    resource.reset();
  }
  async function reload() {
    if (disposed) return;
    reset();
    await resource.reload();
  }
  function changed() {
    const next = key();
    if (next === last) return;
    last = next;
    reset();
    if (ready()) void reload();
  }
  function hide() {
    reset();
  }
  onMounted(() => {
    for (const event of ['online', 'offline', 'meu-agro-offline-changed'])
      window.addEventListener(event, changed);
    document.addEventListener('visibilitychange', changed);
    window.addEventListener('pagehide', hide);
    void reload();
  });
  onScopeDispose(() => {
    disposed = true;
    reset();
    for (const event of ['online', 'offline', 'meu-agro-offline-changed'])
      window.removeEventListener(event, changed);
    document.removeEventListener('visibilitychange', changed);
    window.removeEventListener('pagehide', hide);
  });
  return { ...resource, reload, reset };
}
