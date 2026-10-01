<script setup>
import { computed } from 'vue';
import { money } from '../../services/tradeService.js';
const props = defineProps({ rows: { type: Array, default: () => [] }, title: String });
const max = computed(() => Math.max(1, ...props.rows.map((r) => Number(r.value))));
</script>
<template>
  <section class="rural-panel">
    <h3>{{ title }}</h3>
    <p v-if="!rows.length">Nenhuma venda recebida neste período.</p>
    <ol v-else class="sales-chart" :aria-label="title">
      <li v-for="(r, i) in rows" :key="r.id || i">
        <div class="sales-chart-label">
          <span>{{ r.name }}</span
          ><strong>{{ money(r.value) }}</strong>
        </div>
        <div class="sales-chart-track" aria-hidden="true">
          <span
            class="sales-chart-bar"
            :style="{ width: Math.max(0, Math.min(100, (Number(r.value) / max) * 100)) + '%' }"
          />
        </div>
      </li>
    </ol>
  </section>
</template>
