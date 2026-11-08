<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { workspaceRpc } from '../../services/workspaceService.js';
import { useWorkspace } from '../shared/useWorkspace.js';
import {
  money,
  today,
  decimal,
  schedule,
  dateLabel,
  monthLabel,
  paymentMethods,
} from './liteModel.js';
import '../properties/rural.css';
const props = defineProps({ view: { type: String, default: 'resumo' } });
const month = ref(today().slice(0, 7)),
  search = ref(''),
  offset = ref(0),
  showForm = ref(false);
const w = useWorkspace(() =>
  workspaceRpc('app_lite_context', {
    p_month: month.value + '-01',
    p_search: search.value.trim(),
    p_offset: offset.value,
  }),
);
const { data, error, notice, busy, loading, status } = w;
const editable = computed(
  () =>
    data.value?.access?.active && data.value?.access?.protected && !busy.value && !loading.value,
);
const newItem = () => ({ product: '', quantity: '1', unit: 'un', price: '' });
const blank = () => ({
  id: null,
  version: null,
  producer: '',
  sold_on: today(),
  payment_method: 'pix',
  items: [newItem()],
  commission_type: 'percent',
  commission: '',
  note: '',
  count: 1,
  first: today(),
  dates: [today()],
});
const form = reactive(blank()),
  receive = reactive({ installment: '', amount: '', date: today(), note: '' }),
  correction = reactive({ action: '', id: '', version: 0, reason: '' });
