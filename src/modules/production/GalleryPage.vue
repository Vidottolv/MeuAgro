<script setup lang="ts">
import { ref } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { cycle, photos, removePhoto } from './productionRepository';
import { useMutation } from './useMutation';
import type { Photo } from './productionTypes';
import { formatDateTimePtBr } from '../../js/html.js';
import { differenceInCalendarDays } from '../../js/cycleMetrics.js';
import RequestState from '../properties/components/RequestState.vue';
import RuralDialog from '../properties/components/RuralDialog.vue';
import '../properties/rural.css';
import './production.css';
const props = defineProps<{ cycleId: string }>();
const { data, loading, error, reload } = useResource(() => cycle(props.cycleId), null);
const gallery = useResource(() => photos(props.cycleId), []);
const viewed = ref<Photo | null>(null),
  removing = ref<Photo | null>(null),
  mutation = useMutation(false);
function day(p: Photo) {
  const delta = differenceInCalendarDays(p.captured_at, data.value?.planting_date);
  return delta === null ? 'Evolução' : delta < 0 ? 'Antes do plantio' : 'Dia ' + (delta + 1);
}
function confirm() {
  if (!removing.value || !data.value || data.value.deleted_at) return;
  const item = removing.value;
  void mutation.run(
    () => removePhoto(item),
    () => {
      gallery.data.value = gallery.data.value.filter((p) => p.id !== item.id);
      removing.value = null;
    },
  );
}
</script>
<template>
  <div class="rural-vue">
    <a
      :href="`/plantings/${encodeURIComponent(cycleId)}`"
      class="button button--secondary"
      data-link
      >Voltar ao plantio</a
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><template v-if="data"
        ><section class="rural-panel">
          <header class="rural-header">
            <h2>Evolução do plantio</h2>
            <a
              v-if="!data.deleted_at"
              :href="`/plantings/${encodeURIComponent(cycleId)}/evolution/new`"
              class="button button--primary"
              data-link
              >Adicionar foto</a
            >
          </header>
          <p v-if="data.deleted_at">
            Plantio arquivado: as fotos estão disponíveis somente para consulta.
          </p>
          <button
            class="button button--secondary"
            :disabled="gallery.loading.value || mutation.busy.value"
            @click="gallery.reload"
          >
            Atualizar fotos
          </button>
        </section>
        <RequestState
          :loading="gallery.loading.value"
          :error="gallery.error.value"
          retry-label="Tentar carregar fotos"
          @retry="gallery.reload"
          ><div v-if="gallery.data.value.length" class="rural-grid">
            <article v-for="p in gallery.data.value" :key="p.id" class="rural-card photo-vue-card">
              <h3>{{ day(p) }}</h3>
              <p v-if="p.offline_pending" role="status">
                Salva neste dispositivo • aguardando envio
              </p>
              <button
                v-if="p.signed_url"
                type="button"
                class="photo-preview-button"
                :aria-label="'Ampliar foto: ' + (p.description || 'Evolução')"
                @click="viewed = p"
              >
                <img
                  :src="p.signed_url"
                  :alt="p.description || 'Evolução do plantio'"
                  loading="lazy"
                />
              </button>
              <p v-else>Imagem indisponível. Atualize as fotos para tentar novamente.</p>
              <p>{{ formatDateTimePtBr(p.captured_at) }}</p>
              <p>{{ p.description || 'Sem descrição' }}</p>
              <p>{{ p.production_event?.title || 'Sem evento vinculado' }}</p>
              <button
                v-if="!data.deleted_at"
                class="button button--secondary"
                :disabled="mutation.busy.value"
                @click="
                  removing = p;
                  mutation.error.value = '';
                "
              >
                Excluir foto
              </button>
            </article>
          </div>
          <section v-else class="rural-panel">
            <h3>Nenhuma foto registrada</h3>
          </section></RequestState
        ></template
      >
      <section v-else class="rural-panel"><h2>Plantio não encontrado</h2></section></RequestState
    ><RuralDialog v-if="viewed" title="Visualização da foto" @close="viewed = null"
      ><img
        class="production-preview"
        :src="viewed.signed_url!"
        :alt="viewed.description || 'Evolução'"
      /><button class="button button--secondary" @click="viewed = null">
        Fechar imagem
      </button></RuralDialog
    ><RuralDialog
      v-if="removing"
      title="Excluir foto?"
      :busy="mutation.busy.value"
      @close="removing = null"
      ><p>A foto será removida da evolução deste plantio.</p>
      <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
      <div class="rural-actions">
        <button
          class="button button--secondary"
          :disabled="mutation.busy.value"
          @click="removing = null"
        >
          Cancelar</button
        ><button class="button button--primary" :disabled="mutation.busy.value" @click="confirm">
          {{ mutation.busy.value ? 'Excluindo…' : 'Confirmar exclusão' }}
        </button>
      </div></RuralDialog
    >
  </div>
</template>
