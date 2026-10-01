<script setup lang="ts">
import InputTextField from './InputTextField.vue';
import { INPUT_CATEGORIES } from '../../../constants/inputCategories.js';
import { INPUT_UNITS } from '../../../constants/inputUnits.js';
import type { InputDraft, InputErrors } from '../inputFormModel';
const draft = defineModel<InputDraft>({ required: true });
defineProps<{ errors: InputErrors }>();
</script>

<template>
  <section class="input-form-section" aria-labelledby="input-identity-title">
    <h3 id="input-identity-title">Identificação</h3>
    <InputTextField
      id="input-name"
      v-model="draft.name"
      label="Nome"
      required
      :maxlength="160"
      :error="errors.name"
    />
    <InputTextField
      id="input-brand"
      v-model="draft.brand"
      label="Marca"
      :maxlength="160"
      :error="errors.brand"
    />
    <div class="input-form-grid">
      <div class="field">
        <label for="input-category">Categoria *</label>
        <select
          id="input-category"
          v-model="draft.category"
          required
          :aria-invalid="Boolean(errors.category)"
          :aria-describedby="errors.category ? 'input-category-error' : undefined"
        >
          <option value="">Selecione</option>
          <option v-for="[value, label] in INPUT_CATEGORIES" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
        <small v-if="errors.category" id="input-category-error" class="input-form-error">{{
          errors.category
        }}</small>
      </div>
      <div class="field">
        <label for="input-unit">Unidade principal *</label>
        <select
          id="input-unit"
          v-model="draft.baseUnit"
          required
          :aria-invalid="Boolean(errors.baseUnit)"
          :aria-describedby="errors.baseUnit ? 'input-unit-error' : undefined"
        >
          <option value="">Selecione</option>
          <option v-for="[value, label] in INPUT_UNITS" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
        <small v-if="errors.baseUnit" id="input-unit-error" class="input-form-error">{{
          errors.baseUnit
        }}</small>
      </div>
    </div>
  </section>
</template>
