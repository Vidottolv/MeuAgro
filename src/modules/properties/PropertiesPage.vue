<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchProperties } from './ruralRepository';
import { filterProperties } from './ruralModel';
import { BRAZIL_STATES } from '../../constants/brazilStates.js';
import PropertyCard from './components/PropertyCard.vue';
import RequestState from './components/RequestState.vue';
import PageNavigation from '../inventory/components/PageNavigation.vue';
import './rural.css';
const archived = ref(new URLSearchParams(location.search).get('status') === 'archived'),
  search = ref(''),
  state = ref(''),
  page = ref(1);
const { data, loading, error, reload, reset } = useResource(
  () => fetchProperties(archived.value),
  [],
);
const filtered = computed(() => filterProperties(data.value, search.value, state.value));
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
watch(archived, () => {
  page.value = 1;
  reset();
  void reload();
  history.replaceState(
    history.state,
    '',
    location.pathname + (archived.value ? '?status=archived' : ''),
  );
});
watch([search, state, data], () => {
  page.value = 1;
});
</script>
<template>
  <div class="rural-vue">
    <section class="rural-panel">
      <header class="rural-header">
        <div>
          <h2>Minhas propriedades</h2>
          <p>Organize suas propriedades e os espaços de produção.</p>
        </div>
        <a href="/properties/new" class="button button--primary" data-link>Nova propriedade</a>
      </header>
    </section>
    <section class="rural-panel">
      <div class="rural-actions" role="group" aria-label="Situação das propriedades">
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
          <label for="properties-search">Buscar propriedade</label
          ><input
            id="properties-search"
            v-model="search"
            type="search"
            placeholder="Nome, cidade ou descrição"
          />
        </div>
        <div class="field">
          <label for="properties-state">Estado</label
          ><select id="properties-state" v-model="state">
            <option value="">Todos os estados</option>
            <option v-for="[uf, name] in BRAZIL_STATES" :key="uf" :value="uf">
              {{ uf }} - {{ name }}
            </option>
          </select>
        </div>
      </div>
      <div class="rural-actions">
        <button
          class="button button--secondary"
          @click="
            search = '';
            state = '';
          "
        >
          Limpar busca</button
        ><button class="button button--secondary" :disabled="loading" @click="reload">
          Atualizar propriedades
        </button>
      </div>
    </section>
    <RequestState :loading="loading" :error="error" label="Carregando propriedades…" @retry="reload"
      ><p role="status">{{ filtered.length }} propriedades encontradas</p>
      <div v-if="visible.length" class="rural-grid">
        <PropertyCard v-for="item in visible" :key="item.id" :item="item" @changed="reload" />
      </div>
      <section v-else class="rural-panel">
        <h3>Nenhuma propriedade encontrada</h3>
        <p>
          {{
            archived
              ? 'Confira a busca ou volte à lista de ativas.'
              : 'Confira a busca ou cadastre uma propriedade.'
          }}
        </p>
      </section>
      <PageNavigation :page="page" :size="20" :total="filtered.length" @change="page = $event"
    /></RequestState>
  </div>
</template>
