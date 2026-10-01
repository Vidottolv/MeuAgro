<script setup lang="ts">
import { useResource } from '../inventory/shared/useResource';
import { getSale } from './harvestRepository';
import { amount, money, cycleLabel } from './harvestModel';
import { dateLabel } from '../seasons/seasonModel';
import { getPaymentMethodLabel } from '../../constants/paymentMethods.js';
import RequestState from '../properties/components/RequestState.vue';
const props = defineProps<{ saleId: string }>();
const { data, loading, error, reload } = useResource(() => getSale(props.saleId), null);
</script>
<template>
  <div class="rural-vue">
    <a href="/more/sales" data-link class="button button--secondary">Voltar às vendas</a
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><p v-if="!data">Venda não encontrada.</p>
      <section v-else class="rural-panel">
        <h2>{{ data.buyer || 'Comprador não informado' }}</h2>
        <p>{{ cycleLabel(data.harvest?.production_cycle) }}</p>
        <dl>
          <dt>Data</dt>
          <dd>{{ dateLabel(data.sale_date) }}</dd>
          <dt>Quantidade</dt>
          <dd>{{ amount(data.quantity) }} {{ data.unit }}</dd>
          <dt>Preço unitário</dt>
          <dd>{{ money(data.unit_price) }}</dd>
          <dt>Total</dt>
          <dd>{{ money(data.total_value) }}</dd>
          <dt>Pagamento</dt>
          <dd>{{ getPaymentMethodLabel(data.payment_method) }}</dd>
          <dt>Observações</dt>
          <dd>{{ data.notes || 'Nenhuma' }}</dd>
        </dl>
        <div class="rural-actions">
          <a
            v-if="!data.harvest?.production_cycle?.deleted_at"
            :href="`/more/sales/${encodeURIComponent(data.id)}/edit`"
            data-link
            class="button button--secondary"
            >Editar venda</a
          ><a
            :href="`/more/harvests/${encodeURIComponent(data.harvest_id)}`"
            data-link
            class="button button--secondary"
            >Ver colheita</a
          >
        </div>
      </section></RequestState
    >
  </div>
</template>
