<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { listHarvests } from './harvestRepository';
import { amount, cycleLabel, remaining } from './harvestModel';
import { dateLabel } from '../seasons/seasonModel';
import { matches } from '../production/productionModel';
import {
  HARVEST_DESTINATIONS,
  getHarvestDestinationLabel,
} from '../../constants/harvestDestinations.js';
import RequestState from '../properties/components/RequestState.vue';
import PageNavigation from '../inventory/components/PageNavigation.vue';
const q = new URLSearchParams(location.search);
const search = ref(q.get('search') || ''),
  month = ref(q.get('month') || ''),
  property = ref(q.get('property') || ''),
  destination = ref(q.get('destination') || ''),
  page = ref(1);
const { data, loading, error, reload } = useResource(listHarvests, []);
const properties = computed(() =>
  Array.from(
    new Map(
      data.value.map((h) => [h.production_cycle?.property_id, h.production_cycle?.property?.name]),
    ).entries(),
  ).filter(([id]) => id),
);
const filtered = computed(() =>
  data.value.filter(
    (h) =>
      (!month.value || h.harvest_date.startsWith(month.value)) &&
      (!destination.value || h.destination === destination.value) &&
      (!property.value || h.production_cycle?.property_id === property.value) &&
      matches(cycleLabel(h.production_cycle) + ' ' + (h.notes || ''), search.value),
  ),
);
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
const totals = computed(() =>
  Array.from(
    filtered.value.reduce(
      (m, h) => m.set(h.unit, (m.get(h.unit) || 0) + Number(h.quantity)),
      new Map<string, number>(),
    ),
  ),
);
watch([search, month, property, destination], () => {
  page.value = 1;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({
    search: search.value,
    month: month.value,
    property: property.value,
    destination: destination.value,
  }))
    if (v) p.set(k, v);
  history.replaceState(history.state, '', location.pathname + (p.size ? '?' + p : ''));
});
watch(data, () => (page.value = 1));
</script>
<template>
  <div class="rural-vue">
    <header class="rural-header">
      <h2>Colheitas</h2>
      <a href="/more/harvests/new" data-link class="button button--primary">Nova colheita</a>
    </header>
    <section class="rural-panel">
      <div class="field">
        <label for="harvest-search">Buscar colheitas</label
        ><input id="harvest-search" v-model="search" type="search" />
      </div>
      <div class="rural-grid">
        <div class="field">
          <label for="harvest-month">Mês</label
          ><input id="harvest-month" v-model="month" type="month" />
        </div>
        <div class="field">
          <label for="harvest-property">Propriedade</label
          ><select id="harvest-property" v-model="property">
            <option value="">Todas</option>
            <option v-for="[id, name] in properties" :key="id" :value="id">{{ name }}</option>
          </select>
        </div>
        <div class="field">
          <label for="harvest-destination-filter">Destino</label
          ><select id="harvest-destination-filter" v-model="destination">
            <option value="">Todos</option>
            <option v-for="[v, l] in HARVEST_DESTINATIONS" :key="v" :value="v">{{ l }}</option>
          </select>
        </div>
      </div>
      <button class="button button--secondary" :disabled="loading" @click="reload">
        Atualizar
      </button>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><p>{{ filtered.length }} colheitas encontradas</p>
      <div class="rural-actions">
        <span v-for="[unit, total] in totals" :key="unit" class="rural-tag"
          >{{ amount(total) }} {{ unit }}</span
        >
      </div>
      <p v-if="!filtered.length">Nenhuma colheita para estes filtros.</p>
      <div class="rural-grid">
        <article v-for="h in visible" :key="h.id" class="rural-card">
          <h3>{{ cycleLabel(h.production_cycle) }}</h3>
          <p>{{ dateLabel(h.harvest_date) }} • {{ getHarvestDestinationLabel(h.destination) }}</p>
          <strong>{{ amount(h.quantity) }} {{ h.unit }}</strong>
          <p>Saldo: {{ amount(remaining(h)) }} {{ h.unit }}</p>
          <a
            :href="`/more/harvests/${encodeURIComponent(h.id)}`"
            data-link
            class="button button--secondary"
            >Ver colheita</a
          >
        </article>
      </div>
      <PageNavigation :page="page" :total="filtered.length" :size="20" @change="page = $event"
    /></RequestState>
  </div>
</template>
