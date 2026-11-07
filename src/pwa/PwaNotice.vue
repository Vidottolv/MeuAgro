<script setup>
import { ref } from 'vue';
import { usePwa } from './usePwa.js';
const { status, pwa } = usePwa();
const dismissed = ref(false);
</script>
<template>
  <aside
    v-if="
      !status.native &&
      (status.updateReady ||
        (!dismissed && !status.installed && (status.ios || status.installAvailable)))
    "
    class="pwa-notice"
    aria-label="Instalação e atualização do MeuAgro"
  >
    <template v-if="status.updateReady">
      <strong>Nova versão do MeuAgro pronta.</strong>
      <span
        >Salve suas edições, feche todas as janelas do MeuAgro e abra novamente. Seus dados locais
        são preservados.</span
      >
    </template>
    <template v-else>
      <details>
        <summary>Adicionar MeuAgro à tela inicial</summary>
        <p v-if="status.ios">
          No Safari, toque em Compartilhar → Adicionar à Tela de Início → Adicionar. Se aparecer
          Abrir como App da Web, mantenha ativado. Depois abra pelo ícone e entre na conta.
        </p>
        <button
          v-else
          type="button"
          class="button button--secondary"
          :disabled="status.busy"
          @click="pwa.install()"
        >
          Instalar MeuAgro
        </button>
        <p>Prepare os dados de campo no aplicativo instalado antes de sair sem conexão.</p>
      </details>
      <button
        type="button"
        class="pwa-dismiss"
        aria-label="Ocultar orientação de instalação"
        @click="dismissed = true"
      >
        ×
      </button>
    </template>
  </aside>
</template>
<style scoped>
.pwa-notice {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: max(0.75rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) 0.75rem
    max(1rem, env(safe-area-inset-left));
  color: var(--color-text, #16362a);
  background: var(--color-surface, #edf4ef);
  border-bottom: 1px solid #8aa996;
  font-size: 0.9rem;
}
.pwa-notice details {
  flex: 1;
  min-width: 0;
}
.pwa-notice summary {
  cursor: pointer;
  font-weight: 700;
}
.pwa-notice p {
  margin-top: 0.6rem;
  max-width: 65ch;
}
.pwa-dismiss {
  background: transparent;
  border: 0;
  color: inherit;
  min-width: 44px;
  min-height: 44px;
  font-size: 1.5rem;
}
</style>
