import { computed, onMounted, onScopeDispose, ref, watch } from 'vue';
import { getDataErrorMessage } from '../../services/dataErrorService.js';
import {
  changeInputActive,
  fetchInputDetail,
  fetchRecentLots,
  fetchRecentTransactions,
} from './inputDetailRepository';
import { needsRestock } from './detailModel';
import type { InputDetail, InventoryLot, InventoryTransaction } from './detailTypes';

export function useInputDetail(id: string) {
  const input = ref<InputDetail | null>(null);
  const loading = ref(true),
    loadError = ref(''),
    notFound = ref(false);
  const lots = ref<InventoryLot[]>([]),
    transactions = ref<InventoryTransaction[]>([]);
  const lotsLoading = ref(false),
    transactionsLoading = ref(false);
  const lotsError = ref(''),
    transactionsError = ref('');
  const busy = ref(false),
    actionError = ref(''),
    notice = ref('');
  const confirmOpen = ref(false),
    restockOpen = ref(false);
  const restockAvailable = computed(
    () =>
      needsRestock(input.value, transactions.value.length) &&
      !transactionsError.value &&
      !transactionsLoading.value,
  );
  let disposed = false,
    request = 0,
    lotRequest = 0,
    transactionRequest = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let autoPromptShown = false;

  async function loadLots() {
    if (!input.value || disposed) return;
    const page = request,
      current = ++lotRequest;
    lotsLoading.value = true;
    lotsError.value = '';
    try {
      const result = await fetchRecentLots(id);
      if (!disposed && page === request && current === lotRequest) lots.value = result;
    } catch {
      if (!disposed && page === request && current === lotRequest) {
        lots.value = [];
        lotsError.value = 'Não foi possível carregar os lotes.';
      }
    } finally {
      if (!disposed && page === request && current === lotRequest) lotsLoading.value = false;
    }
  }
  async function loadTransactions() {
    if (!input.value || disposed) return;
    const page = request,
      current = ++transactionRequest;
    transactionsLoading.value = true;
    transactionsError.value = '';
    try {
      const result = await fetchRecentTransactions(id);
      if (!disposed && page === request && current === transactionRequest)
        transactions.value = result;
    } catch {
      if (!disposed && page === request && current === transactionRequest) {
        transactions.value = [];
        transactionsError.value = 'Não foi possível carregar as movimentações.';
      }
    } finally {
      if (!disposed && page === request && current === transactionRequest)
        transactionsLoading.value = false;
    }
  }
  async function reload() {
    if (busy.value || disposed) return;
    const current = ++request;
    loading.value = true;
    loadError.value = '';
    notFound.value = false;
    input.value = null;
    lots.value = [];
    transactions.value = [];
    actionError.value = '';
    notice.value = '';
    confirmOpen.value = false;
    try {
      const result = await fetchInputDetail(id);
      if (disposed || current !== request) return;
      input.value = result;
      notFound.value = !result;
      if (result) {
        void loadLots();
        void loadTransactions();
      }
    } catch {
      if (!disposed && current === request)
        loadError.value =
          'Não foi possível carregar o insumo. Confira sua conexão e tente novamente.';
    } finally {
      if (!disposed && current === request) loading.value = false;
    }
  }
  async function toggleActive() {
    if (!input.value || busy.value || disposed) return;
    confirmOpen.value = false;
    busy.value = true;
    actionError.value = '';
    notice.value = '';
    const next = !input.value.active;
    try {
      const active = await changeInputActive(id, next);
      if (!disposed && input.value) {
        input.value.active = active;
        notice.value = active ? 'Insumo reativado.' : 'Insumo desativado.';
      }
    } catch (error) {
      if (!disposed) actionError.value = getDataErrorMessage(error);
    } finally {
      if (!disposed) busy.value = false;
    }
  }

  watch(restockAvailable, (available) => {
    clearTimeout(timer);
    if (!available) {
      restockOpen.value = false;
      return;
    }
    const key = `meu-agro-restock-shown:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* Storage may be unavailable. */
    }
    if (autoPromptShown) return;
    timer = setTimeout(() => {
      if (disposed || !restockAvailable.value || confirmOpen.value || busy.value) return;
      autoPromptShown = true;
      try {
        sessionStorage.setItem(key, '1');
      } catch {
        /* Keep the current-page guard. */
      }
      restockOpen.value = true;
    }, 250);
  });
  onMounted(reload);
  onScopeDispose(() => {
    disposed = true;
    request++;
    clearTimeout(timer);
  });
  return {
    input,
    loading,
    loadError,
    notFound,
    lots,
    transactions,
    lotsLoading,
    transactionsLoading,
    lotsError,
    transactionsError,
    reload,
    loadLots,
    loadTransactions,
    busy,
    actionError,
    notice,
    confirmOpen,
    restockOpen,
    restockAvailable,
    toggleActive,
  };
}
