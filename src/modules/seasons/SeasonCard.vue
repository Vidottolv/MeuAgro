<script setup lang="ts">
import type { Season } from './seasonTypes';
import { isArchived, periodLabel } from './seasonModel';
import { getSeasonStatusLabel } from '../../constants/seasonStatus.js';
import SeasonArchiveAction from './SeasonArchiveAction.vue';
defineProps<{ item: Season }>();
const emit = defineEmits<{ changed: [] }>();
</script>
<template>
  <article class="rural-card season-vue-card">
    <h3>{{ item.name }}</h3>
    <span class="rural-tag">{{
      isArchived(item) ? 'Arquivada' : getSeasonStatusLabel(item.status)
    }}</span>
    <p>{{ item.property?.name || 'Propriedade não encontrada' }}</p>
    <p>{{ periodLabel(item) }}</p>
    <div class="rural-actions">
      <a
        :href="`/more/seasons/${encodeURIComponent(item.id)}`"
        class="button button--secondary"
        data-link
        >Ver safra</a
      ><SeasonArchiveAction
        v-if="isArchived(item)"
        :id="item.id"
        :archived="true"
        @changed="emit('changed')"
      />
    </div>
  </article>
</template>
