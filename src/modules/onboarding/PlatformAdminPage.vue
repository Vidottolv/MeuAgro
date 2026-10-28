<script setup>
import { computed, ref, watch } from 'vue';
import { workspaceRpc, workspaceFunction } from '../../services/workspaceService.js';
import { useWorkspace } from '../shared/useWorkspace.js';
import AdminCheckoutPanel from './AdminCheckoutPanel.vue';
import AdminCommercialPanel from './AdminCommercialPanel.vue';
import '../properties/rural.css';

const search = ref(''),
  offset = ref(0),
  selected = ref(null),
  planCode = ref('company10');
const subscriptionId = ref(''),
  reason = ref(''),
  confirmed = ref(false),
  preview = ref(null);
const until = ref(''),
  planEdit = ref(null),
  planDraft = ref(null),
  price = ref(''),
  storage = ref(''),
  published = ref(false);
const working = ref(false);
let revision = 0,
  pending = null;
const w = useWorkspace(() =>
  workspaceRpc('app_admin_context', {
    p_search: search.value.trim(),
    p_offset: offset.value,
    p_user: selected.value,
  }),
);
const { data, error, notice, loading, busy, status } = w;
const account = computed(() =>
  selected.value ? data.value?.accounts.find((a) => a.id === selected.value) : null,
);
const labels = {
  processed: 'Processado',
  unlinked: 'Assinatura não vinculada',
  environment_mismatch: 'Ambiente diferente do vínculo',
  provider_failed: 'Falha ao consultar o Asaas',
  database_failed: 'Falha na gravação do pagamento',
  unsupported: 'Cobrança sem assinatura mensal suportada',
};
function clearPreview() {
  revision++;
  preview.value = null;
  confirmed.value = false;
}
function clearForms() {
  clearPreview();
  subscriptionId.value = '';
  reason.value = '';
  until.value = '';
  planEdit.value = null;
  planDraft.value = null;
  working.value = false;
  pending = null;
}
watch(w.invalidated, clearForms);
watch(selected, clearForms);
watch(subscriptionId, clearPreview);
watch(planCode, () => {
  confirmed.value = false;
});
function choose(id) {
  selected.value = id;
  search.value = '';
  offset.value = 0;
  void w.load();
}
function find() {
  selected.value = null;
  offset.value = 0;
  clearForms();
  void w.load();
}
function page(delta) {
  offset.value = Math.max(0, offset.value + delta);
  void w.load();
}
function editPlan(p) {
  planEdit.value = { ...p };
  planDraft.value = { ...p };
  price.value = String(p.monthly_cents ?? '');
  storage.value = String(p.storage_bytes ?? '');
  published.value = p.published;
  confirmed.value = false;
  reason.value = '';
}
async function savePlan() {
  if (
    !confirmed.value ||
    !planEdit.value ||
    !/^\d+$/.test(price.value) ||
    (storage.value && !/^\d+$/.test(storage.value))
  ) {
    error.value = 'Confirme a alteração e informe valores inteiros válidos.';
    return;
  }
  await w.command(
    'app_commercial_plan_save',
    {
      p_expected: planEdit.value,
      p_reason: reason.value,
      p_data: {
        name: planDraft.value.name,
        seat_limit: String(planDraft.value.seat_limit),
        trial_days: String(planDraft.value.trial_days),
        change_policy: planDraft.value.change_policy,
        change_cooldown_days: String(planDraft.value.change_cooldown_days),
        monthly_cents: price.value,
        storage_bytes: storage.value || null,
        published: published.value,
      },
    },
    () => {
      planEdit.value = null;
      confirmed.value = false;
    },
  );
}
async function inspect() {
  if (working.value || loading.value || busy.value) return;
  clearPreview();
  const token = revision;
  working.value = true;
  error.value = '';
  try {
    const result = await workspaceFunction('billing-asaas', {
      action: 'admin-preview',
      subscription: subscriptionId.value.trim(),
    });
    if (token === revision) preview.value = result;
  } catch (e) {
    if (token === revision) error.value = e.message;
  } finally {
    if (token === revision) working.value = false;
  }
}
async function link() {
  if (
    !account.value ||
    !preview.value ||
    !confirmed.value ||
    working.value ||
    loading.value ||
    busy.value
  )
    return;
  const token = revision;
  const body = {
    action: 'admin-link',
    subscription: preview.value.subscription,
    confirmed: preview.value,
    user_id: account.value.id,
    plan_code: planCode.value,
    version: account.value.subscription?.version ?? 0,
    reason: reason.value,
  };
  const signature = JSON.stringify(body);
  if (!pending || pending.signature !== signature) pending = { signature, id: crypto.randomUUID() };
  working.value = true;
  error.value = '';
  try {
    await workspaceFunction('billing-asaas', { ...body, operation: pending.id });
    if (token !== revision) return;
    pending = null;
    clearPreview();
    working.value = false;
    notice.value = 'Vínculo salvo. Não foi criada nem alterada cobrança no Asaas.';
    await w.load();
  } catch (e) {
    if (token === revision) error.value = e.message;
  } finally {
    if (token === revision) working.value = false;
  }
}
async function trial(revoke = false) {
  if (!account.value || !confirmed.value) return;
  if (!revoke && (!until.value || !Number.isFinite(new Date(until.value).getTime()))) {
    error.value = 'Informe uma data válida.';
    return;
  }
  await w.command(
    'app_admin_command',
    {
      p_action: revoke ? 'revoke_trial' : 'trial',
      p_data: {
        user_id: account.value.id,
        version: account.value.subscription?.version ?? 0,
        plan_code: planCode.value,
        until: revoke ? null : new Date(until.value).toISOString(),
        reason: reason.value,
      },
    },
    () => {
      confirmed.value = false;
    },
  );
}
</script>

