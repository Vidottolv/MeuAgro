<script setup lang="ts">
import InputTextField from './InputTextField.vue';
import type { InputDraft, InputErrors } from '../inputFormModel';
const draft = defineModel<InputDraft>({ required: true });
defineProps<{ errors: InputErrors }>();
</script>

<template>
  <section class="input-form-section" aria-labelledby="input-stock-title">
    <h3 id="input-stock-title">Estoque de referência</h3>
    <p>
      Os limites usam a unidade principal selecionada. O saldo atual é calculado pelas
      movimentações.
    </p>
    <div class="input-form-grid">
      <InputTextField
        id="input-minimum-stock"
        v-model="draft.minimumStock"
        label="Estoque mínimo"
        decimal
        :error="errors.minimumStock"
        hint="Vazio equivale a zero."
      />
      <InputTextField
        id="input-ideal-stock"
        v-model="draft.idealStock"
        label="Estoque ideal"
        decimal
        :error="errors.idealStock"
        hint="Opcional. Deixe vazio se não houver meta."
      />
    </div>
    <p>Use vírgula ou ponto decimal, sem separador de milhar.</p>
  </section>
</template>
