<script setup lang="ts">
import { ref, onScopeDispose } from 'vue';
import RuralDialog from './RuralDialog.vue';
import { validateAreaType } from '../ruralModel';
import { saveType } from '../ruralRepository';
import { getDataErrorMessage } from '../../../services/dataErrorService.js';
import type { AreaType } from '../ruralTypes';
const emit = defineEmits<{ created: [type: AreaType]; close: [] }>();
const name = ref(''),
  description = ref(''),
  busy = ref(false),
  error = ref('');
let disposed = false;
async function submit() {
  if (busy.value) return;
  error.value = validateAreaType(name.value, description.value);
  if (error.value) return;
  busy.value = true;
  try {
    const item = await saveType(name.value.trim(), description.value.trim());
    if (!disposed) emit('created', item);
  } catch (cause) {
    if (!disposed) error.value = getDataErrorMessage(cause);
  } finally {
    if (!disposed) busy.value = false;
  }
}
onScopeDispose(() => {
  disposed = true;
});
</script>
<template>
  <RuralDialog title="Novo tipo de área" :busy="busy" @close="emit('close')"
    ><p>Crie um tipo personalizado para usar em suas propriedades.</p>
    <form novalidate @submit.prevent="submit">
      <p v-if="error" role="alert">{{ error }}</p>
      <fieldset :disabled="busy">
        <div class="field">
          <label for="area-type-name">Nome do tipo *</label
          ><input id="area-type-name" v-model="name" maxlength="80" required />
        </div>
        <div class="field">
          <label for="area-type-description">Descrição do tipo</label
          ><textarea
            id="area-type-description"
            v-model="description"
            maxlength="300"
            rows="3"
          ></textarea>
        </div>
      </fieldset>
      <div class="rural-actions">
        <button
          type="button"
          class="button button--secondary"
          :disabled="busy"
          @click="emit('close')"
        >
          Cancelar</button
        ><button class="button button--primary" :disabled="busy" type="submit">
          {{ busy ? 'Criando…' : 'Criar tipo' }}
        </button>
      </div>
    </form></RuralDialog
  >
</template>
