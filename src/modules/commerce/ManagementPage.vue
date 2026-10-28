<script setup>
import { computed, ref } from 'vue';
import {
  managementCompanies,
  managementReport,
  managementWallet,
  managementCommand,
  managementError,
} from '../../services/managementService.js';
import { money } from '../../services/tradeService.js';
import { useSensitiveResource as useResource } from '../shared/useSensitiveResource';
import { useCommand } from './useCommand';
import { field, select } from './tradeModel';
import CommandForm from './CommandForm.vue';
import RequestState from '../properties/components/RequestState.vue';
import RevenueChart from './RevenueChart.vue';
import ManagerTeam from './ManagerTeam.vue';
import ManagerQueue from './ManagerQueue.vue';
const emit = defineEmits(['navigate']);
const q = new URLSearchParams(location.search),
  today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
const from = q.get('from') || today.slice(0, 7) + '-01',
  to = q.get('to') || today,
  offset = Math.max(0, Number(q.get('offset')) || 0),
  walletOffset = Math.max(0, Number(q.get('walletOffset')) || 0),
  walletSearch = q.get('walletSearch') || '',
  filter = {
    agent: q.get('agent') || '',
    product: q.get('product') || '',
    buyer: q.get('buyer') || '',
    state: q.get('state') || 'open',
  };
const { data, loading, error, reload } = useResource(async () => {
  const companies = await managementCompanies(),
    company = companies.find((c) => c.id === q.get('seller')) || companies[0];
  if (!company) return { companies };
  const [report, wallet] = await Promise.all([
    managementReport(company.id, from, to, filter, offset),
    managementWallet(company.id, walletSearch, walletOffset),
  ]);
  return { companies, company, report, wallet };
}, null);
const command = useCommand(
    managementCommand,
    async () => {
      await reload();
      if (error.value) throw Error(error.value);
    },
    managementError,
  ),
  version = ref(0),
  busy = computed(() => command.busy.value || command.committed.value);
const url = (extra = {}) =>
  '/consultor/gestao?' +
  new URLSearchParams({ seller: data.value.company.id, from, to, ...filter, ...extra });
const amount = (v) => (v == null ? 'Pendente' : money(v)),
  num = (v) => Number(v).toLocaleString('pt-BR');
