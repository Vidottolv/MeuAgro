<script setup lang="ts">
defineProps<{ id: string; label: string; value: string; unit: string; options: string[][] }>();
defineEmits<{ 'update:value': [value: string]; 'update:unit': [value: string] }>();
</script>
<template>
  <div class="rural-grid">
    <div class="field">
      <label :for="id">{{ label }}</label
      ><input
        :id="id"
        :value="value"
        type="text"
        inputmode="decimal"
        placeholder="Ex.: 12,5"
        @input="$emit('update:value', ($event.target as HTMLInputElement).value)"
      /><small>Opcional. Até quatro casas decimais.</small>
    </div>
    <div class="field">
      <label :for="id + '-unit'">Unidade do tamanho</label
      ><select
        :id="id + '-unit'"
        :value="unit"
        @change="$emit('update:unit', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Selecione</option>
        <option v-for="[value, label] in options" :key="value" :value="value">{{ label }}</option>
      </select>
    </div>
  </div>
</template>
