<script setup lang="ts">
import { ref, onScopeDispose } from 'vue';
import {
  tradeInbox,
  refreshTradeNotifications,
  readTradeNotification,
} from '../../services/tradeNotificationService.js';
import { pushStatus, enableTradePush, disableTradePush } from '../../services/tradePushService.js';
import { useMutation } from '../production/useMutation';
interface Notice {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  route: string;
}
const emit = defineEmits<{ navigate: [route: string] }>();
const inbox = ref(
    tradeInbox() as { items: Notice[]; unread_count: number; loaded: boolean; error: string },
  ),
  push = ref(pushStatus()),
  refreshing = ref(false),
  readError = ref('');
const mutation = useMutation(false);
let alive = true;
function update() {
  inbox.value = tradeInbox() as typeof inbox.value;
  push.value = pushStatus();
}
document.addEventListener('trade-notifications-updated', update);
document.addEventListener('trade-push-updated', update);
onScopeDispose(() => {
  alive = false;
  document.removeEventListener('trade-notifications-updated', update);
  document.removeEventListener('trade-push-updated', update);
});
async function refresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await refreshTradeNotifications();
  } finally {
    if (alive) {
      refreshing.value = false;
      update();
    }
  }
}
void refresh();
async function open(n: Notice) {
  if (!/^\/(compras|consultor\/negociacoes)\?request=[0-9a-f-]+$/.test(n.route)) {
    readError.value = 'Este aviso não possui uma negociação válida.';
    return;
  }
  try {
    await readTradeNotification(n.id);
  } catch {
    /* Opening a negotiation does not depend on the read receipt. */
  }
  if (alive) emit('navigate', n.route);
}
</script>
<template>
  <div class="rural-vue">
    <section class="rural-panel">
      <h2>Compras e conversas</h2>
      <p>{{ inbox.unread_count }} avisos não lidos. Até 100 avisos, priorizando os não lidos.</p>
      <p>{{ push.message }}</p>
      <div v-if="push.available" class="rural-actions">
        <button
          class="button button--primary"
          :disabled="mutation.busy.value"
          @click="mutation.run(enableTradePush, update)"
        >
          {{ push.enabled ? 'Reativar alertas do celular' : 'Ativar alertas do celular' }}</button
        ><button
          v-if="push.enabled"
          class="button button--secondary"
          :disabled="mutation.busy.value"
          @click="mutation.run(() => disableTradePush(), update)"
        >
          Desativar alertas do celular
        </button>
      </div>
      <p v-if="mutation.error.value || readError" role="alert">
        {{ mutation.error.value || readError }}
      </p>
      <button class="button button--secondary" :disabled="refreshing" @click="refresh">
        {{ refreshing ? 'Atualizando…' : 'Atualizar avisos' }}
      </button>
      <p v-if="inbox.error" role="alert">{{ inbox.error }}</p>
    </section>
    <p v-if="!inbox.loaded && !inbox.error" role="status">Carregando avisos…</p>
    <p v-else-if="!inbox.items.length && !inbox.error">Nenhum aviso de compra disponível.</p>
    <article
      v-for="n in inbox.items"
      :key="n.id"
      class="rural-card"
      :class="{ 'trade-unread': !n.read_at }"
    >
      <h3>{{ n.title }}</h3>
      <p>{{ n.body }}</p>
      <p>
        {{ new Date(n.created_at).toLocaleString('pt-BR') }} • {{ n.read_at ? 'Lido' : 'Não lido' }}
      </p>
      <button class="button button--secondary" @click="open(n)">Abrir negociação</button>
    </article>
  </div>
</template>
