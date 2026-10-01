<script setup>
import { reactive } from 'vue';
import { useId } from 'vue';
const props = defineProps({
  fields: { type: Array, required: true },
  label: { type: String, default: 'Salvar' },
  busy: Boolean,
});
const emit = defineEmits(['submit']);
const id = useId();
const values = reactive(Object.fromEntries(props.fields.map((f) => [f.name, f.value ?? ''])));
</script>
<template>
  <form @submit.prevent="emit('submit', { ...values })">
    <fieldset :disabled="busy">
      <div v-for="f in fields" :key="f.name" class="field">
        <label :for="id + '-' + f.name">{{ f.label }}</label
        ><textarea
          v-if="f.type === 'textarea'"
          :id="id + '-' + f.name"
          v-model="values[f.name]"
          :required="f.required"
          :maxlength="f.maxlength"
          rows="3"
        /><select
          v-else-if="f.type === 'select'"
          :id="id + '-' + f.name"
          v-model="values[f.name]"
          :required="f.required"
        >
          <option v-for="o in f.options" :key="o.value" :value="o.value">
            {{ o.label }}
          </option></select
        ><input
          v-else
          :id="id + '-' + f.name"
          v-model="values[f.name]"
          :type="f.type || 'text'"
          :required="f.required"
          :minlength="f.minlength"
          :maxlength="f.maxlength"
          :min="f.min"
          :max="f.max"
          :step="f.step"
          :autocomplete="f.autocomplete"
        />
      </div>
      <slot :values="values" /><button type="submit" class="button button--primary">
        {{ busy ? 'Aguarde…' : label }}
      </button>
    </fieldset>
  </form>
</template>
