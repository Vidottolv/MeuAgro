<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ page: number; total: number; size: number }>();
const emit = defineEmits<{ change: [page: number] }>();
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.size)));
</script>
<template>
  <nav v-if="pages > 1" class="input-detail-actions" aria-label="Paginação">
    <button
      class="button button--secondary"
      :disabled="page <= 1"
      @click="emit('change', page - 1)"
    >
      Anterior</button
    ><span role="status">Página {{ page }} de {{ pages }}</span
    ><button
      class="button button--secondary"
      :disabled="page >= pages"
      @click="emit('change', page + 1)"
    >
      Próxima
    </button>
  </nav>
</template>
