<script setup>
import { computed, ref, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc } from '../../services/workspaceService.js';
import { parseInputCsv, importHeader, safePlanUrl } from './onboardingModel.js';
import { simpleCsv } from '../planning/planningModel.js';
import { expenseMoney } from '../finance/expenseModel.js';
import { downloadVisitFile } from '../visits/visitFollowup.js';
import { INPUT_CATEGORIES } from '../../constants/inputCategories.js';
import { INPUT_UNITS } from '../../constants/inputUnits.js';
import CheckoutPanel from './CheckoutPanel.vue';
import CommercialPanel from './CommercialPanel.vue';
import LifecyclePanel from './LifecyclePanel.vue';
import ProfileOnboardingPanel from './ProfileOnboardingPanel.vue';
import PermissionsPanel from './PermissionsPanel.vue';
import '../properties/rural.css';
const preview = ref([]),
  plan = ref(''),
  confirmImport = ref(false);
let fileRevision = 0;
const w = useWorkspace(() => workspaceRpc('app_account_context'));
const { data, error, busy, loading, status, notice } = w;
const currentPlan = computed(
  () =>
    data.value?.subscription?.commercial_snapshot ||
    data.value?.plans.find((p) => p.code === data.value?.subscription?.plan_code),
);
watch(w.invalidated, () => {
  preview.value = [];
  confirmImport.value = false;
  fileRevision++;
});
async function readCsv(event) {
  const token = ++fileRevision;
  preview.value = [];
  confirmImport.value = false;
  try {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 60000) throw Error('Use CSV de até 60 KB.');
    const rows = parseInputCsv(await file.text());
    if (token === fileRevision) preview.value = rows;
  } catch (e) {
    if (token === fileRevision) error.value = e.message;
  }
}
async function importRows() {
  await w.command('onboarding_import', { p_rows: preview.value }, (result) => {
    notice.value = result.imported + ' insumos importados. Nenhum saldo inicial foi criado.';
    preview.value = [];
    confirmImport.value = false;
  });
}
function model() {
  downloadVisitFile(
    simpleCsv(importHeader, [['Semente exemplo', 'Marca exemplo', 'seeds', 'kg', '10', '30']]),
    'text/csv;charset=utf-8',
    'modelo-insumos.csv',
  );
}
async function requestPlan() {
  await w.command(
    'app_plan_request',
    { p_plan: plan.value },
    () => (notice.value = 'Solicitação registrada. Isso não contrata nem cobra um plano.'),
  );
}
</script>
<template>
  <div class="rural-vue">
    <h2>Começar e gerenciar plano</h2>
    <p v-if="!status.online">Conecte-se para importar cadastros e consultar o plano.</p>
    <template v-else
      ><p v-if="error" role="alert">{{ error }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <button class="button button--secondary" :disabled="busy || loading" @click="w.load">
        Atualizar conta e plano
      </button>
      <p v-if="loading">Carregando…</p>
      <template v-if="data"
        ><ProfileOnboardingPanel />
        <PermissionsPanel />
        <section class="rural-panel">
          <h3>Importar cadastro de insumos</h3>
          <p>
            Arquivo CSV com separador ponto e vírgula, até 100 linhas. Faça uma cópia da planilha
            como CSV antes de importar. Não são importados saldos, compras nem custos históricos.
          </p>
          <button class="button button--secondary" @click="model">Baixar modelo CSV</button>
          <details>
            <summary>Categorias e unidades aceitas</summary>
            <p>
              Categorias:
              {{ INPUT_CATEGORIES.map(([key, label]) => key + ' = ' + label).join('; ') }}
            </p>
            <p>Unidades: {{ INPUT_UNITS.map(([key, label]) => key + ' = ' + label).join('; ') }}</p>
          </details>
          <label for="onboarding-csv">Selecionar CSV de insumos</label
          ><input
            id="onboarding-csv"
            type="file"
            accept=".csv,text/csv"
            :disabled="busy"
            @change="readCsv"
          /><template v-if="preview.length"
            ><h4>Prévia — {{ preview.length }} insumos</h4>
            <article v-for="(row, index) in preview" :key="index" class="rural-card">
              <p>
                {{ index + 1 }}. {{ row.name }} • {{ row.brand }} • {{ row.category }} •
                {{ row.base_unit }}
              </p>
              <p>Mínimo {{ row.minimum_stock }} • Ideal {{ row.ideal_stock || 'Não informado' }}</p>
            </article>
            <label
              ><input v-model="confirmImport" type="checkbox" /> Revisei os cadastros e confirmo a
              importação sem saldo inicial</label
            ><button class="button" :disabled="busy || !confirmImport" @click="importRows">
              Confirmar importação dos insumos
            </button></template
          >
          <p>
            Duplicatas no arquivo ou já cadastradas são recusadas; nenhuma linha é salva quando
            houver erro. Registre o saldo inicial pelas compras/lotes depois da importação.
          </p>
        </section>
        <CheckoutPanel @updated="w.load" />
        <CommercialPanel @updated="w.load" />
        <section class="rural-panel">
          <h3>Meu plano e utilização</h3>
          <template v-if="data.subscription"
            ><p>
              Plano:
              {{ currentPlan?.name || data.subscription.plan_code }}
            </p>
            <p>
              Vigência:
              {{
                data.subscription.valid_until
                  ? new Date(data.subscription.valid_until).toLocaleString('pt-BR')
                  : 'Sem período ativo confirmado'
              }}
            </p>
            <p v-if="data.subscription.cancel_requested_at">
              Recorrência cancelada em
              {{ new Date(data.subscription.cancel_requested_at).toLocaleString('pt-BR') }}.
            </p>
            <a
              v-if="safePlanUrl(data.subscription.checkout_url)"
              :href="safePlanUrl(data.subscription.checkout_url)"
              target="_blank"
              rel="noopener"
              class="button button--secondary"
              >Abrir cobrança no Asaas</a
            ></template
          >
          <p v-else>
            Conta em implantação, sem assinatura provisionada. Os dados existentes permanecem
            acessíveis.
          </p>
          <p>
            Pessoas distintas nas empresas de sua titularidade: {{ data.usage.people }}, incluindo
            você. Limite: {{ currentPlan?.seat_limit ?? 'Não provisionado' }}.
          </p>
          <p>
            Armazenamento identificado da conta:
            {{ (data.usage.storage_bytes / 1048576).toFixed(2) }} MB • referência contratada:
            {{
              currentPlan?.storage_bytes == null
                ? 'A definir'
                : (currentPlan.storage_bytes / 1048576).toFixed(2) + ' MB'
            }}. Este indicador não bloqueia uploads antigos automaticamente.
          </p>
          <p>
            Satélite: {{ data.satellite?.entitlement?.requests_month ?? 0 }} requisições/mês •
            {{ data.satellite?.entitlement?.pu_month ?? 0 }} PUs/mês. Uso reservado:
            {{ data.satellite?.usage?.requests ?? 0 }} requisições e
            {{ data.satellite?.usage?.pu ?? 0 }} PUs. A franquia é provisionada separadamente.
          </p>
          <form @submit.prevent="requestPlan">
            <label for="account-plan">Solicitar alteração ou atendimento</label
            ><select id="account-plan" v-model="plan" required>
              <option value="">Selecione</option>
              <option v-for="p in data.plans" :key="p.code" :value="p.code">
                {{ p.name }} —
                {{ p.monthly_cents ? expenseMoney(p.monthly_cents) + '/mês' : 'Preço a definir' }}
              </option>
            </select>
            <p>
              Para iniciar uma assinatura disponível, use Contratar plano acima. Esta solicitação
              registra somente interesse ou alteração assistida e não cria cobrança.
            </p>
            <button class="button button--secondary" :disabled="busy">
              Registrar interesse no plano
            </button>
          </form>
        </section>
        <LifecyclePanel @updated="w.load" /></template
    ></template>
  </div>
</template>
<style scoped>
input:not([type='checkbox']),
select {
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
p,
li {
  overflow-wrap: anywhere;
}
li {
  margin: 1rem 0;
}
</style>
