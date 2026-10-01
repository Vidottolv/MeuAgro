<script setup lang="ts">
import { getInputCategoryLabel } from '../../../constants/inputCategories.js';
import type { AgriculturalInput } from '../types';

defineProps<{ item: AgriculturalInput }>();
const statusLabels = {
  normal: 'Estoque normal',
  low_stock: 'Estoque baixo',
  out_of_stock: 'Sem estoque',
};
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
</script>

<template>
  <article class="inventory-vue-card">
    <div>
      <p class="inventory-vue-category">{{ getInputCategoryLabel(item.category) }}</p>
      <h3>{{ item.name }}</h3>
      <p>{{ item.brand || 'Marca não informada' }}</p>
    </div>
    <p class="inventory-vue-quantity">
      {{ number.format(Number(item.current_quantity)) }} <span>{{ item.base_unit }}</span>
    </p>
    <div class="inventory-vue-badges">
      <span :class="['inventory-vue-status', `inventory-vue-status--${item.stock_status}`]">{{
        statusLabels[item.stock_status] || 'Situação não informada'
      }}</span>
      <span v-if="!item.active">Inativo</span>
    </div>
    <a
      :href="`/inventory/${encodeURIComponent(item.id)}`"
      class="button button--secondary"
      data-link
      :aria-label="`Ver detalhes de ${item.name}`"
      >Ver detalhes</a
    >
  </article>
</template>

<style scoped>
.inventory-vue-card {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  min-width: 0;
}
h3 {
  margin: 4px 0 8px;
  overflow-wrap: anywhere;
  color: var(--color-text);
}
p {
  margin: 0;
  color: var(--color-text-soft);
  overflow-wrap: anywhere;
}
.inventory-vue-category {
  font-size: 0.8rem;
  font-weight: 700;
}
.inventory-vue-quantity {
  color: var(--color-text);
  font-size: 1.7rem;
  font-weight: 700;
}
.inventory-vue-quantity span {
  font-size: 0.9rem;
}
.inventory-vue-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
}
.inventory-vue-status {
  padding: 6px 10px;
  border-radius: 8px;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
.inventory-vue-status--low_stock {
  border-left: 4px solid #c39122;
}
.inventory-vue-status--out_of_stock {
  border-left: 4px solid #cf635b;
}
.inventory-vue-status--normal {
  border-left: 4px solid #479a68;
}
a {
  align-self: end;
  min-height: 44px;
}
</style>
