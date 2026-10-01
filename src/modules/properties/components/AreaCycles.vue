<script setup lang="ts">
import { useResource } from '../../inventory/shared/useResource';
import { fetchAreaCycles } from '../ruralRepository';
import { getProductionCycleStatusLabel } from '../../../constants/productionCycleStatus.js';
import RequestState from './RequestState.vue';
const props = defineProps<{ propertyId: string; areaId: string }>();
const { data, loading, error, reload } = useResource(() => fetchAreaCycles(props.areaId), {
  items: [],
  count: 0,
});
</script>
<template>
  <section class="rural-panel">
    <header class="rural-header">
      <h3>Ciclos produtivos</h3>
      <a
        :href="`/plantings/new?property=${encodeURIComponent(propertyId)}&area=${encodeURIComponent(areaId)}`"
        class="button button--primary"
        data-link
        >Registrar plantio</a
      >
    </header>
    <RequestState
      :loading="loading"
      :error="error"
      retry-label="Tentar carregar plantios"
      @retry="reload"
      ><p>{{ data.count }} ciclos em aberto. Até 3 ciclos recentes.</p>
      <div v-if="data.items.length" class="rural-grid">
        <article v-for="item in data.items" :key="item.id" class="rural-card">
          <h4>{{ [item.crop?.name || 'Cultura', item.variety].filter(Boolean).join(' • ') }}</h4>
          <p>{{ getProductionCycleStatusLabel(item.status) }}</p>
          <a
            :href="`/plantings/${encodeURIComponent(item.id)}`"
            class="button button--secondary"
            data-link
            >Ver plantio</a
          >
        </article>
      </div>
      <p v-else>Nenhum plantio nesta área.</p></RequestState
    >
  </section>
</template>