<template>
  <div class="rural-vue admin-platform">
    <h2>Administração de planos e assinaturas</h2>
    <p>Uso exclusivo da administração do MeuAgro. Gerentes de empresas não têm acesso.</p>
    <p v-if="!status.online">Conecte-se para administrar. Não há edição offline.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <button :disabled="busy || loading || working" @click="w.load">Atualizar</button>
    <p v-if="loading">Carregando…</p>
    <template v-if="data && status.online">
      <AdminCheckoutPanel />
      <AdminCommercialPanel />
      <fieldset :disabled="busy || loading || working">
        <legend>Localizar titular</legend>
        <label
          >E-mail (trecho) ou UUID <input v-model="search" maxlength="120" @keyup.enter="find"
        /></label>
        <button @click="find">Buscar</button>
        <ul v-if="!selected">
          <li v-for="a in data.accounts" :key="a.id">
            {{ a.email || a.id }} — {{ a.subscription?.plan_code || 'Piloto sem vínculo' }}
            <button @click="choose(a.id)">Abrir conta</button>
          </li>
        </ul>
        <template v-if="!selected">
          <button :disabled="offset === 0" @click="page(-25)">Anterior</button>
          <button :disabled="data.accounts.length < 25" @click="page(25)">Próxima</button>
        </template>
      </fieldset>
      <template v-if="account">
        <section class="rural-panel">
          <h3>{{ account.email || account.id }}</h3>
          <p>UUID: {{ account.id }}</p>
          <p>
            {{ account.company_count }} empresas • {{ account.people_count }} pessoas distintas,
            incluindo o titular.
          </p>
          <p>
            Plano: {{ account.subscription?.plan_code || 'Sem vínculo' }} • Ambiente:
            {{ account.subscription?.billing_environment || 'Sem vínculo' }}
          </p>
          <p>
            Vigência:
            {{
              account.valid_until
                ? new Date(account.valid_until).toLocaleString('pt-BR')
                : 'Sem período ativo'
            }}
          </p>
          <p v-if="account.subscription">
            Assinatura:
            {{ account.subscription.provider_subscription || 'Sem cobrança vinculada' }} • Cliente:
            {{ account.subscription.provider_customer || 'Sem cliente' }}
          </p>
        </section>
        <fieldset :disabled="busy || loading || working">
          <legend>Vincular assinatura existente no Asaas</legend>
          <p>
            Consulte a assinatura e confira a conta antes de confirmar. Não cria cobranças. O preço
            do plano precisa coincidir com o Asaas.
          </p>
          <label
            >Plano
            <select v-model="planCode">
              <option v-for="p in data.plans" :key="p.code" :value="p.code">
                {{ p.name }} —
                {{
                  p.monthly_cents == null
                    ? 'Preço pendente'
                    : 'R$ ' + (p.monthly_cents / 100).toFixed(2)
                }}
              </option>
            </select></label
          >
          <label
            >ID da assinatura <input v-model="subscriptionId" placeholder="sub_…" maxlength="120"
          /></label>
          <button @click="inspect">Consultar no Asaas</button>
          <div v-if="preview" role="status">
            <p>
              Ambiente: <strong>{{ preview.environment }}</strong> • Mensal: R$
              {{ (preview.expected_cents / 100).toFixed(2) }}
            </p>
            <p>Assinatura: {{ preview.subscription }} • Cliente: {{ preview.customer }}</p>
          </div>
          <label
            >Motivo administrativo <textarea v-model="reason" minlength="5" maxlength="500" />
          </label>
          <label
            ><input v-model="confirmed" type="checkbox" /> Conferi o titular, o plano, o ambiente e
            a alteração solicitada.</label
          >
          <button :disabled="!preview || !confirmed || reason.trim().length < 5" @click="link">
            Confirmar vínculo
          </button>
        </fieldset>
        <fieldset :disabled="busy || loading || working">
          <legend>Concessão administrativa de vigência</legend>
          <p>
            Exceção manual independente dos pagamentos, por até 90 dias; não é o teste público do
            catálogo. Sem vínculo, usa o plano selecionado acima. Não cria assinatura no Asaas.
          </p>
          <label
            >Fim do teste (horário local) <input v-model="until" type="datetime-local"
          /></label>
          <p>
            Usa o motivo e a confirmação acima. Remover a concessão preserva períodos pagos e pode
            bloquear gravações quando não houver outra vigência.
          </p>
          <button
            :disabled="!confirmed || !until || reason.trim().length < 5"
            @click="trial(false)"
          >
            Conceder teste
          </button>
          <button
            :disabled="
              !confirmed || !account.subscription?.manual_until || reason.trim().length < 5
            "
            @click="trial(true)"
          >
            Remover concessão manual
          </button>
        </fieldset>
        <section class="rural-panel">
          <h3>Últimos pagamentos da conta</h3>
          <p v-if="!data.payments.length">Nenhum pagamento sincronizado.</p>
          <ul>
            <li v-for="p in data.payments" :key="p.id">
              {{ p.id }} • {{ p.status }} • R$ {{ (p.amount_cents / 100).toFixed(2) }} • Vencimento
              {{ p.due_date }}
            </li>
          </ul>
        </section>
      </template>
      <section class="rural-panel">
        <h3>Catálogo comercial</h3>
        <p>
          Preços em centavos; armazenamento em bytes é uma referência, sem bloqueio global de
          uploads. Cada edição gera uma versão para novas adesões. Contratos atuais mantêm preço e
          limites aceitos; alterações exigem proposta. Escolha um nome coerente com o limite de
          pessoas.
        </p>
        <ul>
          <li v-for="p in data.plans" :key="p.code">
            {{ p.name }} • {{ p.seat_limit }} pessoas •
            {{ p.published ? 'Publicado' : 'Não publicado' }}
            <button :disabled="busy || loading || working" @click="editPlan(p)">Editar</button>
          </li>
        </ul>
        <fieldset v-if="planEdit" :disabled="busy || loading || working">
          <legend>{{ planEdit.name }}</legend>
          <label>Nome comercial <input v-model="planDraft.name" maxlength="120" /></label>
          <label
            >Total de pessoas, incluindo o titular
            <input v-model="planDraft.seat_limit" inputmode="numeric"
          /></label>
          <label
            >Dias de teste gratuito (0 desativa; máximo 30)
            <input v-model="planDraft.trial_days" inputmode="numeric"
          /></label>
          <label for="commercial-change-policy">Política de troca</label>
          <select id="commercial-change-policy" v-model="planDraft.change_policy">
            <option value="assisted_next_cycle">
              Assistida para o próximo período, sem prorrata
            </option>
            <option value="blocked">Somente atendimento específico</option>
          </select>
          <label
            >Intervalo mínimo entre trocas aplicadas, em dias
            <input v-model="planDraft.change_cooldown_days" inputmode="numeric"
          /></label>
          <label>Mensalidade em centavos <input v-model="price" inputmode="numeric" /></label>
          <label
            >Armazenamento de referência em bytes (vazio = a definir)
            <input v-model="storage" inputmode="numeric"
          /></label>
          <label><input v-model="published" type="checkbox" /> Publicar no catálogo</label>
          <label>Motivo <textarea v-model="reason" maxlength="500" /></label>
          <label
            ><input v-model="confirmed" type="checkbox" /> Confirmo a alteração do catálogo.</label
          >
          <button :disabled="!confirmed || reason.trim().length < 5" @click="savePlan">
            Salvar catálogo
          </button>
        </fieldset>
      </section>
      <section class="rural-panel">
        <h3>Últimos eventos de cobrança da plataforma</h3>
        <p>
          Até 30 eventos, incluindo assinaturas não vinculadas. Para repetir uma entrega, use o
          painel do Asaas.
        </p>
        <ul>
          <li v-for="d in data.diagnostics" :key="d.environment + d.event_id">
            <strong>{{ labels[d.outcome] || d.outcome }}</strong> • {{ d.environment }} •
            {{ d.attempts }} tentativas <br />{{ d.event_id }} •
            {{ d.subscription_id || 'Sem assinatura' }} •
            {{ new Date(d.updated_at).toLocaleString('pt-BR') }}
          </li>
        </ul>
      </section>
      <section class="rural-panel">
        <h3>Histórico administrativo</h3>
        <ul>
          <li v-for="a in data.audit" :key="a.id">
            {{ new Date(a.created_at).toLocaleString('pt-BR') }} • {{ a.action }} • {{ a.target }} •
            Administrador {{ a.actor_id }} • {{ a.reason }}
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
<style scoped>
.admin-platform {
  overflow-wrap: anywhere;
}
fieldset {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #cbd8ce;
  border-radius: 12px;
  min-width: 0;
}
label {
  display: block;
  margin: 0.7rem 0;
}
input:not([type='checkbox']),
select,
textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  padding: 0.7rem;
}
button {
  margin: 0.3rem;
  padding: 0.65rem;
  cursor: pointer;
}
li {
  margin: 0.7rem 0;
}
</style>
