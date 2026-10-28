<script setup>
import { computed, ref, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc, workspaceFunction } from '../../services/workspaceService.js';
import { safePlanUrl } from './onboardingModel.js';
const emit = defineEmits(['updated']);
const selected = ref(''),
  method = ref('PIX'),
  accepted = ref(false),
  name = ref(''),
  email = ref(''),
  document = ref('');
const working = ref(false);
let revision = 0,
  pendingQuote = null;
const w = useWorkspace(async () => {
  const context = await workspaceRpc('app_checkout_context');
  let config = { enabled: false, environment: null };
  try {
    config = await workspaceFunction('billing-asaas', { action: 'checkout-config' });
  } catch {
    /* A conta e o histórico continuam consultáveis. */
  }
  return { ...context, config };
});
const { data, error, notice, loading, busy, status } = w;
const current = computed(
  () =>
    data.value?.checkouts.find((q) =>
      ['quoted', 'accepted', 'provisioning', 'awaiting_payment', 'review'].includes(q.status),
    ) || data.value?.checkouts[0],
);
const open = computed(
  () =>
    current.value &&
    ['quoted', 'accepted', 'provisioning', 'awaiting_payment', 'review'].includes(
      current.value.status,
    ),
);
const labels = {
  quoted: 'Revise a oferta',
  accepted: 'Contratação confirmada',
  provisioning: 'Preparando cobrança',
  awaiting_payment: 'Aguardando pagamento',
  review: 'Aguardando conciliação / atendimento',
  completed: 'Contratação concluída',
  cancelled: 'Oferta descartada',
  rejected: 'Cadastro recusado pelo provedor',
};
function resetPayer() {
  name.value = '';
  email.value = '';
  document.value = '';
  accepted.value = false;
}
watch(w.invalidated, () => {
  revision++;
  working.value = false;
  resetPayer();
  pendingQuote = null;
});
async function perform(body, success) {
  if (working.value || loading.value || busy.value) return;
  const token = revision;
  working.value = true;
  error.value = '';
  notice.value = '';
  try {
    await workspaceFunction('billing-asaas', body);
    if (token !== revision) return;
    resetPayer();
    notice.value = success;
    await w.load();
    if (token === revision) emit('updated');
  } catch (e) {
    if (token === revision) {
      error.value = e.message;
      resetPayer();
      const message = e.message;
      await w.load();
      if (token === revision) error.value = message;
    }
  } finally {
    if (token === revision) working.value = false;
  }
}
async function quote() {
  const signature = JSON.stringify([selected.value, method.value]);
  if (!pendingQuote || pendingQuote.signature !== signature)
    pendingQuote = { signature, id: crypto.randomUUID() };
  await perform(
    {
      action: 'checkout-quote',
      operation: pendingQuote.id,
      plan: selected.value,
      method: method.value,
    },
    'Oferta preparada. Confira os dados antes de confirmar.',
  );
}
async function contract() {
  if (!current.value || !accepted.value) return;
  await perform(
    {
      action: 'checkout-start',
      id: current.value.id,
      accepted: true,
      payer: { name: name.value, email: email.value, document: document.value },
    },
    'Solicitação processada. Consulte o estado abaixo; a licença depende da confirmação do pagamento.',
  );
}
async function refresh() {
  if (!current.value) return;
  await perform(
    { action: 'checkout-refresh', id: current.value.id },
    'Contratação consultada. Confira o estado e a vigência atualizados.',
  );
}
async function discard() {
  if (working.value) return;
  await w.command('app_checkout_discard', { p_id: current.value.id }, () => {
    resetPayer();
    pendingQuote = null;
  });
}
function https(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}
</script>
<template>
  <section class="rural-panel checkout-panel">
    <h3>Contratar plano</h3>
    <p v-if="!status.online">Conecte-se para contratar e acompanhar pagamentos.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <button :disabled="working || loading || busy" @click="w.load">
      Atualizar planos e histórico
    </button>
    <template v-if="data && status.online">
      <p v-if="data.config.environment === 'sandbox'" class="sandbox">
        Ambiente de testes: cobranças simuladas, sem pagamento real.
      </p>
      <p v-if="!data.settings.enabled || !data.config.enabled">
        Novas contratações ainda não estão liberadas. Seu histórico e a consulta de cobranças
        continuam disponíveis.
      </p>
      <p v-if="data.has_subscription && !open">
        Você já tem assinatura vinculada. Use a cobrança e o cancelamento na área do seu plano.
        Alterações e nova contratação após cancelamento são atendidas pela administração.
      </p>
      <form
        v-if="!open && !data.has_subscription && data.settings.enabled && data.config.enabled"
        @submit.prevent="quote"
      >
        <fieldset :disabled="working || busy || loading">
          <legend>Escolher plano e pagamento</legend>
          <p v-if="!data.plans.length">Nenhum plano com preço publicado no momento.</p>
          <label for="checkout-plan">Plano para contratar</label>
          <select id="checkout-plan" v-model="selected" required>
            <option value="">Selecione</option>
            <option v-for="p in data.plans" :key="p.code" :value="p.code">
              {{ p.name }} — R$ {{ (p.monthly_cents / 100).toFixed(2).replace('.', ',') }}/mês •
              {{ p.seat_limit }} pessoas
            </option>
          </select>
          <label for="checkout-method">Pagamento da mensalidade</label>
          <select id="checkout-method" v-model="method">
            <option value="PIX">Pix</option>
            <option value="BOLETO">Boleto</option>
          </select>
          <p>Você revisará as condições antes de criar qualquer cobrança.</p>
          <button :disabled="!selected">Revisar contratação</button>
        </fieldset>
      </form>
      <article v-if="current" class="checkout-summary">
        <h4>{{ labels[current.status] || current.status }}</h4>
        <p>
          {{ current.plan_snapshot.name }} •
          <strong
            >R$ {{ (current.amount_cents / 100).toFixed(2).replace('.', ',') }} por mês</strong
          >
          •
          {{ current.billing_type === 'PIX' ? 'Pix' : 'Boleto' }}
        </p>
        <p>
          Limite de {{ current.plan_snapshot.seat_limit }} pessoas, incluindo o titular.
          Armazenamento de referência:
          {{
            current.plan_snapshot.storage_bytes == null
              ? 'a definir'
              : (current.plan_snapshot.storage_bytes / 1073741824).toFixed(2) + ' GB'
          }}.
        </p>
        <p v-if="current.plan_snapshot.trial_days > 0">
          Este plano oferece {{ current.plan_snapshot.trial_days }} dias de teste para contas
          elegíveis. Esta contratação cria uma assinatura paga; para experimentar sem cobrança, use
          a área Condições comerciais, teste e troca de plano.
        </p>
        <p>
          Trocas:
          {{
            current.plan_snapshot.change_policy === 'blocked'
              ? 'atendimento específico'
              : 'assistidas para o próximo período, sem prorrata automática'
          }}.
        </p>
        <p v-if="current.due_date">
          Primeiro vencimento: {{ current.due_date.split('-').reverse().join('/') }}. A criação da
          assinatura não significa pagamento.
        </p>
        <p v-if="data.valid_until">
          Vigência atual: {{ new Date(data.valid_until).toLocaleString('pt-BR') }}.
        </p>
        <p v-else>
          Sem período ativo confirmado. Após o vínculo, a gravação de dados protegidos depende de
          vigência paga ou concedida.
        </p>
        <details :open="current.status === 'quoted'">
          <summary>
            Condições aceitas / para revisão — versão {{ current.terms_snapshot.terms_version }}
          </summary>
          <p v-if="current.terms_snapshot.merchant_name">
            Fornecedor: {{ current.terms_snapshot.merchant_name }}
          </p>
          <p class="conditions">{{ current.terms_snapshot.conditions }}</p>
          <p>
            As cobranças são mensais até o cancelamento. Pix/boleto exigem pagamento manual a cada
            mês. Não há débito automático via Pix.
          </p>
          <p v-if="current.terms_snapshot.support_email">
            Atendimento: {{ current.terms_snapshot.support_email }}
          </p>
          <a
            v-if="https(current.terms_snapshot.terms_url)"
            :href="https(current.terms_snapshot.terms_url)"
            target="_blank"
            rel="noopener noreferrer"
            >Termos de uso</a
          >
          <a
            v-if="https(current.terms_snapshot.privacy_url)"
            :href="https(current.terms_snapshot.privacy_url)"
            target="_blank"
            rel="noopener noreferrer"
            >Privacidade</a
          >
        </details>
        <p v-if="current.accepted_at">
          Aceite registrado em {{ new Date(current.accepted_at).toLocaleString('pt-BR') }}.
        </p>
        <p v-if="current.status === 'quoted'">
          Oferta válida até {{ new Date(current.expires_at).toLocaleString('pt-BR') }}.
        </p>
        <form
          v-if="
            ['quoted', 'accepted', 'provisioning', 'review'].includes(current.status) &&
            data.config.enabled
          "
          @submit.prevent="contract"
        >
          <fieldset :disabled="working || loading || busy">
            <legend>Responsável pelo pagamento</legend>
            <label
              >Nome ou razão social<input
                v-model="name"
                required
                minlength="2"
                maxlength="120"
                autocomplete="name"
            /></label>
            <label
              >E-mail de cobrança<input
                v-model="email"
                type="email"
                required
                maxlength="254"
                autocomplete="email"
            /></label>
            <label
              >CPF ou CNPJ<input v-model="document" required maxlength="20" autocomplete="off"
            /></label>
            <p>
              Estes dados serão enviados ao Asaas para cadastrar o pagador. Não informe dados de
              cartão. As notificações automáticas do novo cliente ficam desativadas; acompanhe as
              faturas no aplicativo.
            </p>
            <label
              ><input v-model="accepted" type="checkbox" required /> Li as condições e autorizo a
              criação de uma assinatura mensal de R$
              {{ (current.amount_cents / 100).toFixed(2).replace('.', ',') }} no plano acima.</label
            >
            <button :disabled="!accepted">
              {{
                current.status === 'quoted'
                  ? 'Confirmar assinatura mensal'
                  : 'Retomar contratação existente'
              }}
            </button>
          </fieldset>
        </form>
        <p v-if="current.status === 'review'">
          Precisamos conferir uma operação enviada ao provedor. Atualize esta contratação; não crie
          uma segunda assinatura. Se persistir, informe ao atendimento a referência abaixo.
        </p>
        <p v-if="current.status === 'rejected'">
          O provedor recusou o cadastro. Revise os dados antes de preparar nova oferta; se
          persistir, procure o atendimento.
        </p>
        <a
          v-if="safePlanUrl(current.invoice_url)"
          class="button"
          :href="safePlanUrl(current.invoice_url)"
          target="_blank"
          rel="noopener noreferrer"
          >Abrir pagamento no Asaas</a
        >
        <button
          v-if="current.accepted_at && !['cancelled', 'rejected'].includes(current.status)"
          :disabled="working || loading || busy"
          @click="refresh"
        >
          Atualizar contratação
        </button>
        <button v-if="current.can_discard" :disabled="working || loading || busy" @click="discard">
          {{
            current.status === 'quoted'
              ? 'Descartar oferta sem contratar'
              : 'Encerrar antes de criar assinatura'
          }}
        </button>
        <p>
          Referência de atendimento: {{ current.id }} •
          {{ current.environment === 'sandbox' ? 'Teste' : 'Produção' }}.
        </p>
      </article>
    </template>
  </section>
</template>
<style scoped>
.checkout-panel {
  overflow-wrap: anywhere;
}
fieldset {
  min-width: 0;
  border: 1px solid #d7dfd4;
  border-radius: 12px;
  padding: 1rem;
  margin: 1rem 0;
}
label {
  display: block;
  margin: 0.8rem 0;
}
input:not([type='checkbox']),
select {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0.8rem;
  min-height: 48px;
  font: inherit;
}
button,
a {
  margin: 0.4rem 0;
  padding: 0.7rem;
  display: inline-block;
}
.conditions {
  white-space: pre-wrap;
}
.sandbox {
  background: #fff0cb;
  padding: 0.8rem;
  border-radius: 8px;
}
</style>
