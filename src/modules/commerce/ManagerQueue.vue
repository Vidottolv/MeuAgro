<script setup>
import { computed } from 'vue';
import { money } from '../../services/tradeService.js';
import { when, field, select } from './tradeModel';
import { states } from './managementModel';
import CommandForm from './CommandForm.vue';
import QuoteCard from './QuoteCard.vue';
const props = defineProps({
  report: Object,
  wallet: Object,
  filter: Object,
  url: Function,
  offset: Number,
  walletOffset: Number,
  walletSearch: String,
  busy: Boolean,
  version: Number,
});
const emit = defineEmits(['command', 'navigate']);
const options = computed(() =>
  props.report.team.filter((a) => a.active).map((a) => [a.id, a.name]),
);
</script>
<template>
  <section class="rural-panel" id="manager-queue">
    <h2>Fila de negociações</h2>
    <CommandForm
      :fields="[
        select(
          'agent',
          'Consultor',
          [['', 'Todos'], ...report.team.map((a) => [a.id, a.name])],
          filter.agent,
        ),
        select(
          'product',
          'Produto',
          [['', 'Todos'], ...report.catalog.map((p) => [p.id, p.name])],
          filter.product,
        ),
        field('buyer', 'Produtor', filter.buyer),
        select('state', 'Situação', Object.entries(states), filter.state),
      ]"
      label="Filtrar negociações"
      @submit="emit('navigate', url({ ...$event, offset: 0 }) + '#manager-queue')"
    />
    <p>
      {{ report.queue.count }} negociações. Os filtros desta lista não alteram os indicadores
      gerais. Recebidas usa a data de recebimento; Criadas no período usa a criação; as demais
      mostram a posição atual.
    </p>
    <p v-if="!report.queue.items.length">Nenhuma negociação encontrada.</p>
    <article v-for="q in report.queue.items" :key="q.id" class="rural-card">
      <h3>{{ q.buyer_name }}</h3>
      <p>
        {{ q.agent_name }} • {{ states[q.stage] || q.stage
        }}{{ q.approval_pending ? ' • Desconto em aprovação' : '' }}
      </p>
      <p>
        {{
          q.order_total !== null
            ? money(q.order_total)
            : q.quote_total !== null
              ? money(q.quote_total)
              : 'Sem proposta'
        }}
        • Última movimentação: {{ when(q.last_activity) }}
      </p>
      <p v-if="q.attention" class="manager-attention">{{ q.attention }}</p>
      <p>
        Próxima ação: {{ q.next_action || 'Não definida'
        }}{{ q.due_at ? ' • ' + when(q.due_at) : '' }}
      </p>
      <div class="rural-actions">
        <a
          :href="'/consultor/negociacoes?request=' + encodeURIComponent(q.id)"
          data-link
          class="button button--secondary"
          >Abrir negociação</a
        ><a
          :href="'/consultor/acompanhamento?request=' + encodeURIComponent(q.id)"
          data-link
          class="button button--primary"
          >Acompanhamento interno</a
        >
      </div>
    </article>
    <nav class="rural-actions" aria-label="Páginas das negociações">
      <a
        v-if="offset"
        :href="url({ offset: Math.max(0, offset - 50) }) + '#manager-queue'"
        data-link
        class="button button--secondary"
        >Anterior</a
      ><a
        v-if="offset + 50 < report.queue.count"
        :href="url({ offset: offset + 50 }) + '#manager-queue'"
        data-link
        class="button button--secondary"
        >Próxima</a
      >
    </nav>
  </section>
  <section class="rural-panel">
    <h2>Aprovações de desconto</h2>
    <p>
      {{ report.approvals.length }} pendentes. Aprovar publica a proposta para o produtor. A
      justificativa fica no acompanhamento interno.
    </p>
    <article v-for="a in report.approvals" :key="a.id" class="rural-card">
      <h3>Solicitação {{ a.request_id }}</h3>
      <p>
        Produtos: {{ money(a.summary.subtotal) }} • Desconto: {{ money(a.summary.discount) }} •
        Frete: {{ money(a.summary.freight) }} • Total: {{ money(a.summary.total) }}
      </p>
      <p v-for="i in a.summary.items" :key="i.product_id">
        {{ i.name }} × {{ i.quantity }}: {{ money(i.line_total) }}
      </p>
      <p>
        Validade: {{ when(a.summary.valid_until) }} • Entrega: {{ a.summary.delivery_days }} dias •
        Pagamento: {{ a.summary.payment_terms }}
      </p>
      <p v-if="a.summary.notes" class="manager-note">{{ a.summary.notes }}</p>
      <CommandForm
        :fields="[
          field('reason', 'Justificativa', '', { required: true, minlength: 5, maxlength: 500 }),
          select(
            'decision',
            'Decisão',
            [
              ['approve', 'Aprovar e enviar proposta'],
              ['reject', 'Recusar desconto'],
            ],
            'approve',
          ),
        ]"
        :busy="busy"
        label="Confirmar decisão"
        @submit="emit('command', $event.decision, { approval_id: a.id, reason: $event.reason })"
      />
    </article>
  </section>
  <section class="rural-panel" id="manager-wallet">
    <h2>Carteira de produtores</h2>
    <CommandForm
      :fields="[field('walletSearch', 'Buscar produtor na carteira', walletSearch)]"
      label="Buscar na carteira"
      @submit="emit('navigate', url({ ...$event, walletOffset: 0 }) + '#manager-wallet')"
    />
    <p>
      {{ wallet.count }} produtores. Transferir muda o responsável pela carteira e atendimentos em
      andamento, preservando a atribuição das vendas já aceitas.
    </p>
    <details v-for="c in wallet.items" :key="c.id + '-' + c.agent_id" class="rural-card">
      <summary>{{ c.buyer_name }} • {{ c.agent_name }}</summary>
      <CommandForm
        :fields="[
          select('agent_id', 'Novo responsável', options, c.agent_id),
          field('reason', 'Motivo da transferência', '', {
            required: true,
            minlength: 5,
            maxlength: 500,
          }),
        ]"
        :busy="busy"
        label="Transferir carteira"
        @submit="
          emit('command', 'transfer', {
            ...$event,
            connection_id: c.id,
            expected_agent: c.agent_id,
          })
        "
      />
    </details>
    <nav class="rural-actions" aria-label="Páginas da carteira">
      <a
        v-if="walletOffset"
        :href="
          url({ walletSearch, walletOffset: Math.max(0, walletOffset - 50) }) + '#manager-wallet'
        "
        data-link
        class="button button--secondary"
        >Carteira anterior</a
      ><a
        v-if="walletOffset + 50 < wallet.count"
        :href="url({ walletSearch, walletOffset: walletOffset + 50 }) + '#manager-wallet'"
        data-link
        class="button button--secondary"
        >Próxima carteira</a
      >
    </nav>
  </section>
</template>
