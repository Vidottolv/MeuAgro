import { onScopeDispose, ref } from 'vue';
import { getDataErrorMessage } from '../../../services/dataErrorService.js';
import type { InputDetail, InventoryTransaction } from '../detailTypes';
import type { LotDetail } from './lotModel';
import { loadInput, loadLot, loadLots, loadHistory } from './lotRepository';

// Shared loading lifecycle: ignore responses after leaving or retrying a page.
export function useLotPage(inputId: string, lotId?: string, list = false, loadRelated = true) {
  const input = ref<InputDetail | null>(null),
    lot = ref<LotDetail | null>(null);
  const lots = ref<LotDetail[]>([]),
    history = ref<InventoryTransaction[]>([]);
  const loading = ref(true),
    error = ref(''),
    missing = ref(false);
  const relatedLoading = ref(false),
    relatedError = ref('');
  let disposed = false,
    request = 0,
    relatedRequest = 0;
  async function reloadRelated() {
    const current = ++relatedRequest;
    relatedLoading.value = true;
    relatedError.value = '';
    try {
      const result = list ? await loadLots(inputId) : await loadHistory(lotId!);
      if (disposed || current !== relatedRequest) return;
      if (list) lots.value = result as LotDetail[];
      else history.value = result as InventoryTransaction[];
    } catch (cause) {
      if (!disposed && current === relatedRequest) relatedError.value = getDataErrorMessage(cause);
    } finally {
      if (!disposed && current === relatedRequest) relatedLoading.value = false;
    }
  }
  async function reload() {
    const current = ++request;
    ++relatedRequest;
    loading.value = true;
    error.value = '';
    missing.value = false;
    input.value = null;
    lot.value = null;
    lots.value = [];
    history.value = [];
    try {
      const [foundInput, foundLot] = await Promise.all([
        loadInput(inputId),
        lotId ? loadLot(lotId) : Promise.resolve(null),
      ]);
      if (disposed || current !== request) return;
      if (!foundInput || (lotId && (!foundLot || foundLot.agricultural_input_id !== inputId))) {
        missing.value = true;
        return;
      }
      input.value = foundInput;
      lot.value = foundLot;
      if (loadRelated && (list || lotId)) void reloadRelated();
    } catch (cause) {
      if (!disposed && current === request) error.value = getDataErrorMessage(cause);
    } finally {
      if (!disposed && current === request) loading.value = false;
    }
  }
  onScopeDispose(() => {
    disposed = true;
    ++request;
    ++relatedRequest;
  });
  void reload();
  return {
    input,
    lot,
    lots,
    history,
    loading,
    error,
    missing,
    relatedLoading,
    relatedError,
    reload,
    reloadRelated,
  };
}
