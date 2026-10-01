<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
defineProps<{ title: string }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
onMounted(() => dialog.value?.showModal());
onBeforeUnmount(() => dialog.value?.close());
</script>
<template>
  <dialog
    ref="dialog"
    class="inventory-dialog"
    aria-labelledby="inventory-dialog-title"
    @close="emit('close')"
  >
    <h2 id="inventory-dialog-title">{{ title }}</h2>
    <slot />
  </dialog>
</template>
