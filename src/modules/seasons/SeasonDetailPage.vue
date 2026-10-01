<script setup lang="ts">
import { ref, computed } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchSeason } from './seasonRepository';
import { isArchived, dateLabel, periodLabel } from './seasonModel';
import { getSeasonStatusLabel } from '../../constants/seasonStatus.js';
import RequestState from '../properties/components/RequestState.vue';
import SeasonArchiveAction from './SeasonArchiveAction.vue';
import SeasonCycles from './SeasonCycles.vue';
import type { Season } from './seasonTypes';
import '../properties/rural.css';
const props = defineProps<{ seasonId: string }>();
const { data, loading, error, reload } = useResource(() => fetchSeason(props.seasonId), null);
const busy = ref(false),
  feedback = ref('');
const archived = computed(() => (data.value ? isArchived(data.value) : false));
function changed(item: Season) {
  data.value = item;
  feedback.value = isArchived(item) ? 'Safra arquivada.' : 'Safra restaurada.';
}
</script>
<template>
  <div class="rural-vue">
    <a href="/more/seasons" class="button button--secondary" data-link>Voltar para safras</a
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><template v-if="data"
        ><section class="rural-panel">
          <h2>{{ data.name }}</h2>
          <span class="rural-tag">{{
            archived ? 'Arquivada' : getSeasonStatusLabel(data.status)
          }}</span>
          <p>{{ periodLabel(data) }}</p>
          <div class="rural-actions">
            <a
              v-if="!archived"
              :href="`/more/seasons/${encodeURIComponent(data.id)}/edit`"
              class="button button--secondary"
              data-link
              >Editar safra</a
            ><SeasonArchiveAction
              :id="data.id"
              :archived="archived"
              @changed="changed"
              @busy="busy = $event"
            /><button class="button button--secondary" :disabled="busy" @click="reload">
              Atualizar ficha
            </button>
          </div>
          <p v-if="feedback" role="status">{{ feedback }}</p>
        </section>
        <section class="rural-panel">
          <h3>Dados da safra</h3>
          <dl class="season-data">
            <dt>Propriedade</dt>
            <dd>{{ data.property?.name || 'Não encontrada' }}</dd>
            <dt>Status produtivo</dt>
            <dd>{{ getSeasonStatusLabel(data.status) }}</dd>
            <dt>Data inicial</dt>
            <dd>{{ dateLabel(data.start_date) }}</dd>
            <dt>Data final</dt>
            <dd>{{ dateLabel(data.end_date) }}</dd>
            <dt>Descrição</dt>
            <dd class="season-description">
              {{ data.description || 'Nenhuma descrição informada.' }}
            </dd>
          </dl>
          <a
            v-if="data.property"
            :href="`/properties/${encodeURIComponent(data.property_id)}`"
            class="button button--secondary"
            data-link
            >Ver propriedade</a
          >
          <p v-if="data.property?.deleted_at">
            A propriedade está arquivada. Restaure-a antes de registrar novos plantios.
          </p>
        </section>
        <SeasonCycles
          v-if="!archived"
          :id="data.id"
          :property-id="data.property_id"
          :can-create="!!data.property && !data.property.deleted_at"
      /></template>
      <section v-else class="rural-panel">
        <h2>Safra não encontrada</h2>
        <p>O registro não existe ou não está disponível para sua conta.</p>
      </section></RequestState
    >
  </div>
</template>
<style scoped>
.season-data {
  display: grid;
  gap: 10px;
}
.season-data dt {
  color: var(--color-text-soft);
}
.season-data dd {
  margin: 0 0 10px;
  overflow-wrap: anywhere;
}
.season-description {
  white-space: pre-wrap;
}
</style>
