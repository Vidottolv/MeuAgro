<script setup lang="ts">
import { computed, ref, onMounted, onScopeDispose } from 'vue';
import { getReleaseInfo } from '../../services/releaseInfoService.js';
import { getCurrentProfile, signOut } from '../../services/authService.js';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import RequestState from '../properties/components/RequestState.vue';
const props = defineProps<{
  session: { user: { email?: string; user_metadata?: { full_name?: string } } };
}>();
const emit = defineEmits<{ logout: [] }>();
const { data, loading, error, reload } = useResource(getCurrentProfile, null);
const name = computed(
  () =>
    data.value?.full_name ||
    props.session.user.user_metadata?.full_name ||
    props.session.user.email?.split('@')[0] ||
    'Usuário',
);
const mutation = useMutation();
const releaseInfo = ref<{
  version: string;
  build: string;
  channel: string;
  native: boolean;
} | null>(null);
let disposed = false;
onMounted(async () => {
  try {
    const info = await getReleaseInfo();
    if (!disposed) releaseInfo.value = info;
  } catch {
    /* A identificação não bloqueia a conta. */
  }
});
onScopeDispose(() => {
  disposed = true;
});
</script>
<template>
  <div class="rural-vue">
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section class="rural-panel">
        <h2>{{ name }}</h2>
        <p>{{ session.user.email }}</p>
      </section></RequestState
    >
    <section class="rural-panel">
      <h3>Versão do aplicativo</h3>
      <p v-if="releaseInfo">
        {{ releaseInfo.native ? 'Android instalado' : 'Versão web' }}: {{ releaseInfo.version }} •
        Build {{ releaseInfo.build }} •
        {{ releaseInfo.channel === 'pilot' ? 'Piloto' : 'Produção' }}.
      </p>
      <p v-else>Identificação da versão indisponível neste dispositivo.</p>
      <a href="/more/operations" data-link>Diagnóstico e privacidade</a>
    </section>
    <section class="rural-panel">
      <h3>Minha conta</h3>
      <a href="/more/settings" data-link class="button button--secondary">Configurações</a>
      <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
      <button
        class="button button--primary"
        :disabled="mutation.busy.value || mutation.done.value"
        @click="mutation.run(signOut, () => emit('logout'))"
      >
        {{ mutation.busy.value ? 'Saindo…' : 'Sair da conta' }}
      </button>
    </section>
  </div>
</template>
