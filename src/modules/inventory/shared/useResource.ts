import { ref, shallowRef, onScopeDispose } from 'vue';
import { getDataErrorMessage } from '../../../services/dataErrorService.js';

/** A failed or superseded read never becomes an empty successful result. */
export function useResource<T>(fetcher: () => Promise<T>, initial: T, immediate = true) {
  const data = shallowRef<T>(initial),
    loading = ref(false),
    error = ref('');
  let disposed = false,
    sequence = 0;
  async function reload() {
    const current = ++sequence;
    loading.value = true;
    error.value = '';
    try {
      const result = await fetcher();
      if (!disposed && current === sequence) data.value = result;
    } catch (cause) {
      if (!disposed && current === sequence) error.value = getDataErrorMessage(cause);
    } finally {
      if (!disposed && current === sequence) loading.value = false;
    }
  }
  function reset() {
    ++sequence;
    data.value = initial;
    loading.value = false;
    error.value = '';
  }
  onScopeDispose(() => {
    disposed = true;
    ++sequence;
  });
  if (immediate) void reload();
  return { data, loading, error, reload, reset };
}
