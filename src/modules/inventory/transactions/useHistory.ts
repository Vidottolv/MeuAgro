import { computed, ref, watch } from 'vue';
import { useResource } from '../shared/useResource';
import { fetchInputs, fetchHistory } from './transactionRepository';
import { filterHistory, periodError } from './transactionModel';
import {
  INVENTORY_TRANSACTION_TYPES,
  getInventoryTransactionSign,
} from '../../../constants/inventoryTransactionTypes.js';
export function useHistory(fixedInputId = '') {
  const query = new URLSearchParams(window.location.search);
  const inputId = ref(fixedInputId || query.get('input') || ''),
    lotId = ref(query.get('lot') || '');
  const type = ref(
    INVENTORY_TRANSACTION_TYPES.some(([value]) => value === query.get('type'))
      ? query.get('type')!
      : '',
  );
  const search = ref(query.get('search') || ''),
    from = ref(query.get('from') || ''),
    to = ref(query.get('to') || ''),
    page = ref(1);
  const inputs = useResource(fetchInputs, []);
  const history = useResource(() => fetchHistory(inputId.value, lotId.value, type.value), []);
  const invalidPeriod = computed(() => periodError(from.value, to.value));
  const filtered = computed(() =>
    invalidPeriod.value
      ? []
      : filterHistory(history.data.value, { search: search.value, from: from.value, to: to.value }),
  );
  const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
  const incoming = computed(
    () =>
      filtered.value.filter((item) => getInventoryTransactionSign(item.transaction_type) > 0)
        .length,
  );
  const selectedInput = computed(() => inputs.data.value.find((item) => item.id === inputId.value));
  const missingInput = computed(() =>
    Boolean(inputId.value && !inputs.loading.value && !inputs.error.value && !selectedInput.value),
  );
  watch(inputId, () => {
    lotId.value = '';
  });
  watch([inputId, lotId, type], () => {
    history.reset();
    void history.reload();
  });
  watch([inputId, lotId, type, search, from, to], () => {
    page.value = 1;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({
      input: fixedInputId ? '' : inputId.value,
      lot: lotId.value,
      type: type.value,
      search: search.value,
      from: from.value,
      to: to.value,
    }))
      if (value) params.set(key, value);
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + (params.size ? '?' + params.toString() : ''),
    );
  });
  watch(filtered, (items) => {
    if ((page.value - 1) * 20 >= items.length) page.value = 1;
  });
  function clear() {
    inputId.value = fixedInputId;
    lotId.value = '';
    type.value = '';
    search.value = '';
    from.value = '';
    to.value = '';
  }
  const newHref = computed(() => {
    const params = new URLSearchParams();
    if (inputId.value) {
      params.set('input', inputId.value);
      if (lotId.value) params.set('lot', lotId.value);
    }
    return '/inventory/transactions/new' + (params.size ? '?' + params.toString() : '');
  });
  return {
    inputId,
    lotId,
    type,
    search,
    from,
    to,
    page,
    inputs,
    history,
    invalidPeriod,
    filtered,
    visible,
    incoming,
    selectedInput,
    missingInput,
    clear,
    newHref,
  };
}
