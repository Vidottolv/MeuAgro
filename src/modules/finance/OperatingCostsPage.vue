<script setup>
import { ref, reactive, onMounted, onScopeDispose, watch } from 'vue';
import { expenseRpc } from '../../services/expenseService.js';
import { expenseMoney } from './expenseModel.js';
import { costsCsv } from './allocationModel.js';
import { downloadVisitFile } from '../visits/visitFollowup.js';
import { useOffline } from '../../offline/useOffline.js';
import '../properties/rural.css';
const { status } = useOffline();
const data = ref(null),
  context = ref({ properties: [], seasons: [] }),
  page = ref(0),
  loading = ref(false),
  error = ref('');
const q = new URLSearchParams(location.search),
  filters = reactive({ property: '', season: '', cycle: q.get('cycle') || '' });
let epoch = 0,
  disposed = false,
  timer;
function clear() {
  ++epoch;
  data.value = null;
  context.value = { properties: [], seasons: [] };
  loading.value = false;
  error.value = '';
}
async function load() {
  if (!status.value.online || document.hidden) return;
  const token = ++epoch;
  loading.value = true;
  error.value = '';
  data.value = null;
  try {
    const [report, ctx] = await Promise.all([
      expenseRpc('operating_cost_report', {
        p_property: filters.property || null,
        p_season: filters.season || null,
        p_cycle: filters.cycle || null,
        p_offset: page.value * 50,
      }),
      expenseRpc('expense_context'),
    ]);
    if (disposed || token !== epoch) return;
    if (report.version !== 44) throw Error('Execute a etapa 44 de rateio no Supabase.');
    data.value = report;
    context.value = ctx;
    if (page.value > 0 && !report.items.length) {
      page.value = 0;
      void load();
    }
  } catch (e) {
    if (token === epoch) error.value = e.message;
  } finally {
    if (token === epoch) loading.value = false;
  }
}
function filter() {
  page.value = 0;
  void load();
}
function visibility() {
  if (document.hidden) clear();
  else void load();
}
function exportCsv(grouped) {
  try {
    downloadVisitFile(
      costsCsv(grouped ? data.value.groups : data.value.items, grouped),
      'text/csv;charset=utf-8',
      grouped ? 'meuagro-resultado-safras.csv' : 'meuagro-resultado-plantios-pagina.csv',
    );
  } catch (e) {
    error.value = e.message;
  }
}
watch([() => status.value.online, () => status.value.user], () => {
  clear();
  if (status.value.online) void load();
});
watch(
  () => filters.property,
  () => (filters.season = ''),
);
onMounted(() => {
  void load();
  document.addEventListener('visibilitychange', visibility);
  timer = setInterval(load, 30000);
});
onScopeDispose(() => {
  disposed = true;
  clear();
  clearInterval(timer);
  document.removeEventListener('visibilitychange', visibility);
});
</script>
<template>
  <div class="rural-vue">
    <h2>Resultado ampliado da produção</h2>
    <p>
      Receitas de vendas menos insumos consumidos e despesas operacionais rateadas. É uma estimativa
      dos registros existentes, não lucro contábil nem saldo bancário.
    </p>
    <div class="cost-actions">
      <a href="/more/expenses" data-link class="button button--secondary"
        >Gerenciar despesas e rateios</a
      ><a href="/more/finance" data-link class="button button--secondary"
        >Ver demonstrativo de insumos e vendas</a
      >
    </div>
    <p v-if="!status.online" role="status">Conecte-se para consultar o resultado ampliado.</p>
    <template v-else>
      <p v-if="error" role="alert">{{ error }}</p>
      <form class="rural-panel" @submit.prevent="filter">
        <h3>Selecionar propriedades e safras</h3>
        <div class="field">
          <label for="cost-property">Propriedade</label
          ><select id="cost-property" v-model="filters.property">
            <option value="">Todas</option>
            <option v-for="p in context.properties" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="field">
          <label for="cost-season">Safra</label
          ><select id="cost-season" v-model="filters.season">
            <option value="">Todas, incluindo plantios sem safra</option>
            <option
              v-for="s in context.seasons.filter(
                (s) => !filters.property || s.property_id === filters.property,
              )"
              :key="s.id"
              :value="s.id"
            >
              {{ s.name }}
            </option>
          </select>
        </div>
        <p v-if="filters.cycle">
          Filtrado pelo plantio de origem.
          <button
            type="button"
            class="button button--secondary"
            @click="
              filters.cycle = '';
              filter();
            "
          >
            Mostrar todos os plantios
          </button>
        </p>
        <button class="button button--secondary" :disabled="loading">
          Aplicar filtros / atualizar resultados
        </button>
      </form>
      <p v-if="loading" role="status">Calculando resultados…</p>
      <template v-if="data">
        <section class="rural-panel">
          <h3>Totais dos {{ data.count }} plantios selecionados</h3>
          <p>
            Consideram todas as páginas, inclusive plantios arquivados. As receitas são vendas
            registradas; as despesas rateadas entram integralmente, mesmo sem pagamento.
          </p>
          <dl>
            <dt>Insumos consumidos</dt>
            <dd>{{ expenseMoney(data.totals.input_cents) }}</dd>
            <dt>Despesas operacionais rateadas</dt>
            <dd>{{ expenseMoney(data.totals.operating_cents) }}</dd>
            <dt>Receita de vendas</dt>
            <dd>{{ expenseMoney(data.totals.revenue_cents) }}</dd>
            <dt>Resultado estimado ampliado</dt>
            <dd>{{ expenseMoney(data.totals.result_cents) }}</dd>
          </dl>
          <p>
            Despesas sem distribuir na propriedade/safra selecionada:
            <strong>{{ expenseMoney(data.unallocated_cents) }}</strong
            >. Não estão deduzidas do resultado. Este aviso não é restringido ao filtro de um único
            plantio. Ao selecionar uma safra, despesas cadastradas sem safra ficam fora deste aviso;
            consulte todas as safras para incluí-las.
          </p>
        </section>
        <section class="rural-panel">
          <h3>Comparação por propriedade e safra</h3>
          <p>
            Grupos completos dos plantios selecionados, sem somar quantidades de colheita com
            unidades diferentes.
          </p>
          <article
            v-for="g in data.groups"
            :key="g.property_id + ':' + g.season_id"
            class="rural-card"
          >
            <h4>{{ g.property_name }} • {{ g.season_name }}</h4>
            <p>{{ g.cycles }} plantio(s)</p>
            <p>
              Insumos: {{ expenseMoney(g.input_cents) }} • Despesas:
              {{ expenseMoney(g.operating_cents) }}
            </p>
            <p>
              Receitas: {{ expenseMoney(g.revenue_cents) }} • Resultado:
              {{ expenseMoney(g.result_cents) }}
            </p>
          </article>
          <button
            class="button button--secondary"
            :disabled="!data.groups.length"
            @click="exportCsv(true)"
          >
            Exportar comparação por safra (CSV)
          </button>
        </section>
        <section class="rural-panel">
          <h3>Resultado por plantio</h3>
          <p v-if="!data.items.length">Nenhum plantio para esta seleção.</p>
          <article v-for="c in data.items" :key="c.id" class="rural-card">
            <h4>{{ c.property_name }} / {{ c.area_name }} / {{ c.crop_name }}</h4>
            <p>
              {{ c.season_name }} •
              {{ c.planting_date?.split('-').reverse().join('/') || 'Sem data' }} •
              {{ c.id.slice(-8) }} <strong v-if="c.deleted_at">• Arquivado</strong>
            </p>
            <p>
              Insumos: {{ expenseMoney(c.input_cents) }} • Despesas rateadas:
              {{ expenseMoney(c.operating_cents) }}
            </p>
            <p>
              Custo total: {{ expenseMoney(c.total_cost_cents) }} • Vendas:
              {{ expenseMoney(c.revenue_cents) }}
            </p>
            <p>
              Resultado ampliado: <strong>{{ expenseMoney(c.result_cents) }}</strong>
            </p>
            <a
              v-if="!c.deleted_at"
              :href="'/more/finance/' + encodeURIComponent(c.id)"
              data-link
              class="button button--secondary"
              >Abrir demonstrativo de insumos e vendas</a
            >
          </article>
          <div class="cost-actions">
            <button
              class="button button--secondary"
              :disabled="page === 0 || loading"
              @click="
                page--;
                load();
              "
            >
              Página anterior</button
            ><span>Página {{ page + 1 }}</span
            ><button
              class="button button--secondary"
              :disabled="(page + 1) * 50 >= data.count || loading"
              @click="
                page++;
                load();
              "
            >
              Próxima página</button
            ><button
              class="button button--secondary"
              :disabled="!data.items.length"
              @click="exportCsv(false)"
            >
              Exportar plantios desta página (CSV)
            </button>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>
<style scoped>
.cost-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}
input,
select {
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
  padding: 0.75rem;
  border: 1px solid var(--color-border, #d7dfd4);
  border-radius: 0.75rem;
  font: inherit;
}
dd {
  margin: 0 0 0.75rem;
  font-weight: 700;
}
</style>
