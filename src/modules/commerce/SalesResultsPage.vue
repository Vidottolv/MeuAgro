<script setup>
import { computed } from 'vue';
import {
  salesSellers,
  salesReport,
  salesOrder,
  productRanking,
  saveSalesResult,
  salesError,
} from '../../services/salesResultService.js';
import { money } from '../../services/tradeService.js';
import { useResource } from '../inventory/shared/useResource';
import { useCommand } from './useCommand';
import { field, select, number, deliveryStates, when } from './tradeModel';
import CommandForm from './CommandForm.vue';
import RevenueChart from './RevenueChart.vue';
import RequestState from '../properties/components/RequestState.vue';
const props = defineProps({ session: Object }),
  emit = defineEmits(['navigate']);
const q = new URLSearchParams(location.search),
  orderId = q.get('order'),
  today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()),
  from = q.get('from') || today.slice(0, 7) + '-01',
  to = q.get('to') || today,
  year = Number(q.get('year')) || Number(today.slice(0, 4)),
  month = Number(q.get('month')) || Number(today.slice(5, 7)),
  offset = Math.max(0, Number(q.get('offset')) || 0);
const { data, loading, error, reload } = useResource(async () => {
  const sellers = await salesSellers(props.session.user.id),
    seller = sellers.find((s) => s.id === q.get('seller')) || sellers[0];
  if (!seller) return { sellers };
  if (orderId) {
    if (seller.owner_id !== props.session.user.id)
      throw Error('Somente o responsável pode acessar esta apuração.');
    const detail = await salesOrder(orderId);
    if (detail.order.seller_id !== seller.id)
      throw Error('O pedido não pertence à atuação selecionada.');
    return { sellers, seller, detail };
  }
  const [report, ranking] = await Promise.all([
    salesReport(seller.id, from, to, offset),
    productRanking(seller.id, year, month),
  ]);
  return { sellers, seller, report, ranking };
}, null);
const command = useCommand(
    (a, p, key) => saveSalesResult(p, key),
    async () => {
      await reload();
      if (error.value) throw Error(error.value);
    },
    salesError,
  ),
  busy = computed(() => command.busy.value || command.committed.value);
const last = computed(() => data.value?.detail?.versions[0]);
const url = (extra = {}) =>
  '/consultor/resultados?' +
  new URLSearchParams({ seller: data.value.seller.id, from, to, year, month, ...extra });
