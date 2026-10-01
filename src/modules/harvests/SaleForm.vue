<script setup lang="ts">
import { reactive, watch, computed } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import RequestState from '../properties/components/RequestState.vue';
import { getSale, getHarvest, eligibleHarvests, saveSale } from './harvestRepository';
import {
  today,
  validateSale,
  cycleLabel,
  remaining,
  quantity,
  money,
  amount,
} from './harvestModel';
import type { SaleFields } from './harvestTypes';
import { PAYMENT_METHODS } from '../../constants/paymentMethods.js';
const props = defineProps<{ saleId?: string; harvestId?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const { data, loading, error, reload } = useResource(async () => {
  const sale = props.saleId ? await getSale(props.saleId) : null;
  const id = sale?.harvest_id || props.harvestId;
  const h = id ? await getHarvest(id) : null;
  return { sale, harvests: id ? (h ? [h] : []) : await eligibleHarvests() };
}, null);
const f = reactive<SaleFields>({
  harvestId: props.harvestId || '',
  buyer: '',
  quantity: '',
  unitPrice: '',
  saleDate: today(),
  paymentMethod: '',
  notes: '',
});
watch(data, (v) => {
  if (v?.sale) {
    const s = v.sale;
    Object.assign(f, {
      harvestId: s.harvest_id,
      buyer: s.buyer || '',
      quantity: String(s.quantity),
      unitPrice: String(s.unit_price),
      saleDate: s.sale_date,
      paymentMethod: s.payment_method || '',
      notes: s.notes || '',
    });
  }
});
const selected = computed(() => data.value?.harvests.find((h) => h.id === f.harvestId));
const total = computed(() => (quantity(f.quantity) || 0) * (quantity(f.unitPrice) || 0));
const mutation = useMutation();
function submit() {
  if (loading.value || error.value) return;
  mutation.error.value = validateSale(f, selected.value, props.saleId);
  if (!mutation.error.value)
    void mutation.run(
      () => saveSale(props.saleId, { ...f }),
      (id) => emit('saved', id),
    );
}
</script>
<template>
  <div class="rural-vue">
    <a href="/more/sales" data-link class="button button--secondary">Voltar às vendas</a>
    <h2>{{ saleId ? 'Editar venda' : 'Nova venda' }}</h2>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><p v-if="saleId && !data?.sale">Venda não encontrada.</p>
      <p v-else-if="!data?.harvests.length">Nenhuma colheita disponível para esta venda.</p>
      <form v-else class="rural-panel" novalidate @submit.prevent="submit">
        <fieldset :disabled="mutation.busy.value || mutation.done.value">
          <div class="field">
            <label for="sale-harvest">Colheita *</label
            ><select
              id="sale-harvest"
              v-model="f.harvestId"
              :disabled="Boolean(saleId || harvestId)"
            >
              <option value="">Selecione</option>
              <option v-for="h in data.harvests" :key="h.id" :value="h.id">
                {{ cycleLabel(h.production_cycle) }} • {{ h.harvest_date }} •
                {{ amount(remaining(h, saleId)) }} {{ h.unit }}
              </option>
            </select>
          </div>
          <p v-if="selected">
            Saldo disponível: {{ amount(remaining(selected, saleId)) }} {{ selected.unit }}
          </p>
          <div class="field">
            <label for="sale-buyer">Comprador</label
            ><input id="sale-buyer" v-model="f.buyer" maxlength="180" />
          </div>
          <div class="rural-grid">
            <div class="field">
              <label for="sale-quantity">Quantidade *</label
              ><input id="sale-quantity" v-model="f.quantity" inputmode="decimal" />
            </div>
            <div class="field">
              <label for="sale-price">Preço unitário (R$) *</label
              ><input id="sale-price" v-model="f.unitPrice" inputmode="decimal" />
            </div>
          </div>
          <p role="status">Total: {{ money(total) }}</p>
          <div class="field">
            <label for="sale-date">Data da venda *</label
            ><input id="sale-date" v-model="f.saleDate" type="date" :min="selected?.harvest_date" />
          </div>
          <div class="field">
            <label for="sale-payment">Forma de pagamento</label
            ><select id="sale-payment" v-model="f.paymentMethod">
              <option value="">Não informada</option>
              <option v-for="[v, l] in PAYMENT_METHODS" :key="v" :value="v">{{ l }}</option>
            </select>
          </div>
          <div class="field">
            <label for="sale-notes">Observações</label
            ><textarea id="sale-notes" v-model="f.notes" maxlength="1600" rows="4" />
          </div>
        </fieldset>
        <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
        <button
          class="button button--primary"
          :disabled="mutation.busy.value || mutation.done.value"
        >
          {{ mutation.busy.value ? 'Salvando…' : 'Salvar venda' }}
        </button>
      </form></RequestState
    >
  </div>
</template>
