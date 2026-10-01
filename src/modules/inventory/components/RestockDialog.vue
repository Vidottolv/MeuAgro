<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref } from 'vue';
import { listActiveConsultantsWithWhatsApp } from '../../../services/consultantService.js';
import { buildConsultantWhatsAppUrl } from '../../../services/whatsappService.js';
import InventoryDialog from './InventoryDialog.vue';
import type { RestockConsultant } from '../detailTypes';
const props = defineProps<{ inputName: string }>();
const emit = defineEmits<{ close: [] }>();
const consultants = ref<RestockConsultant[]>([]),
  selectedId = ref('');
const loading = ref(true),
  error = ref('');
let disposed = false;
async function load() {
  loading.value = true;
  error.value = '';
  try {
    const result = (await listActiveConsultantsWithWhatsApp()) as RestockConsultant[];
    if (disposed) return;
    consultants.value = result;
    selectedId.value = result.length === 1 ? result[0].id : '';
  } catch {
    if (!disposed) error.value = 'Não foi possível carregar os consultores.';
  } finally {
    if (!disposed) loading.value = false;
  }
}
const url = computed(() =>
  buildConsultantWhatsAppUrl(
    consultants.value.find((item) => item.id === selectedId.value),
    { productName: props.inputName },
  ),
);
onMounted(load);
onScopeDispose(() => {
  disposed = true;
});
</script>
<template>
  <InventoryDialog title="Solicitar reposição" @close="emit('close')">
    <p>
      Seu estoque de <strong>{{ inputName }}</strong> acabou. Consulte preço e disponibilidade com
      um consultor.
    </p>
    <p v-if="loading" role="status">Carregando consultores…</p>
    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button class="button button--secondary" @click="load">Tentar novamente</button>
    </div>
    <template v-else-if="consultants.length">
      <label for="restock-consultant">Consultor</label>
      <select id="restock-consultant" v-model="selectedId">
        <option value="">Selecione</option>
        <option v-for="consultant in consultants" :key="consultant.id" :value="consultant.id">
          {{ consultant.name }}{{ consultant.company ? ` • ${consultant.company}` : '' }}
        </option>
      </select>
      <a
        v-if="url"
        :href="url"
        class="button button--primary"
        target="_blank"
        rel="noopener noreferrer"
        @click="emit('close')"
        >Abrir WhatsApp</a
      >
      <p v-else-if="selectedId" role="alert">
        O WhatsApp desse consultor não é válido. Confira o cadastro.
      </p>
      <p>A mensagem será aberta para você conferir e enviar no WhatsApp.</p>
    </template>
    <template v-else
      ><p>Nenhum consultor ativo com WhatsApp foi cadastrado.</p>
      <a
        href="/more/consultants/new"
        class="button button--primary"
        data-link
        @click="emit('close')"
        >Cadastrar consultor</a
      ></template
    >
    <button class="button button--secondary" autofocus @click="emit('close')">Fechar</button>
  </InventoryDialog>
</template>
