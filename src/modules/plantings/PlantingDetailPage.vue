<script setup lang="ts">
import { computed, ref } from 'vue';
import { useOffline } from '../../offline/useOffline.js';
const { status } = useOffline();
import { useResource } from '../inventory/shared/useResource';
import { fetchPlanting } from './plantingRepository';
import { title, quantityLabel, isArchived, canHarvest } from './plantingModel';
import { dateLabel } from '../seasons/seasonModel';
import { getCycleMetrics } from '../../js/cycleMetrics.js';
import { getProductionCycleStatusLabel } from '../../constants/productionCycleStatus.js';
import type { Planting } from './plantingTypes';
import RequestState from '../properties/components/RequestState.vue';
import PlantingArchiveAction from './PlantingArchiveAction.vue';
import PlantingEvents from './PlantingEvents.vue';
import PlantingHarvests from './PlantingHarvests.vue';
import PlantingFinance from './PlantingFinance.vue';
import '../properties/rural.css';
const props = defineProps<{ cycleId: string }>();
const { data, loading, error, reload } = useResource(() => fetchPlanting(props.cycleId), null);
const busy = ref(false),
  feedback = ref('');
const metrics = computed(() => getCycleMetrics(data.value));
function changed(item: Planting) {
  data.value = item;
  feedback.value = isArchived(item) ? 'Plantio arquivado.' : 'Plantio restaurado.';
}
</script>
<template>
  <div class="rural-vue">
    <a href="/plantings" class="button button--secondary" data-link>Voltar para plantios</a
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><template v-if="data"
        ><section class="rural-panel">
          <h2>{{ title(data) }}</h2>
          <p>{{ [data.property?.name, data.area?.name].filter(Boolean).join(' • ') }}</p>
          <span class="rural-tag">{{
            isArchived(data) ? 'Arquivado' : getProductionCycleStatusLabel(data.status)
          }}</span>
          <p>{{ metrics.plantingText }}</p>
          <p>{{ metrics.forecastText }}</p>
          <template v-if="metrics.progressPercent !== null"
            ><label for="planting-progress"
              >Ciclo médio estimado: {{ metrics.progressPercent }}%</label
            ><progress
              id="planting-progress"
              :value="metrics.progressPercent"
              max="100"
              style="width: 100%"
          /></template>
          <div class="rural-actions">
            <a
              v-if="!isArchived(data)"
              :href="`/plantings/${encodeURIComponent(data.id)}/edit`"
              class="button button--secondary"
              data-link
              >Editar plantio</a
            ><PlantingArchiveAction
              :id="data.id"
              :archived="isArchived(data)"
              @changed="changed"
              @busy="busy = $event"
            /><button class="button button--secondary" :disabled="busy" @click="reload">
              Atualizar ficha
            </button>
          </div>
          <p v-if="feedback" role="status">{{ feedback }}</p>
        </section>
        <section class="rural-panel">
          <h3>Dados do plantio</h3>
          <dl>
            <dt>Propriedade</dt>
            <dd>{{ data.property?.name || 'Não encontrada' }}</dd>
            <dt>Área</dt>
            <dd>{{ data.area?.name || 'Não encontrada' }}</dd>
            <dt>Safra</dt>
            <dd>{{ data.season?.name || 'Sem safra' }}</dd>
            <dt>Cultura e variedade</dt>
            <dd>{{ title(data) }}</dd>
            <dt>Status produtivo</dt>
            <dd>{{ getProductionCycleStatusLabel(data.status) }}</dd>
            <dt>Quantidade plantada</dt>
            <dd>{{ quantityLabel(data) }}</dd>
            <dt>Data do plantio</dt>
            <dd>{{ dateLabel(data.planting_date) }}</dd>
            <dt>Previsão inicial</dt>
            <dd>{{ dateLabel(data.initial_harvest_forecast) }}</dd>
            <dt>Previsão atual</dt>
            <dd>{{ dateLabel(data.current_harvest_forecast) }}</dd>
            <dt>Data real da colheita</dt>
            <dd>{{ dateLabel(data.final_harvest_date) }}</dd>
            <dt>Observações</dt>
            <dd>{{ data.notes || 'Nenhuma observação informada.' }}</dd>
          </dl>
          <div class="rural-actions">
            <a
              :href="`/properties/${encodeURIComponent(data.property_id)}`"
              class="button button--secondary"
              data-link
              >Ver propriedade</a
            ><a
              :href="`/properties/${encodeURIComponent(data.property_id)}/areas/${encodeURIComponent(data.area_id)}`"
              class="button button--secondary"
              data-link
              >Ver área</a
            ><a
              v-if="data.season_id"
              :href="`/more/seasons/${encodeURIComponent(data.season_id)}`"
              class="button button--secondary"
              data-link
              >Ver safra</a
            >
          </div>
        </section>
        <PlantingHarvests
          v-if="status.online"
          :id="data.id"
          :can-create="canHarvest(data)" /><PlantingFinance
          v-if="status.online"
          :id="data.id" /><PlantingEvents :id="data.id" :archived="isArchived(data)"
      /></template>
      <section v-else class="rural-panel">
        <h2>Plantio não encontrado</h2>
        <p>O registro não existe ou não está disponível para sua conta.</p>
      </section></RequestState
    >
  </div>
</template>
