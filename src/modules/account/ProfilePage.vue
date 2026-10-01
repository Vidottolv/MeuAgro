<script setup lang="ts">
import { computed } from 'vue';
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
