<script setup lang="ts">
import {
  formatCurrencyBRL,
  formatDatePtBr,
  formatDateTimePtBr,
  formatNumberPtBr,
} from '../../../js/html.js';
import {
  getInventoryTransactionSign,
  getInventoryTransactionTypeLabel,
} from '../../../constants/inventoryTransactionTypes.js';
import type { InventoryTransaction } from '../detailTypes';
defineProps<{ item: InventoryTransaction }>();
</script>
<template>
  <article class="input-detail-related-card transaction-vue-card">
    <h4>{{ getInventoryTransactionTypeLabel(item.transaction_type) }}</h4>
    <strong
      >{{ getInventoryTransactionSign(item.transaction_type) > 0 ? '+' : '-'
      }}{{ formatNumberPtBr(item.quantity) }} {{ item.unit }}</strong
    >
    <p>
      {{ item.agricultural_input?.name || 'Insumo' }} •
      {{
        item.inventory_lot
          ? item.inventory_lot.batch_number
            ? `Lote ${item.inventory_lot.batch_number}`
            : `Compra ${formatDatePtBr(item.inventory_lot.purchase_date)}`
          : 'Sem lote'
      }}
    </p>
    <p>{{ formatDateTimePtBr(item.occurred_at) }}</p>
    <p v-if="item.total_cost != null">{{ formatCurrencyBRL(item.total_cost) }}</p>
    <a
      :href="`/inventory/transactions/${encodeURIComponent(item.id)}`"
      class="button button--secondary"
      data-link
      >Abrir movimentação</a
    >
  </article>
</template>
