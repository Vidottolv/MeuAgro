<script setup>
import { ref } from 'vue';
import { useOffline } from './useOffline.js';
import { prepareFieldData } from './prepare.js';
import { syncOffline, offlineEngine, offlineUserId } from './runtime.js';
import { downloadVisitFile } from '../modules/visits/visitFollowup.js';
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
      await syncOffline({ manual: true });
      message.value = 'Tentativa de envio concluída. Confira as pendências abaixo.';
    }
  } catch (cause) {
    error.value = cause.message || 'Não foi possível concluir. Tente novamente.';
  } finally {
    busy.value = false;
    await refresh();
  }
}
async function retry(id) {
  if (busy.value || status.value.syncing) return;
  busy.value = true;
  error.value = '';
  try {
    await offlineEngine.retry(id);
    await syncOffline({ manual: true });
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
    await refresh();
  }
}
async function backup() {
  if (busy.value || status.value.syncing) return;
  busy.value = true;
  error.value = '';
  const user = offlineUserId();
  try {
    const archive = await offlineEngine.backup();
    if (user !== offlineUserId()) throw Error('A conta mudou. Gere a cópia novamente.');
    downloadVisitFile(
      JSON.stringify(archive),
      'application/json',
      'meuagro-pendencias-' + new Date().toISOString().slice(0, 10) + '.json',
    );
    message.value =
      'Cópia de recuperação gerada. Ela contém dados de campo e fotos; guarde em local privado. Não é uma importação automática.';
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
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
    <p>
      Falhas temporárias usam espera progressiva de até 15 minutos. Permissões, conflitos de arquivo
      e validações ficam pausados para revisão. Depois de corrigir a causa, tente novamente a
      pendência. Uma visita bloqueada também mantém suas fotos pendentes.
    </p>
    <article v-for="item in status.queue || []" :key="item.id" class="rural-card">
      <strong
        >{{
          item.kind === 'visit'
            ? 'Visita'
            : item.kind === 'visit_photo' || item.kind === 'photo'
              ? 'Foto'
              : 'Evento'
        }}
        •
        {{
          item.state === 'review'
            ? 'Revisão necessária'
            : item.state === 'retry'
              ? 'Aguardando nova tentativa'
              : 'Aguardando envio'
        }}</strong
      >
      <p>Identificador: {{ item.id }} • Tentativas: {{ item.attempts }}.</p>
      <p v-if="item.error" role="status">{{ item.error }}</p>
      <p v-if="item.nextAttemptAt">
        Próxima tentativa automática a partir de
        {{ new Date(item.nextAttemptAt).toLocaleString('pt-BR') }}.
      </p>
      <button
        v-if="item.state === 'review'"
        class="button button--secondary"
        :disabled="busy || status.syncing || !status.online"
        @click="retry(item.id)"
      >
        Revisei a causa — tentar novamente
      </button>
    </article>
    <button
      class="button button--secondary"
      :disabled="busy || status.syncing || !status.pending"
      @click="backup"
    >
      Baixar cópia das pendências e fotos
    </button>
    <p>
      A cópia inclui somente pendências desta conta, com fotos, até 100 MB de arquivos. Serve para
      recuperação assistida; não altera nem remove a fila. Não compartilhe publicamente.
    </p>
    <p>
      Enquanto houver pendências, mantenha os dados do aplicativo neste dispositivo. Limpar o
      armazenamento ou desinstalar o app remove os registros locais.
    </p>
  </section>
</template>
