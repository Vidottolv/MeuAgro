import { ref, onScopeDispose } from 'vue';
import { getDataErrorMessage } from '../../services/dataErrorService.js';
export function useMutation(once = true) {
  const busy = ref(false),
    done = ref(false),
    error = ref('');
  let disposed = false;
  onScopeDispose(() => {
    disposed = true;
  });
  async function run<T>(work: () => Promise<T>, success: (result: T) => void) {
    if (disposed || busy.value || (once && done.value)) return;
    busy.value = true;
    error.value = '';
    let result: T;
    try {
      result = await work();
    } catch (cause) {
      if (!disposed) {
        error.value = getDataErrorMessage(cause);
        busy.value = false;
      }
      return;
    }
    done.value = true;
    if (!disposed) {
      busy.value = false;
      success(result);
    }
  }
  return { busy, done, error, run, alive: () => !disposed };
}
