<script setup lang="ts">
import { ref, computed } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import { get, change } from './contactRepository';
import { buildConsultantWhatsAppUrl } from '../../services/whatsappService.js';
import RequestState from '../properties/components/RequestState.vue';
import RuralDialog from '../properties/components/RuralDialog.vue';
const props = defineProps<{ contactId: string }>();
const { data, loading, error, reload } = useResource(() => get(props.contactId), null);
const action = ref<'archive' | 'restore' | 'active' | null>(null);
const mutation = useMutation(false);
const whatsapp = computed(() =>
  data.value?.active && !data.value.deleted_at && data.value.whatsapp
    ? buildConsultantWhatsAppUrl({ name: data.value.name, whatsapp: data.value.whatsapp })
    : null,
);
function confirm() {
  if (!data.value || !action.value) return;
  void mutation.run(
    () => change(data.value!, action.value!),
    (c) => {
      data.value = c;
      action.value = null;
    },
  );
}
</script>
<template>
  <div class="rural-vue">
    <a href="/more/consultants" data-link class="button button--secondary">Voltar aos contatos</a
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><p v-if="!data">Contato não encontrado.</p>
      <section v-else class="rural-panel">
        <h2>{{ data.name }}</h2>
        <p>{{ data.deleted_at ? 'Arquivado' : data.active ? 'Ativo' : 'Inativo' }}</p>
        <dl>
          <dt>Empresa</dt>
          <dd>{{ data.company || 'Não informada' }}</dd>
          <dt>Especialidade</dt>
          <dd>{{ data.specialty || 'Não informada' }}</dd>
          <dt>Telefone</dt>
          <dd>{{ data.phone || 'Não informado' }}</dd>
          <dt>WhatsApp</dt>
          <dd>{{ data.whatsapp || 'Não informado' }}</dd>
          <dt>E-mail</dt>
          <dd>{{ data.email || 'Não informado' }}</dd>
          <dt>Observações</dt>
          <dd>{{ data.notes || 'Nenhuma' }}</dd>
        </dl>
        <div class="rural-actions">
          <a
            v-if="whatsapp"
            :href="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            class="button button--primary"
            >Conversar no WhatsApp</a
          ><a
            v-if="!data.deleted_at"
            :href="`/more/consultants/${encodeURIComponent(data.id)}/edit`"
            data-link
            class="button button--secondary"
            >Editar contato</a
          ><button
            v-if="!data.deleted_at"
            class="button button--secondary"
            @click="action = 'active'"
          >
            {{ data.active ? 'Desativar contato' : 'Ativar contato' }}</button
          ><button
            class="button button--secondary"
            @click="action = data.deleted_at ? 'restore' : 'archive'"
          >
            {{ data.deleted_at ? 'Restaurar contato' : 'Arquivar contato' }}
          </button>
        </div>
      </section></RequestState
    ><RuralDialog
      v-if="action"
      title="Confirmar alteração do contato?"
      :busy="mutation.busy.value"
      @close="action = null"
      ><p>O histórico será preservado. Contatos arquivados podem ser restaurados.</p>
      <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
      <div class="rural-actions">
        <button
          class="button button--secondary"
          :disabled="mutation.busy.value"
          @click="action = null"
        >
          Cancelar</button
        ><button class="button button--primary" :disabled="mutation.busy.value" @click="confirm">
          Confirmar
        </button>
      </div></RuralDialog
    >
  </div>
</template>