const amount = (v) => (v == null ? 'Pendente' : money(v));
const fields = computed(() => {
  if (!data.value?.detail) return [];
  return [
    ...data.value.detail.order.quote_snapshot.items.map((i) =>
      number(
        'cost_' + i.product_id,
        'Custo por ' + i.package_name + ' de ' + i.name,
        last.value?.items.find((x) => x.product_id === i.product_id)?.unit_cost ?? '',
        { required: true },
      ),
    ),
    number('delivery_cost', 'Custo da entrega (R$)', last.value?.delivery_cost ?? 0, {
      required: true,
    }),
    number('other_cost', 'Outros custos (R$)', last.value?.other_cost ?? 0, { required: true }),
    number('commission_percent', 'Comissão do consultor (%)', last.value?.commission_percent ?? 0, {
      required: true,
      max: 100,
    }),
    field(
      'reason',
      last.value ? 'Motivo da correção' : 'Descrição da apuração',
      last.value ? '' : 'Apuração inicial',
      { required: true, minlength: 5, maxlength: 500 },
    ),
  ];
});
function save(values) {
  const payload = {
    ...values,
    order_id: orderId,
    expected_version: last.value?.version || 0,
    items: Object.entries(values)
      .filter(([k]) => k.startsWith('cost_'))
      .map(([k, v]) => ({ product_id: k.slice(5), unit_cost: v })),
  };
  for (const k of Object.keys(payload)) if (k.startsWith('cost_')) delete payload[k];
  void command.run('save', payload);
}
const metrics = computed(() => {
  const r = data.value?.report;
  if (!r) return [];
  const t = r.totals,
    rows = [
      ['Vendas recebidas', money(t.sales_total)],
      ['Pedidos recebidos', t.received_count],
      ['Em andamento', t.pending_count + ' • ' + money(t.pending_total)],
      ['Comissões das vendas recebidas', amount(t.commission_total)],
    ];
  if (r.owner)
    rows.push(
      ['Custos informados (sem comissão)', amount(t.cost_total)],
      ['Resultado sobre custos informados', amount(t.result_total)],
      [
        'Margem sobre a receita',
        t.margin_percent == null
          ? 'Pendente'
          : Number(t.margin_percent).toLocaleString('pt-BR') + '%',
      ],
    );
  return rows;
});
</script>
<template>
  <div class="rural-vue commerce-page">
    <p v-if="command.message.value" role="status">{{ command.message.value }}</p>
    <p v-if="command.error.value" role="alert">{{ command.error.value }}</p>
    <button
      v-if="command.committed.value"
      class="button button--secondary"
      @click="command.refresh().catch(() => {})"
    >
      Atualizar apuração salva</button
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="!data?.seller" class="rural-panel">
        <h2>Ative sua atuação comercial</h2>
        <a href="/consultor" data-link class="button button--secondary">Meu espaço</a>
      </section>
      <template v-else-if="data.detail"
        ><a :href="url()" data-link class="button button--secondary">Voltar aos resultados</a>
        <section class="rural-panel">
          <h2>Apuração do pedido</h2>
          <p>{{ data.seller.name }} • {{ data.detail.order.buyer_name }}</p>
          <p>Pedido {{ data.detail.order.id }} • {{ deliveryStates[data.detail.order.state] }}</p>
          <p>
            Receita acordada: {{ money(data.detail.order.total) }}.
            {{
              data.detail.order.state === 'received'
                ? 'Incluída nas vendas concluídas.'
                : 'Permanece prevista até o recebimento.'
            }}
          </p>
          <p>
            Os custos não são mostrados ao produtor. A comissão incide sobre os produtos após
            desconto, sem frete, e fica atribuída ao consultor responsável no aceite.
          </p>
          <p>Cada gravação cria uma versão. Preços aceitos e estoque permanecem preservados.</p>
          <CommandForm
            :key="last?.version || 0"
            :fields="fields"
            :busy="busy"
            label="Salvar apuração"
            @submit="save"
          />
        </section>
        <section class="rural-panel">
          <h3>Histórico de apurações</h3>
          <p v-if="!data.detail.versions.length">Nenhuma apuração registrada.</p>
          <article v-for="v in data.detail.versions" :key="v.version" class="rural-card">
            <h4>Versão {{ v.version }}{{ v === last ? ' • Atual' : '' }}</h4>
            <p>{{ when(v.created_at) }} • {{ v.reason }}</p>
            <p v-for="i in v.items" :key="i.product_id">
              {{ i.name }}: {{ money(i.unit_cost) }} por embalagem • {{ money(i.line_cost) }} de
              custo
            </p>
            <p>
              Produtos: {{ money(v.product_cost) }} • Entrega: {{ money(v.delivery_cost) }} •
              Outros: {{ money(v.other_cost) }}
            </p>
            <p>Comissão: {{ v.commission_percent }}% = {{ money(v.commission_amount) }}</p>
            <strong>Resultado sobre custos informados: {{ money(v.result_amount) }}</strong>
          </article>
        </section></template
      ><template v-else
        ><section class="rural-panel">
          <h2>{{ data.report.owner ? 'Resultados do vendedor' : 'Minhas vendas e comissões' }}</h2>
          <CommandForm
            :fields="[
              select(
                'seller',
                'Atuação',
                data.sellers.map((s) => [s.id, s.name]),
                data.seller.id,
              ),
              field('from', 'Início', from, { type: 'date', required: true }),
              field('to', 'Fim', to, { type: 'date', required: true }),
            ]"
            label="Atualizar resultados"
            @submit="emit('navigate', '/consultor/resultados?' + new URLSearchParams($event))"
          />
          <p>
            Vendas pelo dia do recebimento em Brasília. Pedidos em andamento pelo dia de criação.
            Período de até 366 dias.
          </p>
          <p v-if="!data.report.owner">
            Você vê as vendas atribuídas a você no aceite. Custos e resultados da empresa são
            restritos ao responsável.
          </p>
        </section>
        <div class="rural-grid">
          <article v-for="[label, value] in metrics" :key="label" class="rural-card">
            <h3>{{ label }}</h3>
            <strong>{{ value }}</strong>
          </article>
        </div>
        <p v-if="data.report.totals.missing_count">
          {{ data.report.totals.missing_count }} vendas recebidas ainda sem apuração.
        </p>
        <p>
          Este painel registra valores; não comprova pagamentos nem inclui despesas ou tributos que
          você não informou.
        </p>
        <section class="rural-panel">
          <h2>Produtos campeões de vendas</h2>
          <p>
            Até 10 produtos por valor vendido após desconto, sem frete. Somente recebimentos
            confirmados, no horário de Brasília.
          </p>
          <CommandForm
            :fields="[
              number('year', 'Ano', year, { required: true, min: 2000, max: 2200, step: 1 }),
              number('month', 'Mês', month, { required: true, min: 1, max: 12, step: 1 }),
            ]"
            label="Atualizar gráfico"
            @submit="emit('navigate', url($event))"
          /><template
            v-for="[label, rows] in [
              ['No mês ' + month + '/' + year, data.ranking.monthly],
              ['No ano ' + year, data.ranking.annual],
            ]"
            :key="label"
            ><p v-if="rows.length" class="sales-champion">
              {{
                rows.filter((p) => p.rank === 1).length > 1
                  ? 'Líderes empatados'
                  : 'Campeão de vendas'
              }}:
              {{
                rows
                  .filter((p) => p.rank === 1)
                  .map((p) => p.name)
                  .join(', ')
              }}
            </p>
            <RevenueChart
              :title="label"
              :rows="rows.map((p) => ({ name: p.name, value: p.revenue }))"
          /></template>
        </section>
        <section class="rural-panel">
          <h3>Produtos vendidos e recebidos</h3>
          <p v-if="!data.report.products.length">Nenhum produto recebido neste período.</p>
          <article v-for="(p, i) in data.report.products" :key="i" class="rural-card">
            <h4>{{ p.name }}</h4>
            <p>{{ p.package_name }} • {{ p.package_size }} {{ p.base_unit }}</p>
            <p>{{ p.packages }} embalagens • {{ p.base_quantity }} {{ p.base_unit }}</p>
          </article>
        </section>
        <section class="rural-panel">
          <h3>Pedidos do período</h3>
          <p v-if="!data.report.orders.length">Nenhum pedido neste período.</p>
          <article v-for="o in data.report.orders" :key="o.id" class="rural-card">
            <h4>{{ o.buyer_name }} • {{ money(o.total) }}</h4>
            <p>{{ when(o.date) }} • {{ deliveryStates[o.state] }}</p>
            <p>Consultor no aceite: {{ o.agent_name }}</p>
            <p>
              Comissão {{ o.state === 'received' ? 'apurada' : 'prevista' }}:
              {{ amount(o.commission_amount) }}
              {{ o.commission_percent != null ? '(' + o.commission_percent + '%)' : '' }}
            </p>
            <p v-if="data.report.owner">Resultado: {{ amount(o.result_amount) }}</p>
            <p>Pedido {{ o.id }}</p>
            <div class="rural-actions">
              <a
                v-if="o.can_open"
                :href="'/consultor/negociacoes?request=' + encodeURIComponent(o.request_id)"
                data-link
                class="button button--secondary"
                >Abrir pedido</a
              ><a
                v-if="data.report.owner"
                :href="url({ order: o.id })"
                data-link
                class="button button--primary"
                >{{ o.version ? 'Revisar apuração' : 'Informar custos' }}</a
              >
            </div>
          </article>
          <nav class="rural-actions" aria-label="Páginas de pedidos">
            <a
              v-if="offset"
              :href="url({ offset: Math.max(0, offset - 50) })"
              data-link
              class="button button--secondary"
              >Anterior</a
            ><a
              v-if="offset + 50 < Number(data.report.totals.order_count)"
              :href="url({ offset: offset + 50 })"
              data-link
              class="button button--secondary"
              >Próxima</a
            >
          </nav>
        </section></template
      ></RequestState
    >
  </div>
</template>
