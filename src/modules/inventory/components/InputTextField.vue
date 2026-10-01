<script setup lang="ts">
const model = defineModel<string>({ required: true });
defineProps<{
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  maxlength?: number;
  multiline?: boolean;
  decimal?: boolean;
}>();
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}<span v-if="required"> *</span></label>
    <textarea
      v-if="multiline"
      :id="id"
      v-model="model"
      :maxlength="maxlength"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
      rows="4"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      type="text"
      :inputmode="decimal ? 'decimal' : undefined"
      :required="required"
      :maxlength="maxlength"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
    />
    <small v-if="error" :id="`${id}-error`" class="input-form-error">{{ error }}</small>
    <small v-else-if="hint" :id="`${id}-hint`">{{ hint }}</small>
  </div>
</template>
