<script setup lang="ts">
import type { ActivityFilter, StockStatus } from '../types';
const query = defineModel<string>('query', { required: true });
const activity = defineModel<ActivityFilter>('activity', { required: true });
const stock = defineModel<StockStatus | 'all'>('stock', { required: true });
const options: { value: ActivityFilter; label: string }[] = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'all', label: 'Todos' },
];
</script>

<template>
  <section class="inventory-vue-filters" aria-label="Filtros do estoque">
    <label class="inventory-vue-search"
      >Buscar insumos
      <input
        v-model="query"
        type="search"
        placeholder="Nome, marca ou categoria"
        autocomplete="off"
      />
    </label>
    <label
      >Estoque
      <select v-model="stock" aria-label="Estoque">
        <option value="all">Todas as situações</option>
        <option value="low_stock">Estoque baixo</option>
        <option value="out_of_stock">Sem estoque</option>
        <option value="normal">Estoque normal</option>
      </select>
    </label>
    <div class="inventory-vue-activity" role="group" aria-label="Situação dos insumos">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="button button--secondary"
        :aria-pressed="activity === option.value"
        @click="activity = option.value"
      >
        {{ option.label }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.inventory-vue-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
}
label {
  display: grid;
  gap: 8px;
  font-weight: 600;
  min-width: 0;
  flex: 1 1 200px;
}
.inventory-vue-search {
  flex-grow: 2;
}
input,
select {
  width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-text);
}
.inventory-vue-activity {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
button {
  min-height: 44px;
}
button[aria-pressed='true'] {
  border: 2px solid var(--color-primary-700);
  background: var(--color-primary-050);
  color: var(--color-text);
}
</style>
