<script setup>
import { computed } from 'vue';
import { money, requestStates, eventLabels } from '../../services/tradeService.js';
import {
  when,
  packaging,
  deliveryStates,
  terminal,
  stockUnit,
  field,
  text,
  select,
  number,
} from './tradeModel';
import CommandForm from './CommandForm.vue';
import QuoteCard from './QuoteCard.vue';
const props = defineProps({
  state: Object,
  requestId: String,
  uid: String,
  commercial: Boolean,
  busy: Boolean,
  versions: Object,
});
const emit = defineEmits(['command', 'refresh']);
const r = computed(() => props.state.trade_requests.find((x) => x.id === props.requestId)),
  connection = computed(() =>
    props.state.trade_connections.find((c) => c.id === r.value?.connection_id),
  ),
  buyer = computed(() => connection.value?.buyer_id === props.uid),
  quotes = computed(() =>
    props.state.trade_quotes
      .filter((q) => q.request_id === r.value?.id)
      .sort((a, b) => b.version - a.version),
  ),
  last = computed(() => quotes.value[0]),
  order = computed(() => props.state.trade_orders.find((o) => o.request_id === r.value?.id)),
  messages = computed(() =>
    props.state.trade_messages
      .filter((m) => m.request_id === r.value?.id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id.localeCompare(b.id)),
  ),
  events = computed(() =>
    props.state.trade_events
      .filter((e) => e.request_id === r.value?.id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  );
const sellerName = computed(
  () =>
    props.state.commerce_sellers.find((s) => s.id === connection.value?.seller_id)?.name ||
    'Vendedor',
);
const base = props.commercial ? '/consultor/negociacoes' : '/compras';
const quoteFields = computed(() => {
  const valid = new Date(Date.now() + 7 * 86400000),
    local = new Date(valid.getTime() - valid.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  return [
    ...(r.value?.items || []).map((i) =>
      number(
        'price_' + i.product_id,
        'Preço de ' + i.name + ' (' + packaging(i) + ')',
        last.value?.items.find((x) => x.product_id === i.product_id)?.unit_price ??
          props.state.trade_products.find((x) => x.id === i.product_id)?.reference_price ??
          '',
        { required: true },
      ),
    ),
    number('discount', 'Desconto total (R$)', last.value?.discount ?? 0),
    number('freight', 'Frete (R$)', last.value?.freight ?? 0),
    field('valid_until', 'Validade da proposta', local, { type: 'datetime-local', required: true }),
    number(
      'delivery_days',
      'Prazo de entrega após confirmação (dias)',
      last.value?.delivery_days ?? 3,
      { required: true, max: 365, step: 1 },
    ),
    field('payment_terms', 'Condições de pagamento', last.value?.payment_terms || '', {
      required: true,
      maxlength: 500,
    }),
    text('message', 'Observações do orçamento', last.value?.notes || ''),
  ];
});
const receiptFields = computed(() =>
  (order.value?.quote_snapshot.items || []).map((i) => {
    const inputs = props.state.agricultural_inputs.filter(
      (x) => x.active && !x.deleted_at && x.base_unit === stockUnit(i.base_unit),
    );
    const linked = props.state.trade_inventory_links.find(
      (l) => l.product_id === i.product_id,
    )?.agricultural_input_id;
    return select(
      'input_' + i.product_id,
      'Destino de ' +
        i.name +
        ' (' +
        (Number(i.quantity) * Number(i.package_size)).toLocaleString('pt-BR') +
        ' ' +
        i.base_unit +
        ')',
      [['', 'Vincular automaticamente'], ...inputs.map((x) => [x.id, x.name])],
      inputs.some((x) => x.id === linked) ? linked : '',
    );
  }),
);
const send = (action, data = {}) => emit('command', action, { ...data, request_id: r.value.id });
</script>
<template>
  <a :href="base" data-link class="button button--secondary">Voltar às negociações</a>
  <p v-if="!r">Solicitação indisponível. Atualize a página ou verifique seu acesso.</p>
  <template v-else
    ><section class="rural-panel">
      <span class="commerce-badge">{{ requestStates[r.state] }}</span>
      <h2>{{ sellerName }}</h2>
      <p>Solicitação {{ r.id.slice(0, 8) }} • {{ when(r.created_at) }}</p>
      <p>Produtor: {{ connection?.buyer_name || 'Produtor' }}</p>
      <p>Destino: {{ r.delivery_address }} {{ r.property_name }}</p>
      <p v-if="r.desired_date">
        Data desejada: {{ r.desired_date.split('-').reverse().join('/') }}
      </p>
      <p>{{ r.notes }}</p>
      <article v-for="i in r.items" :key="i.product_id" class="rural-card">
        <strong>{{ i.name }}</strong>
        <p>{{ packaging(i) }} × {{ Number(i.quantity).toLocaleString('pt-BR') }} embalagens</p>
      </article>
    </section>
    <a
      v-if="!buyer"
      :href="'/consultor/acompanhamento?request=' + encodeURIComponent(r.id)"
      data-link
      class="button button--secondary"
      >Acompanhamento interno</a
    ><template v-if="!terminal.includes(r.state)"
      ><section
        v-if="!buyer && ['awaiting', 'revision_requested'].includes(r.state)"
        class="rural-panel"
      >
        <h3>Enviar {{ last ? 'nova versão do' : 'o' }} orçamento</h3>
        <p>Os valores são por embalagem. Cada proposta fica registrada no histórico.</p>
        <CommandForm
          :key="(last?.id || 'new') + '-' + (versions.send_quote || 0)"
          :fields="quoteFields"
          :busy="busy"
          label="Enviar orçamento"
          @submit="send('send_quote', $event)"
        />
      </section>
      <section v-if="buyer && r.state === 'quoted' && last" class="rural-panel">
        <h3>Responder à proposta</h3>
        <p v-if="new Date(last.valid_until) <= new Date()">
          A validade terminou. Solicite uma nova versão se desejar continuar.
        </p>
        <CommandForm
          :key="last.id + 'revision'"
          :fields="[text('message', 'Motivo da revisão')]"
          :busy="busy"
          label="Pedir revisão"
          @submit="send('request_revision', { ...$event, quote_id: last.id })"
        /><CommandForm
          :key="last.id + 'decline'"
          :fields="[text('message', 'Motivo da recusa')]"
          :busy="busy"
          label="Recusar proposta"
          @submit="send('decline_quote', { ...$event, quote_id: last.id })"
        /><template v-if="new Date(last.valid_until) > new Date()"
          ><p>
            Ao aceitar, você confirma o pedido de {{ money(last.total) }}. Nenhum pagamento será
            realizado pelo aplicativo.
          </p>
          <button
            class="button button--primary"
            :disabled="busy"
            @click="send('accept_quote', { quote_id: last.id })"
          >
            Aceitar proposta e criar pedido
          </button></template
        >
      </section>
      <section
        v-if="
          (!buyer && ['awaiting', 'revision_requested'].includes(r.state)) ||
          (buyer && r.state === 'awaiting_buyer')
        "
        class="rural-panel"
      >
        <h3>{{ buyer ? 'Responder ao consultor' : 'Pedir esclarecimento' }}</h3>
        <CommandForm
          :fields="[text('message', 'Esclarecimento')]"
          :busy="busy"
          :label="buyer ? 'Enviar resposta' : 'Solicitar esclarecimento'"
          @submit="send(buyer ? 'answer_clarification' : 'ask_clarification', $event)"
        />
      </section>
      <details class="rural-panel">
        <summary>Encerrar solicitação</summary>
        <CommandForm
          :fields="[text('message', 'Motivo do encerramento')]"
          :busy="busy"
          :label="buyer ? 'Cancelar solicitação' : 'Recusar atendimento'"
          @submit="send(buyer ? 'cancel_request' : 'reject_request', $event)"
        /></details
    ></template>
    <section v-if="order" class="rural-panel">
      <h3>Pedido confirmado</h3>
      <strong>{{ deliveryStates[order.state] }}</strong>
      <p>Número do pedido: {{ order.id }}</p>
      <p>Confirmado em {{ when(order.created_at) }} por {{ order.buyer_name }}</p>
      <p>Vendedor: {{ order.seller_name }}</p>
      <p>Total: {{ money(order.total) }}</p>
      <p>Pagamento: {{ order.quote_snapshot.payment_terms }}</p>
      <p>Destino: {{ order.delivery_snapshot.address }}</p>
      <p>Prazo combinado: {{ order.quote_snapshot.delivery_days }} dias após a confirmação.</p>
      <p>O estoque entra no barracão somente após o produtor confirmar o recebimento integral.</p>
    </section>
    <section
      v-if="order && !buyer && ['confirmed', 'delivery_issue'].includes(order.state)"
      class="rural-panel"
    >
      <h3>Informar entrega</h3>
      <p>
        Informe somente após entregar todos os produtos. O produtor deverá confirmar o recebimento.
      </p>
      <CommandForm
        :fields="[text('message', 'Observações da entrega')]"
        :busy="busy"
        label="Informar que entreguei"
        @submit="emit('command', 'mark_delivery', { ...$event, order_id: order.id })"
      />
    </section>
    <section v-if="order && buyer && order.state === 'awaiting_receipt'" class="rural-panel">
      <h3>Conferir recebimento</h3>
      <p>
        Confira todos os itens. Se faltou algo, informe um problema: nenhuma quantidade entrará no
        barracão.
      </p>
      <p>
        A vinculação automática reutiliza um vínculo válido ou cadastra um insumo em Outros. Escolha
        um existente para evitar duplicatas.
      </p>
      <CommandForm
        :key="order.delivery_version"
        :fields="receiptFields"
        :busy="busy"
        label="Confirmar recebimento integral"
        @submit="
          emit('command', 'confirm_receipt', {
            ...$event,
            order_id: order.id,
            delivery_version: order.delivery_version,
          })
        "
      /><CommandForm
        :fields="[text('message', 'Problema encontrado')]"
        :busy="busy"
        label="Informar problema na entrega"
        @submit="
          emit('command', 'report_delivery_issue', {
            ...$event,
            order_id: order.id,
            delivery_version: order.delivery_version,
          })
        "
      />
    </section>
    <section v-if="order?.state === 'delivery_issue'" class="rural-panel">
      <h3>Entrega em ajuste</h3>
      <p>
        Combine a solução na conversa. Nenhuma entrada no barracão foi feita. O consultor deve
        informar a entrega novamente após resolver.
      </p>
    </section>
    <section v-if="order?.state === 'received'" class="rural-panel">
      <h3>Recebimento concluído</h3>
      <p>Confirmado em {{ when(order.received_at) }}.</p>
      <template v-if="buyer"
        ><article
          v-for="i in state.trade_receipt_items.filter((i) => i.order_id === order.id)"
          :key="i.id || i.product_id"
          class="rural-card"
        >
          <p>
            {{ Number(i.quantity).toLocaleString('pt-BR') }} {{ i.unit }} •
            {{ money(i.total_cost) }}
          </p>
          <a
            :href="
              '/inventory/' +
              encodeURIComponent(i.agricultural_input_id) +
              '/lots/' +
              encodeURIComponent(i.inventory_lot_id)
            "
            data-link
            class="button button--secondary"
            >Ver lote no barracão</a
          >
        </article></template
      >
    </section>
    <section class="rural-panel">
      <h3>Conversa da negociação</h3>
      <p>As mensagens ficam registradas e não podem ser editadas.</p>
      <button class="button button--secondary" :disabled="busy" @click="emit('refresh')">
        Atualizar conversa
      </button>
      <div class="trade-messages">
        <p v-if="!messages.length">Nenhuma mensagem nesta conversa.</p>
        <article
          v-for="m in messages"
          :key="m.id"
          class="trade-message"
          :class="{ 'trade-message--own': m.sender_id === uid }"
        >
          <strong>{{
            m.sender_id === uid
              ? 'Você'
              : m.sender_role === 'buyer'
                ? 'Produtor'
                : 'Equipe do vendedor'
          }}</strong
          ><time>{{ when(m.created_at) }}</time>
          <p>{{ m.body }}</p>
        </article>
      </div>
      <CommandForm
        v-if="!['declined', 'cancelled', 'rejected'].includes(r.state) && connection?.active"
        :key="versions.send_message || 0"
        :fields="[text('message', 'Sua mensagem')]"
        :busy="busy"
        label="Enviar mensagem"
        @submit="send('send_message', $event)"
      />
      <p v-else>Conversa encerrada. O histórico permanece disponível.</p>
    </section>
    <h3>Histórico de orçamentos</h3>
    <p v-if="!quotes.length">Nenhum orçamento enviado.</p>
    <QuoteCard v-for="q in quotes" :key="q.id" :quote="q" />
    <section class="rural-panel">
      <h3>Atividades da negociação</h3>
      <article v-for="e in events" :key="e.id" class="rural-card">
        <strong>{{ eventLabels[e.action] || 'Atualização' }}</strong>
        <p>{{ when(e.created_at) }}</p>
        <p>{{ e.message }}</p>
      </article>
    </section></template
  >
</template>
