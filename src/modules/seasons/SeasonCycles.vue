<script setup lang="ts">
import { useResource } from '../inventory/shared/useResource';
import { fetchSeasonCycles } from './seasonRepository';
import RequestState from '../properties/components/RequestState.vue';
import { getProductionCycleStatusLabel } from '../../constants/productionCycleStatus.js';
const props = defineProps<{ id: string; propertyId: string; canCreate: boolean }>();
const { data, loading, error, reload } = useResource(() => fetchSeasonCycles(props.id), {
  items: [],
  count: 0,
});
</script>
<template>
  <section class="rural-panel">
    <header class="rural-header">
      <h3>Plantios desta safra</h3>
      <a
        v-if="canCreate"
        :href="`/plantings/new?property=${encodeURIComponent(propertyId)}&season=${encodeURIComponent(id)}`"
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
      ><p>
        {{ data.count }} {{ data.count === 1 ? 'plantio em aberto' : 'plantios em aberto' }}. Prévia
        de até 3 plantios.
      </p>
      <div v-if="data.items.length" class="rural-grid">
        <article v-for="item in data.items" :key="item.id" class="rural-card">
          <h4>{{ item.crop?.name || 'Cultura' }}{{ item.variety ? ' — ' + item.variety : '' }}</h4>
          <p>{{ getProductionCycleStatusLabel(item.status) }}</p>
          <a
            :href="`/plantings/${encodeURIComponent(item.id)}`"
            class="button button--secondary"
            data-link
            >Ver plantio</a
          >
        </article>
      </div>
      <p v-else>Nenhum plantio vinculado a esta safra.</p></RequestState
    >
  </section>
</template>
