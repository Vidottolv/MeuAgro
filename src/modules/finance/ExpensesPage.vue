<script setup>
import { ref, reactive, computed, watch, onMounted, onScopeDispose } from 'vue';
import ExpenseAllocation from './ExpenseAllocation.vue';
import { expenseRpc } from '../../services/expenseService.js';
import {
  expenseCategories,
  expenseMoney,
  expensePayload,
  parseCents,
  validExpenseDate,
  expenseState,
  expensesCsv,
} from './expenseModel.js';
import { useOffline } from '../../offline/useOffline.js';
import { offlineUserId } from '../../offline/runtime.js';
import { localDay, downloadVisitFile } from '../visits/visitFollowup.js';
import '../properties/rural.css';
const { status } = useOffline();
const rows = ref([]),
  context = ref({ properties: [], seasons: [] }),
  totals = ref(null),
  count = ref(0),
  page = ref(0),
  loading = ref(false),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  detail = ref(null),
  action = ref(''),
  paymentId = ref(''),
  creating = ref(false);
const filters = reactive({ property: '', from: '', to: '', state: 'active' });
const blank = () => ({
  property_id: '',
  season_id: '',
  title: '',
  category: 'services',
  amount: '',
  record_date: localDay(),
  due_date: localDay(),
  notes: '',
});
const form = reactive(blank()),
  payment = reactive({ amount: '', paid_on: localDay(), note: '', reason: '' });
const seasons = computed(() =>
  context.value.seasons.filter((s) => s.property_id === form.property_id),
);
const paid = computed(
  () =>
    detail.value?.payments
      .filter((p) => !p.reversed_at)
      .reduce((sum, p) => sum + Number(p.amount_cents), 0) || 0,
);
const balance = computed(() =>
  detail.value && !detail.value.expense.cancelled_at
    ? Number(detail.value.expense.amount_cents) - paid.value
    : 0,
);
let epoch = 0,
  disposed = false,
  timer,
  retry = null;
