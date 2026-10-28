<script setup>
import { computed, ref, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc } from '../../services/workspaceService.js';
const emit = defineEmits(['updated']);
const selected = ref(''),
  trialAccepted = ref(false),
  offerAccepted = ref(false);
const w = useWorkspace(() => workspaceRpc('app_commercial_context'));
const { data, error, notice, loading, busy } = w;
const plan = computed(() => data.value?.plans.find((p) => p.code === selected.value));
const labels = {
  requested: 'Solicitada',
  offered: 'Proposta para revisar',
  accepted: 'Aceita — aguardando execução assistida',
  applied: 'Aplicada',
  rejected: 'Recusada',
  cancelled: 'Cancelada',
};
watch(w.invalidated, () => {
  selected.value = '';
  trialAccepted.value = false;
  offerAccepted.value = false;
});
watch(selected, () => {
  trialAccepted.value = false;
  offerAccepted.value = false;
});
const money = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n / 100);
function https(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
async function trial() {
  if (!trialAccepted.value || !plan.value) return;
  await w.command('app_trial_start', { p_expected: plan.value, p_accepted: true }, () => {
    trialAccepted.value = false;
    emit('updated');
  });
}
async function request() {
  if (!plan.value) return;
  await w.command('app_change_request', { p_expected: plan.value }, () => emit('updated'));
}
async function reply(c, action) {
  if (action === 'accept' && !offerAccepted.value) return;
  await w.command(
    'app_change_reply',
    { p_id: c.id, p_version: c.version, p_action: action },
    () => {
      offerAccepted.value = false;
      emit('updated');
    },
  );
}
</script>
<template>
  <section class="rural-panel commercial-panel">
    <h3>Condições comerciais, teste e troca de plano</h3>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <button :disabled="busy || loading" @click="w.load">Atualizar condições comerciais</button>
    <template v-if="data">
      <div v-if="data.contract">
        <p>
          Condições da sua conta: <strong>{{ data.contract.snapshot.name }}</strong> •
          {{
            data.contract.snapshot.monthly_cents == null
              ? 'Preço a definir'
              : money(data.contract.snapshot.monthly_cents) + '/mês'
          }}
          • {{ data.contract.snapshot.seat_limit }} pessoas, incluindo você.
        </p>
        <p>
          Armazenamento:
          {{
            data.contract.snapshot.storage_bytes == null
              ? 'referência a definir'
              : (data.contract.snapshot.storage_bytes / 1073741824).toFixed(2) +
                ' GB de referência'
          }}. A referência não bloqueia uploads automaticamente. Satélite tem franquia separada.
        </p>
        <p v-if="data.contract.trial_ends_at">
          Fim do teste gratuito:
          {{ new Date(data.contract.trial_ends_at).toLocaleString('pt-BR') }}. Não há cobrança
          automática ao terminar.
        </p>
      </div>
      <fieldset :disabled="busy || loading">
        <legend>
          {{
            data.contract?.has_provider
              ? 'Comparar e solicitar troca'
              : 'Conhecer planos e período de teste'
          }}
        </legend>
        <label for="commercial-plan">Plano comercial</label>
        <select id="commercial-plan" v-model="selected">
          <option value="">Selecione</option>
          <option v-for="p in data.plans" :key="p.code" :value="p.code">
            {{ p.name }} — {{ money(p.monthly_cents) }}/mês • {{ p.seat_limit }} pessoas
          </option>
        </select>
        <template v-if="plan">
          <p>
            {{
              plan.trial_days > 0
                ? plan.trial_days + ' dias de teste gratuito para contas elegíveis'
                : 'Sem teste gratuito de autoatendimento neste plano'
            }}.
          </p>
          <p>
            Política do plano:
            {{
              plan.change_policy === 'blocked'
                ? 'alterações somente em atendimento específico'
                : 'troca assistida para o próximo período, sem prorrata automática'
            }}. Intervalo mínimo entre trocas aplicadas: {{ plan.change_cooldown_days }} dias.
          </p>
          <template v-if="!data.contract?.has_provider">
            <p v-if="data.trial_used">
              Esta conta já recebeu período de teste. Extensões dependem de atendimento.
            </p>
            <template v-else-if="plan.trial_days > 0">
              <label
                ><input v-model="trialAccepted" type="checkbox" /> Confirmo o teste de
                {{ plan.trial_days }} dias, com limite de {{ plan.seat_limit }} pessoas. Ao
                terminar, não será criada cobrança e precisarei contratar para continuar gravando
                dados protegidos.</label
              >
              <button :disabled="!trialAccepted" @click="trial">Iniciar teste gratuito</button>
            </template>
          </template>
          <template v-else>
            <p>
              Vale a política do seu contrato atual. A solicitação não altera preço, licença nem
              cobrança. A administração emitirá uma proposta para seu aceite, preservando a vigência
              atual.
            </p>
            <button
              :disabled="
                data.contract.cancelled || data.contract.snapshot.change_policy === 'blocked'
              "
              @click="request"
            >
              Solicitar proposta de troca
            </button>
          </template>
        </template>
      </fieldset>
      <h4>Suas solicitações de troca</h4>
      <p v-if="!data.changes.length">Nenhuma solicitação.</p>
      <article v-for="c in data.changes" :key="c.id">
        <p>
          <strong>{{ labels[c.status] }}</strong> • {{ c.target_snapshot.name }} •
          {{ money(c.target_snapshot.monthly_cents) }}/mês •
          {{ c.target_snapshot.seat_limit }} pessoas.
        </p>
        <p v-if="c.effective_at">
          Data acordada para entrada em vigor:
          {{ new Date(c.effective_at).toLocaleString('pt-BR') }}.
        </p>
        <p>
          Armazenamento de referência:
          {{
            c.target_snapshot.storage_bytes == null
              ? 'a definir'
              : (c.target_snapshot.storage_bytes / 1073741824).toFixed(2) + ' GB'
          }}. Sem prorrata, crédito ou reembolso automático; satélite permanece separado.
        </p>
        <p>
          Política após a troca:
          {{
            c.target_snapshot.change_policy === 'blocked'
              ? 'atendimento específico'
              : 'troca assistida para o próximo período'
          }}. Intervalo mínimo entre trocas: {{ c.target_snapshot.change_cooldown_days }} dias. O
          teste gratuito não é renovado.
        </p>
        <details>
          <summary>Condições da proposta — versão {{ c.terms_snapshot?.terms_version }}</summary>
          <p style="white-space: pre-wrap">{{ c.terms_snapshot?.conditions }}</p>
          <a
            v-if="https(c.terms_snapshot?.terms_url)"
            :href="https(c.terms_snapshot.terms_url)"
            target="_blank"
            rel="noopener noreferrer"
            >Termos da proposta</a
          >
        </details>
        <p v-if="c.admin_note">Atendimento: {{ c.admin_note }}</p>
        <template v-if="c.status === 'offered'">
          <label
            ><input v-model="offerAccepted" type="checkbox" /> Li a proposta e aceito o novo preço,
            os limites e a data acima. Entendo que a execução é assistida e não haverá alteração
            automática na cobrança.</label
          >
          <button :disabled="busy || loading || !offerAccepted" @click="reply(c, 'accept')">
            Aceitar proposta de troca
          </button>
        </template>
        <button
          v-if="['requested', 'offered', 'accepted'].includes(c.status)"
          :disabled="busy || loading"
          @click="reply(c, 'cancel')"
        >
          Cancelar solicitação de troca
        </button>
      </article>
    </template>
  </section>
</template>
<style scoped>
.commercial-panel {
  overflow-wrap: anywhere;
}
fieldset {
  min-width: 0;
  padding: 1rem;
  margin: 1rem 0;
  border: 1px solid #d7dfd4;
  border-radius: 12px;
}
label {
  display: block;
  margin: 0.8rem 0;
}
select {
  width: 100%;
  padding: 0.7rem;
  box-sizing: border-box;
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