watch(w.invalidated, () => {
  showForm.value = false;
  Object.assign(form, blank());
  receive.installment = '';
  correction.action = '';
});
function calculate() {
  const items = form.items.map((i) => ({
    product: i.product,
    quantity: decimal(i.quantity, 3) / 1000,
    unit: i.unit,
    unit_price_cents: decimal(i.price),
  }));
  const total = items.reduce(
    (s, i) =>
      s +
      Number((BigInt(Math.round(i.quantity * 1000)) * BigInt(i.unit_price_cents) + 500n) / 1000n),
    0,
  );
  const rate = form.commission_type === 'percent' ? decimal(form.commission) : 0;
  return {
    items,
    total,
    rate,
    commission:
      form.commission_type === 'percent'
        ? Number((BigInt(total) * BigInt(rate) + 5000n) / 10000n)
        : decimal(form.commission),
  };
}
const preview = computed(() => {
  try {
    return calculate();
  } catch {
    return null;
  }
});
function setDates() {
  try {
    form.dates = schedule(form.first, Number(form.count));
  } catch (e) {
    error.value = e.message;
  }
}
function createSale() {
  Object.assign(form, blank());
  showForm.value = true;
  error.value = '';
}
function edit(s) {
  Object.assign(form, {
    id: s.id,
    version: s.version,
    producer: s.producer,
    sold_on: s.sold_on,
    payment_method: s.payment_method,
    items: s.items.map((i) => ({
      product: i.product,
      quantity: String(i.quantity).replace('.', ','),
      unit: i.unit,
      price: (i.unit_price_cents / 100).toFixed(2).replace('.', ','),
    })),
    commission_type: s.commission_type,
    commission: ((s.commission_type === 'percent' ? s.commission_rate : s.commission_cents) / 100)
      .toFixed(2)
      .replace('.', ','),
    note: s.note,
    count: s.installments.length,
    first: s.installments[0].due_on,
    dates: s.installments.map((i) => i.due_on),
  });
  showForm.value = true;
}
async function save() {
  try {
    const p = calculate();
    if (form.dates.length !== Number(form.count))
      throw Error('Clique em Gerar parcelas para atualizar as datas.');
    await w.command(
      'app_lite_command',
      {
        p_action: 'save',
        p_data: {
          id: form.id,
          version: form.version,
          producer: form.producer,
          sold_on: form.sold_on,
          payment_method: form.payment_method,
          items: p.items,
          commission_type: form.commission_type,
          commission_rate: p.rate,
          commission_cents: p.commission,
          note: form.note,
          dates: form.dates,
        },
      },
      () => {
        showForm.value = false;
        Object.assign(form, blank());
      },
    );
  } catch (e) {
    error.value = e.message;
  }
}
async function confirmReceive() {
  try {
    await w.command(
      'app_lite_command',
      {
        p_action: 'receive',
        p_data: {
          installment: receive.installment,
          amount_cents: decimal(receive.amount),
          received_on: receive.date,
          note: receive.note,
        },
      },
      () => {
        receive.installment = '';
      },
    );
  } catch (e) {
    error.value = e.message;
  }
}
async function correct() {
  await w.command(
    'app_lite_command',
    {
      p_action: correction.action,
      p_data:
        correction.action === 'cancel'
          ? { id: correction.id, version: correction.version, reason: correction.reason }
          : { receipt: correction.id, reason: correction.reason },
    },
    () => {
      correction.action = '';
    },
  );
}
function filter() {
  offset.value = 0;
  void w.load();
}
const forecasts = computed(
  () => data.value?.months.filter((m) => m.month >= month.value + '-01') || [],
);
const history = computed(
  () =>
    data.value?.months
      .filter((m) => m.month <= month.value + '-01')
      .slice()
      .reverse() || [],
);
</script>
<template>
  <div class="rural-vue lite-page">
    <p class="lite-intro">
      Suas vendas e comissões em um só lugar. Os produtores são identificados pelo nome, sem
      precisar de conta no aplicativo.
    </p>
    <p v-if="!status.online" role="status">
      Conecte-se para consultar seus registros Lite. Nenhuma alteração será enviada sem conexão.
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <section v-if="view === 'conta'" class="rural-panel">
      <h2>Sua conta Lite</h2>
      <p>
        Plano exclusivo para consultores. Inclui vendas próprias e controle de comissões; o modo
        produtor, estoque, equipe, visitas, IA e satélite pertencem a outros planos.
      </p>
      <a href="/more/account-plan" data-link class="button">Consultar plano e cobrança</a
      ><a href="/more/profile" data-link class="button button--secondary">Meu perfil e sair</a
      ><a href="/more/help?topic=lite" data-link class="button button--secondary"
        >Como usar o Lite</a
      >
    </section>
    <template v-else-if="status.online">
      <form class="rural-panel lite-filters" @submit.prevent="filter">
        <label
          >Mês de referência<input
            v-model="month"
            type="month"
            required
            min="2000-01"
            max="2199-12" /></label
        ><label v-if="view === 'vendas'"
          >Buscar produtor ou produto<input v-model="search" maxlength="160" /></label
        ><button class="button button--secondary" :disabled="busy || loading">Atualizar</button>
      </form>
      <p v-if="loading">Carregando registros…</p>
      <template v-if="data">
        <p v-if="!data.access.active" role="status">
          O plano está sem vigência. Seu histórico continua disponível; renove para cadastrar ou
          alterar registros.
        </p>
        <div class="lite-stats">
          <section class="rural-panel">
            <h2>Vendas no mês</h2>
            <strong>{{ data.summary.count }}</strong>
            <p>{{ money(data.summary.sales) }} em vendas</p>
          </section>
          <section class="rural-panel">
            <h2>Comissão gerada no mês</h2>
            <strong>{{ money(data.summary.earned) }}</strong>
            <p>Das vendas realizadas no mês selecionado.</p>
          </section>
          <section class="rural-panel">
            <h2>Comissão recebida no mês</h2>
            <strong>{{ money(data.received) }}</strong>
            <p>Pela data do recebimento confirmado, inclusive de vendas antigas.</p>
          </section>
        </div>
        <template v-if="view === 'resumo' || view === 'comissoes'">
          <section class="rural-panel">
            <h2>Previsão de recebimentos</h2>
            <p>
              Saldo de comissão ainda pendente, pela data prevista de cada parcela. Não é
              confirmação de pagamento.
            </p>
            <p>
              Em atraso até hoje: <strong>{{ money(data.overdue) }}</strong>
            </p>
            <div class="lite-table">
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Comissão pendente prevista</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in forecasts" :key="m.month">
                    <td>{{ monthLabel(m.month) }}</td>
                    <td>{{ money(m.expected) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="rural-panel">
            <h2>Recebido nos últimos 12 meses</h2>
            <p>Recebimentos confirmados até o mês selecionado. Estornos são descontados.</p>
            <div class="lite-table">
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Comissão recebida</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in history" :key="m.month">
                    <td>{{ monthLabel(m.month) }}</td>
                    <td>{{ money(m.received) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <a href="/consultor/lite/vendas" data-link class="button"
              >Registrar vendas e recebimentos</a
            >
          </section>
        </template>
        <template v-if="view === 'vendas'">
          <button class="button" :disabled="!editable" @click="createSale">Nova venda</button>
          <form v-if="showForm" class="rural-panel" @submit.prevent="save">
            <h2>{{ form.id ? 'Editar venda' : 'Nova venda' }}</h2>
            <label
              >Nome do produtor<input
                v-model="form.producer"
                required
                minlength="2"
                maxlength="160" /></label
            ><label
              >Data da venda<input
                v-model="form.sold_on"
                type="date"
                required
                :max="today()"
                min="2000-01-01"
            /></label>
            <fieldset v-for="(item, index) in form.items" :key="index">
              <legend>Item {{ index + 1 }}</legend>
              <label>Produto<input v-model="item.product" required maxlength="160" /></label>
              <div class="lite-grid">
                <label
                  >Quantidade<input
                    v-model="item.quantity"
                    inputmode="decimal"
                    required
                    placeholder="1,000" /></label
                ><label
                  >Unidade<input
                    v-model="item.unit"
                    required
                    maxlength="24"
                    placeholder="un, kg, L, saco…" /></label
                ><label
                  >Valor unitário (R$)<input
                    v-model="item.price"
                    inputmode="decimal"
                    required
                    placeholder="0,00"
                /></label>
              </div>
              <button
                v-if="form.items.length > 1"
                type="button"
                class="button button--secondary"
                @click="form.items.splice(index, 1)"
              >
                Remover item
              </button>
            </fieldset>
            <button
              type="button"
              class="button button--secondary"
              :disabled="form.items.length >= 50"
              @click="form.items.push(newItem())"
            >
              Adicionar produto
            </button>
            <label
              >Forma de pagamento do produtor<select v-model="form.payment_method">
                <option v-for="[value, label] in paymentMethods" :key="value" :value="value">
                  {{ label }}
                </option>
              </select></label
            >
            <div class="lite-grid">
              <label
                >Comissão<select v-model="form.commission_type">
                  <option value="percent">Percentual da venda</option>
                  <option value="fixed">Valor fixo por venda</option>
                </select></label
              ><label
                >{{ form.commission_type === 'percent' ? 'Percentual (%)' : 'Comissão total (R$)'
                }}<input v-model="form.commission" inputmode="decimal" required placeholder="0,00"
              /></label>
            </div>
            <div class="lite-grid">
              <label
                >Pagamento em quantas vezes?<input
                  v-model.number="form.count"
                  type="number"
                  required
                  min="1"
                  max="36" /></label
              ><label
                >Primeira previsão de comissão<input v-model="form.first" type="date" required
              /></label>
            </div>
            <button type="button" class="button button--secondary" @click="setDates">
              Gerar parcelas
            </button>
            <p>
              A comissão é dividida igualmente entre as parcelas, com ajuste dos centavos. Ajuste
              abaixo a data em que espera receber cada uma.
            </p>
            <div class="lite-grid">
              <label v-for="(_, j) in form.dates" :key="j"
                >Previsão da parcela {{ j + 1 }}<input v-model="form.dates[j]" type="date" required
              /></label>
            </div>
            <p v-if="preview">
              Total da venda: <strong>{{ money(preview.total) }}</strong> • Comissão total:
              <strong>{{ money(preview.commission) }}</strong>
            </p>
            <label>Observações<textarea v-model="form.note" maxlength="2000" /></label
            ><button class="button" :disabled="!editable">Salvar venda</button
            ><button type="button" class="button button--secondary" @click="showForm = false">
              Fechar formulário
            </button>
          </form>
          <p>
            {{ data.count }} venda(s) no filtro, incluindo canceladas. Para receber comissão de uma
            venda antiga, selecione o mês em que a venda ocorreu.
          </p>
          <p v-if="!data.sales.length">Nenhuma venda encontrada neste mês.</p>
          <article v-for="s in data.sales" :key="s.id" class="rural-panel">
            <h2>{{ s.producer }} <small v-if="s.cancelled_at">— Cancelada</small></h2>
            <p>
              {{ dateLabel(s.sold_on) }} •
              {{ paymentMethods.find((x) => x[0] === s.payment_method)?.[1] }} •
              {{ s.installments.length }} vez(es)
            </p>
            <ul>
              <li v-for="(i, j) in s.items" :key="j">
                {{ i.product }} — {{ i.quantity }} {{ i.unit }} × {{ money(i.unit_price_cents) }} =
                {{ money(i.total_cents) }}
              </li>
            </ul>
            <p>
              Total: <strong>{{ money(s.total_cents) }}</strong> • Comissão:
              <strong>{{ money(s.commission_cents) }}</strong>
              {{
                s.commission_type === 'percent' ? `(${s.commission_rate / 100}%)` : '(valor fixo)'
              }}
            </p>
            <p v-if="s.note">{{ s.note }}</p>
            <p v-if="s.cancelled_at">Motivo: {{ s.cancel_reason }}</p>
            <template v-if="!s.cancelled_at"
              ><button
                class="button button--secondary"
                :disabled="!editable || s.installments.some((i) => i.receipts.length)"
                @click="edit(s)"
              >
                Editar</button
              ><button
                class="button button--secondary"
                :disabled="!editable"
                @click="
                  Object.assign(correction, {
                    action: 'cancel',
                    id: s.id,
                    version: s.version,
                    reason: '',
                  })
                "
              >
                Cancelar venda
              </button></template
            >
            <details>
              <summary>Parcelas e recebimentos de comissão</summary>
              <section v-for="i in s.installments" :key="i.id" class="lite-installment">
                <h3>Parcela {{ i.number }} — {{ dateLabel(i.due_on) }}</h3>
                <p>
                  Venda: {{ money(i.sale_cents) }} • Comissão: {{ money(i.commission_cents) }} •
                  Recebido: {{ money(i.paid) }} • Pendente: {{ money(i.commission_cents - i.paid) }}
                </p>
                <button
                  v-if="!s.cancelled_at && i.commission_cents > i.paid"
                  class="button"
                  :disabled="!editable"
                  @click="
                    Object.assign(receive, {
                      installment: i.id,
                      amount: ((i.commission_cents - i.paid) / 100).toFixed(2).replace('.', ','),
                      date: today(),
                      note: '',
                    })
                  "
                >
                  Registrar recebimento da comissão
                </button>
                <ul>
                  <li v-for="r in i.receipts" :key="r.id">
                    {{ dateLabel(r.received_on) }} — {{ money(r.amount_cents) }}
                    <span v-if="r.reversed_at">(Estornado: {{ r.reverse_reason }})</span
                    ><template v-else
                      ><span v-if="r.note"> • {{ r.note }}</span
                      ><button
                        class="button button--secondary"
                        :disabled="!editable"
                        @click="
                          Object.assign(correction, { action: 'reverse', id: r.id, reason: '' })
                        "
                      >
                        Estornar recebimento
                      </button></template
                    >
                  </li>
                </ul>
              </section>
            </details>
          </article>
          <div class="lite-filters">
            <button
              class="button button--secondary"
              :disabled="busy || loading || offset === 0"
              @click="
                offset -= 20;
                w.load();
              "
            >
              Anterior</button
            ><span>Página {{ offset / 20 + 1 }}</span
            ><button
              class="button button--secondary"
              :disabled="busy || loading || offset + 20 >= data.count"
              @click="
                offset += 20;
                w.load();
              "
            >
              Próxima
            </button>
          </div>
          <form v-if="receive.installment" class="rural-panel" @submit.prevent="confirmReceive">
            <h2>Confirmar recebimento de comissão</h2>
            <p>
              Registre somente o valor que você efetivamente recebeu. É permitido receber parte da
              parcela.
            </p>
            <label
              >Valor recebido (R$)<input
                v-model="receive.amount"
                inputmode="decimal"
                required /></label
            ><label
              >Data em que recebeu<input
                v-model="receive.date"
                type="date"
                :max="today()"
                min="2000-01-01"
                required /></label
            ><label>Observações<textarea v-model="receive.note" maxlength="2000" /></label
            ><button class="button" :disabled="!editable">Confirmar recebimento</button
            ><button
              type="button"
              class="button button--secondary"
              @click="receive.installment = ''"
            >
              Voltar
            </button>
          </form>
          <form v-if="correction.action" class="rural-panel" @submit.prevent="correct">
            <h2>
              {{ correction.action === 'cancel' ? 'Cancelar venda' : 'Estornar recebimento' }}
            </h2>
            <p>
              O histórico será preservado. Para cancelar uma venda, estorne antes os recebimentos
              ativos.
            </p>
            <label
              >Motivo<textarea
                v-model="correction.reason"
                required
                minlength="3"
                maxlength="500"
              /></label
            ><button class="button" :disabled="!editable">
              Confirmar {{ correction.action === 'cancel' ? 'cancelamento' : 'estorno' }}</button
            ><button type="button" class="button button--secondary" @click="correction.action = ''">
              Voltar
            </button>
          </form>
        </template></template
      ></template
    >
  </div>
</template>
<style scoped>
.lite-page {
  max-width: 1100px;
  margin: auto;
}
.lite-intro {
  margin-bottom: 1rem;
}
.lite-grid,
.lite-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 1rem;
}
.lite-stats h2 {
  font-size: 1rem;
}
.lite-stats strong {
  font-size: 1.5rem;
}
.lite-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 1rem;
}
.lite-filters label {
  flex: 1;
  min-width: 160px;
}
.lite-table {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  padding: 0.65rem;
  border-bottom: 1px solid #adb9ad;
}
fieldset,
.lite-installment {
  border: 1px solid #abb9ab;
  border-radius: 12px;
  padding: 1rem;
  margin: 1rem 0;
  min-width: 0;
}
.button {
  margin: 0.3rem 0.3rem 0.3rem 0;
}
label {
  display: block;
  margin: 0.7rem 0;
}
input,
select,
textarea {
  border: 1px solid #bac9bc;
  border-radius: 12px;
  padding: 0.75rem;
  font: inherit;
  color: inherit;
  background: var(--surface, #f8faf7);
  width: 100%;
  box-sizing: border-box;
  min-height: 44px;
}
summary {
  cursor: pointer;
  padding: 0.8rem 0;
}
small {
  font-size: 0.85rem;
}
li {
  overflow-wrap: anywhere;
}
button.button:not(.button--secondary) {
  background: #215f3d;
  color: white;
}
button:disabled {
  opacity: 0.5;
}
</style>