function clear() {
  ++epoch;
  notice.value = '';
  error.value = '';
  rows.value = [];
  totals.value = null;
  count.value = 0;
  context.value = { properties: [], seasons: [] };
  detail.value = null;
  creating.value = false;
  action.value = '';
  retry = null;
  busy.value = false;
  loading.value = false;
  Object.assign(form, blank());
  Object.assign(payment, { amount: '', paid_on: localDay(), note: '', reason: '' });
}
async function load() {
  if (!status.value.online || document.hidden) return;
  const token = ++epoch;
  loading.value = true;
  error.value = '';
  try {
    if (
      (filters.from && !validExpenseDate(filters.from)) ||
      (filters.to && !validExpenseDate(filters.to)) ||
      (filters.from && filters.to && filters.from > filters.to)
    )
      throw Error('Confira o intervalo de vencimentos.');
    const [data, ctx] = await Promise.all([
      expenseRpc('expense_list', {
        p_offset: page.value * 50,
        p_property: filters.property || null,
        p_from: filters.from || null,
        p_to: filters.to || null,
        p_state: filters.state,
      }),
      expenseRpc('expense_context'),
    ]);
    if (disposed || token !== epoch) return;
    rows.value = data.items;
    count.value = data.count;
    totals.value = data.totals;
    context.value = ctx;
    if (page.value > 0 && !rows.value.length) {
      page.value = 0;
      void load();
    }
  } catch (e) {
    if (token === epoch) {
      rows.value = [];
      totals.value = null;
      error.value = e.message;
    }
  } finally {
    if (token === epoch) loading.value = false;
  }
}
async function open(id) {
  const token = epoch;
  error.value = '';
  try {
    const data = await expenseRpc('expense_detail', { p_id: id });
    if (!disposed && token === epoch) {
      detail.value = data;
      action.value = '';
    }
  } catch (e) {
    if (token === epoch) error.value = e.message;
  }
}
function startAction(kind, id = '') {
  action.value = kind;
  paymentId.value = id;
  Object.assign(payment, { amount: '', paid_on: localDay(), note: '', reason: '' });
  error.value = '';
}
async function save(kind) {
  if (busy.value || loading.value) return;
  error.value = '';
  notice.value = '';
  let data;
  try {
    if (kind === 'create') data = expensePayload(form);
    else {
      data = { id: detail.value.expense.id, version: detail.value.expense.version };
      if (kind === 'pay') {
        if (!validExpenseDate(payment.paid_on, false))
          throw Error('Informe uma data de pagamento válida até hoje.');
        const amount = parseCents(payment.amount);
        if (amount > balance.value) throw Error('Pagamento maior que o saldo em aberto.');
        data = { ...data, amount_cents: amount, paid_on: payment.paid_on, note: payment.note };
      } else {
        if (payment.reason.trim().length < 2 || payment.reason.length > 1000)
          throw Error('Informe um motivo de 2 a 1000 caracteres.');
        data = {
          ...data,
          reason: payment.reason.trim(),
          ...(kind === 'reverse' ? { payment_id: paymentId.value } : {}),
        };
      }
    }
  } catch (e) {
    error.value = e.message;
    return;
  }
  const signature = JSON.stringify({ kind, data });
  if (!retry || retry.signature !== signature) retry = { signature, id: crypto.randomUUID() };
  const token = epoch;
  busy.value = true;
  try {
    const result = await expenseRpc('expense_command', {
      p_operation: retry.id,
      p_action: kind,
      p_data: data,
    });
    if (disposed || token !== epoch) return;
    retry = null;
    action.value = '';
    creating.value = false;
    Object.assign(form, blank());
    notice.value = 'Operação registrada. Nenhuma movimentação bancária foi realizada.';
    detail.value = null;
    await load();
    await open(result.id);
  } catch (e) {
    if (token === epoch) error.value = e.message;
  } finally {
    if (!disposed) busy.value = false;
  }
}
function exportCsv() {
  try {
    downloadVisitFile(
      expensesCsv(rows.value),
      'text/csv;charset=utf-8',
      'meuagro-despesas-pagina.csv',
    );
  } catch (e) {
    error.value = e.message;
  }
}
watch(
  () => form.property_id,
  () => (form.season_id = ''),
);
function filter() {
  page.value = 0;
  detail.value = null;
  action.value = '';
  void load();
}
function visibility() {
  if (document.hidden) clear();
  else void load();
}
watch([() => status.value.online, () => status.value.user], () => {
  clear();
  if (status.value.online) void load();
});
function identity() {
  if (!offlineUserId()) clear();
}
onMounted(() => {
  void load();
  document.addEventListener('visibilitychange', visibility);
  addEventListener('meu-agro-offline-changed', identity);
  timer = setInterval(() => {
    if (!creating.value && !action.value && !busy.value && !detail.value) void load();
  }, 30000);
});
onScopeDispose(() => {
  disposed = true;
  clear();
  clearInterval(timer);
  document.removeEventListener('visibilitychange', visibility);
  removeEventListener('meu-agro-offline-changed', identity);
});
const date = (v) => v?.split('-').reverse().join('/');
</script>
<template>
  <div class="rural-vue expense-page">
    <h2>Despesas operacionais</h2>
    <a href="/more/costs" data-link class="button button--secondary"
      >Ver resultado ampliado por safra</a
    >
    <p>
      Serviços, mão de obra, frete e outros gastos da sua propriedade. Os valores pagos são
      registros manuais, sem transferência bancária.
    </p>
    <p>
      Não lance aqui compras de insumos já registradas no estoque. Distribua estas despesas entre os
      plantios pelo rateio e consulte o resultado ampliado.
    </p>
    <a href="/more/finance" data-link class="button button--secondary"
      >Ver resultado dos plantios</a
    >
    <p v-if="!status.online" role="status">
      Conecte-se para consultar e registrar despesas. Este módulo não possui fila offline.
    </p>
    <template v-else>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <section class="rural-panel">
        <h3>Filtrar por vencimento</h3>
        <form @submit.prevent="filter">
          <div class="field">
            <label for="expense-filter-property">Propriedade</label
            ><select id="expense-filter-property" v-model="filters.property">
              <option value="">Todas</option>
              <option v-for="p in context.properties" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>
          <div class="field">
            <label for="expense-from">De</label
            ><input id="expense-from" v-model="filters.from" type="date" />
          </div>
          <div class="field">
            <label for="expense-to">Até</label
            ><input id="expense-to" v-model="filters.to" type="date" />
          </div>
          <div class="field">
            <label for="expense-state">Situação</label
            ><select id="expense-state" v-model="filters.state">
              <option value="active">Todas as ativas</option>
              <option value="open">Com saldo em aberto</option>
              <option value="paid">Pagas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          <button class="button button--secondary" :disabled="loading || busy">
            Aplicar filtros / atualizar
          </button>
        </form>
      </section>
      <section v-if="totals" class="rural-panel">
        <h3>Totais das despesas filtradas</h3>
        <p>
          Todos os {{ count }} registros do filtro, incluindo outras páginas. Pagamentos agrupados
          pelo vencimento da despesa, não pela data da saída de caixa. Canceladas não somam.
        </p>
        <dl>
          <dt>Valor das despesas</dt>
          <dd>{{ expenseMoney(totals.amount_cents) }}</dd>
          <dt>Pago, descontando estornos</dt>
          <dd>{{ expenseMoney(totals.paid_cents) }}</dd>
          <dt>Saldo em aberto</dt>
          <dd>{{ expenseMoney(totals.balance_cents) }}</dd>
        </dl>
      </section>
      <button
        v-if="!creating"
        class="button"
        :disabled="busy || loading"
        @click="
          creating = true;
          detail = null;
          notice = '';
        "
      >
        Nova despesa
      </button>
      <section v-if="creating" class="rural-panel">
        <h3>Nova despesa</h3>
        <p>
          Confira os dados antes de salvar. Para corrigir uma despesa salva, estorne seus
          pagamentos, cancele com motivo e registre uma nova.
        </p>
        <form @submit.prevent="save('create')">
          <fieldset :disabled="busy">
            <legend>Dados da despesa</legend>
            <div class="field">
              <label for="expense-property">Propriedade *</label
              ><select id="expense-property" v-model="form.property_id" required>
                <option value="">Selecione</option>
                <option v-for="p in context.properties" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="expense-season">Safra</label
              ><select id="expense-season" v-model="form.season_id">
                <option value="">Sem safra</option>
                <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div class="field">
              <label for="expense-title">Descrição *</label
              ><input
                id="expense-title"
                v-model="form.title"
                required
                minlength="2"
                maxlength="160"
              />
            </div>
            <div class="field">
              <label for="expense-category">Categoria *</label
              ><select id="expense-category" v-model="form.category">
                <option v-for="(label, key) in expenseCategories" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="expense-amount">Valor (R$) *</label
              ><input
                id="expense-amount"
                v-model="form.amount"
                inputmode="decimal"
                placeholder="Ex.: 1500,50"
                required
              />
            </div>
            <div class="field">
              <label for="expense-record">Data da ocorrência *</label
              ><input
                id="expense-record"
                v-model="form.record_date"
                type="date"
                :max="localDay()"
                required
              />
            </div>
            <div class="field">
              <label for="expense-due">Vencimento *</label
              ><input id="expense-due" v-model="form.due_date" type="date" required />
            </div>
            <div class="field">
              <label for="expense-notes">Observações</label
              ><textarea id="expense-notes" v-model="form.notes" maxlength="2000" />
            </div>
            <button class="button">Salvar despesa</button
            ><button type="button" class="button button--secondary" @click="creating = false">
              Fechar formulário
            </button>
          </fieldset>
        </form>
      </section>
      <p v-if="loading" role="status">Carregando despesas…</p>
      <section v-if="detail" class="rural-panel" aria-label="Detalhe da despesa">
        <h3>{{ detail.expense.title }}</h3>
        <p>
          {{ detail.expense.property_name }} • {{ detail.expense.season_name || 'Sem safra' }} •
          {{ expenseCategories[detail.expense.category] }}
        </p>
        <p>
          Ocorrência: {{ date(detail.expense.record_date) }} • Vencimento:
          {{ date(detail.expense.due_date) }}
        </p>
        <p class="expense-text">{{ detail.expense.notes }}</p>
        <p>
          Total: {{ expenseMoney(detail.expense.amount_cents) }} • Pago: {{ expenseMoney(paid) }} •
          Saldo: {{ expenseMoney(balance) }}
        </p>
        <p v-if="detail.expense.cancelled_at" class="expense-text">
          Cancelada: {{ detail.expense.cancel_reason }}
        </p>
        <template v-else>
          <button
            v-if="balance > 0"
            class="button"
            :disabled="busy || loading"
            @click="startAction('pay')"
          >
            Registrar pagamento
          </button>
          <button
            v-if="paid === 0"
            class="button button--secondary"
            :disabled="busy || loading"
            @click="startAction('cancel')"
          >
            Cancelar despesa
          </button>
        </template>
        <ExpenseAllocation
          :key="detail.expense.id + ':' + detail.expense.version"
          :expense-id="detail.expense.id"
          @changed="open(detail.expense.id)"
        />
        <h4>Histórico de pagamentos</h4>
        <p v-if="!detail.payments.length">Nenhum pagamento registrado.</p>
        <article v-for="p in detail.payments" :key="p.id" class="rural-card">
          <p>{{ date(p.paid_on) }} • {{ expenseMoney(p.amount_cents) }}</p>
          <p class="expense-text">{{ p.note }}</p>
          <p v-if="p.reversed_at" class="expense-text">Estornado: {{ p.reverse_reason }}</p>
          <button
            v-else-if="!detail.expense.cancelled_at"
            class="button button--secondary"
            :disabled="busy || loading"
            @click="startAction('reverse', p.id)"
          >
            Estornar pagamento
          </button>
        </article>
        <form v-if="action" @submit.prevent="save(action)">
          <fieldset :disabled="busy">
            <legend>
              {{
                action === 'pay'
                  ? 'Registrar pagamento'
                  : action === 'reverse'
                    ? 'Confirmar estorno'
                    : 'Confirmar cancelamento'
              }}
            </legend>
            <template v-if="action === 'pay'"
              ><div class="field">
                <label for="expense-payment-amount">Valor do pagamento (R$) *</label
                ><input
                  id="expense-payment-amount"
                  v-model="payment.amount"
                  inputmode="decimal"
                  required
                />
              </div>
              <div class="field">
                <label for="expense-payment-date">Data do pagamento *</label
                ><input
                  id="expense-payment-date"
                  v-model="payment.paid_on"
                  type="date"
                  :max="localDay()"
                  required
                />
              </div>
              <div class="field">
                <label for="expense-payment-note">Observação do pagamento</label
                ><textarea id="expense-payment-note" v-model="payment.note" maxlength="1000" /></div
            ></template>
            <div v-else class="field">
              <label for="expense-action-reason">Motivo *</label
              ><textarea
                id="expense-action-reason"
                v-model="payment.reason"
                required
                minlength="2"
                maxlength="1000"
              />
            </div>
            <button class="button">Confirmar registro</button
            ><button type="button" class="button button--secondary" @click="action = ''">
              Voltar sem registrar
            </button>
          </fieldset>
        </form>
        <button
          class="button button--secondary"
          :disabled="busy"
          @click="
            detail = null;
            action = '';
          "
        >
          Fechar detalhe
        </button>
      </section>
      <section class="rural-panel">
        <h3>Despesas encontradas</h3>
        <p v-if="!rows.length && !loading">Nenhuma despesa nesta seleção.</p>
        <article v-for="row in rows" :key="row.id" class="rural-card">
          <h4>{{ row.title }}</h4>
          <p>{{ row.property_name }} • {{ date(row.due_date) }} • {{ expenseState(row) }}</p>
          <p>
            Valor: {{ expenseMoney(row.amount_cents) }} • Saldo:
            {{ expenseMoney(row.balance_cents) }}
          </p>
          <button
            class="button button--secondary"
            :disabled="busy || loading"
            @click="
              creating = false;
              open(row.id);
            "
          >
            Abrir despesa
          </button>
        </article>
        <div class="expense-actions">
          <button
            class="button button--secondary"
            :disabled="page === 0 || loading || busy"
            @click="
              page--;
              detail = null;
              load();
            "
          >
            Página anterior</button
          ><span>Página {{ page + 1 }} • {{ count }} registros</span
          ><button
            class="button button--secondary"
            :disabled="(page + 1) * 50 >= count || loading || busy"
            @click="
              page++;
              detail = null;
              load();
            "
          >
            Próxima página</button
          ><button
            class="button button--secondary"
            :disabled="!rows.length || loading || busy"
            @click="exportCsv"
          >
            Exportar esta página (CSV)
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
<style scoped>
input,
select,
textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 48px;
  padding: 0.75rem;
  border: 1px solid var(--color-border, #d7dfd4);
  border-radius: 0.75rem;
  font: inherit;
}
fieldset {
  border: 0;
  padding: 0;
  min-width: 0;
}
.expense-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.expense-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}
dd {
  margin: 0 0 0.75rem;
  font-weight: 700;
}
button {
  margin: 0.25rem 0;
}
</style>
