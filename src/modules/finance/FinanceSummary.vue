<script setup lang="ts">
import { money } from '../harvests/harvestModel';
defineProps<{ summary: { input_cost: number; sales_revenue: number; estimated_result: number } }>();
</script>
<template>
  <div class="rural-grid">
    <article class="rural-card">
      <h3>Custos de insumos</h3>
      <strong>{{ money(summary.input_cost) }}</strong>
    </article>
    <article class="rural-card">
      <h3>Receita de vendas</h3>
      <strong>{{ money(summary.sales_revenue) }}</strong>
    </article>
    <article class="rural-card">
      <h3>Resultado estimado</h3>
      <strong>{{ money(summary.estimated_result) }}</strong>
    </article>
  </div>
</template>
