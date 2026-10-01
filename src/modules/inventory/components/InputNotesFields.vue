<script setup lang="ts">
import InputTextField from './InputTextField.vue';
import type { InputDraft, InputErrors } from '../inputFormModel';
const draft = defineModel<InputDraft>({ required: true });
defineProps<{ errors: InputErrors }>();
</script>

<template>
  <section class="input-form-section" aria-labelledby="input-notes-title">
    <h3 id="input-notes-title">Informações adicionais</h3>
    <InputTextField
      id="input-description"
      v-model="draft.description"
      label="Descrição"
      multiline
      :maxlength="1200"
      :error="errors.description"
    />
    <InputTextField
      id="input-notes"
      v-model="draft.notes"
      label="Observações"
      multiline
      :maxlength="1600"
      :error="errors.notes"
    />
  </section>
</template>
