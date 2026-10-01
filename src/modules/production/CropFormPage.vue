<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { crop, saveCrop } from './productionRepository';
import { validateCrop } from './productionModel';
import { useMutation } from './useMutation';
import RequestState from '../properties/components/RequestState.vue';
import '../properties/rural.css';
const props = defineProps<{ cropId?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const { data, loading, error, reload } = useResource(
  () => (props.cropId ? crop(props.cropId) : Promise.resolve(null)),
  null,
);
const fields = reactive({ name: '', category: '', averageCycleDays: '', notes: '' });
const mutation = useMutation();
watch(data, (c) => {
  if (c)
    Object.assign(fields, {
      name: c.name,
      category: c.category || '',
      averageCycleDays: String(c.average_cycle_days ?? ''),
      notes: c.notes || '',
    });
});
function submit() {
  if (loading.value || error.value || (props.cropId && (!data.value || data.value.is_system)))
    return;
  mutation.error.value = validateCrop(fields);
  if (!mutation.error.value)
    void mutation.run(
      () => saveCrop(props.cropId, { ...fields }),
      (id) => emit('saved', id),
    );
}
</script>
<template>
  <div class="rural-vue">
    <a
      :href="cropId ? `/more/crops/${encodeURIComponent(cropId)}` : '/more/crops'"
      class="button button--secondary"
      data-link
      >Voltar</a
    >
    <section class="rural-panel">
      <h2>{{ cropId ? 'Editar cultura' : 'Nova cultura' }}</h2>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="cropId && !data" class="rural-panel"><h3>Cultura não encontrada</h3></section>
      <section v-else-if="data?.is_system" class="rural-panel">
        <h3>Cultura do sistema</h3>
        <p>Crie uma cultura personalizada para definir outros valores.</p>
      </section>
      <form v-else class="rural-panel" novalidate @submit.prevent="submit">
        <fieldset :disabled="mutation.busy.value || mutation.done.value">
          <div class="field">
            <label for="crop-name">Nome *</label
            ><input id="crop-name" v-model="fields.name" maxlength="120" />
          </div>
          <div class="field">
            <label for="crop-category">Categoria</label
            ><input id="crop-category" v-model="fields.category" maxlength="100" />
          </div>
          <div class="field">
            <label for="crop-days">Ciclo médio em dias</label
            ><input id="crop-days" v-model="fields.averageCycleDays" inputmode="numeric" />
            <p>Usado para sugerir a previsão de colheita.</p>
          </div>
          <div class="field">
            <label for="crop-notes">Observações</label
            ><textarea id="crop-notes" v-model="fields.notes" maxlength="1500" rows="4" />
          </div>
        </fieldset>
        <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
        <button
          class="button button--primary"
          :disabled="mutation.busy.value || mutation.done.value"
        >
          {{
            mutation.busy.value ? 'Salvando…' : cropId ? 'Salvar alterações' : 'Cadastrar cultura'
          }}
        </button>
      </form></RequestState
    >
  </div>
</template>
