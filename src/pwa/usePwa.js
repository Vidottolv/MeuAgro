import { ref, onScopeDispose } from 'vue';
import { pwa } from './runtime.js';
export function usePwa() {
  const status = ref(pwa.getState());
  const unsubscribe = pwa.subscribe((next) => {
    status.value = next;
  });
  onScopeDispose(unsubscribe);
  return { status, pwa };
}
