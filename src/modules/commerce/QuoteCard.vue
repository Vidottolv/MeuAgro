<script setup>
import { money } from '../../services/tradeService.js';
import { when, packaging } from './tradeModel';
defineProps({ quote: { type: Object, required: true } });
</script>
<template>
  <details class="rural-card trade-quote" open>
    <summary>
      <strong>Versão {{ quote.version }} • {{ money(quote.total) }}</strong> —
      {{
        quote.status === 'accepted'
          ? 'Aceita'
          : quote.status === 'superseded'
            ? 'Substituída'
            : quote.status === 'declined'
              ? 'Recusada'
              : new Date(quote.valid_until) <= new Date()
                ? 'Validade encerrada'
                : 'Enviada'
      }}
    </summary>
    <p>{{ quote.seller_name }} • {{ when(quote.created_at) }}</p>
    <article v-for="i in quote.items" :key="i.product_id" class="rural-card">
      <strong>{{ i.name }}</strong>
      <p>{{ packaging(i) }} × {{ Number(i.quantity).toLocaleString('pt-BR') }}</p>
      <p>{{ money(i.unit_price) }} por embalagem • {{ money(i.line_total) }}</p>
    </article>
    <dl>
      <dt>Produtos</dt>
      <dd>{{ money(quote.subtotal) }}</dd>
      <dt>Desconto</dt>
      <dd>{{ money(quote.discount) }}</dd>
      <dt>Frete</dt>
      <dd>{{ money(quote.freight) }}</dd>
      <dt>Total</dt>
      <dd>{{ money(quote.total) }}</dd>
    </dl>
    <p>
      Válida até {{ when(quote.valid_until) }}. Entrega estimada: {{ quote.delivery_days }} dias
      após confirmação.
    </p>
    <p>Pagamento: {{ quote.payment_terms }}</p>
    <p v-if="quote.notes">Observações: {{ quote.notes }}</p>
  </details>
</template>
