import { ref, onMounted, onScopeDispose } from 'vue';
import { offlineStatus, isOnline } from './runtime.js';
export function useOffline() {
  const status = ref({
    online: isOnline(),
    user: null,
    pending: 0,
    syncing: false,
    cachedAt: null,
    preparedAt: null,
    errors: [],
  });
  let disposed = false,
    revision = 0;
  async function refresh() {
    const version = ++revision;
    try {
      const next = await offlineStatus();
      if (!disposed && version === revision) status.value = next;
    } catch {
      if (!disposed)
        status.value = {
          ...status.value,
          online: isOnline(),
          errors: [
            {
              id: 'storage',
              message:
                'Armazenamento offline indisponível. Libere espaço ou permita o armazenamento neste navegador.',
            },
          ],
        };
    }
  }
  onMounted(() => {
    addEventListener('meu-agro-offline-changed', refresh);
    void refresh();
  });
  onScopeDispose(() => {
    disposed = true;
    removeEventListener('meu-agro-offline-changed', refresh);
  });
  return { status, refresh };
}
