<script setup lang="ts">
import { onScopeDispose, ref } from 'vue';
import { changeArchive } from './plantingRepository';
import { getDataErrorMessage } from '../../services/dataErrorService.js';
import type { Planting } from './plantingTypes';
import RuralDialog from '../properties/components/RuralDialog.vue';
const props = defineProps<{
  id: string;
  archived: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{ changed: [record: Planting]; busy: [value: boolean] }>();
const open = ref(false),
  busy = ref(false),
  error = ref('');
let disposed = false;
async function confirm() {
  if (busy.value || props.disabled) return;
  busy.value = true;
  emit('busy', true);
  error.value = '';
  try {
    const record = await changeArchive(props.id, !props.archived);
    if (!disposed) {
      open.value = false;
      emit('changed', record);
    }
  } catch (cause) {
    if (!disposed) error.value = getDataErrorMessage(cause);
  } finally {
    if (!disposed) {
      busy.value = false;
      emit('busy', false);
    }
  }
}
onScopeDispose(() => {
  disposed = true;
});
</script>
<template>
  <button
    class="button button--secondary"
    :disabled="disabled || busy"
    @click="
      open = true;
      error = '';
    "
  >
    {{ archived ? 'Restaurar' : 'Arquivar' }}</button
  ><RuralDialog
    v-if="open"
    :title="archived ? 'Restaurar plantio?' : 'Arquivar plantio?'"
    :busy="busy"
    @close="open = false"
    ><p>
      {{
        archived
          ? 'O plantio voltará à listagem, mantendo seu status produtivo.'
          : 'O plantio sairá da listagem principal. Seu histórico será preservado.'
      }}
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
    <div class="rural-actions">
      <button class="button button--secondary" :disabled="busy" @click="open = false">
        Cancelar</button
      ><button class="button button--primary" :disabled="busy" @click="confirm">
        {{ busy ? 'Salvando…' : archived ? 'Confirmar restauração' : 'Confirmar arquivamento' }}
      </button>
    </div></RuralDialog
  >
</template>
