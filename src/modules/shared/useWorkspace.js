import { ref, watch, onMounted, onScopeDispose } from 'vue';
import { useOffline } from '../../offline/useOffline.js';
import { workspaceRpc } from '../../services/workspaceService.js';
export function useWorkspace(loader) {
  const { status } = useOffline(),
    data = ref(null),
    error = ref(''),
    notice = ref(''),
    busy = ref(false),
    loading = ref(false),
    invalidated = ref(0);
  let epoch = 0,
    request = 0,
    disposed = false,
    retry = null;
  function clear() {
    ++epoch;
    ++request;
    invalidated.value++;
    data.value = null;
    error.value = '';
    notice.value = '';
    busy.value = false;
    loading.value = false;
    retry = null;
  }
  async function load() {
    if (!status.value.online || document.hidden) return;
    const version = ++request,
      scope = epoch;
    loading.value = true;
    error.value = '';
    try {
      const result = await loader();
      if (!disposed && scope === epoch && version === request) data.value = result;
    } catch (e) {
      if (!disposed && scope === epoch && version === request) {
        data.value = null;
        error.value = e.message;
      }
    } finally {
      if (scope === epoch && version === request) loading.value = false;
    }
  }
  async function command(name, args, after) {
    if (busy.value || loading.value) return;
    const signature = JSON.stringify({ name, args });
    if (!retry || retry.signature !== signature) retry = { signature, id: crypto.randomUUID() };
    const scope = epoch;
    busy.value = true;
    error.value = '';
    notice.value = '';
    try {
      const result = await workspaceRpc(name, { ...args, p_operation: retry.id });
      if (disposed || scope !== epoch) return;
      retry = null;
      notice.value = 'Registro confirmado.';
      if (after) after(result);
      await load();
      return result;
    } catch (e) {
      if (!disposed && scope === epoch) error.value = e.message;
    } finally {
      if (scope === epoch) busy.value = false;
    }
  }
  function visibility() {
    if (document.hidden) clear();
    else void load();
  }
  watch([() => status.value.online, () => status.value.user], () => {
    clear();
    if (status.value.online) void load();
  });
  onMounted(() => {
    void load();
    document.addEventListener('visibilitychange', visibility);
  });
  onScopeDispose(() => {
    disposed = true;
    clear();
    document.removeEventListener('visibilitychange', visibility);
  });
  return { status, data, error, notice, busy, loading, load, command, invalidated };
}
