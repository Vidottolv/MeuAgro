<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchProperty, fetchAreas } from './ruralRepository';
import { filterAreas, isArchived } from './ruralModel';
import AreaCard from './components/AreaCard.vue';
import RequestState from './components/RequestState.vue';
import PageNavigation from '../inventory/components/PageNavigation.vue';
import './rural.css';
const props = defineProps<{ propertyId: string }>();
const archived = ref(new URLSearchParams(location.search).get('status') === 'archived'),
  search = ref(''),
  typeId = ref(''),
  page = ref(1);
const {
  data: property,
  loading: propertyLoading,
  error: propertyError,
  reload: reloadProperty,
} = useResource(() => fetchProperty(props.propertyId), null);
const { data, loading, error, reload, reset } = useResource(
  () => fetchAreas(props.propertyId, archived.value),
  [],
  false,
);
watch(property, (item) => {
  if (item && !isArchived(item)) void reload();
});
watch(archived, () => {
  page.value = 1;
  typeId.value = '';
  reset();
  if (property.value && !isArchived(property.value)) void reload();
  history.replaceState(
    history.state,
    '',
    location.pathname + (archived.value ? '?status=archived' : ''),
  );
});
const types = computed(() => [
  ...new Map(
    data.value
      .filter((item) => item.area_type)
      .map((item) => [item.area_type!.id, item.area_type!]),
  ).values(),
]);
const filtered = computed(() => filterAreas(data.value, search.value, typeId.value));
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
watch([search, typeId, data], () => {
  page.value = 1;
});
</script>
<template>
  <div class="rural-vue">
    <a
      :href="`/properties/${encodeURIComponent(propertyId)}`"
      class="button button--secondary rural-back"
      data-link
      >Voltar à propriedade</a
    >
    <h2>Áreas da propriedade</h2>
    <RequestState :loading="propertyLoading" :error="propertyError" @retry="reloadProperty"
      ><section v-if="!property" class="rural-panel"><h3>Propriedade não encontrada</h3></section>
      <section v-else-if="isArchived(property)" class="rural-panel">
        <h3>Propriedade arquivada</h3>
        <p>Restaure a propriedade para gerenciar suas áreas.</p>
      </section>
      <template v-else
        ><section class="rural-panel">
          <header class="rural-header">
            <h3>{{ property.name }}</h3>
            <a
              :href="`/properties/${encodeURIComponent(propertyId)}/areas/new`"
              class="button button--primary"
              data-link
              >Nova área</a
            >
          </header>
          <div class="rural-actions" role="group" aria-label="Situação das áreas">
            <button
              class="button"
              :class="archived ? 'button--secondary' : 'button--primary'"
              :aria-pressed="!archived"
              @click="archived = false"
            >
              Ativas</button
            ><button
              class="button"
              :class="archived ? 'button--primary' : 'button--secondary'"
              :aria-pressed="archived"
              @click="archived = true"
            >
              Arquivadas
            </button>
          </div>
          <div class="rural-grid">
            <div class="field">
              <label for="areas-search">Buscar área</label
              ><input
                id="areas-search"
                v-model="search"
                type="search"
                placeholder="Nome, tipo ou localização"
              />
            </div>
            <div class="field">
              <label for="areas-type">Tipo</label
              ><select id="areas-type" v-model="typeId">
                <option value="">Todos os tipos</option>
                <option v-for="item in types" :key="item.id" :value="item.id">
                  {{ item.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="rural-actions">
            <button
              class="button button--secondary"
              @click="
                search = '';
                typeId = '';
              "
            >
              Limpar busca</button
            ><button class="button button--secondary" :disabled="loading" @click="reload">
              Atualizar áreas
            </button>
          </div>
        </section>
        <RequestState
          :loading="loading"
          :error="error"
          label="Carregando áreas…"
          retry-label="Tentar carregar áreas"
          @retry="reload"
          ><p role="status">{{ filtered.length }} áreas encontradas</p>
          <div v-if="visible.length" class="rural-grid">
            <AreaCard v-for="item in visible" :key="item.id" :item="item" @changed="reload" />
          </div>
          <section v-else class="rural-panel">
            <h3>Nenhuma área encontrada</h3>
            <p>Confira os filtros ou cadastre uma área.</p>
          </section>
          <PageNavigation
            :page="page"
            :total="filtered.length"
            :size="20"
            @change="page = $event" /></RequestState></template
    ></RequestState>
  </div>
</template>
