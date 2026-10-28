<script setup>
import { ref, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc, workspaceFunction } from '../../services/workspaceService.js';
import { safePlanUrl } from './onboardingModel.js';
const emit = defineEmits(['updated']);
const w = useWorkspace(() => workspaceRpc('app_lifecycle_context'));
const { data, error, notice, busy, loading } = w;
const confirm = ref(false);
let epoch = 0;
watch(w.invalidated, () => {
  epoch++;
  confirm.value = false;
});
const date = (v) => (v ? new Date(v).toLocaleString('pt-BR') : 'Ainda não confirmado');
const money = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);
const states = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Suspensa',
  EXPIRED: 'Encerrada',
  DELETED: 'Cancelada',
};
const labels = {
  PENDING: 'Aguardando pagamento',
  OVERDUE: 'Em atraso',
  RECEIVED: 'Recebida',
  CONFIRMED: 'Confirmada',
  REFUNDED: 'Reembolsada integralmente',
  REFUND_REQUESTED: 'Reembolso solicitado',
  REFUND_IN_PROGRESS: 'Reembolso em processamento',
  CHARGEBACK_REQUESTED: 'Contestação solicitada',
  CHARGEBACK_DISPUTE: 'Contestação em análise',
  AWAITING_CHARGEBACK_REVERSAL: 'Aguardando reversão da contestação',
  DELETED: 'Excluída',
  DUNNING_REQUESTED: 'Recuperação de cobrança solicitada',
  DUNNING_RECEIVED: 'Recuperação de cobrança recebida',
};
async function run(action) {
  if (busy.value || loading.value || (action === 'cancel' && !confirm.value)) return;
  const scope = epoch;
  busy.value = true;
  error.value = '';
  notice.value = '';
  try {
    const result = await workspaceFunction('billing-asaas', {
      action,
      confirmed: action === 'cancel',
    });
    if (scope !== epoch) return;
    notice.value = result.cancelled
      ? 'Recorrência cancelada. Consulte a vigência e as cobranças abaixo.'
      : 'Cobranças atualizadas com o Asaas.';
    confirm.value = false;
    emit('updated');
    await w.load();
  } catch (e) {
    if (scope === epoch) error.value = e.message;
  } finally {
    if (scope === epoch) busy.value = false;
  }
}
</script>
<template>
  <section class="rural-panel lifecycle-panel">
    <h3>Pagamentos e renovação</h3>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <p v-if="loading">Carregando pagamentos…</p>
    <template v-if="data">
      <p>
        Vigência: {{ data.active ? 'ativa' : 'sem período ativo confirmado' }} • Até
        {{ date(data.valid_until) }}.
      </p>
      <p>
        A renovação exige pagamento confirmado e valor compatível com o contrato. Uma cobrança em
        atraso não elimina outro período já pago. Após o fim da vigência, consulta e exportação
        permanecem disponíveis.
      </p>
      <template v-if="data.has_provider">
        <p>
          Recorrência no Asaas: {{ states[data.sync?.provider_status] || 'a verificar' }}.
          Verificada em {{ date(data.sync?.provider_checked_at) }}.
        </p>
        <p v-if="data.sync?.cancel_pending" role="status">
          Há um cancelamento sem confirmação local. Aguarde um minuto e atualize com o Asaas antes
          de tentar novamente.
        </p>
        <p v-if="data.sync && !data.sync.finished_at">
          A última atualização completa ainda não foi confirmada.
        </p>
        <button
          class="button button--secondary"
          :disabled="busy || loading"
          @click="run('lifecycle-sync')"
        >
          Atualizar pagamentos com o Asaas
        </button>
        <p>
          A atualização é manual, com intervalo mínimo de um minuto. Os webhooks mantêm as mudanças
          recebidas do provedor.
        </p>
        <template v-if="data.sync?.provider_status !== 'DELETED'">
          <button class="button button--secondary" :disabled="busy" @click="confirm = !confirm">
            Cancelar recorrência do plano
          </button>
          <form v-if="confirm" @submit.prevent="run('cancel')">
            <p>
              O cancelamento encerra a geração de cobranças e o Asaas exclui as cobranças pendentes
              ou vencidas desta assinatura. Pagamentos realizados permanecem registrados e o período
              pago continua válido. Esta ação não solicita reembolso. Uma nova contratação precisará
              de atendimento.
            </p>
            <button class="button" :disabled="busy || loading">
              Confirmar cancelamento da recorrência
            </button>
            <button
              type="button"
              class="button button--secondary"
              :disabled="busy"
              @click="confirm = false"
            >
              Manter recorrência
            </button>
          </form>
        </template>
      </template>
      <h4>Últimas cobranças sincronizadas (até 24)</h4>
      <p v-if="!data.payments.length">Nenhuma cobrança sincronizada.</p>
      <article v-for="p in data.payments" :key="p.id" class="rural-card">
        <p>
          {{ p.due_date.split('-').reverse().join('/') }} • {{ money(p.amount_cents) }} •
          {{ labels[p.status] || 'Estado em revisão: ' + p.status }}
        </p>
        <p v-if="p.refund_review">
          Há registro de estorno para revisão no Asaas. Estorno parcial não encerra automaticamente
          a licença; reembolso integral e contestação deixam de sustentar a vigência desta cobrança.
        </p>
        <p>Última verificação: {{ date(p.checked_at) }}.</p>
        <a
          v-if="safePlanUrl(p.invoice_url)"
          :href="safePlanUrl(p.invoice_url)"
          target="_blank"
          rel="noopener"
          >Abrir cobrança no Asaas</a
        >
      </article>
      <p>
        Reembolsos são tratados pelo atendimento e executados no Asaas após análise. O MeuAgro
        acompanha o resultado, sem devolver valores automaticamente. Outros pagamentos válidos,
        testes e concessões administrativas podem manter o acesso.
      </p>
    </template>
  </section>
</template>
<style scoped>
p {
  overflow-wrap: anywhere;
}
button {
  margin: 0.3rem;
  white-space: normal;
  max-width: 100%;
}
form {
  border: 1px solid #d7dfd4;
  border-radius: 0.75rem;
  padding: 1rem;
}
</style>
