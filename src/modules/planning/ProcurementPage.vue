<script setup>
import { ref, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc } from '../../services/workspaceService.js';
import { simpleCsv } from './planningModel.js';
import { localDay, downloadVisitFile } from '../visits/visitFollowup.js';
import '../properties/rural.css';
const until = ref(localDay()),
  page = ref(0),
  links = ref({});
const w = useWorkspace(async () => {
  const [report, context] = await Promise.all([
    workspaceRpc('procurement_report', { p_until: until.value, p_offset: page.value * 50 }),
    workspaceRpc('budget_context'),
  ]);
  return { report, context };
});
const { data, error, busy, loading, status, notice } = w;
watch(w.invalidated, () => (links.value = {}));
async function link(row) {
  if (!links.value[row.product_id]) {
    error.value = 'Selecione o insumo correspondente.';
    return;
  }
  await w.command('procurement_link', {
    p_product: row.product_id,
    p_input: links.value[row.product_id],
  });
}
function exportCsv() {
  downloadVisitFile(
    simpleCsv(
      [
        'Insumo',
        'Unidade',
        'Saldo',
        'Vencido',
        'Utilizável',
        'Demanda aprovada',
        'Pedidos a receber',
        'Sugestão',
      ],
      data.value.report.items.map((i) => [
        i.name,
        i.base_unit,
        i.stock,
        i.expired,
        i.usable,
        i.demand,
        i.incoming,
        i.suggested,
      ]),
    ),
    'text/csv;charset=utf-8',
    'meuagro-reposicao-pagina.csv',
  );
}
const amount = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 4 });
</script>
<template>
  <div class="rural-vue">
    <h2>Reposição planejada do estoque</h2>
    <p>
      Sugestão = maior entre estoque ideal e demanda planejada + mínimo, menos saldo utilizável e
      pedidos vinculados a receber. Lotes já vencidos não entram no saldo utilizável. Operações
      executadas e orçamentos não aprovados não geram demanda.
    </p>
    <a href="/compras" data-link class="button button--secondary"
      >Abrir compras e solicitar orçamento</a
    ><a href="/more/budgets" data-link class="button button--secondary">Revisar planejamento</a>
    <p v-if="!status.online">Conecte-se para calcular reposição.</p>
    <template v-else
      ><p v-if="error" role="alert">{{ error }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <form
        class="rural-panel"
        @submit.prevent="
          page = 0;
          w.load();
        "
      >
        <label for="procurement-until">Consumo planejado até</label
        ><input id="procurement-until" v-model="until" type="date" required :min="localDay()" />
        <p>
          Inclui operações ainda não executadas com data anterior a hoje. Pedidos vinculados são
          considerados a receber, sem promessa de entrega até esta data.
        </p>
        <button class="button button--secondary" :disabled="busy || loading">
          Calcular reposição
        </button>
      </form>
      <p v-if="loading">Calculando…</p>
      <template v-if="data"
        ><section v-if="data.report.unmapped.length" class="rural-panel">
          <h3>Pedidos sem vínculo de insumo (até 50 produtos)</h3>
          <p>
            Estes produtos ainda não foram abatidos da sugestão. Revise a correspondência; ela
            também será usada no recebimento do pedido. Não há equivalência automática pelo nome.
          </p>
          <article v-for="row in data.report.unmapped" :key="row.product_id" class="rural-card">
            <h4>{{ row.name }}</h4>
            <p>{{ amount(row.quantity) }} {{ row.unit }}</p>
            <label :for="'procurement-link-' + row.product_id">Insumo correspondente</label
            ><select :id="'procurement-link-' + row.product_id" v-model="links[row.product_id]">
              <option value="">Selecione</option>
              <option
                v-for="i in data.context.inputs.filter((i) => i.unit === row.unit)"
                :key="i.id"
                :value="i.id"
              >
                {{ i.name }}
              </option></select
            ><button class="button button--secondary" :disabled="busy" @click="link(row)">
              Confirmar vínculo do pedido
            </button>
          </article>
        </section>
        <section class="rural-panel">
          <h3>{{ data.report.count }} insumos ativos</h3>
          <article v-for="i in data.report.items" :key="i.id" class="rural-card">
            <h4>{{ i.name }}</h4>
            <p>
              Saldo utilizável: {{ amount(i.usable) }} {{ i.base_unit }} • Vencido:
              {{ amount(i.expired) }}
            </p>
            <p>Demanda: {{ amount(i.demand) }} • A receber: {{ amount(i.incoming) }}</p>
            <p>
              Reposição sugerida: <strong>{{ amount(i.suggested) }} {{ i.base_unit }}</strong>
            </p>
          </article>
          <p>
            Esta é uma sugestão revisável. Nenhum pedido ou movimentação de estoque é criado
            automaticamente. Confira validade futura dos lotes e prazos com o fornecedor antes de
            comprar.
          </p>
          <button
            class="button button--secondary"
            :disabled="!data.report.items.length"
            @click="exportCsv"
          >
            Exportar reposição desta página (CSV)</button
          ><button
            class="button button--secondary"
            :disabled="page === 0 || loading"
            @click="
              page--;
              w.load();
            "
          >
            Página anterior</button
          ><span>Página {{ page + 1 }}</span
          ><button
            class="button button--secondary"
            :disabled="(page + 1) * 50 >= data.report.count || loading"
            @click="
              page++;
              w.load();
            "
          >
            Próxima página
          </button>
        </section></template
      ></template
    >
  </div>
</template>
<style scoped>
input,
select {
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  padding: 0.75rem;
  border: 1px solid #d7dfd4;
  border-radius: 0.75rem;
  font: inherit;
}
button {
  margin: 0.25rem;
}
</style>
