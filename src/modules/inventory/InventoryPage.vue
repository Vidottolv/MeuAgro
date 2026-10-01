<script setup lang="ts">
import InventoryCard from './components/InventoryCard.vue';
import InventoryFilters from './components/InventoryFilters.vue';
import { useInventory } from './useInventory';

const { query, activity, stock, loading, error, filtered, summary, reload, clearFilters } =
  useInventory();
</script>

<template>
  <div class="inventory-vue">
    <header class="inventory-vue-heading">
      <div>
        <p class="section-eyebrow">Barracão</p>
        <h2>Meu estoque</h2>
        <p>Consulte seus insumos e acompanhe o que precisa de reposição.</p>
      </div>
      <a href="/inventory/new" class="button button--primary" data-link>Novo insumo</a>
    </header>
    <section
      v-if="!loading && !error"
      class="inventory-vue-summary"
      aria-label="Resumo dos insumos ativos"
    >
      <article>
        <span>Insumos ativos</span><strong>{{ summary.active }}</strong>
      </article>
      <article>
        <span>Estoque baixo</span><strong>{{ summary.low }}</strong>
      </article>
      <article>
        <span>Sem estoque</span><strong>{{ summary.empty }}</strong>
      </article>
    </section>
    <p class="inventory-vue-note">
      O resumo considera todos os insumos ativos. Os saldos são calculados pelas movimentações do
      estoque.
    </p>
    <nav class="inventory-vue-actions" aria-label="Ações do estoque">
      <a href="/inventory/transactions" class="button button--secondary" data-link
        >Histórico de movimentações</a
      >
      <a href="/inventory/transactions/new" class="button button--secondary" data-link
        >Nova movimentação</a
      >
      <button class="button button--secondary" type="button" :disabled="loading" @click="reload">
        Atualizar estoque
      </button>
    </nav>
    <InventoryFilters v-model:query="query" v-model:activity="activity" v-model:stock="stock" />
    <p v-if="loading" role="status">Carregando estoque…</p>
    <section v-else-if="error" role="alert" class="inventory-vue-empty">
      <h3>Estoque indisponível</h3>
      <p>{{ error }}</p>
      <button class="button button--primary" type="button" @click="reload">Tentar novamente</button>
    </section>
    <template v-else>
      <p role="status">{{ filtered.length }} insumo(s) encontrado(s)</p>
      <section v-if="filtered.length" class="inventory-vue-grid" aria-label="Insumos encontrados">
        <InventoryCard v-for="item in filtered" :key="item.id" :item="item" />
      </section>
      <section v-else class="inventory-vue-empty">
        <h3>Nenhum insumo encontrado</h3>
        <p>Confira os filtros ou cadastre seu primeiro insumo.</p>
        <button class="button button--secondary" type="button" @click="clearFilters">
          Limpar filtros</button
        ><a href="/inventory/new" class="button button--primary" data-link>Cadastrar insumo</a>
      </section>
    </template>
  </div>
</template>

<style scoped>
.inventory-vue :deep(.button) {
  transition:
    transform 120ms ease,
    opacity 120ms ease;
}
.inventory-vue :deep(.button--secondary) {
  color: var(--color-text);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
}
.inventory-vue :deep(.button[aria-pressed='true']) {
  border: 2px solid var(--color-primary-700);
  background: var(--color-primary-050);
}
.inventory-vue {
  display: grid;
  gap: 20px;
  color: var(--color-text);
}
.inventory-vue-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
h2 {
  margin: 4px 0 10px;
}
p {
  color: var(--color-text-soft);
  margin: 0;
}
.inventory-vue-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.inventory-vue-summary article {
  padding: 18px;
  display: grid;
  gap: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}
.inventory-vue-summary span {
  color: var(--color-text-soft);
}
.inventory-vue-summary strong {
  font-size: 1.8rem;
}
.inventory-vue-note {
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text);
}
.inventory-vue-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.inventory-vue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 16px;
}
.inventory-vue-empty {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px;
}
.inventory-vue-empty h3,
.inventory-vue-empty p {
  width: 100%;
}
footer {
  padding-top: 8px;
}
@media (max-width: 520px) {
  .inventory-vue-summary {
    grid-template-columns: 1fr;
  }
}
</style>
