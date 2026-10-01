<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchSeasons, fetchFilterProperties } from './seasonRepository';
import { searchSeasons } from './seasonModel';
import { SEASON_STATUSES } from '../../constants/seasonStatus.js';
import RequestState from '../properties/components/RequestState.vue';
import PageNavigation from '../inventory/components/PageNavigation.vue';
import SeasonCard from './SeasonCard.vue';
import '../properties/rural.css';
const query = new URLSearchParams(location.search);
const property = ref(query.get('property') || ''),
  status = ref(
    SEASON_STATUSES.some(([v]) => v === query.get('status')) ? query.get('status')! : '',
  );
const archived = ref(query.get('archived') === '1'),
  search = ref(query.get('q') || ''),
  page = ref(1);
const { data, loading, error, reload, reset } = useResource(
  () => fetchSeasons(property.value, status.value, archived.value),
  [],
);
const properties = useResource(fetchFilterProperties, []);
const filtered = computed(() => searchSeasons(data.value, search.value));
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
const missingProperty = computed(
  () => property.value && !properties.data.value.some((p) => p.id === property.value),
);
const newHref = computed(
  () =>
    '/more/seasons/new' + (property.value ? '?property=' + encodeURIComponent(property.value) : ''),
);
function syncUrl() {
  const q = new URLSearchParams();
  if (property.value) q.set('property', property.value);
  if (status.value) q.set('status', status.value);
  if (archived.value) q.set('archived', '1');
  if (search.value) q.set('q', search.value);
  history.replaceState(history.state, '', location.pathname + (q.size ? '?' + q : ''));
}
watch([property, status, archived], () => {
  page.value = 1;
  reset();
  void reload();
  syncUrl();
});
watch(search, () => {
  page.value = 1;
  syncUrl();
});
watch(data, () => {
  page.value = 1;
});
function clear() {
  property.value = '';
  status.value = '';
  search.value = '';
}
</script>
<template>
  <div class="rural-vue">
    <section class="rural-panel">
      <header class="rural-header">
        <div>
          <h2>Minhas safras</h2>
          <p>Organize os períodos produtivos e acompanhe os plantios vinculados.</p>
        </div>
        <a :href="newHref" class="button button--primary" data-link>Nova safra</a>
      </header>
    </section>
    <section class="rural-panel">
      <div class="rural-actions" role="group" aria-label="Situação das safras">
        <button
          class="button"
          :class="archived ? 'button--secondary' : 'button--primary'"
          :aria-pressed="!archived"
          @click="archived = false"
        >
          Não arquivadas</button
        ><button
          class="button"
          :class="archived ? 'button--primary' : 'button--secondary'"
          :aria-pressed="archived"
          @click="archived = true"
        >
          Arquivadas
        </button>
      </div>
      <div class="field">
        <label for="seasons-search">Buscar safra</label
        ><input
          id="seasons-search"
          v-model="search"
          type="search"
          placeholder="Nome, propriedade ou descrição"
        />
      </div>
      <div class="rural-grid">
        <div class="field">
          <label for="seasons-property">Propriedade</label
          ><select id="seasons-property" v-model="property">
            <option value="">Todas as propriedades</option>
            <option v-if="missingProperty" :value="property">Propriedade do filtro</option>
            <option v-for="p in properties.data.value" :key="p.id" :value="p.id">
              {{ p.name }}{{ p.deleted_at ? ' (arquivada)' : '' }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="seasons-status">Status produtivo</label
          ><select id="seasons-status" v-model="status">
            <option value="">Todos os status</option>
            <option v-for="[value, label] in SEASON_STATUSES" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>
      </div>
      <RequestState
        :loading="properties.loading.value"
        :error="properties.error.value"
        label="Carregando opções de propriedades…"
        retry-label="Tentar carregar propriedades"
        @retry="properties.reload"
      />
      <div class="rural-actions">
        <button class="button button--secondary" @click="clear">Limpar filtros</button
        ><button class="button button--secondary" :disabled="loading" @click="reload">
          Atualizar safras
        </button>
      </div>
    </section>
    <RequestState :loading="loading" :error="error" label="Carregando safras…" @retry="reload"
      ><p role="status">
        {{ filtered.length }}
        {{ filtered.length === 1 ? 'safra encontrada' : 'safras encontradas' }}
      </p>
      <div v-if="visible.length" class="rural-grid">
        <SeasonCard v-for="item in visible" :key="item.id" :item="item" @changed="reload" />
      </div>
      <section v-else class="rural-panel">
        <h3>Nenhuma safra encontrada</h3>
        <p>Confira os filtros ou cadastre uma safra.</p>
      </section>
      <PageNavigation :page="page" :total="filtered.length" :size="20" @change="page = $event"
    /></RequestState>
  </div>
</template>
