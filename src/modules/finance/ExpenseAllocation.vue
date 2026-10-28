<script setup>
import { ref, computed, onMounted, onScopeDispose } from 'vue';
import { expenseRpc } from '../../services/expenseService.js';
import { expenseMoney } from './expenseModel.js';
import { allocationPayload, equalAllocation, centsInput } from './allocationModel.js';
const props = defineProps({ expenseId: String });
const emit = defineEmits(['changed']);
const data = ref(null),
  items = ref([]),
  reason = ref(''),
  loading = ref(false),
  busy = ref(false),
  error = ref(''),
  notice = ref(''),
  editing = ref(false);
let disposed = false,
  retry = null;
const preview = computed(() => {
  try {
    return allocationPayload(items.value, data.value?.expense.amount_cents || 0);
  } catch {
    return null;
  }
});
async function load() {
  loading.value = true;
  error.value = '';
  try {
    const result = await expenseRpc('expense_allocation_context', { p_expense: props.expenseId });
    if (!disposed) {
      if (result.version !== 44) throw Error('Atualize o SQL da etapa 44.');
      data.value = result;
      items.value = result.allocations.map((a) => ({
        cycle_id: a.cycle_id,
        amount: centsInput(a.amount_cents),
      }));
      editing.value = false;
      reason.value = '';
    }
  } catch (e) {
    if (!disposed) error.value = e.message;
  } finally {
    if (!disposed) loading.value = false;
  }
}
function divide() {
  try {
    items.value = equalAllocation(items.value, data.value.expense.amount_cents);
    error.value = '';
  } catch (e) {
    error.value = e.message;
  }
}
async function save() {
  if (busy.value) return;
  error.value = '';
  let payload;
  try {
    const parsed = allocationPayload(items.value, data.value.expense.amount_cents);
    if (reason.value.trim().length < 2 || reason.value.length > 1000)
      throw Error('Informe o motivo do rateio (2 a 1000 caracteres).');
    payload = {
      id: props.expenseId,
      version: data.value.expense.version,
      allocations: parsed.allocations,
      reason: reason.value.trim(),
    };
  } catch (e) {
    error.value = e.message;
    return;
  }
  const signature = JSON.stringify(payload);
  if (!retry || retry.signature !== signature) retry = { signature, id: crypto.randomUUID() };
  busy.value = true;
  try {
    await expenseRpc('expense_allocate', { p_operation: retry.id, p_data: payload });
    if (disposed) return;
    retry = null;
    notice.value = 'Rateio registrado.';
    emit('changed');
    await load();
  } catch (e) {
    if (!disposed) error.value = e.message;
  } finally {
    if (!disposed) busy.value = false;
  }
}
onMounted(load);
onScopeDispose(() => (disposed = true));
</script>
<template>
  <section aria-label="Rateio da despesa" class="allocation-panel">
    <h4>Rateio entre plantios</h4>
    <p>
      Distribua o custo entre plantios da mesma propriedade e, quando definida, da mesma safra.
      Pagamentos não alteram o custo rateado.
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <p v-if="loading" role="status">Carregando rateio…</p>
    <template v-if="data">
      <p v-if="!editing">
        Rateado:
        {{ expenseMoney(data.allocations.reduce((sum, a) => sum + Number(a.amount_cents), 0)) }} •
        Sem distribuir:
        {{
          expenseMoney(
            data.expense.amount_cents -
              data.allocations.reduce((sum, a) => sum + Number(a.amount_cents), 0),
          )
        }}
      </p>
      <ul v-if="!editing">
        <li v-for="a in data.allocations" :key="a.cycle_id">
          {{ a.cycle_label }} — {{ expenseMoney(a.amount_cents) }}
        </li>
      </ul>
      <p v-if="data.expense.cancelled_at">
        A despesa foi cancelada; este rateio fica preservado no histórico e não compõe o resultado.
      </p>
      <button
        v-else-if="!editing"
        type="button"
        class="button button--secondary"
        :disabled="loading || busy"
        @click="editing = true"
      >
        Editar rateio
      </button>
      <form v-if="editing" @submit.prevent="save">
        <fieldset :disabled="busy || loading">
          <legend>Distribuição do custo</legend>
          <article v-for="(item, index) in items" :key="index" class="rural-card">
            <div class="field">
              <label :for="'allocation-cycle-' + index">Plantio {{ index + 1 }}</label
              ><select :id="'allocation-cycle-' + index" v-model="item.cycle_id" required>
                <option value="">Selecione</option>
                <option
                  v-if="item.cycle_id && !data.cycles.some((c) => c.id === item.cycle_id)"
                  :value="item.cycle_id"
                >
                  {{
                    data.allocations.find((a) => a.cycle_id === item.cycle_id)?.cycle_label
                  }}
                  (arquivado)
                </option>
                <option v-for="c in data.cycles" :key="c.id" :value="c.id">{{ c.label }}</option>
              </select>
            </div>
            <div class="field">
              <label :for="'allocation-amount-' + index"
                >Valor para o plantio {{ index + 1 }} (R$)</label
              ><input
                :id="'allocation-amount-' + index"
                v-model="item.amount"
                inputmode="decimal"
                required
              />
            </div>
            <button type="button" class="button button--secondary" @click="items.splice(index, 1)">
              Remover plantio {{ index + 1 }}
            </button>
          </article>
          <div class="allocation-actions">
            <button
              type="button"
              class="button button--secondary"
              :disabled="items.length >= 50"
              @click="items.push({ cycle_id: '', amount: '' })"
            >
              Adicionar plantio ao rateio</button
            ><button
              type="button"
              class="button button--secondary"
              :disabled="!items.length"
              @click="divide"
            >
              Dividir igualmente
            </button>
          </div>
          <p v-if="preview">
            Rateado: {{ expenseMoney(preview.total) }} • Sem distribuir:
            {{ expenseMoney(preview.remaining) }}
          </p>
          <p v-else>Confira os plantios e valores; o total deve respeitar o valor da despesa.</p>
          <p>
            Salvar sem plantios remove o rateio atual. A parte sem distribuir não é deduzida do
            resultado de nenhum plantio.
          </p>
          <div class="field">
            <label for="allocation-reason">Motivo do rateio ou alteração *</label
            ><textarea
              id="allocation-reason"
              v-model="reason"
              required
              minlength="2"
              maxlength="1000"
            />
          </div>
          <button class="button">Salvar rateio</button
          ><button type="button" class="button button--secondary" @click="load">
            Descartar alterações de rateio
          </button>
        </fieldset>
      </form>
      <button
        type="button"
        class="button button--secondary"
        :disabled="loading || busy"
        @click="load"
      >
        Atualizar rateio do servidor
      </button>
      <details>
        <summary>Últimas {{ data.history.length }} alterações de rateio (até 20)</summary>
        <article v-for="h in data.history" :key="h.operation_id" class="rural-card">
          <p>{{ new Date(h.created_at).toLocaleString('pt-BR') }} — {{ h.reason }}</p>
          <ul>
            <li v-for="a in h.allocations" :key="a.cycle_id">
              {{ a.cycle_label }} — {{ expenseMoney(a.amount_cents) }}
            </li>
          </ul>
        </article>
      </details>
    </template>
  </section>
</template>
<style scoped>
.allocation-panel {
  margin: 1.5rem 0;
  border-top: 1px solid var(--color-border, #d7dfd4);
  padding-top: 1rem;
  overflow-wrap: anywhere;
}
.allocation-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
fieldset {
  min-width: 0;
  border: 0;
  padding: 0;
}
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
summary {
  cursor: pointer;
  padding: 0.75rem 0;
}
</style>
