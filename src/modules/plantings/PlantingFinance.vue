<script setup lang="ts">
import { useResource } from '../inventory/shared/useResource';
import { fetchFinance } from './plantingRepository';
import { formatCurrencyBRL } from '../../js/html.js';
import RequestState from '../properties/components/RequestState.vue';
const props = defineProps<{ id: string }>();
const { data, loading, error, reload } = useResource(() => fetchFinance(props.id), null);
</script>
<template>
  <section class="rural-panel">
    <header class="rural-header">
      <h3>Resumo financeiro</h3>
      <a
        :href="`/more/finance/${encodeURIComponent(id)}`"
        class="button button--secondary"
        data-link
        >Ver financeiro</a
      >
    </header>
    <RequestState
      :loading="loading"
      :error="error"
      retry-label="Tentar carregar financeiro"
      @retry="reload"
      ><dl v-if="data">
        <dt>Custo com insumos</dt>
        <dd>{{ formatCurrencyBRL(data.input_cost) }}</dd>
        <dt>Receita de vendas</dt>
        <dd>{{ formatCurrencyBRL(data.sales_revenue) }}</dd>
        <dt>Resultado estimado</dt>
        <dd>{{ formatCurrencyBRL(data.estimated_result) }}</dd>
      </dl>
      <p v-else>Resumo financeiro indisponível para este plantio.</p></RequestState
    >
  </section>
</template>
