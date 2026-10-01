<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { cycles, overview } from './financeRepository';
import { cycleLabel, money } from '../harvests/harvestModel';
import { matches } from '../production/productionModel';
import {
  FINANCIAL_RESULT_FILTERS,
  getFinancialResultLabel,
} from '../../constants/financialResult.js';
import { PRODUCTION_CYCLE_STATUSES } from '../../constants/productionCycleStatus.js';
import RequestState from '../properties/components/RequestState.vue';
import PageNavigation from '../inventory/components/PageNavigation.vue';
import FinanceSummary from './FinanceSummary.vue';
const q = new URLSearchParams(location.search),
  search = ref(q.get('search') || ''),
  property = ref(q.get('property') || ''),
  status = ref(q.get('status') || ''),
  result = ref(q.get('result') || 'all'),
  page = ref(1);
const stats = useResource(overview, null);
const { data, loading, error, reload } = useResource(cycles, []);
const properties = computed(() =>
  Array.from(new Map(data.value.map((c) => [c.property_id, c.property?.name])).entries()),
);
const filtered = computed(() =>
  data.value.filter(
    (c) =>
      (!property.value || c.property_id === property.value) &&
      (!status.value || c.status === status.value) &&
      (result.value === 'all' || c.finance.result_state === result.value) &&
      matches(cycleLabel(c), search.value),
  ),
);
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
watch([search, property, status, result], () => {
  page.value = 1;
  const p = new URLSearchParams({ result: result.value });
  for (const [k, v] of Object.entries({
    search: search.value,
    property: property.value,
    status: status.value,
  }))
    if (v) p.set(k, v);
  history.replaceState(history.state, '', location.pathname + '?' + p);
});
watch(data, () => (page.value = 1));
</script>
<template>
  <div class="rural-vue">
    <h2>Custos, receitas e resultados</h2>
    <p>
      Resultado estimado a partir dos insumos consumidos e das vendas registradas. Não inclui outros
      custos da atividade.
    </p>
    <RequestState :loading="stats.loading.value" :error="stats.error.value" @retry="stats.reload"
      ><FinanceSummary v-if="stats.data.value" :summary="stats.data.value"
    /></RequestState>
    <section class="rural-panel">
      <h3>Filtrar plantios</h3>
      <div class="field">
        <label for="finance-search">Buscar plantio</label
        ><input id="finance-search" v-model="search" type="search" />
      </div>
      <div class="rural-grid">
        <div class="field">
          <label for="finance-property">Propriedade</label
          ><select id="finance-property" v-model="property">
            <option value="">Todas</option>
            <option v-for="[id, name] in properties" :key="id" :value="id">{{ name }}</option>
          </select>
        </div>
        <div class="field">
          <label for="finance-status">Situação do plantio</label
          ><select id="finance-status" v-model="status">
            <option value="">Todas</option>
            <option v-for="[v, l] in PRODUCTION_CYCLE_STATUSES" :key="v" :value="v">{{ l }}</option>
          </select>
        </div>
        <div class="field">
          <label for="finance-result">Resultado</label
          ><select id="finance-result" v-model="result">
            <option v-for="[v, l] in FINANCIAL_RESULT_FILTERS" :key="v" :value="v">{{ l }}</option>
          </select>
        </div>
      </div>
      <button
        class="button button--secondary"
        :disabled="loading || stats.loading.value"
        @click="
          reload();
          stats.reload();
        "
      >
        Atualizar
      </button>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><p>{{ filtered.length }} plantios encontrados</p>
      <div class="rural-grid">
        <article v-for="c in visible" :key="c.id" class="rural-card">
          <h3>{{ cycleLabel(c) }}</h3>
          <p>{{ getFinancialResultLabel(c.finance.result_state) }}</p>
          <dl>
            <dt>Custos</dt>
            <dd>{{ money(c.finance.input_cost) }}</dd>
            <dt>Receita</dt>
            <dd>{{ money(c.finance.sales_revenue) }}</dd>
            <dt>Resultado estimado</dt>
            <dd>{{ money(c.finance.estimated_result) }}</dd>
          </dl>
          <a
            :href="`/more/finance/${encodeURIComponent(c.id)}`"
            data-link
            class="button button--secondary"
            >Ver composição</a
          >
        </article>
      </div>
      <PageNavigation :page="page" :total="filtered.length" :size="20" @change="page = $event"
    /></RequestState>
  </div>
</template>
