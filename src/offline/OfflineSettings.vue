<script setup>
import { ref } from 'vue';
import { useOffline } from './useOffline.js';
import { prepareFieldData } from './prepare.js';
import { syncOffline } from './runtime.js';
const { status, refresh } = useOffline();
const busy = ref(false),
  message = ref(''),
  error = ref('');
async function run(prepare) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  message.value = '';
  try {
    if (prepare) {
      await navigator.storage?.persist?.();
      await prepareFieldData((text) => {
        message.value = text;
      });
      message.value = 'Dados de campo preparados neste dispositivo.';
    } else {
      await syncOffline();
      message.value = 'Tentativa de envio concluída. Confira as pendências abaixo.';
    }
  } catch (cause) {
    error.value = cause.message || 'Não foi possível concluir. Tente novamente.';
  } finally {
    busy.value = false;
    await refresh();
  }
}
</script>
<template>
  <section id="offline" class="rural-panel">
    <h3>Uso offline e sincronização</h3>
    <p>
      {{ status.online ? 'Dispositivo com conexão.' : 'Dispositivo sem conexão.' }}
      {{ status.pending }} registro(s) aguardando envio.
    </p>
    <p v-if="status.preparedAt">
      Último preparo concluído: {{ new Date(status.preparedAt).toLocaleString('pt-BR') }}.
    </p>
    <p v-else>Prepare os dados com internet antes de sair para o campo.</p>
    <p>
      Consulte propriedades, talhões, plantios e seu histórico de visitas preparados. Novas
      anamneses, eventos e fotos ficam salvos no dispositivo e são enviados quando o aplicativo
      estiver aberto com conexão.
    </p>
    <p>
      Estoque, pedidos, cadastros, edições e exclusões precisam de internet. O primeiro acesso
      também precisa de conexão.
    </p>
    <div class="rural-actions">
      <button
        class="button button--primary"
        :disabled="busy || status.syncing || !status.online"
        @click="run(true)"
      >
        Preparar dados de campo
      </button>
      <button
        class="button button--secondary"
        :disabled="busy || status.syncing || !status.online || !status.pending"
        @click="run(false)"
      >
        {{ status.syncing ? 'Enviando…' : 'Sincronizar agora' }}
      </button>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <ul v-if="status.errors.length">
      <li v-for="item in status.errors" :key="item.id">{{ item.message }}</li>
    </ul>
    <p>
      Enquanto houver pendências, mantenha os dados do aplicativo neste dispositivo. Limpar o
      armazenamento ou desinstalar o app remove os registros locais.
    </p>
  </section>
</template>
