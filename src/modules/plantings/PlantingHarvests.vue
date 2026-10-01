<script setup lang="ts">
import { useResource } from '../inventory/shared/useResource';
import { fetchHarvests } from './plantingRepository';
import { getHarvestSalesSummary } from '../../services/harvestService.js';
import { getHarvestDestinationLabel } from '../../constants/harvestDestinations.js';
import { formatNumberPtBr, formatCurrencyBRL } from '../../js/html.js';
import { dateLabel } from '../seasons/seasonModel';
import RequestState from '../properties/components/RequestState.vue';
const props = defineProps<{ id: string; canCreate: boolean }>();
const { data, loading, error, reload } = useResource(() => fetchHarvests(props.id), []);
</script>
<template>
  <section class="rural-panel">
    <header class="rural-header">
      <h3>Produção colhida</h3>
      <a
        v-if="canCreate"
        :href="`/plantings/${encodeURIComponent(id)}/harvests/new`"
        class="button button--primary"
        data-link
        >Registrar colheita</a
      >
    </header>
    <RequestState
      :loading="loading"
      :error="error"
      retry-label="Tentar carregar colheitas"
      @retry="reload"
      ><p>{{ data.length }} colheitas registradas neste ciclo</p>
      <div v-if="data.length" class="rural-grid">
        <article v-for="item in data" :key="item.id" class="rural-card">
          <h4>Colheita de {{ dateLabel(item.harvest_date) }}</h4>
          <p>{{ formatNumberPtBr(item.quantity) }} {{ item.unit }}</p>
          <p>{{ getHarvestDestinationLabel(item.destination) }}</p>
          <p v-if="getHarvestSalesSummary(item).salesCount">
            {{ getHarvestSalesSummary(item).salesCount }} vendas •
            {{ formatCurrencyBRL(getHarvestSalesSummary(item).grossRevenue) }}
          </p>
          <a
            :href="`/more/harvests/${encodeURIComponent(item.id)}`"
            class="button button--secondary"
            data-link
            >Ver colheita</a
          >
        </article>
      </div></RequestState
    ><a
      :href="`/more/harvests?cycle=${encodeURIComponent(id)}`"
      class="button button--secondary"
      data-link
      >Ver todas as colheitas</a
    >
  </section>
</template>
