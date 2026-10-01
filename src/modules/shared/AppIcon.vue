<script setup lang="ts">
import { shapes } from './iconShapes';
defineProps<{ name: string }>();
</script>
<template>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <component
      :is="shape.tag"
      v-for="(shape, i) in shapes[name] || shapes.more"
      :key="i"
      v-bind="shape.attrs"
    />
  </svg>
</template>
