<script setup lang="ts">
import type { Property } from '../ruralTypes';
import { isArchived, propertyLocation, sizeLabel } from '../ruralModel';
import RecordStatusAction from './RecordStatusAction.vue';
defineProps<{ item: Property }>();
defineEmits<{ changed: [] }>();
</script>
<template>
  <article class="rural-card property-vue-card">
    <h3>{{ item.name }}</h3>
    <span class="rural-tag">{{ isArchived(item) ? 'Arquivada' : 'Ativa' }}</span>
    <p>{{ propertyLocation(item) }}</p>
    <p>Área total: {{ sizeLabel(item.total_area, item.area_unit, true) }}</p>
    <p v-if="item.description">{{ item.description }}</p>
    <div class="rural-actions">
      <a
        :href="`/properties/${encodeURIComponent(item.id)}`"
        class="button button--secondary"
        data-link
        >Ver propriedade</a
      ><RecordStatusAction
        v-if="isArchived(item)"
        kind="property"
        :id="item.id"
        archived
        @changed="$emit('changed')"
      />
    </div>
  </article>
</template>
