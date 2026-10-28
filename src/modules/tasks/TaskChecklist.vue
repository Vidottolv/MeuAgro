<script setup>
import { computed, ref, onScopeDispose, watch } from 'vue';
import { taskRpc } from '../../services/technicalTaskService.js';
import { checklistProgress } from './taskCollaboration.js';
import { taskOpen } from './taskModel.js';
const props = defineProps({ task: { type: Object, required: true }, disabled: Boolean });
const emit = defineEmits(['changed']);
const progress = computed(() => checklistProgress(props.task.checklist || []));
const busy = ref(false),
  error = ref('');
let version = 0,
  disposed = false,
  retry = null;
watch(
  () => props.task.id,
  () => {
    ++version;
    busy.value = false;
    error.value = '';
  },
);
onScopeDispose(() => {
  disposed = true;
  ++version;
});
async function toggle(item) {
  if (busy.value || props.disabled || !taskOpen(props.task)) return;
  const data = {
    id: props.task.id,
    version: props.task.version,
    item_id: item.id,
    done: !item.done,
  };
  const key = JSON.stringify(data);
  if (retry?.key !== key) retry = { key, id: crypto.randomUUID() };
  const token = version;
  busy.value = true;
  error.value = '';
  try {
    await taskRpc('technical_task_command', {
      p_operation: retry.id,
      p_action: 'check',
      p_data: data,
    });
    if (!disposed && token === version) {
      retry = null;
      emit('changed');
    }
  } catch (e) {
    if (!disposed && token === version) error.value = e.message;
  } finally {
    if (token === version) busy.value = false;
  }
}
</script>
<template>
  <section v-if="progress.total" class="task-checklist">
    <h5>Checklist: {{ progress.done }} de {{ progress.total }} concluído(s)</h5>
    <progress
      :value="progress.done"
      :max="progress.total"
      :aria-label="`Checklist: ${progress.done} de ${progress.total}`"
    />
    <ul>
      <li v-for="item in task.checklist" :key="item.id">
        <label
          ><input
            type="checkbox"
            :checked="item.done"
            :disabled="busy || disabled || !taskOpen(task)"
            @change="
              $event.target.checked = item.done;
              toggle(item);
            "
          /><span>{{ item.label }}</span></label
        >
      </li>
    </ul>
    <p v-if="!taskOpen(task)">Reabra a tarefa para alterar os itens.</p>
    <p v-if="busy" role="status">Salvando item…</p>
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
</template>
<style scoped>
ul {
  list-style: none;
  padding: 0;
}
li {
  margin: 0.6rem 0;
}
label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow-wrap: anywhere;
}
input[type='checkbox'] {
  width: 1.25rem;
  min-width: 1.25rem;
  height: 1.25rem;
  min-height: 1.25rem;
  margin: 0;
}
progress {
  width: 100%;
  accent-color: var(--color-primary, #205c3c);
}
</style>
