<script setup>
import { ref, reactive, computed } from 'vue';
import { loadTrade, tradeCommand, tradeError, money } from '../../services/tradeService.js';
import { useResource } from '../inventory/shared/useResource';
import { useCommand } from './useCommand';
import { commandPayload } from './tradeModel';
import RuralDialog from '../properties/components/RuralDialog.vue';
import TradeOverview from './TradeOverview.vue';
import TradeDetail from './TradeDetail.vue';
const props = defineProps({ session: Object });
const emit = defineEmits(['navigate']);
const commercial = location.pathname.startsWith('/consultor'),
  base = commercial ? '/consultor/negociacoes' : '/compras',
  requestId = new URLSearchParams(location.search).get('request');
const { data, loading, error, reload } = useResource(loadTrade, null);
const command = useCommand(
  tradeCommand,
  async () => {
    await reload();
    if (error.value) throw Error(error.value);
  },
  tradeError,
);
const versions = reactive({}),
  pending = ref(null),
  validation = ref('');
const busy = computed(() => command.busy.value || command.committed.value || loading.value);
const confirmations = {
  confirm_receipt: [
    'Recebeu todos os produtos?',
    'As quantidades serão adicionadas ao seu barracão. Confira a entrega completa e os insumos escolhidos.',
  ],
  mark_delivery: [
    'Todos os produtos foram entregues?',
    'O produtor será avisado para conferir e confirmar o recebimento.',
  ],
  accept_quote: [
    'Confirmar este pedido?',
    'Confira os produtos, o endereço e as condições de pagamento. O aplicativo não cobra nem transfere dinheiro.',
  ],
  cancel_request: [
    'Encerrar esta negociação?',
    'O histórico será preservado. Será necessário criar outra solicitação para retomar.',
  ],
  decline_quote: ['Recusar esta proposta?', 'O histórico será preservado.'],
  reject_request: ['Recusar atendimento?', 'O histórico será preservado.'],
  archive_product: [
    'Arquivar produto?',
    'O produto sairá das novas solicitações. As propostas anteriores serão preservadas.',
  ],
  revoke_connection_invite: ['Cancelar convite?', 'O código deixará de funcionar.'],
};
async function execute(action, payload) {
  const result = await command.run(action, payload);
  if (command.error.value) return;
  versions[action] = (versions[action] || 0) + 1;
  pending.value = null;
  if (result?.approval_pending)
    command.message.value =
      'Proposta enviada para aprovação interna. O produtor receberá a proposta após a aprovação.';
  if (action === 'create_request' && result?.request_id)
    emit('navigate', base + '?request=' + encodeURIComponent(result.request_id));
}
function submit(action, values) {
  if (busy.value) return;
  validation.value = '';
  try {
    const payload = commandPayload(action, values);
    if (confirmations[action]) {
      let [title, message] = confirmations[action];
      if (action === 'accept_quote') {
        const q = data.value.trade_quotes.find((q) => q.id === payload.quote_id);
        if (!q) throw Error('Proposta indisponível. Atualize a conversa.');
        message = 'Valor: ' + money(q.total) + '. ' + message;
      }
      pending.value = { action, payload, title, message };
    } else void execute(action, payload);
  } catch (e) {
    validation.value = tradeError(e);
  }
}
async function refresh() {
  await reload();
  if (!error.value) command.committed.value = false;
}
</script>
<template>
  <div class="rural-vue commerce-page trade-page">
    <p v-if="loading" role="status">Atualizando negociações…</p>
    <p v-if="error || command.error.value || validation" role="alert">
      {{ validation || command.error.value || error }}
    </p>
    <p v-if="command.message.value" role="status">{{ command.message.value }}</p>
    <button
      v-if="error || command.committed.value"
      class="button button--secondary"
      :disabled="loading || command.busy.value"
      @click="refresh"
    >
      Atualizar dados</button
    ><template v-if="data"
      ><TradeDetail
        v-if="requestId"
        :state="data"
        :request-id="requestId"
        :uid="session.user.id"
        :commercial="commercial"
        :busy="busy"
        :versions="versions"
        @command="submit"
        @refresh="refresh" /><TradeOverview
        v-else
        :state="data"
        :session="session"
        :commercial="commercial"
        :busy="busy"
        :versions="versions"
        @command="submit" /></template
    ><RuralDialog v-if="pending" :title="pending.title" :busy="busy" @close="pending = null"
      ><p>{{ pending.message }}</p>
      <p v-if="command.error.value" role="alert">{{ command.error.value }}</p>
      <div class="rural-actions">
        <button class="button button--secondary" :disabled="busy" @click="pending = null">
          Voltar</button
        ><button
          class="button button--primary"
          :disabled="busy"
          @click="execute(pending.action, pending.payload)"
        >
          Confirmar
        </button>
      </div></RuralDialog
    >
  </div>
</template>
