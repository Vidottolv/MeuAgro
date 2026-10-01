<script setup>
import { money } from '../../services/tradeService.js';
import { number, field, select } from './tradeModel';
import { auditLabels } from './managementModel';
import { when } from './tradeModel';
import CommandForm from './CommandForm.vue';
import RevenueChart from './RevenueChart.vue';
import { computed } from 'vue';
const props = defineProps({ report: Object, busy: Boolean, version: Number });
const emit = defineEmits(['command']);
const options = computed(() =>
    props.report.team.filter((a) => a.active).map((a) => [a.id, a.name]),
  ),
  goal = computed(() => props.report.goals.items.find((g) => !g.agent_id));
const amount = (v) => (v == null ? 'Pendente' : money(v)),
  num = (v) => Number(v).toLocaleString('pt-BR');
</script>
<template>
  <RevenueChart
    title="Vendas por consultor — até dez maiores valores"
    :rows="
      report.team
        .filter((a) => a.revenue > 0)
        .slice(0, 10)
        .map((a) => ({ name: a.name, value: a.revenue }))
    "
  />
  <section class="rural-panel">
    <h2>Metas do mês {{ report.goals.month.slice(0, 7) }}</h2>
    <p>
      Recebido no mês completo: {{ money(report.goals.company_sales) }}. Meta da empresa:
      {{ goal ? money(goal.amount) : 'Não definida'
      }}{{
        goal?.amount > 0
          ? ' • ' + num((report.goals.company_sales / goal.amount) * 100) + '% atingida'
          : ''
      }}.
    </p>
    <p>As metas usam o mês da data inicial do painel, independentemente do intervalo escolhido.</p>
    <CommandForm
      :key="version"
      :fields="[
        select('agent_id', 'Meta para', [['', 'Empresa'], ...options]),
        number('amount', 'Valor da meta (R$)', '', { required: true, max: 1000000000000 }),
      ]"
      :busy="busy"
      label="Salvar meta"
      @submit="emit('command', 'goal', $event)"
    />
  </section>
  <section class="rural-panel">
    <h2>Desempenho da equipe</h2>
    <p>
      Vendas e comissões ficam com o consultor no aceite. A conversão é atribuída a quem enviou a
      primeira proposta; a primeira resposta considera horas corridas e somente solicitações
      respondidas.
    </p>
    <div class="manager-table" role="region" aria-label="Comparação dos consultores" tabindex="0">
      <table>
        <thead>
          <tr>
            <th>Consultor</th>
            <th>Carteira</th>
            <th>Abertas</th>
            <th>Vendas recebidas</th>
            <th>Conversão</th>
            <th>Primeira resposta</th>
            <th>Meta mensal</th>
            <th v-if="report.finance">Comissão</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in report.team" :key="a.id">
            <th scope="row">{{ a.name }}{{ a.active ? '' : ' • Inativo' }}</th>
            <td>{{ a.customers }}</td>
            <td>{{ a.open_requests }}</td>
            <td>{{ money(a.revenue) }}</td>
            <td>
              {{ a.quoted ? num((a.converted / a.quoted) * 100) + '%' : '—' }} ({{ a.converted }}/{{
                a.quoted
              }})
            </td>
            <td>{{ a.response_hours === null ? '—' : num(a.response_hours) + ' h' }}</td>
            <td>
              {{ a.goal === null ? 'Não definida' : money(a.goal) }}<br />{{
                money(a.month_sales)
              }}
              recebido
            </td>
            <td v-if="report.finance">{{ amount(a.commission) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <section v-if="report.owner" class="rural-panel">
    <h2>Permissões e limites</h2>
    <CommandForm
      :key="'settings' + version"
      :fields="[
        number('discount_limit', 'Desconto sem aprovação (%)', report.settings.discount_limit, {
          required: true,
          max: 100,
        }),
        number(
          'stale_hours',
          'Atenção após quantas horas sem movimentação?',
          report.settings.stale_hours,
          { required: true, min: 1, max: 720, step: 1 },
        ),
      ]"
      :busy="busy"
      label="Salvar limites"
      @submit="emit('command', 'settings', $event)"
    />
    <p>O limite considera o campo Desconto da proposta. Dono e gestores podem aprovar descontos.</p>
    <CommandForm
      v-if="report.team.some((a) => a.role !== 'owner' && a.active)"
      :key="'grant' + version"
      :fields="[
        select(
          'agent_id',
          'Representante para alterar acesso',
          report.team
            .filter((a) => a.role !== 'owner' && a.active)
            .map((a) => [a.id, a.name + ' • ' + (a.role === 'manager' ? 'Gestor' : 'Consultor')]),
          report.team.find((a) => a.role !== 'owner' && a.active)?.id,
        ),
        select(
          'role',
          'Papel',
          [
            ['representative', 'Consultor'],
            ['manager', 'Gestor'],
          ],
          'representative',
        ),
        select(
          'finance',
          'Pode consultar custos e comissões?',
          [
            ['false', 'Não'],
            ['true', 'Sim'],
          ],
          'false',
        ),
      ]"
      :busy="busy"
      label="Salvar permissões"
      @submit="emit('command', 'grant', $event)"
    />
    <p v-else>Convide representantes pelo cadastro da empresa para delegar acesso de gestor.</p>
  </section>
  <details class="rural-panel">
    <summary>Histórico gerencial recente</summary>
    <p>Últimas 50 ações.</p>
    <p v-for="(a, i) in report.audit" :key="a.id || i">
      {{ when(a.created_at) }} • {{ a.actor }} • {{ auditLabels[a.action] || 'Atualização'
      }}{{ a.details.reason ? ' • ' + a.details.reason : '' }}
    </p>
  </details>
</template>
