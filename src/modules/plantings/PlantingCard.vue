<script setup lang="ts">
import { computed } from 'vue';
import type { Planting } from './plantingTypes';
import { title, quantityLabel, isArchived } from './plantingModel';
import { getCycleMetrics } from '../../js/cycleMetrics.js';
import { getProductionCycleStatusLabel } from '../../constants/productionCycleStatus.js';
import PlantingArchiveAction from './PlantingArchiveAction.vue';
const props = defineProps<{ item: Planting }>();
const emit = defineEmits<{ changed: [] }>();
const metrics = computed(() => getCycleMetrics(props.item));
</script>
<template>
  <article class="rural-card planting-vue-card">
    <h3>{{ title(item) }}</h3>
    <span class="rural-tag">{{
      isArchived(item) ? 'Arquivado' : getProductionCycleStatusLabel(item.status)
    }}</span>
    <p>
      {{
        [item.property?.name, item.area?.name].filter(Boolean).join(' • ') || 'Local não informado'
      }}
    </p>
    <p>{{ item.season?.name || 'Sem safra vinculada' }}</p>
    <p>{{ quantityLabel(item) }}</p>
    <p>{{ metrics.plantingText }}</p>
    <p>{{ metrics.forecastText }}</p>
    <div class="rural-actions">
      <a
        :href="`/plantings/${encodeURIComponent(item.id)}`"
        class="button button--secondary"
        data-link
        >Ver plantio</a
      ><PlantingArchiveAction
        v-if="isArchived(item)"
        :id="item.id"
        :archived="true"
        @changed="emit('changed')"
      />
    </div>
  </article>
</template>
