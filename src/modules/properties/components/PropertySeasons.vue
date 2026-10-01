<script setup lang="ts">
import { useResource } from '../../inventory/shared/useResource';
import { fetchPropertySeasons } from '../ruralRepository';
import { getSeasonStatusLabel } from '../../../constants/seasonStatus.js';
import { formatDatePtBr } from '../../../js/html.js';
import RequestState from './RequestState.vue';
const props = defineProps<{ propertyId: string }>();
const { data, loading, error, reload } = useResource(() => fetchPropertySeasons(props.propertyId), {
  items: [],
  count: 0,
});
</script>
<template>
  <section class="rural-panel">
    <header class="rural-header">
      <h3>Safras da propriedade</h3>
      <a
        :href="`/more/seasons/new?property=${encodeURIComponent(propertyId)}`"
        class="button button--primary"
        data-link
        >Nova safra</a
      >
    </header>
    <RequestState
      :loading="loading"
      :error="error"
      retry-label="Tentar carregar safras"
      @retry="reload"
      ><p>{{ data.count }} safras em aberto. Até 3 safras recentes.</p>
      <div v-if="data.items.length" class="rural-grid">
        <article v-for="item in data.items" :key="item.id" class="rural-card">
          <h4>{{ item.name }}</h4>
          <p>{{ getSeasonStatusLabel(item.status) }}</p>
          <p>{{ formatDatePtBr(item.start_date) }} — {{ formatDatePtBr(item.end_date) }}</p>
          <a
            :href="`/more/seasons/${encodeURIComponent(item.id)}`"
            class="button button--secondary"
            data-link
            >Ver safra</a
          >
        </article>
      </div>
      <p v-else>Nenhuma safra cadastrada.</p></RequestState
    ><a
      :href="`/more/seasons?property=${encodeURIComponent(propertyId)}`"
      class="button button--secondary"
      data-link
      >Gerenciar safras</a
    >
  </section>
</template>
