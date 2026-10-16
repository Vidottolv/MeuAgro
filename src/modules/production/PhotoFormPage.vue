<script setup lang="ts">
import { ref } from 'vue';
import { usePhotoForm } from './usePhotoForm';
import RequestState from '../properties/components/RequestState.vue';
import '../properties/rural.css';
import './production.css';
const props = defineProps<{ cycleId: string }>();
const emit = defineEmits<{ saved: [] }>();
const {
  planting,
  options,
  eventId,
  capturedAt,
  description,
  preview,
  picking,
  mutation,
  native,
  setFile,
  pick,
  submit,
} = usePhotoForm(props.cycleId, () => emit('saved'));
const { data, loading, error, reload } = planting;
const fileInput = ref<HTMLInputElement | null>(null);
function selected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) setFile(file);
  (event.target as HTMLInputElement).value = '';
}
</script>
<template>
  <div class="rural-vue">
    <a
      :href="`/plantings/${encodeURIComponent(cycleId)}/evolution`"
      class="button button--secondary"
      data-link
      >Voltar à evolução</a
    >
    <section class="rural-panel">
      <h2>Adicionar foto</h2>
      <p>A foto será salva neste dispositivo e enviada quando houver conexão.</p>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="!data" class="rural-panel"><h3>Plantio não encontrado</h3></section>
      <section v-else-if="data.deleted_at" class="rural-panel"><h3>Plantio arquivado</h3></section>
      <form v-else class="rural-panel" novalidate @submit.prevent="submit">
        <fieldset :disabled="mutation.busy.value || mutation.done.value || picking">
          <div class="rural-actions">
            <button
              v-if="native"
              type="button"
              class="button button--primary"
              @click="pick('camera')"
            >
              Tirar foto</button
            ><button
              type="button"
              class="button button--secondary"
              @click="native ? pick('gallery') : fileInput?.click()"
            >
              Escolher imagem
            </button>
          </div>
          <input
            id="photo-file"
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            @change="selected"
          />
          <p>JPG, PNG ou WebP de até 8 MB.</p>
          <img
            v-if="preview"
            class="production-preview"
            :src="preview"
            alt="Prévia da imagem selecionada"
          /><RequestState
            :loading="options.loading.value"
            :error="options.error.value"
            retry-label="Tentar carregar eventos"
            @retry="options.reload"
          />
          <div class="field">
            <label for="photo-event">Evento</label
            ><select
              id="photo-event"
              v-model="eventId"
              :disabled="options.loading.value || !!options.error.value"
            >
              <option value="__auto__">Criar registro fotográfico</option>
              <option value="">Sem evento vinculado</option>
              <option
                v-if="
                  eventId &&
                  eventId !== '__auto__' &&
                  !options.data.value.some((e) => e.id === eventId)
                "
                :value="eventId"
                disabled
              >
                Evento indisponível
              </option>
              <option v-for="e in options.data.value" :key="e.id" :value="e.id">
                {{ e.title }}
              </option>
            </select>
          </div>
          <div class="field">
            <label for="photo-date">Data e horário *</label
            ><input id="photo-date" v-model="capturedAt" type="datetime-local" />
          </div>
          <div class="field">
            <label for="photo-description">Descrição</label
            ><textarea id="photo-description" v-model="description" maxlength="800" rows="4" />
          </div>
        </fieldset>
        <p v-if="picking" role="status">Abrindo imagem…</p>
        <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
        <button
          class="button button--primary"
          :disabled="
            mutation.busy.value ||
            mutation.done.value ||
            picking ||
            options.loading.value ||
            !!options.error.value
          "
        >
          {{ mutation.busy.value ? 'Enviando…' : 'Salvar foto' }}
        </button>
      </form></RequestState
    >
  </div>
</template>
