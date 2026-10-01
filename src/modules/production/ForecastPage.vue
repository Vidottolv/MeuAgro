<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { forecasts } from './productionRepository';
import { fetchFilterProperties } from '../seasons/seasonRepository';
import { matches } from './productionModel';
import { title } from '../plantings/plantingModel';
import { dateLabel } from '../seasons/seasonModel';
import {
  HARVEST_FORECAST_FILTERS,
  getHarvestForecastLabel,
} from '../../constants/harvestForecast.js';
import RequestState from '../properties/components/RequestState.vue';
import PageNavigation from '../inventory/components/PageNavigation.vue';
import '../properties/rural.css';
const q = new URLSearchParams(location.search),
  property = ref(q.get('property') || ''),
  filter = ref(
    HARVEST_FORECAST_FILTERS.some(([v]) => v === q.get('filter')) ? q.get('filter')! : 'all',
  ),
  search = ref(''),
  page = ref(1);
const { data, loading, error, reload, reset } = useResource(() => forecasts(property.value), []);
const properties = useResource(fetchFilterProperties, []);
const filtered = computed(() =>
  data.value.filter(
    (c) =>
      (filter.value === 'all' || c.forecast_state === filter.value) &&
      matches([title(c), c.property?.name, c.area?.name].join(' '), search.value),
  ),
);
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
function sync() {
  const params = new URLSearchParams({ filter: filter.value });
  if (property.value) params.set('property', property.value);
  history.replaceState(history.state, '', location.pathname + '?' + params);
}
watch(property, () => {
  reset();
  void reload();
  sync();
});
watch(filter, sync);
watch([data, filter, search], () => {
  page.value = 1;
});
</script>
<template>
  <div class="rural-vue">
    <section class="rural-panel">
      <h2>Previsão de colheita</h2>
      <p>Acompanhe as previsões dos ciclos em aberto.</p>
      <div class="rural-grid">
        <div class="field">
          <label for="forecast-property">Propriedade</label
          ><select id="forecast-property" v-model="property">
            <option value="">Todas as propriedades</option>
            <option
              v-if="property && !properties.data.value.some((p) => p.id === property)"
              :value="property"
            >
              Propriedade do filtro
            </option>
            <option v-for="p in properties.data.value" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="forecast-search">Buscar plantio</label
          ><input id="forecast-search" v-model="search" type="search" />
        </div>
      </div>
      <RequestState
        :loading="properties.loading.value"
        :error="properties.error.value"
        retry-label="Tentar carregar propriedades"
        @retry="properties.reload"
      /><button class="button button--secondary" :disabled="loading" @click="reload">
        Atualizar previsões
      </button>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section class="rural-panel">
        <p>Contagens da propriedade selecionada, antes da busca:</p>
        <div class="rural-actions">
          <button
            v-for="[value, label] in HARVEST_FORECAST_FILTERS"
            :key="value"
            class="button"
            :class="filter === value ? 'button--primary' : 'button--secondary'"
            :aria-pressed="filter === value"
            @click="filter = value"
          >
            {{ label }} ({{
              value === 'all' ? data.length : data.filter((c) => c.forecast_state === value).length
            }})
          </button>
        </div>
      </section>
      <div v-if="visible.length" class="rural-grid">
        <article v-for="c in visible" :key="c.id" class="rural-card forecast-vue-card">
          <h3>{{ title(c) }}</h3>
          <p>{{ c.property?.name }} • {{ c.area?.name }}</p>
          <strong>{{ getHarvestForecastLabel(c.forecast_state) }}</strong>
          <p>Previsão atual: {{ dateLabel(c.current_harvest_forecast) }}</p>
          <p
            v-if="
              c.initial_harvest_forecast &&
              c.initial_harvest_forecast !== c.current_harvest_forecast
            "
          >
            Previsão inicial: {{ dateLabel(c.initial_harvest_forecast) }}
          </p>
          <p>
            {{
              c.days_to_harvest === 0
                ? 'Colheita prevista para hoje'
                : c.days_to_harvest !== null && c.days_to_harvest < 0
                  ? Math.abs(c.days_to_harvest) + ' dias de atraso'
                  : c.days_to_harvest + ' dias até a previsão'
            }}
          </p>
          <a
            :href="`/plantings/${encodeURIComponent(c.id)}`"
            class="button button--secondary"
            data-link
            >Ver plantio</a
          >
        </article>
      </div>
      <section v-else class="rural-panel">
        <h3>Nenhuma previsão encontrada</h3>
        <p>Confira os filtros e as datas informadas nos plantios.</p>
      </section>
      <PageNavigation :page="page" :total="filtered.length" :size="20" @change="page = $event"
    /></RequestState>
  </div>
</template>
