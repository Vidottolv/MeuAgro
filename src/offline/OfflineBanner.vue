<script setup>
import { useOffline } from './useOffline.js';
const { status } = useOffline();
</script>
<template>
  <aside
    v-if="!status.online || status.pending || status.errors.length || status.cachedAt"
    class="offline-banner"
    role="status"
    aria-live="polite"
  >
    <strong>{{
      !status.online
        ? 'Sem conexão'
        : status.syncing
          ? 'Enviando registros…'
          : status.errors.length
            ? 'Envio precisa de atenção'
            : status.pending
              ? 'Registros salvos neste dispositivo'
              : 'Exibindo dados salvos no dispositivo'
    }}</strong>
    <span v-if="status.pending">{{ status.pending }} registro(s) aguardando envio.</span>
    <span v-else-if="!status.online">Consulte os dados preparados e registre eventos e fotos.</span>
    <a href="/more/settings#offline" data-link>Ver sincronização</a>
  </aside>
</template>
<style scoped>
.offline-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
  padding: 0.85rem 1rem;
  margin: 0.75rem 1rem 0;
  border: 1px solid currentColor;
  border-radius: 0.75rem;
  color: var(--text-color, inherit);
  background: var(--surface-color, transparent);
  font-size: 0.9rem;
}
.offline-banner a {
  color: inherit;
  text-decoration: underline;
}
</style>
