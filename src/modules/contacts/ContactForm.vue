<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import { get, save, validate, type Fields } from './contactRepository';
import RequestState from '../properties/components/RequestState.vue';
const props = defineProps<{ contactId?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const { data, loading, error, reload } = useResource(
  () => (props.contactId ? get(props.contactId) : Promise.resolve(null)),
  null,
);
const f = reactive<Fields>({
  name: '',
  company: '',
  phone: '',
  whatsapp: '',
  email: '',
  specialty: '',
  notes: '',
});
watch(data, (c) => {
  if (c) for (const key of Object.keys(f) as (keyof Fields)[]) f[key] = c[key] || '';
});
const mutation = useMutation();
const fields: { key: keyof Fields; label: string; type: string; max: number }[] = [
  { key: 'name', label: 'Nome *', type: 'text', max: 120 },
  { key: 'company', label: 'Empresa', type: 'text', max: 120 },
  { key: 'phone', label: 'Telefone', type: 'tel', max: 40 },
  { key: 'whatsapp', label: 'WhatsApp com DDD', type: 'tel', max: 40 },
  { key: 'email', label: 'E-mail', type: 'email', max: 254 },
  { key: 'specialty', label: 'Especialidade', type: 'text', max: 120 },
];
function submit() {
  if (loading.value || error.value) return;
  mutation.error.value = validate(f);
  if (!mutation.error.value)
    void mutation.run(
      () => save(props.contactId, { ...f }),
      (id) => emit('saved', id),
    );
}
</script>
<template>
  <div class="rural-vue">
    <a href="/more/consultants" data-link class="button button--secondary">Voltar aos contatos</a>
    <h2>{{ contactId ? 'Editar contato' : 'Novo contato' }}</h2>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><p v-if="contactId && !data">Contato não encontrado.</p>
      <p v-else-if="data?.deleted_at">Reative o contato antes de editar.</p>
      <form v-else class="rural-panel" novalidate @submit.prevent="submit">
        <fieldset :disabled="mutation.busy.value || mutation.done.value">
          <div v-for="field in fields" :key="field.key" class="field">
            <label :for="'contact-' + field.key">{{ field.label }}</label
            ><input
              :id="'contact-' + field.key"
              v-model="f[field.key]"
              :type="field.type"
              :maxlength="field.max"
            />
          </div>
          <div class="field">
            <label for="contact-notes">Observações</label
            ><textarea id="contact-notes" v-model="f.notes" maxlength="1800" rows="4" />
          </div>
        </fieldset>
        <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
        <button
          class="button button--primary"
          :disabled="mutation.busy.value || mutation.done.value"
        >
          {{ mutation.busy.value ? 'Salvando…' : 'Salvar contato' }}
        </button>
      </form></RequestState
    >
  </div>
</template>
