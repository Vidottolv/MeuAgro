<script setup>
import { ref, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc, workspaceFunction } from '../../services/workspaceService.js';
const w = useWorkspace(() => workspaceRpc('app_commercial_admin_context'));
const { data, error, notice, loading, busy } = w;
const selected = ref(null),
  date = ref(''),
  reason = ref(''),
  confirmed = ref(false),
  preview = ref(null),
  working = ref(false);
let revision = 0,
  pending = null;
watch(w.invalidated, () => {
  revision++;
  selected.value = null;
  confirmed.value = false;
  preview.value = null;
  working.value = false;
  pending = null;
  reason.value = '';
});
function choose(c) {
  revision++;
  selected.value = { ...c };
  reason.value = '';
  preview.value = null;
  confirmed.value = false;
  pending = null;
  const dt = new Date(Math.max(new Date(c.earliest_at).getTime(), Date.now() + 600000));
  date.value = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
async function offer(action) {
  if (!confirmed.value || !selected.value) return;
  await w.command(
    'app_change_offer',
    {
      p_id: selected.value.id,
      p_version: selected.value.version,
      p_action: action,
      p_effective_at: action === 'offer' ? new Date(date.value).toISOString() : null,
      p_reason: reason.value,
    },
    () => {
      selected.value = null;
    },
  );
}
async function inspect() {
  if (!selected.value || working.value || busy.value || loading.value) return;
  const token = revision;
  working.value = true;
  error.value = '';
  try {
    const result = await workspaceFunction('billing-asaas', {
      action: 'commercial-preview',
      id: selected.value.id,
    });
    if (token === revision) {
      preview.value = result;
      confirmed.value = false;
    }
  } catch (e) {
    if (token === revision) error.value = e.message;
  } finally {
    if (token === revision) working.value = false;
  }
}
async function apply() {
  if (
    !preview.value ||
    !confirmed.value ||
    !selected.value ||
    working.value ||
    busy.value ||
    loading.value
  )
    return;
  const token = revision;
  const body = {
    action: 'commercial-apply',
    id: selected.value.id,
    version: selected.value.version,
    confirmed: preview.value,
    reason: reason.value,
  };
  const signature = JSON.stringify(body);
  if (!pending || pending.signature !== signature) pending = { signature, id: crypto.randomUUID() };
  working.value = true;
  error.value = '';
  try {
    await workspaceFunction('billing-asaas', { ...body, operation: pending.id });
    if (token !== revision) return;
    notice.value = 'Troca aplicada após conferência do contrato no Asaas.';
    selected.value = null;
    await w.load();
  } catch (e) {
    if (token === revision) error.value = e.message;
  } finally {
    if (token === revision) working.value = false;
  }
}
const money = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n / 100);
const labels = {
  requested: 'Solicitada',
  offered: 'Aguardando aceite',
  accepted: 'Aceita pelo titular',
  applied: 'Aplicada',
  rejected: 'Recusada',
  cancelled: 'Cancelada',
};
</script>
<template>
  <section class="rural-panel admin-commercial">
    <h3>Regras comerciais e propostas de troca</h3>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <button :disabled="busy || loading || working" @click="w.load">
      Atualizar propostas comerciais
    </button>
    <template v-if="data">
      <p>
        Edite preços, pessoas e teste no catálogo abaixo. Cada alteração gera uma versão e vale para
        novas adesões; contratos vigentes preservam suas condições.
      </p>
      <p>
        Trocas são assistidas, sem prorrata. Envie proposta com data posterior ou igual ao fim da
        vigência atual e aguarde o aceite. Na data acordada, revise o preço e as cobranças pendentes
        no Asaas. Esta área somente consulta o provedor e aplica a licença após conferir os dados;
        não modifica cobranças no Asaas.
      </p>
      <article v-for="c in data.changes" :key="c.id">
        <p>
          <strong>{{ labels[c.status] }}</strong> • Titular {{ c.user_id }} •
          {{ c.target_snapshot.name }} • {{ money(c.target_snapshot.monthly_cents) }}/mês •
          {{ c.target_snapshot.seat_limit }} pessoas.
        </p>
        <p v-if="c.effective_at">
          Data proposta: {{ new Date(c.effective_at).toLocaleString('pt-BR') }}.
        </p>
        <button
          v-if="['requested', 'offered', 'accepted'].includes(c.status)"
          :disabled="busy || loading || working"
          @click="choose(c)"
        >
          Revisar troca {{ c.id.slice(0, 8) }}
        </button>
      </article>
      <fieldset v-if="selected" :disabled="busy || loading || working">
        <legend>Proposta para {{ selected.user_id }}</legend>
        <p>
          Plano solicitado: {{ selected.target_snapshot.name }}. Ao emitir/reemitir, o catálogo
          atual é consultado e será exigido novo aceite.
        </p>
        <label
          >Data para a troca (horário local)<input v-model="date" type="datetime-local"
        /></label>
        <label
          >Motivo / mensagem ao titular<textarea v-model="reason" minlength="5" maxlength="500" />
        </label>
        <label
          ><input v-model="confirmed" type="checkbox" /> Revisei o contrato, a equipe e a vigência
          que deve ser preservada.</label
        >
        <button :disabled="!confirmed || !date || reason.trim().length < 5" @click="offer('offer')">
          Emitir proposta para aceite
        </button>
        <button :disabled="!confirmed || reason.trim().length < 5" @click="offer('reject')">
          Recusar solicitação
        </button>
        <template v-if="selected.status === 'accepted'">
          <button @click="inspect">Conferir contrato no Asaas</button>
          <div v-if="preview">
            <p>
              {{ preview.environment }} • Assinatura {{ preview.subscription }} • Valor no provedor:
              {{ money(preview.amount_cents) }}. Valor aceito: {{ money(preview.expected_cents) }}.
            </p>
            <p>
              {{
                preview.matches_offer
                  ? 'Preço e cobranças pendentes conferem.'
                  : 'Preço ou cobranças pendentes não correspondem à proposta.'
              }}
            </p>
            <p>
              Somente será aplicada na data acordada, sem reduzir a vigência atual. A confirmação
              acima deve ser marcada novamente após a consulta.
            </p>
            <button
              :disabled="
                !confirmed ||
                !preview.matches_offer ||
                reason.trim().length < 5 ||
                new Date(preview.effective_at).getTime() > Date.now()
              "
              @click="apply"
            >
              Aplicar troca conferida
            </button>
          </div>
        </template>
      </fieldset>
      <details>
        <summary>Últimas 30 versões do catálogo</summary>
        <ul>
          <li v-for="v in data.versions" :key="v.plan_code + '-' + v.revision">
            {{ v.snapshot.name }} • versão {{ v.revision }} •
            {{
              v.snapshot.monthly_cents == null ? 'Preço a definir' : money(v.snapshot.monthly_cents)
            }}
            • {{ v.snapshot.seat_limit }} pessoas • {{ v.snapshot.trial_days }} dias de teste •
            {{ new Date(v.created_at).toLocaleString('pt-BR') }}
          </li>
        </ul>
      </details>
    </template>
  </section>
</template>
<style scoped>
.admin-commercial {
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
