<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { list } from './contactRepository';
import { matches } from '../production/productionModel';
import RequestState from '../properties/components/RequestState.vue';
import PageNavigation from '../inventory/components/PageNavigation.vue';
const search = ref(''),
  filter = ref('active'),
  page = ref(1);
const { data, loading, error, reload, reset } = useResource(
  () => list(filter.value === 'archived'),
  [],
);
const filtered = computed(() =>
  data.value.filter(
    (c) =>
      (filter.value === 'all' ||
        filter.value === 'archived' ||
        c.active === (filter.value === 'active')) &&
      matches([c.name, c.company, c.specialty].join(' '), search.value),
  ),
);
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
watch(filter, () => {
  reset();
  page.value = 1;
  void reload();
});
watch(search, () => (page.value = 1));
watch(data, () => (page.value = 1));
</script>
<template>
  <div class="rural-vue">
    <header class="rural-header">
      <h2>Contatos de consultores</h2>
      <a href="/more/consultants/new" data-link class="button button--primary">Novo contato</a>
    </header>
    <section class="rural-panel">
      <div class="field">
        <label for="contact-search">Buscar nome, empresa ou especialidade</label
        ><input id="contact-search" v-model="search" type="search" />
      </div>
      <div class="field">
        <label for="contact-filter">Situação</label
        ><select id="contact-filter" v-model="filter">
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="all">Todos os não arquivados</option>
          <option value="archived">Arquivados</option>
        </select>
      </div>
      <button class="button button--secondary" :disabled="loading" @click="reload">
        Atualizar
      </button>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><p v-if="!filtered.length">Nenhum contato encontrado.</p>
      <div class="rural-grid">
        <article v-for="c in visible" :key="c.id" class="rural-card">
          <h3>{{ c.name }}</h3>
          <p>{{ c.company || 'Profissional independente' }}</p>
          <p>{{ c.specialty || 'Especialidade não informada' }}</p>
          <a
            :href="`/more/consultants/${encodeURIComponent(c.id)}`"
            data-link
            class="button button--secondary"
            >Ver contato</a
          >
        </article>
      </div>
      <PageNavigation :page="page" :total="filtered.length" :size="20" @change="page = $event"
    /></RequestState>
  </div>
</template>
