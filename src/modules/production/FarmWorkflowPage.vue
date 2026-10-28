<script setup>
import { ref, computed } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc } from '../../services/workspaceService.js';
import { getProductionCycleStatusLabel } from '../../constants/productionCycleStatus.js';
import '../properties/rural.css';
const offset = ref(0);
const cycle = new URLSearchParams(location.search).get('cycle');
const w = useWorkspace(() =>
  workspaceRpc('app_farm_workflow', { p_cycle: cycle, p_offset: offset.value }),
);
const { data, error, loading, busy, status } = w;
const checks = computed(() => new Map((data.value?.checks || []).map((c) => [c.id, c])));
const money = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(v || 0) / 100,
  );
async function page(delta) {
  offset.value = Math.max(0, offset.value + delta);
  await w.load();
}
</script>
<template>
  <div class="rural-vue farm-workflow">
    <h2>Conferência da rotina agrícola</h2>
    <p v-if="!status.online">Conecte-se para conferir os registros atualizados da produção.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <button class="button button--secondary" :disabled="loading || busy" @click="w.load">
      Atualizar conferência
    </button>
    <p v-if="loading">Conferindo plantios, colheitas, vendas e custos…</p>
    <template v-if="data">
      <section class="rural-panel">
        <h3>Valores registrados {{ cycle ? 'do plantio' : 'da conta' }}</h3>
        <p>Receita das vendas de colheitas: {{ money(data.totals.revenue_cents) }}.</p>
        <p>
          Insumos consumidos: {{ money(data.totals.input_cents) }} • Despesas rateadas:
          {{ money(data.totals.operating_cents) }}.
        </p>
        <p>Resultado dos registros: {{ money(data.totals.result_cents) }}.</p>
        <p v-if="data.unallocated_cents">
          Há {{ money(data.unallocated_cents) }} em despesas ainda sem rateio na conta. Confira os
          rateios antes de avaliar o resultado por plantio.
        </p>
        <p>
          Receita registrada não é recebimento confirmado. Custos não lançados, despesas sem rateio
          e tributos não informados não entram no resultado. Quantidades de colheita em unidades
          diferentes não são somadas.
        </p>
        <div class="rural-actions">
          <a href="/more/costs" data-link>Custos e rateios</a
          ><a href="/more/receivables" data-link>Contas a receber</a
          ><a href="/more/cashflow" data-link>Fluxo de caixa</a>
        </div>
      </section>
      <p>
        {{ data.count }} plantio(s) no escopo. Esta tela aponta registros e pendências; não
        certifica a conclusão da safra.
      </p>
      <p v-if="!data.items.length">
        Nenhum plantio neste escopo. <a href="/plantings" data-link>Abrir plantios</a>.
      </p>
      <article v-for="c in data.items" :key="c.id" class="rural-panel">
        <h3>{{ c.property_name }} • {{ c.area_name }} • {{ c.crop_name }}</h3>
        <p>
          {{ c.season_name }} • Situação:
          {{ getProductionCycleStatusLabel(checks.get(c.id)?.status) }}.
        </p>
        <template v-if="checks.get(c.id)">
          <p
            v-if="
              !checks.get(c.id).has_season ||
              !checks.get(c.id).has_area ||
              !checks.get(c.id).has_crop
            "
          >
            Confira os vínculos de safra, talhão e cultura deste plantio.
          </p>
          <p>
            Eventos: {{ checks.get(c.id).events }} • Consumos de insumos:
            {{ checks.get(c.id).usages }} • Colheitas: {{ checks.get(c.id).harvests }} • Vendas:
            {{ checks.get(c.id).sales }}.
          </p>
          <p v-if="!checks.get(c.id).usages">
            Sem consumo de insumos registrado. Confira se é aplicável a este plantio; compra de
            insumo não é consumo.
          </p>
          <p v-if="checks.get(c.id).issues" role="alert">
            {{ checks.get(c.id).issues }} colheita(s) com inconsistência de datas, saldo, unidade ou
            encerramento. Revise os registros antes de concluir a análise.
          </p>
          <p v-else>
            Não foram encontradas inconsistências nas verificações de colheitas/vendas e datas de
            encerramento deste plantio.
          </p>
        </template>
        <p>
          Receita: {{ money(c.revenue_cents) }} • Insumos: {{ money(c.input_cents) }} • Despesas
          rateadas: {{ money(c.operating_cents) }} • Resultado: {{ money(c.result_cents) }}.
        </p>
        <div class="rural-actions">
          <a :href="'/plantings/' + encodeURIComponent(c.id)" data-link>Abrir plantio</a
          ><a href="/more/harvests" data-link>Colheitas</a
          ><a href="/more/sales" data-link>Vendas</a>
        </div>
      </article>
      <nav class="rural-actions" aria-label="Páginas da conferência">
        <button
          class="button button--secondary"
          :disabled="offset === 0 || loading"
          @click="page(-50)"
        >
          Anterior</button
        ><button
          class="button button--secondary"
          :disabled="offset + 50 >= data.count || loading"
          @click="page(50)"
        >
          Próxima
        </button>
      </nav>
    </template>
  </div>
</template>
<style scoped>
p,
h3,
a {
  overflow-wrap: anywhere;
}
.rural-actions {
  gap: 0.7rem;
  flex-wrap: wrap;
}
button {
  max-width: 100%;
  white-space: normal;
}
</style>
