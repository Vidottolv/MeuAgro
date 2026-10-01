<script setup lang="ts">
import { usePlantingForm } from './usePlantingForm';
import { isArchived } from './plantingModel';
import { PRODUCTION_CYCLE_STATUSES } from '../../constants/productionCycleStatus.js';
import { PLANTED_UNITS } from '../../constants/plantedUnits.js';
import RequestState from '../properties/components/RequestState.vue';
import '../properties/rural.css';
const props = defineProps<{ cycleId?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const {
  base,
  links,
  fields,
  busy,
  feedback,
  submit,
  changeProperty,
  recalculate,
  forecastBusy,
  forecastMessage,
} = usePlantingForm(props.cycleId, new URLSearchParams(location.search), (id) => emit('saved', id));
const { data, loading, error, reload } = base;
</script>
<template>
  <div class="rural-vue">
    <a
      :href="cycleId ? `/plantings/${encodeURIComponent(cycleId)}` : '/plantings'"
      class="button button--secondary"
      data-link
      >Voltar</a
    >
    <section class="rural-panel">
      <h2>{{ cycleId ? 'Editar plantio' : 'Novo plantio' }}</h2>
      <p>Vincule o ciclo a uma área, escolha a cultura e acompanhe a previsão de colheita.</p>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="cycleId && !data.item" class="rural-panel">
        <h3>Plantio não encontrado</h3>
      </section>
      <section v-else-if="data.item && isArchived(data.item)" class="rural-panel">
        <h3>Plantio arquivado</h3>
        <p>Restaure o plantio antes de editar.</p>
      </section>
      <form v-else class="rural-panel" novalidate @submit.prevent="submit">
        <p v-if="!data.properties.length">
          Cadastre ou restaure uma propriedade para registrar um plantio.
        </p>
        <a
          v-if="!data.properties.length"
          href="/properties/new"
          class="button button--secondary"
          data-link
          >Nova propriedade</a
        >
        <fieldset :disabled="busy">
          <legend>Local e cultura</legend>
          <div class="field">
            <label for="cycle-property">Propriedade *</label
            ><select
              id="cycle-property"
              :value="fields.propertyId"
              @change="changeProperty(($event.target as HTMLSelectElement).value)"
            >
              <option value="">Selecione</option>
              <option
                v-if="fields.propertyId && !data.properties.some((p) => p.id === fields.propertyId)"
                :value="fields.propertyId"
                disabled
              >
                Propriedade indisponível
              </option>
              <option v-for="p in data.properties" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <RequestState
            :loading="links.loading.value"
            :error="links.error.value"
            retry-label="Tentar carregar áreas e safras"
            @retry="links.reload"
            ><p v-if="fields.propertyId && !links.data.value.areas.length">
              Esta propriedade não possui áreas disponíveis.
            </p>
            <a
              v-if="fields.propertyId && !links.data.value.areas.length"
              :href="`/properties/${encodeURIComponent(fields.propertyId)}/areas/new`"
              class="button button--secondary"
              data-link
              >Nova área</a
            ></RequestState
          >
          <div class="rural-grid">
            <div class="field">
              <label for="cycle-area">Área *</label
              ><select
                id="cycle-area"
                v-model="fields.areaId"
                :disabled="links.loading.value || !!links.error.value"
              >
                <option value="">Selecione</option>
                <option
                  v-if="
                    fields.areaId && !links.data.value.areas.some((a) => a.id === fields.areaId)
                  "
                  :value="fields.areaId"
                  disabled
                >
                  Área indisponível
                </option>
                <option v-for="a in links.data.value.areas" :key="a.id" :value="a.id">
                  {{ a.name }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="cycle-season">Safra</label
              ><select
                id="cycle-season"
                v-model="fields.seasonId"
                :disabled="links.loading.value || !!links.error.value"
              >
                <option value="">Sem safra</option>
                <option
                  v-if="
                    fields.seasonId &&
                    !links.data.value.seasons.some((s) => s.id === fields.seasonId)
                  "
                  :value="fields.seasonId"
                  disabled
                >
                  Safra indisponível
                </option>
                <option v-for="s in links.data.value.seasons" :key="s.id" :value="s.id">
                  {{ s.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="field">
            <label for="cycle-crop">Cultura *</label
            ><select id="cycle-crop" v-model="fields.cropId">
              <option value="">Selecione</option>
              <option v-for="c in data.crops" :key="c.id" :value="c.id">
                {{ c.name }}{{ c.active === false ? ' (inativa)' : '' }}
              </option>
            </select>
            <p v-if="fields.cropId">
              {{
                data.crops.find((c) => c.id === fields.cropId)?.average_cycle_days
                  ? 'Ciclo médio: ' +
                    data.crops.find((c) => c.id === fields.cropId)?.average_cycle_days +
                    ' dias.'
                  : 'Cultura sem ciclo médio cadastrado.'
              }}
            </p>
            <a
              v-if="!data.crops.length"
              href="/more/crops/new"
              class="button button--secondary"
              data-link
              >Nova cultura</a
            >
          </div>
          <div class="field">
            <label for="cycle-variety">Variedade</label
            ><input id="cycle-variety" v-model="fields.variety" maxlength="160" />
          </div>
          <div class="rural-grid">
            <div class="field">
              <label for="cycle-quantity">Quantidade plantada</label
              ><input id="cycle-quantity" v-model="fields.plantedQuantity" inputmode="decimal" />
            </div>
            <div class="field">
              <label for="cycle-unit">Unidade</label
              ><select id="cycle-unit" v-model="fields.plantedUnit">
                <option value="">Selecione</option>
                <option v-for="[value, label] in PLANTED_UNITS" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </div>
          </div>
          <div class="field">
            <label for="cycle-planting-date">Data do plantio *</label
            ><input id="cycle-planting-date" v-model="fields.plantingDate" type="date" required />
          </div>
          <div class="rural-grid">
            <div class="field">
              <label for="cycle-initial-forecast">Previsão inicial</label
              ><input
                id="cycle-initial-forecast"
                v-model="fields.initialHarvestForecast"
                type="date"
              />
            </div>
            <div class="field">
              <label for="cycle-current-forecast">Previsão atual</label
              ><input
                id="cycle-current-forecast"
                v-model="fields.currentHarvestForecast"
                type="date"
              />
            </div>
          </div>
          <button
            type="button"
            class="button button--secondary"
            :disabled="forecastBusy"
            @click="recalculate"
          >
            {{ forecastBusy ? 'Calculando…' : 'Recalcular previsão' }}
          </button>
          <p v-if="forecastMessage" role="status">{{ forecastMessage }}</p>
          <div class="field">
            <label for="cycle-final-harvest-date">Data real da colheita</label
            ><input id="cycle-final-harvest-date" v-model="fields.finalHarvestDate" type="date" />
          </div>
          <div class="field">
            <label for="cycle-status">Status *</label
            ><select id="cycle-status" v-model="fields.status">
              <option
                v-for="[value, label] in PRODUCTION_CYCLE_STATUSES"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select>
          </div>
          <div class="field">
            <label for="cycle-notes">Observações</label
            ><textarea id="cycle-notes" v-model="fields.notes" maxlength="2000" rows="4" />
          </div>
        </fieldset>
        <p v-if="feedback" role="alert">{{ feedback }}</p>
        <button
          type="submit"
          class="button button--primary"
          :disabled="
            busy ||
            forecastBusy ||
            links.loading.value ||
            !!links.error.value ||
            !data.properties.length ||
            !data.crops.length
          "
        >
          {{ busy ? 'Salvando…' : cycleId ? 'Salvar alterações' : 'Cadastrar plantio' }}
        </button>
      </form></RequestState
    >
  </div>
</template>
