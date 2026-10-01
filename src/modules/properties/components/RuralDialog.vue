<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, useId } from 'vue';
const props = defineProps<{ title: string; busy?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement | null>(null),
  titleId = useId();
onMounted(() => dialog.value?.showModal());
onBeforeUnmount(() => dialog.value?.close());
function cancel(event: Event) {
  if (props.busy) event.preventDefault();
}
</script>
<template>
  <dialog
    ref="dialog"
    class="rural-dialog"
    :aria-labelledby="titleId"
    @cancel="cancel"
    @close="emit('close')"
  >
    <h2 :id="titleId">{{ title }}</h2>
    <slot />
  </dialog>
</template>
