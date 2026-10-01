<script setup lang="ts">
import { useResource } from '../../inventory/shared/useResource';
import { fetchPropertyAreas } from '../ruralRepository';
import RequestState from './RequestState.vue';
import AreaCard from './AreaCard.vue';
const props = defineProps<{ propertyId: string }>();
const { data, loading, error, reload } = useResource(() => fetchPropertyAreas(props.propertyId), {
  items: [],
  count: 0,
});
</script>
<template>
  <section class="rural-panel">
    <header class="rural-header">
      <h3>Áreas da propriedade</h3>
      <a
        :href="`/properties/${encodeURIComponent(propertyId)}/areas/new`"
        class="button button--primary"
        data-link
        >Nova área</a
      >
    </header>
    <RequestState
      :loading="loading"
      :error="error"
      retry-label="Tentar carregar áreas"
      @retry="reload"
      ><p>{{ data.count }} áreas ativas. Prévia de até 3 áreas.</p>
      <div v-if="data.items.length" class="rural-grid">
        <AreaCard v-for="item in data.items" :key="item.id" :item="item" />
      </div>
      <p v-else>Nenhuma área cadastrada.</p></RequestState
    ><a
      :href="`/properties/${encodeURIComponent(propertyId)}/areas`"
      class="button button--secondary"
      data-link
      >Gerenciar áreas</a
    >
  </section>
</template>
