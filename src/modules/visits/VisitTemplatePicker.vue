<script setup>
import { ref, computed, onMounted, onScopeDispose, watch } from 'vue';
import { useOffline } from '../../offline/useOffline.js';
import { listVisitTemplates, saveVisitTemplate } from '../../services/visitTemplateService.js';
import { templatePayload, applyEmptyTemplate } from './visitTemplates.js';
const props = defineProps({ modelValue: Object });
const emit = defineEmits(['update:modelValue']);
const { status } = useOffline();
const rows = ref([]),
  chosen = ref(''),
  name = ref(''),
  archived = ref(false),
  busy = ref(false),
  error = ref(''),
  notice = ref('');
const selected = computed(() => rows.value.find((t) => t.id === chosen.value));
const options = computed(() => rows.value.filter((t) => archived.value || t.active));
let disposed = false,
  version = 0,
  retry = null;
onScopeDispose(() => {
  disposed = true;
  ++version;
});
onMounted(() => void load());
watch(chosen, () => {
  name.value = selected.value?.name || '';
});
async function load() {
  const token = ++version;
  busy.value = true;
  error.value = '';
  try {
    const data = await listVisitTemplates();
    if (!disposed && token === version) rows.value = data;
  } catch (e) {
    if (!disposed && token === version) error.value = e.message;
  } finally {
    if (token === version) busy.value = false;
  }
}
function apply() {
  if (!selected.value?.active) return;
  const { data, filled } = applyEmptyTemplate(props.modelValue, selected.value);
  emit('update:modelValue', data);
  notice.value = filled + ' campo(s) vazio(s) preenchido(s). Revise os dados para esta visita.';
}
async function save(action) {
  if (busy.value) return;
  error.value = '';
  notice.value = '';
  let data;
  try {
    data = ['create', 'update'].includes(action)
      ? templatePayload(name.value, props.modelValue)
      : {};
    if (action !== 'create') {
      if (!selected.value) return;
      data = { ...data, id: selected.value.id, version: selected.value.version };
    }
  } catch (e) {
    error.value = e.message;
    return;
  }
  const key = JSON.stringify({ action, data });
  if (retry?.key !== key) retry = { key, id: crypto.randomUUID() };
  const token = version;
  busy.value = true;
  try {
    const result = await saveVisitTemplate(retry.id, action, data);
    if (disposed || token !== version) return;
    retry = null;
    chosen.value = result.id;
    busy.value = false;
    await load();
    name.value = selected.value?.name || '';
    notice.value = 'Biblioteca pessoal atualizada.';
  } catch (e) {
    if (!disposed && token === version) error.value = e.message;
  } finally {
    if (token === version) busy.value = false;
  }
}
</script>
<template>
  <details class="template-picker">
    <summary>Modelos pessoais de anamnese</summary>
    <p>
      Use seus roteiros para preencher campos vazios. Revise os textos para o atendimento atual. O
      modelo salva somente os textos da anamnese; confira se eles incluem dados de um atendimento
      específico.
    </p>
    <button type="button" class="button button--secondary" :disabled="busy" @click="load">
      Atualizar biblioteca de modelos
    </button>
    <div class="field">
      <label for="visit-template">Modelo pessoal</label
      ><select id="visit-template" v-model="chosen" :disabled="busy">
        <option value="">Selecione um modelo</option>
        <option v-for="item in options" :key="item.id" :value="item.id">
          {{ item.name }}{{ item.active ? '' : ' — arquivado' }}
        </option>
      </select>
    </div>
    <p v-if="!rows.length && !busy">
      Nenhum modelo disponível neste dispositivo. Preencha a anamnese e salve um novo modelo quando
      estiver conectado.
    </p>
    <button
      type="button"
      class="button button--secondary"
      :disabled="busy || !selected?.active"
      @click="apply"
    >
      Preencher campos vazios com o modelo
    </button>
    <div class="field">
      <label for="visit-template-name">Nome do modelo</label
      ><input id="visit-template-name" v-model="name" maxlength="100" :disabled="busy" />
    </div>
    <button
      type="button"
      class="button button--secondary"
      :disabled="busy || !status.online"
      @click="save('create')"
    >
      Salvar anamnese como novo modelo
    </button>
    <button
      v-if="selected"
      type="button"
      class="button button--secondary"
      :disabled="busy || !status.online"
      @click="save('update')"
    >
      Atualizar modelo com os textos atuais
    </button>
    <button
      v-if="selected"
      type="button"
      class="button button--secondary"
      :disabled="busy || !status.online"
      @click="save(selected.active ? 'archive' : 'restore')"
    >
      {{ selected.active ? 'Arquivar modelo' : 'Reativar modelo' }}
    </button>
    <label class="show-archived"
      ><input v-model="archived" type="checkbox" /> Mostrar modelos arquivados</label
    >
    <p>
      Até 20 modelos ativos. Modelos consultados ou preparados nesta conta podem ser usados offline.
      Criar e atualizar modelos exige conexão.
    </p>
    <p v-if="busy" role="status">Carregando modelos…</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
  </details>
</template>
<style scoped>
.template-picker {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--color-border, #d7dfd4);
  border-radius: 1rem;
}
summary {
  cursor: pointer;
  font-weight: 700;
}
.show-archived {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
}
.show-archived input {
  width: 1.25rem;
  min-width: 1.25rem;
  min-height: 1.25rem;
  height: 1.25rem;
}
</style>
