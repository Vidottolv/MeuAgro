<script setup lang="ts">
import { ref } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchEvents } from './plantingRepository';
import RequestState from '../properties/components/RequestState.vue';
import RuralDialog from '../properties/components/RuralDialog.vue';
import { getProductionEventTypeLabel } from '../../constants/productionEventTypes.js';
import { formatCurrencyBRL, formatNumberPtBr, formatDateTimePtBr } from '../../js/html.js';
import type { PlantingEvent } from './plantingTypes';
const props = defineProps<{ id: string; archived: boolean }>();
const { data, loading, error, reload } = useResource(() => fetchEvents(props.id), []);
const photo = ref<{ src: string; alt: string } | null>(null);
const path = `/plantings/${encodeURIComponent(props.id)}`;
function cost(event: PlantingEvent) {
  return event.event_inputs.reduce((sum, i) => sum + Number(i.total_cost || 0), 0);
}
</script>
<template>
  <section id="timeline" class="rural-panel">
    <header class="rural-header">
      <h3>Linha do tempo</h3>
      <div class="rural-actions">
        <a :href="path + '/evolution'" class="button button--secondary" data-link>Ver evolução</a
        ><a v-if="!archived" :href="path + '/events/new'" class="button button--primary" data-link
          >Registrar evento</a
        >
      </div>
    </header>
    <RequestState
      :loading="loading"
      :error="error"
      retry-label="Tentar carregar eventos"
      @retry="reload"
      ><p v-if="!data.length">Nenhum evento registrado.</p>
      <article v-for="event in data" :key="event.id" class="rural-card planting-event">
        <p>{{ getProductionEventTypeLabel(event.event_type) }}</p>
        <h4>{{ event.title }}</h4>
        <time>{{ formatDateTimePtBr(event.occurred_at) }}</time>
        <p v-if="event.description" class="event-text">{{ event.description }}</p>
        <p v-if="event.notes" class="event-text">Observações: {{ event.notes }}</p>
        <div v-if="event.event_photos?.length" class="event-photos">
          <button
            v-for="p in event.event_photos.filter((p) => p.signed_url).slice(0, 4)"
            :key="p.id"
            type="button"
            class="button button--secondary"
            :aria-label="'Ampliar foto: ' + (p.description || event.title)"
            @click="photo = { src: p.signed_url!, alt: p.description || event.title }"
          >
            <img :src="p.signed_url" :alt="p.description || event.title" loading="lazy" />
          </button>
        </div>
        <template v-if="event.event_inputs?.length"
          ><h4>Insumos utilizados</h4>
          <p v-if="cost(event) > 0">Custo: {{ formatCurrencyBRL(cost(event)) }}</p>
          <div v-for="input in event.event_inputs" :key="input.id" class="rural-card">
            <strong>{{ input.agricultural_input?.name || 'Insumo' }}</strong>
            <p>
              {{ formatNumberPtBr(input.quantity) }} {{ input.unit
              }}{{
                input.inventory_lot?.batch_number
                  ? ' • Lote ' + input.inventory_lot.batch_number
                  : ''
              }}
            </p>
            <p v-if="input.total_cost !== null && input.total_cost !== undefined">
              {{ formatCurrencyBRL(input.total_cost) }}
            </p>
          </div></template
        >
        <div v-if="!archived" class="rural-actions">
          <a
            :href="path + '/events/' + encodeURIComponent(event.id) + '/edit'"
            class="button button--secondary"
            data-link
            >Editar evento</a
          ><a
            :href="path + '/events/' + encodeURIComponent(event.id) + '/inputs/new'"
            class="button button--secondary"
            data-link
            >Adicionar insumo</a
          ><a
            :href="path + '/evolution/new?event=' + encodeURIComponent(event.id)"
            class="button button--secondary"
            data-link
            >Adicionar foto</a
          >
        </div>
      </article></RequestState
    ><RuralDialog v-if="photo" title="Visualização da foto" :busy="false" @close="photo = null"
      ><img class="expanded-photo" :src="photo.src" :alt="photo.alt" /><button
        class="button button--secondary"
        @click="photo = null"
      >
        Fechar imagem
      </button></RuralDialog
    >
  </section>
</template>
<style scoped>
.event-text {
  white-space: pre-wrap;
}
.event-photos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.event-photos img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}
.expanded-photo {
  max-width: 100%;
  max-height: 65vh;
  object-fit: contain;
}
</style>
