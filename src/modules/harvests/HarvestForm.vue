<script setup lang="ts">
import { reactive, watch, computed } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import RequestState from '../properties/components/RequestState.vue';
import { getHarvest, listCycles, saveHarvest } from './harvestRepository';
import { today, validateHarvest, cycleLabel } from './harvestModel';
import type { HarvestFields } from './harvestTypes';
import { HARVEST_UNITS } from '../../constants/harvestUnits.js';
import { HARVEST_DESTINATIONS } from '../../constants/harvestDestinations.js';
const props = defineProps<{ harvestId?: string; cycleId?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const { data, loading, error, reload } = useResource(async () => {
  const harvest = props.harvestId ? await getHarvest(props.harvestId) : null;
  return { harvest, cycles: harvest ? [harvest.production_cycle] : await listCycles() };
}, null);
const f = reactive<HarvestFields>({
  cycleId: props.cycleId || '',
  harvestDate: today(),
  quantity: '',
  unit: 'kg',
  destination: 'own_consumption',
  qualityClassification: '',
  notes: '',
});
watch(data, (v) => {
  if (v?.harvest) {
    const h = v.harvest;
    Object.assign(f, {
      cycleId: h.production_cycle_id,
      harvestDate: h.harvest_date,
      quantity: String(h.quantity),
      unit: h.unit,
      destination: h.destination,
      qualityClassification: h.quality_classification || '',
      notes: h.notes || '',
    });
  }
});
const selected = computed(() => data.value?.cycles.find((c) => c.id === f.cycleId));
const mutation = useMutation();
function submit() {
  if (loading.value || error.value) return;
  mutation.error.value = validateHarvest(f, selected.value, data.value?.harvest);
  if (!mutation.error.value)
    void mutation.run(
      () => saveHarvest(props.harvestId, { ...f }),
      (id) => emit('saved', id),
    );
}
</script>
<template>
  <div class="rural-vue">
    <a href="/more/harvests" data-link class="button button--secondary">Voltar às colheitas</a>
    <h2>{{ harvestId ? 'Editar colheita' : 'Nova colheita' }}</h2>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><p v-if="harvestId && !data?.harvest">Colheita não encontrada.</p>
      <p v-else-if="data?.harvest?.production_cycle.deleted_at">
        Plantio arquivado. Reative-o para editar.
      </p>
      <form v-else class="rural-panel" @submit.prevent="submit" novalidate>
        <fieldset :disabled="mutation.busy.value || mutation.done.value">
          <div class="field">
            <label for="harvest-cycle">Plantio *</label
            ><select
              id="harvest-cycle"
              v-model="f.cycleId"
              :disabled="Boolean(harvestId || cycleId)"
            >
              <option value="">Selecione</option>
              <option v-for="c in data?.cycles" :key="c.id" :value="c.id">
                {{ cycleLabel(c) }}
              </option>
            </select>
          </div>
          <div class="field">
            <label for="harvest-date">Data da colheita *</label
            ><input
              id="harvest-date"
              v-model="f.harvestDate"
              type="date"
              :min="selected?.planting_date"
            />
          </div>
          <div class="rural-grid">
            <div class="field">
              <label for="harvest-quantity">Quantidade *</label
              ><input id="harvest-quantity" v-model="f.quantity" inputmode="decimal" />
            </div>
            <div class="field">
              <label for="harvest-unit">Unidade *</label
              ><select id="harvest-unit" v-model="f.unit">
                <option v-for="[v, l] in HARVEST_UNITS" :key="v" :value="v">{{ l }}</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label for="harvest-destination">Destino *</label
            ><select id="harvest-destination" v-model="f.destination">
              <option v-for="[v, l] in HARVEST_DESTINATIONS" :key="v" :value="v">{{ l }}</option>
            </select>
          </div>
          <div class="field">
            <label for="harvest-quality">Classificação de qualidade</label
            ><input id="harvest-quality" v-model="f.qualityClassification" maxlength="120" />
          </div>
          <div class="field">
            <label for="harvest-notes">Observações</label
            ><textarea id="harvest-notes" v-model="f.notes" maxlength="1800" rows="4" />
          </div>
        </fieldset>
        <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
        <button
          class="button button--primary"
          :disabled="mutation.busy.value || mutation.done.value"
        >
          {{ mutation.busy.value ? 'Salvando…' : 'Salvar colheita' }}
        </button>
      </form></RequestState
    >
  </div>
</template>
