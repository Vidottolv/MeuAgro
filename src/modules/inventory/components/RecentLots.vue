<script setup lang="ts">
import { formatCurrencyBRL, formatDatePtBr, formatNumberPtBr } from '../../../js/html.js';
import { lotStatus } from '../detailModel';
import type { InventoryLot } from '../detailTypes';
defineProps<{
  items: InventoryLot[];
  inputId: string;
  active: boolean;
  loading: boolean;
  error: string;
}>();
defineEmits<{ retry: [] }>();
</script>
<template>
  <section class="input-detail-section" aria-labelledby="recent-lots-title">
    <header>
      <div>
        <h3 id="recent-lots-title">Lotes recentes</h3>
        <p>Até 3 compras recentes, com saldo e custo próprios.</p>
      </div>
      <a
        :href="`/inventory/${encodeURIComponent(inputId)}/lots`"
        class="button button--secondary"
        data-link
        >Ver todos os lotes</a
      >
    </header>
    <p v-if="loading" role="status">Carregando lotes…</p>
    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button class="button button--secondary" @click="$emit('retry')">
        Tentar carregar lotes
      </button>
    </div>
    <div v-else-if="items.length" class="input-detail-related-grid">
      <article v-for="lot in items" :key="lot.id" class="input-detail-related-card">
        <h4>
          {{
            lot.batch_number
              ? `Lote ${lot.batch_number}`
              : `Compra de ${formatDatePtBr(lot.purchase_date)}`
          }}
        </h4>
        <p>{{ lot.supplier || 'Fornecedor não informado' }}</p>
        <p>
          {{ lotStatus(lot) }} • {{ formatNumberPtBr(lot.current_quantity ?? 0) }} {{ lot.unit }}
        </p>
        <p>
          Compra: {{ formatNumberPtBr(lot.purchased_quantity) }} {{ lot.unit }} •
          {{ formatCurrencyBRL(lot.total_price) }}
        </p>
        <p>{{ formatDatePtBr(lot.purchase_date) }}</p>
        <a
          :href="`/inventory/${encodeURIComponent(inputId)}/lots/${encodeURIComponent(lot.id)}`"
          class="button button--secondary"
          data-link
          :aria-label="`Abrir lote ${lot.batch_number || formatDatePtBr(lot.purchase_date)}`"
          >Abrir lote</a
        >
      </article>
    </div>
    <div v-else>
      <p>Nenhum lote cadastrado.</p>
      <a
        v-if="active"
        :href="`/inventory/${encodeURIComponent(inputId)}/lots/new`"
        class="button button--primary"
        data-link
        >Cadastrar lote</a
      >
    </div>
  </section>
</template>
