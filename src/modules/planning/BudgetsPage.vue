<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc } from '../../services/workspaceService.js';
import { expenseMoney } from '../finance/expenseModel.js';
import { budgetPayload, budgetCategories, plannedLine, simpleCsv } from './planningModel.js';
import { localDay, downloadVisitFile } from '../visits/visitFollowup.js';
import '../properties/rural.css';
const makeId = () => crypto.randomUUID();
const page = ref(0),
  editing = ref(false),
  actual = ref(null);
const blank = () => ({ id: '', version: 0, cycle_id: '', name: '', items: [] });
const form = reactive(blank());
const w = useWorkspace(async () => {
  const [list, context] = await Promise.all([
    workspaceRpc('budget_list', { p_offset: page.value * 50 }),
    workspaceRpc('budget_context'),
  ]);
  return { list, context };
});
const { data, error, notice, busy, loading, status } = w;
watch(w.invalidated, () => {
  editing.value = false;
  actual.value = null;
  Object.assign(form, blank());
});
const total = computed(() => {
  try {
    return form.items.reduce((s, i) => s + plannedLine(i).total_cents, 0);
  } catch {
    return null;
  }
});
function edit(row) {
  actual.value = null;
  Object.assign(
    form,
    row
      ? {
          id: row.id,
          version: row.version,
          cycle_id: row.cycle_id,
          name: row.name,
          items: row.items.map((i) => ({
            ...i,
            quantity: String(i.quantity),
            price: (i.unit_cents / 100).toFixed(2).replace('.', ','),
          })),
        }
      : blank(),
  );
  editing.value = true;
}
function choose(item) {
  const i = data.value.context.inputs.find((i) => i.id === item.input_id);
  if (i) {
    item.unit = i.unit;
    if (!item.label) item.label = i.name;
  }
}
async function save() {
  try {
    const payload = budgetPayload(form);
    await w.command(
      'budget_command',
      {
        p_action: form.id ? 'update' : 'create',
        p_data: { ...payload, ...(form.id ? { id: form.id, version: form.version } : {}) },
      },
      () => (editing.value = false),
    );
  } catch (e) {
    error.value = e.message;
  }
}
async function setState(row, state) {
  await w.command(
    'budget_command',
    { p_action: 'status', p_data: { id: row.id, version: row.version, status: state } },
    () => (actual.value = null),
  );
}
async function compare(row) {
  try {
    const result = await workspaceRpc('budget_actual', { p_budget: row.id });
    if (status.value.online) actual.value = { ...result, name: row.name };
  } catch (e) {
    error.value = e.message;
  }
}
function exportBudget(row) {
  downloadVisitFile(
    simpleCsv(
      [
        'Operação',
        'Categoria',
        'Insumo ID',
        'Quantidade',
        'Unidade',
        'Preço unitário (centavos)',
        'Custo (centavos)',
        'Data',
        'Executada',
      ],
      row.items.map((i) => [
        i.label,
        i.category,
        i.input_id,
        i.quantity,
        i.unit,
        i.unit_cents,
        i.total_cents,
        i.due_date,
        i.completed ? 'Sim' : 'Não',
      ]),
    ),
    'text/csv;charset=utf-8',
    'meuagro-orcamento.csv',
  );
}
</script>
<template>
  <div class="rural-vue">
    <h2>Planejamento e orçamento da safra</h2>
    <p>
      Planeje operações por plantio. Só orçamentos aprovados alimentam a demanda de estoque. Marcar
      uma operação como executada retira sua demanda futura, mas não grava consumo nem despesa:
      registre a execução nos módulos correspondentes.
    </p>
    <a href="/more/procurement" data-link class="button button--secondary"
      >Ver reposição planejada</a
    >
    <p v-if="!status.online">Conecte-se para gerenciar orçamentos.</p>
    <template v-else
      ><p v-if="error" role="alert">{{ error }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <button class="button button--secondary" :disabled="busy || loading" @click="w.load">
        Atualizar orçamentos</button
      ><button class="button" :disabled="busy || loading || !data" @click="edit(null)">
        Novo orçamento
      </button>
      <section v-if="editing && data" class="rural-panel">
        <h3>{{ form.id ? 'Editar' : 'Novo' }} orçamento</h3>
        <form @submit.prevent="save">
          <fieldset :disabled="busy">
            <legend>Dados do planejamento</legend>
            <div class="field">
              <label for="budget-cycle">Plantio</label
              ><select id="budget-cycle" v-model="form.cycle_id" required :disabled="!!form.id">
                <option value="">Selecione</option>
                <option v-for="c in data.context.cycles" :key="c.id" :value="c.id">
                  {{ c.label }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="budget-name">Nome do orçamento</label
              ><input id="budget-name" v-model="form.name" required minlength="2" maxlength="120" />
            </div>
            <article v-for="(item, index) in form.items" :key="item.id" class="rural-card">
              <h4>Operação {{ index + 1 }}</h4>
              <div class="field">
                <label :for="'budget-label-' + index">Descrição</label
                ><input
                  :id="'budget-label-' + index"
                  v-model="item.label"
                  required
                  minlength="2"
                  maxlength="160"
                />
              </div>
              <div class="field">
                <label :for="'budget-category-' + index">Categoria</label
                ><select
                  :id="'budget-category-' + index"
                  v-model="item.category"
                  @change="item.input_id = ''"
                >
                  <option v-for="(label, key) in budgetCategories" :value="key" :key="key">
                    {{ label }}
                  </option>
                </select>
              </div>
              <div v-if="item.category === 'input'" class="field">
                <label :for="'budget-input-' + index">Insumo</label
                ><select
                  :id="'budget-input-' + index"
                  v-model="item.input_id"
                  required
                  @change="choose(item)"
                >
                  <option value="">Selecione</option>
                  <option v-for="i in data.context.inputs" :key="i.id" :value="i.id">
                    {{ i.name }} ({{ i.unit }})
                  </option>
                </select>
              </div>
              <div class="field">
                <label :for="'budget-qty-' + index">Quantidade</label
                ><input
                  :id="'budget-qty-' + index"
                  v-model="item.quantity"
                  inputmode="decimal"
                  required
                />
              </div>
              <div class="field">
                <label :for="'budget-unit-' + index">Unidade</label
                ><input
                  :id="'budget-unit-' + index"
                  v-model="item.unit"
                  :readonly="item.category === 'input'"
                  maxlength="20"
                  required
                />
              </div>
              <div class="field">
                <label :for="'budget-price-' + index">Preço unitário (R$)</label
                ><input
                  :id="'budget-price-' + index"
                  v-model="item.price"
                  inputmode="decimal"
                  required
                />
              </div>
              <div class="field">
                <label :for="'budget-date-' + index">Data prevista</label
                ><input :id="'budget-date-' + index" v-model="item.due_date" type="date" required />
              </div>
              <label
                ><input v-model="item.completed" type="checkbox" /> Operação executada (consumo deve
                ser registrado separadamente)</label
              ><button
                type="button"
                class="button button--secondary"
                @click="form.items.splice(index, 1)"
              >
                Remover operação {{ index + 1 }}
              </button>
            </article>
            <button
              type="button"
              class="button button--secondary"
              :disabled="form.items.length >= 100"
              @click="
                form.items.push({
                  id: makeId(),
                  label: '',
                  category: 'input',
                  input_id: '',
                  quantity: '1',
                  unit: '',
                  price: '0',
                  due_date: localDay(),
                  completed: false,
                })
              "
            >
              Adicionar operação
            </button>
            <p>Total previsto: {{ total === null ? 'Confira os valores' : expenseMoney(total) }}</p>
            <p>
              Se este orçamento já estiver aprovado, salvar altera a demanda de reposição
              imediatamente.
            </p>
            <button class="button">Salvar orçamento</button
            ><button type="button" class="button button--secondary" @click="editing = false">
              Descartar edição
            </button>
          </fieldset>
        </form>
      </section>
      <section v-if="actual" class="rural-panel">
        <h3>Previsto × realizado — {{ actual.name }}</h3>
        <p>
          Previsto: {{ expenseMoney(actual.planned_cents) }} • Realizado:
          {{
            expenseMoney(Number(actual.actual.input_cents) + Number(actual.actual.operating_cents))
          }}
        </p>
        <p>
          Desvio: {{ expenseMoney(actual.variance_cents) }}. Positivo indica custo realizado acima
          do orçamento. Realizado considera todos os consumos e despesas rateadas do plantio, sem
          conciliação automática por operação.
        </p>
      </section>
      <p v-if="loading">Carregando…</p>
      <section v-if="data" class="rural-panel">
        <p>{{ data.list.count }} orçamento(s). Um orçamento aprovado por plantio.</p>
        <article v-for="row in data.list.items" :key="row.id" class="rural-card">
          <h3>{{ row.name }}</h3>
          <p>{{ data.context.cycles.find((c) => c.id === row.cycle_id)?.label || row.cycle_id }}</p>
          <p>
            {{ { draft: 'Rascunho', approved: 'Aprovado', archived: 'Arquivado' }[row.status] }} •
            {{ expenseMoney(row.planned_cents) }}
          </p>
          <button
            v-if="row.status !== 'archived'"
            class="button button--secondary"
            :disabled="busy"
            @click="edit(row)"
          >
            Editar orçamento</button
          ><button
            v-if="row.status !== 'approved'"
            class="button button--secondary"
            :disabled="busy"
            @click="setState(row, 'approved')"
          >
            Aprovar orçamento</button
          ><button
            v-if="row.status !== 'draft'"
            class="button button--secondary"
            :disabled="busy"
            @click="setState(row, 'draft')"
          >
            Voltar a rascunho</button
          ><button
            v-if="row.status !== 'archived'"
            class="button button--secondary"
            :disabled="busy"
            @click="setState(row, 'archived')"
          >
            Arquivar orçamento</button
          ><button class="button button--secondary" @click="compare(row)">
            Comparar com realizado</button
          ><button class="button button--secondary" @click="exportBudget(row)">
            Exportar orçamento (CSV)
          </button>
        </article>
        <button
          class="button button--secondary"
          :disabled="page === 0 || loading"
          @click="
            page--;
            w.load();
          "
        >
          Página anterior</button
        ><span>Página {{ page + 1 }}</span
        ><button
          class="button button--secondary"
          :disabled="(page + 1) * 50 >= data.list.count || loading"
          @click="
            page++;
            w.load();
          "
        >
          Próxima página
        </button>
      </section></template
    >
  </div>
</template>
<style scoped>
fieldset {
  border: 0;
  padding: 0;
  min-width: 0;
}
input:not([type='checkbox']),
select {
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
  padding: 0.75rem;
  font: inherit;
  border: 1px solid #d7dfd4;
  border-radius: 0.75rem;
}
button {
  margin: 0.25rem;
}
p {
  overflow-wrap: anywhere;
}
</style>
