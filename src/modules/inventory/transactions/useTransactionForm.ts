import { computed, onScopeDispose, reactive, ref, watch } from 'vue';
import { useResource } from '../shared/useResource';
import { loadInput, loadLots } from '../lots/lotRepository';
import { fetchInputs, fetchCycles, fetchEvents, saveTransaction } from './transactionRepository';
import { validateTransaction, projectedBalance } from './transactionModel';
import { decimal } from '../lots/lotModel';
import { getInventoryTransactionSign } from '../../../constants/inventoryTransactionTypes.js';
import { toDateTimeLocalValue } from '../../../js/html.js';
import { getDataErrorMessage } from '../../../services/dataErrorService.js';
import type { TransactionFields } from './transactionTypes';

export function useTransactionForm(
  initialInput: string,
  initialLot: string,
  finished: (id: string) => void,
) {
  const fields = reactive<TransactionFields>({
    inputId: '',
    lotId: '',
    transactionType: 'negative_adjustment',
    quantity: '',
    occurredAt: toDateTimeLocalValue(),
    productionCycleId: '',
    productionEventId: '',
    notes: '',
  });
  const inputs = useResource(fetchInputs, []),
    cycles = useResource(fetchCycles, []);
  const lots = useResource(
    () => (fields.inputId ? loadLots(fields.inputId) : Promise.resolve([])),
    [],
    false,
  );
  const events = useResource(
    () => (fields.productionCycleId ? fetchEvents(fields.productionCycleId) : Promise.resolve([])),
    [],
    false,
  );
  const busy = ref(false),
    feedback = ref(''),
    review = ref<TransactionFields | null>(null),
    savedId = ref(''),
    restockName = ref('');
  let disposed = false,
    initialized = false,
    pendingLot = initialLot;
  const selectedInput = computed(() =>
    inputs.data.value.find((item) => item.id === fields.inputId),
  );
  const selectedLot = computed(() => lots.data.value.find((item) => item.id === fields.lotId));
  const projected = computed(() =>
    projectedBalance(selectedLot.value, fields.quantity, fields.transactionType),
  );
  const estimatedCost = computed(() => {
    const qty = decimal(fields.quantity),
      cost = selectedLot.value?.unit_price;
    return qty !== null && cost != null ? qty * Number(cost) : null;
  });
  watch(inputs.data, (items) => {
    if (initialized) return;
    initialized = true;
    if (initialInput && items.some((item) => item.id === initialInput))
      fields.inputId = initialInput;
    else if (initialInput) {
      pendingLot = '';
      feedback.value = 'O insumo do link não está disponível. Selecione um insumo.';
    }
  });
  watch(
    () => fields.inputId,
    () => {
      fields.lotId = '';
      lots.reset();
      void lots.reload();
    },
  );
  watch(lots.data, (items) => {
    if (!pendingLot) return;
    if (
      items.some((item) => item.id === pendingLot && item.agricultural_input_id === fields.inputId)
    )
      fields.lotId = pendingLot;
    else if (fields.inputId === initialInput)
      feedback.value = 'O lote do link não está disponível para este insumo. Selecione um lote.';
    pendingLot = '';
  });
  watch(
    () => fields.productionCycleId,
    () => {
      fields.productionEventId = '';
      events.reset();
      void events.reload();
    },
  );
  function validate(snapshot: TransactionFields): string {
    if (inputs.loading.value || inputs.error.value || lots.loading.value || lots.error.value)
      return 'Aguarde ou tente carregar os dados do insumo e do lote novamente.';
    if (!inputs.data.value.some((item) => item.id === snapshot.inputId))
      return 'Selecione um insumo válido.';
    if (
      snapshot.productionCycleId &&
      (cycles.loading.value || cycles.error.value || events.loading.value || events.error.value)
    )
      return 'Aguarde ou tente carregar os dados de produção novamente. Você também pode retirar o vínculo com o ciclo.';
    return validateTransaction(snapshot, selectedLot.value, cycles.data.value, events.data.value);
  }
  function requestReview() {
    if (busy.value || savedId.value || review.value) return;
    feedback.value = validate(fields);
    if (!feedback.value) review.value = { ...fields };
  }
  function finish() {
    if (!disposed && savedId.value) finished(savedId.value);
  }
  async function confirm() {
    if (busy.value || savedId.value || !review.value) return;
    const snapshot = { ...review.value };
    feedback.value = validate(snapshot);
    review.value = null;
    if (feedback.value) return;
    busy.value = true;
    try {
      const id = await saveTransaction(snapshot);
      if (disposed) return;
      savedId.value = id;
    } catch (cause) {
      if (!disposed) {
        feedback.value = getDataErrorMessage(cause);
        busy.value = false;
      }
      return;
    }
    // The write succeeded. Failure of this optional read must never offer another write.
    try {
      if (getInventoryTransactionSign(snapshot.transactionType) < 0) {
        const updated = await loadInput(snapshot.inputId);
        if (disposed) return;
        if (updated && Number(updated.current_quantity) <= 0) {
          restockName.value = updated.name;
          return;
        }
      }
    } catch {
      /* The saved record is still successful and can be opened. */
    }
    finish();
  }
  onScopeDispose(() => {
    disposed = true;
  });
  return {
    fields,
    inputs,
    cycles,
    lots,
    events,
    selectedInput,
    selectedLot,
    projected,
    estimatedCost,
    busy,
    feedback,
    review,
    savedId,
    restockName,
    requestReview,
    confirm,
    finish,
  };
}
