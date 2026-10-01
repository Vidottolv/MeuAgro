<script setup lang="ts">
import type { Area } from '../ruralTypes';
import { isArchived, sizeLabel } from '../ruralModel';
import RecordStatusAction from './RecordStatusAction.vue';
defineProps<{ item: Area }>();
defineEmits<{ changed: [] }>();
</script>
<template>
  <article class="rural-card area-vue-card">
    <h3>{{ item.name }}</h3>
    <span class="rural-tag">{{ isArchived(item) ? 'Arquivada' : 'Ativa' }}</span>
    <p>{{ item.area_type?.name || 'Sem tipo' }}</p>
    <p>{{ sizeLabel(item.size, item.unit) }}</p>
    <p v-if="item.location_description">{{ item.location_description }}</p>
    <div class="rural-actions">
      <a
        :href="`/properties/${encodeURIComponent(item.property_id)}/areas/${encodeURIComponent(item.id)}`"
        class="button button--secondary"
        data-link
        >Ver área</a
      ><RecordStatusAction
        v-if="isArchived(item)"
        kind="area"
        :id="item.id"
        archived
        @changed="$emit('changed')"
      />
    </div>
  </article>
</template>
