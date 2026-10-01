import { computed, onScopeDispose, reactive, ref, watch } from 'vue';
import { useLotPage } from './useLotPage';
import { todayLocal } from '../detailModel';
import { decimal, validateLot, type LotFields } from './lotModel';
import { saveLot } from './lotRepository';
import { getDataErrorMessage } from '../../../services/dataErrorService.js';

export function useLotForm(
  inputId: string,
  lotId: string | undefined,
  saved: (id: string) => void,
) {
  const page = useLotPage(inputId, lotId, false, false);
  const fields = reactive<LotFields>({
    purchasedQuantity: '',
    totalPrice: '',
    purchaseDate: todayLocal(),
    supplier: '',
    batchNumber: '',
    expirationDate: '',
    notes: '',
  });
  const busy = ref(false),
    feedback = ref('');
  let disposed = false;
  watch(page.lot, (lot) => {
    if (!lot) return;
    Object.assign(fields, {
      purchasedQuantity: String(lot.purchased_quantity ?? ''),
      totalPrice: String(lot.total_price ?? ''),
      purchaseDate: lot.purchase_date,
      supplier: lot.supplier ?? '',
      batchNumber: lot.batch_number ?? '',
      expirationDate: lot.expiration_date ?? '',
      notes: lot.notes ?? '',
    });
  });
  const unitPrice = computed(() => {
    if (lotId) return page.lot.value?.unit_price ?? null;
    const quantity = decimal(fields.purchasedQuantity),
      price = decimal(fields.totalPrice);
    return quantity && price !== null ? price / quantity : null;
  });
  async function submit() {
    if (
      busy.value ||
      disposed ||
      !page.input.value ||
      page.loading.value ||
      (lotId && !page.lot.value)
    )
      return;
    if (!lotId && !page.input.value.active) return;
    feedback.value = validateLot(fields, page.lot.value);
    if (feedback.value) return;
    busy.value = true;
    try {
      const id = await saveLot(inputId, page.lot.value, { ...fields });
      if (!disposed) saved(id);
    } catch (cause) {
      if (!disposed) feedback.value = getDataErrorMessage(cause);
    } finally {
      if (!disposed) busy.value = false;
    }
  }
  onScopeDispose(() => {
    disposed = true;
  });
  return { ...page, fields, busy, feedback, unitPrice, submit };
}
