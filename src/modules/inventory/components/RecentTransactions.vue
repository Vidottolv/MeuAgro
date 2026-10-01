<script setup lang="ts">
import TransactionCard from './TransactionCard.vue';
import type { InventoryTransaction } from '../detailTypes';
withDefaults(
  defineProps<{
    items: InventoryTransaction[];
    inputId: string;
    lotId?: string;
    limit?: number;
    loading: boolean;
    error: string;
  }>(),
  { limit: 4 },
);
defineEmits<{ retry: [] }>();
</script>
<template>
  <section class="input-detail-section" aria-labelledby="recent-transactions-title">
    <header>
      <div>
        <h3 id="recent-transactions-title">Movimentações recentes</h3>
        <p>Até {{ limit }} registros recentes do histórico.</p>
      </div>
      <a
        :href="`/inventory/${encodeURIComponent(inputId)}/transactions${lotId ? '?lot=' + encodeURIComponent(lotId) : ''}`"
        class="button button--secondary"
        data-link
        >Ver todas as movimentações</a
      >
    </header>
    <p v-if="loading" role="status">Carregando movimentações…</p>
    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button class="button button--secondary" @click="$emit('retry')">
        Tentar carregar movimentações
      </button>
    </div>
    <div v-else-if="items.length" class="input-detail-related-grid">
      <TransactionCard v-for="item in items" :key="item.id" :item="item" />
    </div>
    <p v-else>Nenhuma movimentação registrada.</p>
  </section>
</template>
