<script setup lang="ts">
withDefaults(
  defineProps<{ loading: boolean; error: string; label?: string; retryLabel?: string }>(),
  { label: 'Carregando…', retryLabel: 'Tentar novamente' },
);
defineEmits<{ retry: [] }>();
</script>
<template>
  <p v-if="loading" role="status">{{ label }}</p>
  <div v-else-if="error" role="alert">
    <p>{{ error }}</p>
    <button class="button button--secondary" @click="$emit('retry')">{{ retryLabel }}</button>
  </div>
  <slot v-else />
</template>
