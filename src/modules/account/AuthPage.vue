<script setup lang="ts">
import { ref, computed, onScopeDispose } from 'vue';
import {
  signIn,
  signUp,
  requestPasswordReset,
  updatePassword,
  signOut,
  getSession,
} from '../../services/authService.js';
import { getAuthErrorMessage } from '../../services/authErrorService.js';
import {
  AUTH_PROVIDERS,
  signInWithProvider,
  cancelProviderSignIn,
  providerErrorMessage,
} from '../../services/authProviderService.js';
import { validatePassword } from '../../components/formHelpers.js';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import PasswordField from './PasswordField.vue';
import RequestState from '../properties/components/RequestState.vue';
const props = defineProps<{ mode: 'login' | 'register' | 'forgot' | 'reset' }>();
const emit = defineEmits<{ navigate: [path: string] }>();
const labels = {
  login: 'Entrar',
  register: 'Criar conta',
  forgot: 'Recuperar senha',
  reset: 'Definir nova senha',
};
const name = ref(''),
  email = ref(''),
  password = ref(''),
  confirmation = ref(''),
  message = ref(''),
  oauthBusy = ref(false),
  oauthError = ref(''),
  savedPassword = ref(false);
const query = new URLSearchParams(location.search);
let alive = true;
onScopeDispose(() => (alive = false));
const session = useResource(
  () => (props.mode === 'reset' ? getSession() : Promise.resolve(null)),
  null,
);
const mutation = useMutation();
const logout = useMutation();
if (props.mode === 'login') {
  message.value =
    query.get('passwordUpdated') === '1'
      ? 'Senha alterada. Entre novamente.'
      : query.get('confirmed') === '1'
        ? 'E-mail confirmado. Agora você já pode entrar.'
        : '';
  oauthError.value = query.get('nativeError') || '';
}
const busy = computed(() => mutation.busy.value || oauthBusy.value);
const newPassword = computed(() => ['register', 'reset'].includes(props.mode));
function destination() {
  const p = query.get('redirect') || '';
  return p.startsWith('/') && !p.startsWith('//') && !p.includes('\\') ? p : '/dashboard';
}
async function google() {
  if (busy.value || mutation.done.value) return;
  oauthBusy.value = true;
  oauthError.value = '';
  message.value = 'Abrindo Google…';
  try {
    await signInWithProvider('google', { destination: destination() });
    if (alive)
      message.value = 'Conclua o login no navegador. Se voltou sem concluir, tente novamente.';
  } catch (e) {
    if (alive) {
      oauthError.value = providerErrorMessage(e);
      message.value = '';
    }
  } finally {
    if (alive) oauthBusy.value = false;
  }
}
function finishLogout() {
  void logout.run(
    async () => {
      try {
        await signOut();
      } catch (e) {
        throw Error(getAuthErrorMessage(e));
      }
    },
    () => emit('navigate', '/login?passwordUpdated=1'),
  );
}
function submit() {
  if (busy.value || mutation.done.value) return;
  mutation.error.value = '';
  oauthError.value = '';
  message.value = '';
  if (
    props.mode === 'reset' &&
    (session.loading.value || session.error.value || !session.data.value)
  )
    return;
  if (props.mode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    mutation.error.value = 'Informe um e-mail válido.';
    return;
  }
  if (
    props.mode === 'register' &&
    (name.value.trim().length < 2 || name.value.trim().length > 120)
  ) {
    mutation.error.value = 'Informe seu nome, entre 2 e 120 caracteres.';
    return;
  }
  if (props.mode === 'login' && !password.value) {
    mutation.error.value = 'Informe sua senha.';
    return;
  }
  if (newPassword.value) {
    mutation.error.value = validatePassword(password.value) || '';
    if (!mutation.error.value && password.value !== confirmation.value)
      mutation.error.value = 'As senhas informadas são diferentes.';
    if (mutation.error.value) return;
  }
  void mutation.run(
    async () => {
      try {
        cancelProviderSignIn();
        if (props.mode === 'login') {
          await signIn({ email: email.value, password: password.value });
          return true;
        }
        if (props.mode === 'register') {
          const d = await signUp({
            fullName: name.value,
            email: email.value,
            password: password.value,
          });
          return Boolean(d.session);
        }
        if (props.mode === 'forgot') {
          await requestPasswordReset(email.value);
          return false;
        }
        await updatePassword(password.value);
        return false;
      } catch (e) {
        throw Error(getAuthErrorMessage(e));
      }
    },
    (logged) => {
      password.value = '';
      confirmation.value = '';
      if (logged) {
        emit('navigate', props.mode === 'login' ? destination() : '/dashboard');
        return;
      }
      if (props.mode === 'reset') {
        savedPassword.value = true;
        finishLogout();
      } else
        message.value =
          props.mode === 'register'
            ? 'Conta criada. Confira seu e-mail para confirmar o cadastro.'
            : 'Se existir uma conta com esse e-mail, enviaremos as instruções para redefinir a senha.';
    },
  );
}
</script>
<template>
  <main class="auth-layout">
    <section class="auth-shell">
      <header class="auth-brand">
        <div class="brand__mark" aria-hidden="true">🌱</div>
        <div>
          <p class="brand__eyebrow">Meu Agro</p>
          <h1 class="auth-brand__title">Cultive informação. Colha decisões melhores.</h1>
          <p class="auth-brand__description">
            Gerencie propriedades, plantios, estoque e colheitas em um só lugar.
          </p>
        </div>
      </header>
      <div class="auth-card">
        <div class="auth-card__header">
          <h2>{{ labels[mode] }}</h2>
        </div>
        <p v-if="message" class="form-message form-message--success" role="status">{{ message }}</p>
        <p v-if="mutation.error.value || oauthError" class="form-message" role="alert">
          {{ mutation.error.value || oauthError }}
        </p>
        <template v-if="savedPassword"
          ><p role="status">
            Senha alterada com sucesso. Encerrando a sessão para você entrar novamente.
          </p>
          <p v-if="logout.error.value" role="alert">
            A senha já foi salva. {{ logout.error.value }}
          </p>
          <button
            v-if="logout.error.value"
            class="button button--primary"
            :disabled="logout.busy.value"
            @click="finishLogout"
          >
            Tentar encerrar sessão novamente
          </button></template
        ><template v-else
          ><div
            v-if="['login', 'register'].includes(mode) && AUTH_PROVIDERS.google.enabled"
            class="auth-provider"
          >
            <button
              class="google-sign-in"
              type="button"
              :disabled="busy || mutation.done.value"
              :aria-busy="oauthBusy"
              @click="google"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.02 46.98 31.84 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Continuar com Google</span>
            </button>
            <p class="auth-divider"><span>ou use seu e-mail</span></p>
          </div>
          <RequestState
            :loading="mode === 'reset' && session.loading.value"
            :error="mode === 'reset' ? session.error.value : ''"
            @retry="session.reload"
            ><p v-if="mode === 'reset' && !session.data.value">
              Abra esta página pelo link de recuperação enviado ao seu e-mail.
            </p>
            <form v-else :id="mode + '-form'" novalidate @submit.prevent="submit">
              <fieldset
                :disabled="busy || mutation.done.value"
                style="border: 0; padding: 0; margin: 0; display: grid; gap: 20px; min-width: 0"
              >
                <div v-if="mode === 'register'" class="field">
                  <label for="account-name">Nome completo</label
                  ><input
                    id="account-name"
                    v-model="name"
                    autocomplete="name"
                    maxlength="120"
                    required
                  />
                </div>
                <div v-if="mode !== 'reset'" class="field">
                  <label for="account-email">E-mail</label
                  ><input
                    id="account-email"
                    v-model="email"
                    type="email"
                    autocomplete="email"
                    inputmode="email"
                    required
                  />
                </div>
                <PasswordField
                  v-if="mode !== 'forgot'"
                  id="account-password"
                  v-model="password"
                  label="Senha"
                  :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                /><PasswordField
                  v-if="newPassword"
                  id="account-confirmation"
                  v-model="confirmation"
                  label="Confirmar senha"
                /><button type="submit" class="button button--primary button--full">
                  {{ busy ? 'Aguarde…' : labels[mode] }}
                </button>
              </fieldset>
            </form></RequestState
          ></template
        >
        <div class="rural-actions" style="margin-top: 20px">
          <a
            v-if="mode === 'login'"
            href="/forgot-password"
            data-link
            class="button button--secondary"
            >Esqueci minha senha</a
          ><a v-if="mode === 'login'" href="/register" data-link class="button button--secondary"
            >Criar conta</a
          ><a v-else href="/login" data-link class="button button--secondary">Voltar para entrar</a>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>input { min-width: 0; } .form-message { overflow-wrap:anywhere; } </style>
