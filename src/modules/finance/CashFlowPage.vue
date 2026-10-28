<script setup>
import { ref } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc } from '../../services/workspaceService.js';
import { localDay, downloadVisitFile } from '../visits/visitFollowup.js';
import { expenseMoney } from './expenseModel.js';
import { simpleCsv } from '../planning/planningModel.js';
import '../properties/rural.css';
const today = new Date(),
  from = ref(localDay(new Date(today.getFullYear(), today.getMonth(), 1))),
  to = ref(localDay());
const w = useWorkspace(() =>
  workspaceRpc('cash_flow_report', { p_from: from.value, p_to: to.value }),
);
const { data, error, loading, status } = w;
function exportCsv() {
  downloadVisitFile(
    simpleCsv(
      ['Dia', 'Entradas (centavos)', 'Saídas (centavos)', 'Movimento líquido (centavos)'],
      data.value.days.map((d) => [d.day, d.incoming, d.outgoing, d.net]),
    ),
    'text/csv;charset=utf-8',
    'meuagro-fluxo-registrado.csv',
  );
}
</script>
<template>
  <div class="rural-vue">
    <h2>Fluxo de caixa registrado</h2>
    <p>
      Entradas e saídas manuais, agrupadas pela data de recebimento ou pagamento. Não é saldo
      bancário: não inclui saldo inicial, transferências, compras ou vendas sem baixa registrada.
    </p>
    <a href="/more/expenses" data-link class="button button--secondary">Contas a pagar</a
    ><a href="/more/receivables" data-link class="button button--secondary">Contas a receber</a>
    <p v-if="!status.online">Conecte-se para consultar o fluxo registrado.</p>
    <template v-else
      ><p v-if="error" role="alert">{{ error }}</p>
      <form class="rural-panel" @submit.prevent="w.load">
        <div class="field">
          <label for="cash-from">De</label
          ><input id="cash-from" v-model="from" type="date" required />
        </div>
        <div class="field">
          <label for="cash-to">Até</label><input id="cash-to" v-model="to" type="date" required />
        </div>
        <button class="button button--secondary" :disabled="loading">Atualizar fluxo</button>
      </form>
      <p v-if="loading">Carregando…</p>
      <section v-if="data" class="rural-panel">
        <h3>Movimentações confirmadas no período</h3>
        <p>Entradas: {{ expenseMoney(data.incoming) }}</p>
        <p>Saídas: {{ expenseMoney(data.outgoing) }}</p>
        <p>Movimento líquido: {{ expenseMoney(data.net) }}</p>
        <p>
          Estornos de lançamento retiram a baixa da data original; não representam devolução
          bancária.
        </p>
        <article v-for="d in data.days" :key="d.day" class="rural-card">
          <h4>{{ d.day.split('-').reverse().join('/') }}</h4>
          <p>
            Entradas {{ expenseMoney(d.incoming) }} • Saídas {{ expenseMoney(d.outgoing) }} •
            Líquido {{ expenseMoney(d.net) }}
          </p>
        </article>
        <p v-if="!data.days.length">Nenhuma baixa registrada nesta seleção.</p>
        <button class="button button--secondary" :disabled="!data.days.length" @click="exportCsv">
          Exportar fluxo (CSV)
        </button>
      </section></template
    >
  </div>
</template>
<style scoped>
input {
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
  padding: 0.75rem;
  border: 1px solid #d7dfd4;
  border-radius: 0.75rem;
  font: inherit;
}
button {
  margin: 0.25rem;
}
</style>
