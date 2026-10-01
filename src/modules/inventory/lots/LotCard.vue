<script setup lang="ts">
import type { LotDetail } from './lotModel';
import { lotStatus } from '../detailModel';
import { formatDatePtBr, formatCurrencyBRL, formatNumberPtBr } from '../../../js/html.js';
defineProps<{ lot: LotDetail; inputId: string }>();
</script>
<template>
  <article class="input-detail-related-card">
    <h3>
      {{
        lot.batch_number
          ? `Lote ${lot.batch_number}`
          : `Compra de ${formatDatePtBr(lot.purchase_date)}`
      }}
    </h3>
    <p>{{ lot.supplier || 'Fornecedor não informado' }}</p>
    <span class="lot-vue-status">{{ lotStatus(lot) }}</span>
    <strong>Saldo: {{ formatNumberPtBr(lot.current_quantity) }} {{ lot.unit }}</strong>
    <p>Comprado: {{ formatNumberPtBr(lot.purchased_quantity) }} {{ lot.unit }}</p>
    <p>Preço total: {{ formatCurrencyBRL(lot.total_price) }}</p>
    <p>Compra: {{ formatDatePtBr(lot.purchase_date) }}</p>
    <p>Validade: {{ formatDatePtBr(lot.expiration_date) }}</p>
    <a
      :href="`/inventory/${encodeURIComponent(inputId)}/lots/${encodeURIComponent(lot.id)}`"
      class="button button--secondary"
      data-link
      >Abrir lote</a
    >
  </article>
</template>
