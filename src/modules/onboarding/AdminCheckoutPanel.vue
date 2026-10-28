<script setup>
import { ref, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc, workspaceFunction } from '../../services/workspaceService.js';
const w = useWorkspace(() => workspaceRpc('app_checkout_admin_context'));
const { data, error, notice, loading, busy } = w;
const editing = ref(null),
  reason = ref(''),
  confirmed = ref(false),
  working = ref(false);
let revision = 0;
watch(w.invalidated, () => {
  revision++;
  editing.value = null;
  reason.value = '';
  confirmed.value = false;
  working.value = false;
});
function edit() {
  editing.value = { ...data.value.settings };
  reason.value = '';
  confirmed.value = false;
}
async function save() {
  if (!confirmed.value || !editing.value) return;
  await w.command(
    'app_checkout_settings_save',
    { p_expected: data.value.settings, p_settings: editing.value, p_reason: reason.value },
    () => {
      editing.value = null;
    },
  );
}
async function reconcile(q) {
  if (working.value || loading.value || busy.value) return;
  const token = revision;
  working.value = true;
  error.value = '';
  try {
    await workspaceFunction('billing-asaas', {
      action: 'checkout-admin-refresh',
      id: q.id,
      user_id: q.user_id,
    });
    if (token !== revision) return;
    notice.value = 'Consulta ao provedor concluída. Confira o estado abaixo.';
    await w.load();
  } catch (e) {
    if (token === revision) error.value = e.message;
  } finally {
    if (token === revision) working.value = false;
  }
}
const labels = {
  quoted: 'Oferta em revisão',
  accepted: 'Aceite registrado',
  provisioning: 'Preparando cobrança',
  awaiting_payment: 'Aguardando pagamento',
  review: 'Revisão necessária',
  completed: 'Contratação concluída',
  cancelled: 'Oferta descartada',
  rejected: 'Recusado pelo provedor',
};
</script>
<template>
  <section class="rural-panel admin-checkout">
    <h3>Contratação pelo aplicativo</h3>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <button :disabled="busy || loading || working" @click="w.load">Atualizar contratações</button>
    <template v-if="data">
      <p>
        Novas ofertas: {{ data.settings.enabled ? 'liberadas no banco' : 'desativadas' }}. A função
        também exige CHECKOUT_ENABLED=true no servidor.
      </p>
      <p>
        Publique os preços no catálogo antes de liberar. Para produção, preencha fornecedor, contato
        e links HTTPS de termos e privacidade. Alterar condições exige nova versão; ofertas não
        aceitas serão revistas.
      </p>
      <button :disabled="busy || loading || working" @click="edit">
        Editar condições da contratação
      </button>
      <form v-if="editing" @submit.prevent="save">
        <fieldset :disabled="busy || loading || working">
          <legend>Condições comerciais</legend>
          <label><input v-model="editing.enabled" type="checkbox" /> Liberar novas ofertas</label>
          <label
            >Fornecedor / razão social<input v-model="editing.merchant_name" maxlength="160"
          /></label>
          <label
            >E-mail de atendimento<input
              v-model="editing.support_email"
              type="email"
              maxlength="254"
          /></label>
          <label
            >Link dos termos de uso<input v-model="editing.terms_url" type="url" maxlength="500"
          /></label>
          <label
            >Link da privacidade<input v-model="editing.privacy_url" type="url" maxlength="500"
          /></label>
          <label
            >Versão das condições<input v-model="editing.terms_version" required maxlength="60"
          /></label>
          <label
            >Condições apresentadas ao cliente<textarea
              v-model="editing.conditions"
              required
              minlength="50"
              maxlength="3000"
              rows="8"
            />
          </label>
          <label
            >Motivo da alteração<input v-model="reason" required minlength="5" maxlength="500"
          /></label>
          <label
            ><input v-model="confirmed" type="checkbox" required /> Revisei as condições e confirmo
            a alteração.</label
          >
          <button>Salvar condições da contratação</button>
        </fieldset>
      </form>
      <h4>Últimas 30 contratações</h4>
      <p v-if="!data.checkouts.length">Nenhuma contratação iniciada pelo aplicativo.</p>
      <article v-for="q in data.checkouts" :key="q.id">
        <p>
          <strong>{{ labels[q.status] }}</strong> • {{ q.environment }} •
          {{ q.plan_snapshot.name }} • R$
          {{ (q.amount_cents / 100).toFixed(2).replace('.', ',') }}/mês
        </p>
        <p>Titular: {{ q.user_id }} • Referência: {{ q.id }}</p>
        <p v-if="q.provider_subscription">Assinatura: {{ q.provider_subscription }}</p>
        <p v-if="q.status === 'review'">
          Operação inconclusiva: consulte o provedor. Nunca recrie a assinatura manualmente sem
          conferir se a anterior existe.
        </p>
        <button
          v-if="q.accepted_at && !['cancelled', 'rejected'].includes(q.status)"
          :disabled="busy || loading || working"
          @click="reconcile(q)"
        >
          Conciliar contratação {{ q.id.slice(0, 8) }}
        </button>
      </article>
    </template>
  </section>
</template>
<style scoped>
.admin-checkout {
  overflow-wrap: anywhere;
}
fieldset {
  min-width: 0;
  padding: 1rem;
  border: 1px solid #d7dfd4;
  border-radius: 12px;
}
label {
  display: block;
  margin: 0.8rem 0;
}
input:not([type='checkbox']),
textarea {
  box-sizing: border-box;
  width: 100%;
  display: block;
  padding: 0.7rem;
  font: inherit;
}
button {
  margin: 0.5rem 0;
  padding: 0.7rem;
}
article {
  border-top: 1px solid #d7dfd4;
  padding: 0.8rem 0;
}
</style>
