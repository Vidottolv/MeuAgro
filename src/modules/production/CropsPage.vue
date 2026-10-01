<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { crops } from './productionRepository';
import { matches } from './productionModel';
import RequestState from '../properties/components/RequestState.vue';
import PageNavigation from '../inventory/components/PageNavigation.vue';
import '../properties/rural.css';
const { data, loading, error, reload } = useResource(crops, []);
const query = ref(''),
  state = ref('active'),
  origin = ref('all'),
  page = ref(1);
const filtered = computed(() =>
  data.value.filter(
    (c) =>
      matches([c.name, c.category, c.notes].join(' '), query.value) &&
      (state.value === 'all' || c.active === (state.value === 'active')) &&
      (origin.value === 'all' || c.is_system === (origin.value === 'system')),
  ),
);
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
watch([query, state, origin, data], () => {
  page.value = 1;
});
</script>
<template>
  <div class="rural-vue">
    <section class="rural-panel">
      <header class="rural-header">
        <div>
          <h2>Minhas culturas</h2>
          <p>Organize suas culturas e os ciclos médios de produção.</p>
        </div>
        <a href="/more/crops/new" class="button button--primary" data-link>Nova cultura</a>
      </header>
      <div class="field">
        <label for="crops-search">Buscar cultura</label
        ><input id="crops-search" v-model="query" type="search" />
      </div>
      <div class="rural-grid">
        <div class="field">
          <label for="crops-state">Situação</label
          ><select id="crops-state" v-model="state">
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
            <option value="all">Todas</option>
          </select>
        </div>
        <div class="field">
          <label for="crops-origin">Origem</label
          ><select id="crops-origin" v-model="origin">
            <option value="all">Todas</option>
            <option value="system">Do sistema</option>
            <option value="own">Personalizadas</option>
          </select>
        </div>
      </div>
      <div class="rural-actions">
        <button
          class="button button--secondary"
          @click="
            query = '';
            state = 'active';
            origin = 'all';
          "
        >
          Limpar filtros</button
        ><button class="button button--secondary" :disabled="loading" @click="reload">
          Atualizar culturas
        </button>
      </div>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><p>{{ filtered.length }} culturas encontradas</p>
      <div v-if="visible.length" class="rural-grid">
        <article v-for="c in visible" :key="c.id" class="rural-card crop-vue-card">
          <h3>{{ c.name }}</h3>
          <p>{{ c.category || 'Sem categoria' }}</p>
          <p>
            {{ c.is_system ? 'Cultura do sistema' : 'Personalizada' }} •
            {{ c.active ? 'Ativa' : 'Inativa' }}
          </p>
          <p>
            {{
              c.average_cycle_days
                ? c.average_cycle_days + ' dias de ciclo médio'
                : 'Ciclo médio não informado'
            }}
          </p>
          <a
            :href="`/more/crops/${encodeURIComponent(c.id)}`"
            class="button button--secondary"
            data-link
            >Ver cultura</a
          >
        </article>
      </div>
      <section v-else class="rural-panel"><h3>Nenhuma cultura encontrada</h3></section>
      <PageNavigation :page="page" :total="filtered.length" :size="20" @change="page = $event"
    /></RequestState>
  </div>
</template>
