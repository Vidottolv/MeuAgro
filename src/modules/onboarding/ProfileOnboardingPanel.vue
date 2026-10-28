<script setup>
import { computed, ref, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc } from '../../services/workspaceService.js';
import { onboardingProfiles, suggestedProfile, profileSteps } from './profileOnboarding.js';
const w = useWorkspace(() => workspaceRpc('app_onboarding_context'));
const { data, error, notice, loading, busy, status } = w;
const selected = ref(''),
  reviewed = ref(false);
watch(data, (context) => {
  selected.value = context?.preference?.profile || suggestedProfile(context);
  reviewed.value = !!context?.preference?.reviewed_at;
});
watch(selected, (value) => {
  reviewed.value =
    value === data.value?.preference?.profile && !!data.value?.preference?.reviewed_at;
});
watch(w.invalidated, () => {
  selected.value = '';
  reviewed.value = false;
});
const steps = computed(() => profileSteps(selected.value, data.value, !!status.value.preparedAt));
const required = computed(() => steps.value.filter((s) => !s.optional));
const done = computed(() => required.value.filter((s) => s.done).length);
const next = computed(() => required.value.find((s) => !s.done));
const roles = { owner: 'Responsável', manager: 'Gerente', representative: 'Representante' };
async function save() {
  await w.command('app_onboarding_save', {
    p_profile: selected.value,
    p_version: data.value?.preference?.version || 0,
    p_reviewed: reviewed.value,
  });
}
</script>
<template>
  <section class="rural-panel profile-onboarding">
    <h3>Seu roteiro de primeiros passos</h3>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <button class="button button--secondary" :disabled="busy || loading" @click="w.load">
      Atualizar meu roteiro
    </button>
    <p v-if="loading">Verificando seus cadastros e vínculos…</p>
    <template v-if="data">
      <p>
        Escolha como pretende começar. Você pode mudar o roteiro e continuar usando outras áreas
        conforme suas permissões. Essa escolha não altera seu plano ou seus vínculos.
      </p>
      <label for="onboarding-profile">Roteiro de uso</label>
      <select id="onboarding-profile" v-model="selected" :disabled="busy || loading">
        <option v-for="[value, label] in onboardingProfiles" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
      <p v-if="!data.preference">
        Sugerimos um roteiro pelos seus vínculos atuais. Salve para retomá-lo em outro dispositivo.
      </p>
      <p>
        {{ done }} de {{ required.length }} etapas principais com condição atendida. Etapas
        opcionais não entram no total.
      </p>
      <p v-if="next">
        Próxima etapa sugerida: <a :href="next.href" data-link>{{ next.title }}</a
        >.
      </p>
      <ol>
        <li v-for="s in steps" :key="s.id">
          <strong>{{ s.title }} <span v-if="s.optional">(opcional)</span></strong>
          <p>{{ s.done ? 'Condição verificada' : 'A conferir' }} • {{ s.description }}</p>
          <a :href="s.href" data-link>Abrir: {{ s.title.toLocaleLowerCase('pt-BR') }}</a>
        </li>
      </ol>
      <p>
        Os indicadores conferem cadastros, vínculos ou preparo local. Não atestam que uma operação
        foi testada em campo. Atualize o roteiro após concluir uma etapa.
      </p>
      <h4>Vínculos de empresa confirmados</h4>
      <p v-if="!data.companies.length">
        Nenhum vínculo ativo de empresa. Para atuar como gerente ou representante, aceite o convite
        autorizado em Consultor.
      </p>
      <article v-for="company in data.companies" :key="company.id" class="rural-card">
        <p>{{ company.name }} • {{ roles[company.role] || 'Vínculo ativo' }}</p>
        <a :href="'/consultor/empresa?id=' + encodeURIComponent(company.id)" data-link
          >Abrir empresa</a
        >
        <template
          v-if="
            data.counts.commercial_account &&
            (company.role === 'owner' || company.role === 'manager')
          "
        >
          <a :href="'/consultor/equipe?seller=' + encodeURIComponent(company.id)" data-link
            >Abrir equipe</a
          >
          <a :href="'/consultor/gestao?seller=' + encodeURIComponent(company.id)" data-link
            >Abrir gestão</a
          >
        </template>
      </article>
      <label class="review"
        ><input v-model="reviewed" type="checkbox" :disabled="busy || loading" /> Li as orientações
        deste roteiro</label
      >
      <p v-if="data.preference?.reviewed_at">
        Orientações revisadas em
        {{ new Date(data.preference.reviewed_at).toLocaleString('pt-BR') }}. Os indicadores
        continuam sendo conferidos a cada atualização.
      </p>
      <button class="button" :disabled="busy || loading || !selected" @click="save">
        Salvar meu roteiro
      </button>
      <p>
        Não é preciso concluir este roteiro para navegar pelo aplicativo. Cobrança e permissões
        continuam seguindo o contrato e os acessos existentes.
      </p>
    </template>
  </section>
</template>
<style scoped>
select {
  width: 100%;
  min-height: 48px;
  font: inherit;
  padding: 0.7rem;
  border: 1px solid #d7dfd4;
  border-radius: 0.7rem;
  box-sizing: border-box;
}
li {
  margin: 1rem 0;
}
p,
a,
strong {
  overflow-wrap: anywhere;
}
article a {
  display: block;
  margin: 0.6rem 0;
}
button {
  max-width: 100%;
  white-space: normal;
  margin: 0.3rem 0;
}
.review {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  margin: 1rem 0;
}
.profile-onboarding .review input[type='checkbox'] {
  width: 20px;
  height: 20px;
  min-height: 20px;
  flex: 0 0 20px;
  margin: 0;
}
</style>
