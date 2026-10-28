<script setup>
import { ref, onScopeDispose, watch } from 'vue';
import { taskRpc } from '../../services/technicalTaskService.js';
const props = defineProps({ taskId: String });
const opened = ref(false),
  items = ref([]),
  body = ref(''),
  busy = ref(false),
  error = ref('');
let version = 0,
  disposed = false,
  retry = null;
function clear() {
  ++version;
  opened.value = false;
  items.value = [];
  body.value = '';
  busy.value = false;
  error.value = '';
  retry = null;
}
watch(() => props.taskId, clear);
onScopeDispose(() => {
  disposed = true;
  clear();
});
async function load() {
  const token = version;
  busy.value = true;
  error.value = '';
  try {
    const result = await taskRpc('technical_task_comment_list', { p_id: props.taskId });
    if (!disposed && token === version) items.value = result;
  } catch (e) {
    if (!disposed && token === version) {
      items.value = [];
      error.value = e.message;
    }
  } finally {
    if (token === version) busy.value = false;
  }
}
async function open() {
  opened.value = true;
  await load();
}
async function save() {
  const text = body.value.trim();
  if (busy.value || !text || text.length > 2000) return;
  const data = { id: props.taskId, body: text },
    key = JSON.stringify(data);
  if (retry?.key !== key) retry = { key, id: crypto.randomUUID() };
  const token = version;
  busy.value = true;
  error.value = '';
  try {
    await taskRpc('technical_task_command', {
      p_operation: retry.id,
      p_action: 'comment',
      p_data: data,
    });
    if (!disposed && token === version) {
      body.value = '';
      retry = null;
      await load();
    }
  } catch (e) {
    if (!disposed && token === version) error.value = e.message;
  } finally {
    if (token === version) busy.value = false;
  }
}
</script>
<template>
  <section class="task-comments">
    <button v-if="!opened" type="button" class="button button--secondary" @click="open">
      Abrir comentários da tarefa
    </button>
    <template v-else>
      <h5>Comentários — últimos 50</h5>
      <p>
        As pessoas com acesso à tarefa podem ler e comentar. Revise antes de registrar: os
        comentários preservam o histórico.
      </p>
      <button type="button" class="button button--secondary" :disabled="busy" @click="load">
        Atualizar comentários
      </button>
      <p v-if="!items.length && !busy">Nenhum comentário registrado.</p>
      <article v-for="item in items" :key="item.id">
        <p>
          <strong>{{ item.author_name }}</strong> •
          {{ new Date(item.created_at).toLocaleString('pt-BR') }}
        </p>
        <p class="comment-body">{{ item.body }}</p>
      </article>
      <form @submit.prevent="save">
        <label :for="'comment-' + taskId">Nova observação sobre a execução</label
        ><textarea
          :id="'comment-' + taskId"
          v-model="body"
          maxlength="2000"
          rows="3"
          required
          :disabled="busy"
        /><button class="button button--secondary" :disabled="busy || !body.trim()">
          Registrar comentário
        </button>
      </form>
      <p v-if="busy" role="status">Carregando comentários…</p>
      <p v-if="error" role="alert">{{ error }}</p>
      <button type="button" class="button button--secondary" @click="clear">
        Fechar comentários
      </button>
    </template>
  </section>
</template>
<style scoped>
.task-comments {
  margin: 1rem 0;
}
.comment-body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
article {
  border-bottom: 1px solid var(--color-border, #d7dfd4);
  padding: 0.5rem 0;
}
label {
  font-weight: 600;
}
textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 6rem;
  padding: 0.75rem;
  font: inherit;
  border: 1px solid var(--color-border, #d7dfd4);
  border-radius: 0.75rem;
}
textarea:focus-visible {
  outline: 2px solid var(--color-primary, #205c3c);
  outline-offset: 2px;
}
</style>
