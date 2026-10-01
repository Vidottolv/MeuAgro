<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchPlantings, fetchOptions } from './plantingRepository';
import { searchPlantings } from './plantingModel';
import { PRODUCTION_CYCLE_STATUSES } from '../../constants/productionCycleStatus.js';
import RequestState from '../properties/components/RequestState.vue';
import PageNavigation from '../inventory/components/PageNavigation.vue';
import PlantingCard from './PlantingCard.vue';
import '../properties/rural.css';
const q = new URLSearchParams(location.search);
const filters = reactive({
  property: q.get('property') || '',
  crop: q.get('crop') || '',
  status: PRODUCTION_CYCLE_STATUSES.some(([v]) => v === q.get('status')) ? q.get('status')! : '',
  archived: q.get('archived') === '1',
  open: q.get('open') === '1',
});
const search = ref(q.get('q') || ''),
  page = ref(1);
const { data, loading, error, reload, reset } = useResource(
  () => fetchPlantings({ ...filters }),
  [],
);
const options = useResource(() => fetchOptions(true), { properties: [], crops: [] });
const filtered = computed(() => searchPlantings(data.value, search.value)),
  visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
function sync() {
  const q = new URLSearchParams();
  for (const key of ['property', 'crop', 'status'] as const)
    if (filters[key]) q.set(key, filters[key]);
  if (filters.open) q.set('open', '1');
  if (filters.archived) q.set('archived', '1');
  if (search.value) q.set('q', search.value);
  history.replaceState(history.state, '', location.pathname + (q.size ? '?' + q : ''));
}
watch(filters, () => {
  page.value = 1;
  reset();
  void reload();
  sync();
});
watch(search, () => {
  page.value = 1;
  sync();
});
watch(data, () => {
  page.value = 1;
});
function clear() {
  Object.assign(filters, { property: '', crop: '', status: '', open: false });
  search.value = '';
}
</script>
<template>
  <div class="rural-vue">
    <section class="rural-panel">
      <header class="rural-header">
        <div>
          <h2>Meus plantios</h2>
          <p>Acompanhe cada ciclo produtivo e preserve o histórico de suas áreas.</p>
        </div>
        <a
          :href="
            '/plantings/new' +
            (filters.property ? '?property=' + encodeURIComponent(filters.property) : '')
          "
          class="button button--primary"
          data-link
          >Novo plantio</a
        >
      </header>
    </section>
    <section class="rural-panel">
      <div class="rural-actions" role="group" aria-label="Situação dos plantios">
        <button
          class="button"
          :class="filters.archived ? 'button--secondary' : 'button--primary'"
          :aria-pressed="!filters.archived"
          @click="filters.archived = false"
        >
          Não arquivados</button
        ><button
          class="button"
          :class="filters.archived ? 'button--primary' : 'button--secondary'"
          :aria-pressed="filters.archived"
          @click="filters.archived = true"
        >
          Arquivados
        </button>
      </div>
      <div class="field">
        <label for="plantings-search">Buscar plantio</label
        ><input
          id="plantings-search"
          v-model="search"
          type="search"
          placeholder="Cultura, variedade, local ou safra"
        />
      </div>
      <div class="rural-grid">
        <div class="field">
          <label for="plantings-property">Propriedade</label
          ><select id="plantings-property" v-model="filters.property">
            <option value="">Todas</option>
            <option
              v-if="
                filters.property &&
                !options.data.value.properties.some((p) => p.id === filters.property)
              "
              :value="filters.property"
            >
              Propriedade do filtro
            </option>
            <option v-for="p in options.data.value.properties" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="plantings-crop">Cultura</label
          ><select id="plantings-crop" v-model="filters.crop">
            <option value="">Todas</option>
            <option
              v-if="filters.crop && !options.data.value.crops.some((c) => c.id === filters.crop)"
              :value="filters.crop"
            >
              Cultura do filtro
            </option>
            <option v-for="c in options.data.value.crops" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="plantings-status">Status produtivo</label
          ><select
            id="plantings-status"
            v-model="filters.status"
            :disabled="filters.open || filters.archived"
          >
            <option value="">Todos</option>
            <option v-for="[value, label] in PRODUCTION_CYCLE_STATUSES" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>
      </div>
      <label class="rural-actions"
        ><input
          v-model="filters.open"
          style="width: auto"
          type="checkbox"
          :disabled="filters.archived"
        />Somente em aberto</label
      >
      <p v-if="filters.archived">A lista de arquivados inclui todos os status produtivos.</p>
      <RequestState
        :loading="options.loading.value"
        :error="options.error.value"
        label="Carregando opções…"
        retry-label="Tentar carregar filtros"
        @retry="options.reload"
      />
      <div class="rural-actions">
        <button class="button button--secondary" @click="clear">Limpar filtros</button
        ><button class="button button--secondary" :disabled="loading" @click="reload">
          Atualizar plantios
        </button>
      </div>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><p role="status">{{ filtered.length }} plantios encontrados</p>
      <div v-if="visible.length" class="rural-grid">
        <PlantingCard v-for="item in visible" :key="item.id" :item="item" @changed="reload" />
      </div>
      <section v-else class="rural-panel">
        <h3>Nenhum plantio encontrado</h3>
        <p>Confira os filtros ou registre um plantio.</p>
      </section>
      <PageNavigation :page="page" :total="filtered.length" :size="20" @change="page = $event"
    /></RequestState>
  </div>
</template>