const metrics = computed(() => {
  const t = data.value?.report?.totals;
  return t
    ? [
        ['Vendas recebidas', money(t.sales_total), 'received'],
        ['Propostas abertas válidas', money(t.open_quotes), 'quoted_valid'],
        ['Pedidos a entregar', t.to_deliver, 'to_deliver'],
        ['Aguardando recebimento', t.to_receive, 'awaiting_receipt'],
        ['Sem movimentação', t.stale, 'stale'],
        ['Retorno vencido', t.followup_due, 'followup_due'],
        ['Propostas vencendo em 48h', t.quote_expiring, 'quote_expiring'],
        ['Problemas de entrega', t.delivery_issues, 'delivery_issue'],
      ]
    : [];
});
async function submit(action, values) {
  const payload = { ...values, seller_id: data.value.company.id };
  if (action === 'goal') {
    payload.month = data.value.report.goals.month;
    payload.expected_version =
      data.value.report.goals.items.find((g) => (g.agent_id || '') === payload.agent_id)?.version ||
      0;
  }
  await command.run(action, payload);
  if (!command.error.value) version.value++;
}
</script>
<template>
  <div class="rural-vue commerce-page manager-page">
    <p v-if="command.message.value" role="status">{{ command.message.value }}</p>
    <p v-if="command.error.value" role="alert">{{ command.error.value }}</p>
    <button
      v-if="command.committed.value"
      class="button button--secondary"
      @click="command.refresh().catch(() => {})"
    >
      Atualizar alteração salva</button
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="!data?.company" class="rural-panel">
        <h2>Gestão da empresa</h2>
        <p>Esta área é exclusiva do dono e dos gestores autorizados da empresa.</p>
        <a href="/consultor" data-link class="button button--secondary">Meu espaço</a>
      </section>
      <template v-else
        ><section class="rural-panel">
          <p>{{ data.report.owner ? 'Dono da empresa' : 'Gestor' }} • {{ data.company.name }}</p>
          <h2>Uma visão da sua equipe</h2>
          <a href="/more/visits?team=1" data-link class="button button--secondary">Visitas técnicas da equipe</a>
          <a :href="'/consultor/equipe?seller=' + encodeURIComponent(data.company.id)" data-link class="button button--secondary">Gerentes e representantes</a>
          <CommandForm
            :fields="[
              select(
                'seller',
                'Empresa',
                data.companies.map((c) => [c.id, c.name]),
                data.company.id,
              ),
              field('from', 'Início', from, { type: 'date', required: true }),
              field('to', 'Fim', to, { type: 'date', required: true }),
            ]"
            label="Atualizar painel"
            @submit="emit('navigate', '/consultor/gestao?' + new URLSearchParams($event))"
          />
        </section>
        <div class="rural-grid">
          <article v-for="[label, value, state] in metrics" :key="state" class="rural-card">
            <h3>{{ label }}</h3>
            <strong>{{ value }}</strong
            ><a
              :href="url({ state, offset: 0 }) + '#manager-queue'"
              data-link
              class="button button--secondary"
              >Ver negociações</a
            >
          </article>
        </div>
        <section class="rural-panel">
          <p>
            Vendas no intervalo anterior equivalente:
            {{ money(data.report.totals.previous_sales) }}.
            {{
              data.report.totals.previous_sales > 0
                ? 'Variação: ' +
                  num(
                    (data.report.totals.sales_total / data.report.totals.previous_sales - 1) * 100,
                  ) +
                  '%.'
                : 'Sem base anterior para variação percentual.'
            }}
          </p>
          <p>
            Conversão:
            {{
              data.report.totals.quote_requests
                ? num(
                    (data.report.totals.converted_requests / data.report.totals.quote_requests) *
                      100,
                  ) + '%'
                : 'Sem propostas'
            }}
            ({{ data.report.totals.converted_requests }} de
            {{ data.report.totals.quote_requests }} solicitações criadas no período que tiveram
            proposta). Revisões não contam como novas oportunidades.
          </p>
          <p>
            Vendas pela data de recebimento em Brasília. Carteira, propostas abertas e alertas
            representam a posição atual, inclusive negociações antigas.
          </p>
          <template v-if="data.report.finance"
            ><p>
              Comissões: {{ amount(data.report.totals.commission) }} • Custos:
              {{ amount(data.report.totals.cost) }} • Resultado:
              {{ amount(data.report.totals.result) }}
            </p>
            <p v-if="data.report.totals.missing_financials">
              {{ data.report.totals.missing_financials }} vendas sem apuração completa.
            </p></template
          >
          <p v-else>
            Seu acesso é operacional. Custos, comissões e resultados financeiros privados não são
            exibidos.
          </p>
        </section>
        <ManagerTeam
          :report="data.report"
          :busy="busy"
          :version="version"
          @command="submit"
        /><ManagerQueue
          :report="data.report"
          :wallet="data.wallet"
          :filter="filter"
          :url="url"
          :offset="offset"
          :wallet-offset="walletOffset"
          :wallet-search="walletSearch"
          :busy="busy"
          :version="version"
          @command="submit"
          @navigate="emit('navigate', $event)"
        />
        <section class="rural-panel">
          <h2>Análise de produtos</h2>
          <p>Receita após desconto, sem frete. Volumes separados por embalagem e unidade.</p>
          <p v-if="data.report.finance">
            Resultado do produto = receita menos custo de aquisição; não deduz entrega, comissão ou
            outras despesas.
          </p>
          <RevenueChart
            title="Cinco produtos com maior receita no período"
            :rows="
              data.report.products
                .slice(0, 5)
                .map((p) => ({
                  name: p.name + ' • ' + p.package_name + ' ' + p.package_size + ' ' + p.base_unit,
                  value: p.revenue,
                }))
            "
          />
          <p v-if="!data.report.products.length">Nenhuma venda recebida no período.</p>
          <article v-for="(p, i) in data.report.products" :key="i" class="rural-card">
            <h3>{{ p.name }}</h3>
            <p>
              {{ p.package_name }} • {{ num(p.package_size) }} {{ p.base_unit }} •
              {{ num(p.packages) }} embalagens • {{ num(p.volume) }} {{ p.base_unit }}
            </p>
            <p>
              Receita: {{ money(p.revenue) }} • Desconto médio ponderado:
              {{ num(p.discount_percent) }}%
            </p>
            <p v-if="data.report.finance">
              Resultado do produto: {{ amount(p.product_result)
              }}{{
                p.revenue > 0 && p.product_result !== null
                  ? ' • Margem: ' + num((p.product_result / p.revenue) * 100) + '%'
                  : ''
              }}{{ p.missing ? ' • Custos incompletos' : '' }}
            </p>
          </article>
        </section>
        <details class="rural-panel">
          <summary>Negociações encerradas e motivos registrados</summary>
          <p>
            Até 100 solicitações mais recentes, criadas no período. Motivos registrados pelas
            partes.
          </p>
          <p v-if="!data.report.losses.length">Nenhum encerramento encontrado.</p>
          <article v-for="(l, i) in data.report.losses" :key="l.id || i" class="rural-card">
            <strong>{{ l.buyer_name }} • {{ l.agent_name }}</strong>
            <p>{{ l.items.map((i) => i.name).join(', ') }}</p>
            <p>{{ l.reason || 'Sem motivo informado' }}</p>
          </article>
        </details></template
      ></RequestState
    >
  </div>
</template>
