<script setup lang="ts">
import { ref } from 'vue';
defineProps<{ id: string; label: string; autocomplete?: string }>();
const model = defineModel<string>({ required: true });
const visible = ref(false),
  input = ref<HTMLInputElement | null>(null);
function toggle() {
  const start = input.value?.selectionStart,
    end = input.value?.selectionEnd;
  visible.value = !visible.value;
  requestAnimationFrame(() => {
    input.value?.focus({ preventScroll: true });
    if (start != null && end != null) input.value?.setSelectionRange(start, end);
  });
}
</script>
<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <div class="password-input">
      <input
        :id="id"
        ref="input"
        v-model="model"
        :name="id"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete || 'new-password'"
        required
      /><button
        type="button"
        class="password-input__toggle"
        :aria-label="visible ? 'Ocultar senha' : 'Mostrar senha'"
        :aria-pressed="visible"
        :aria-controls="id"
        @click="toggle"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          <path v-if="!visible" d="m3 3 18 18" />
        </svg>
      </button>
    </div>
  </div>
</template>
