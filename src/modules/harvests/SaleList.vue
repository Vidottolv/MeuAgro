<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { listSales } from './harvestRepository';
import { amount, cycleLabel, money } from './harvestModel';
import { dateLabel } from '../seasons/seasonModel';
import { matches } from '../production/productionModel';
import RequestState from '../properties/components/RequestState.vue';
import PageNavigation from '../inventory/components/PageNavigation.vue';
const q = new URLSearchParams(location.search),
  search = ref(q.get('search') || ''),
  month = ref(q.get('month') || ''),
  property = ref(q.get('property') || ''),
  page = ref(1);
const { data, loading, error, reload } = useResource(listSales, []);
const properties = computed(() =>
  Array.from(
    new Map(
      data.value.map((s) => [
        s.harvest?.production_cycle?.property_id,
        s.harvest?.production_cycle?.property?.name,
      ]),
    ).entries(),
  ).filter(([id]) => id),
);
const filtered = computed(() =>
  data.value.filter(
    (s) =>
      (!month.value || s.sale_date.startsWith(month.value)) &&
      (!property.value || s.harvest?.production_cycle?.property_id === property.value) &&
      matches(cycleLabel(s.harvest?.production_cycle) + ' ' + s.buyer, search.value),
  ),
);
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20)),
  total = computed(() => filtered.value.reduce((a, s) => a + Number(s.total_value), 0));
watch([search, month, property], () => {
  page.value = 1;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({
    search: search.value,
    month: month.value,
    property: property.value,
  }))
    if (v) p.set(k, v);
  history.replaceState(history.state, '', location.pathname + (p.size ? '?' + p : ''));
});
watch(data, () => (page.value = 1));
</script>
<template>
  <div class="rural-vue">
    <header class="rural-header">
      <h2>Vendas da produção</h2>
      <a href="/more/sales/new" data-link class="button button--primary">Nova venda</a>
    </header>
    <section class="rural-panel">
      <div class="field">
        <label for="sale-search">Buscar por comprador ou plantio</label
        ><input id="sale-search" v-model="search" type="search" />
      </div>
      <div class="rural-grid">
        <div class="field">
          <label for="sale-month">Mês</label><input id="sale-month" v-model="month" type="month" />
        </div>
        <div class="field">
          <label for="sale-property">Propriedade</label
          ><select id="sale-property" v-model="property">
            <option value="">Todas</option>
            <option v-for="[id, name] in properties" :key="id" :value="id">{{ name }}</option>
          </select>
        </div>
      </div>
      <button class="button button--secondary" :disabled="loading" @click="reload">
        Atualizar
      </button>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section class="rural-panel">
        <h3>Receita dos registros filtrados</h3>
        <strong>{{ money(total) }}</strong>
        <p>{{ filtered.length }} vendas</p>
      </section>
      <p v-if="!filtered.length">Nenhuma venda para estes filtros.</p>
      <div class="rural-grid">
        <article v-for="s in visible" :key="s.id" class="rural-card">
          <h3>{{ s.buyer || 'Comprador não informado' }}</h3>
          <p>{{ cycleLabel(s.harvest?.production_cycle) }}</p>
          <p>{{ dateLabel(s.sale_date) }} • {{ amount(s.quantity) }} {{ s.unit }}</p>
          <strong>{{ money(s.total_value) }}</strong
          ><a
            :href="`/more/sales/${encodeURIComponent(s.id)}`"
            data-link
            class="button button--secondary"
            >Ver venda</a
          >
        </article>
      </div>
      <PageNavigation :page="page" :total="filtered.length" :size="20" @change="page = $event"
    /></RequestState>
  </div>
</template>
