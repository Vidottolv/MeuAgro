<script setup>
import { toastItems, dismissToast } from '../../components/toast.js';
</script>
<template>
  <template v-for="t in toastItems" :key="t.id"
    ><aside v-if="t.trade" id="trade-toast" class="trade-toast" role="status">
      <button type="button" aria-label="Fechar aviso" @click="dismissToast(t.id)">×</button>
      <p>{{ t.message }}</p>
      <a
        href="/notificacoes/compras"
        data-link
        class="button button--secondary"
        @click="dismissToast(t.id)"
        >Ver avisos</a
      >
    </aside>
    <div
      v-else
      class="toast"
      :class="{ 'toast--error': t.type === 'error', 'toast--success': t.type === 'success' }"
      role="status"
    >
      {{ t.message }}
    </div></template
  >
</template>
