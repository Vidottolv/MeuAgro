<script setup lang="ts">
import { usePropertyForm } from './usePropertyForm';
import { isArchived } from './ruralModel';
import { BRAZIL_STATES, PROPERTY_AREA_UNITS } from '../../constants/brazilStates.js';
import RequestState from './components/RequestState.vue';
import SizeFields from './components/SizeFields.vue';
import './rural.css';
const props = defineProps<{ propertyId?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const { data, loading, error, reload, fields, busy, feedback, submit } = usePropertyForm(
  props.propertyId,
  (id) => emit('saved', id),
);
const back = props.propertyId
  ? `/properties/${encodeURIComponent(props.propertyId)}`
  : '/properties';
</script>
<template>
  <div class="rural-vue">
    <a v-if="!busy" :href="back" class="button button--secondary rural-back" data-link>Voltar</a>
    <h2>{{ propertyId ? 'Editar propriedade' : 'Nova propriedade' }}</h2>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="propertyId && !data" class="rural-panel">
        <h3>Propriedade não encontrada</h3>
      </section>
      <section v-else-if="data && isArchived(data)" class="rural-panel">
        <h3>Propriedade arquivada</h3>
        <p>Restaure a propriedade antes de editar.</p>
      </section>
      <form v-else novalidate :aria-busy="busy" @submit.prevent="submit">
        <p v-if="feedback" role="alert">{{ feedback }}</p>
        <fieldset :disabled="busy">
          <section class="rural-panel">
            <h3>Dados da propriedade</h3>
            <div class="field">
              <label for="property-name">Nome da propriedade *</label
              ><input id="property-name" v-model="fields.name" maxlength="120" required />
            </div>
            <div class="field">
              <label for="property-description">Descrição</label
              ><textarea
                id="property-description"
                v-model="fields.description"
                maxlength="600"
                rows="3"
              ></textarea>
            </div>
          </section>
          <section class="rural-panel">
            <h3>Localização e tamanho</h3>
            <div class="rural-grid">
              <div class="field">
                <label for="property-city">Cidade</label
                ><input id="property-city" v-model="fields.city" maxlength="120" />
              </div>
              <div class="field">
                <label for="property-state">Estado</label
                ><select id="property-state" v-model="fields.state">
                  <option value="">Selecione</option>
                  <option v-for="[uf, name] in BRAZIL_STATES" :key="uf" :value="uf">
                    {{ uf }} - {{ name }}
                  </option>
                </select>
              </div>
            </div>
            <SizeFields
              id="property-total-area"
              label="Área total"
              v-model:value="fields.totalArea"
              v-model:unit="fields.areaUnit"
              :options="PROPERTY_AREA_UNITS"
            />
          </section>
          <section class="rural-panel">
            <div class="field">
              <label for="property-notes">Observações</label
              ><textarea
                id="property-notes"
                v-model="fields.notes"
                maxlength="1500"
                rows="4"
              ></textarea>
            </div>
          </section>
        </fieldset>
        <div class="rural-actions">
          <a v-if="!busy" :href="back" class="button button--secondary" data-link>Cancelar</a
          ><button class="button button--primary" :disabled="busy" type="submit">
            {{ busy ? 'Salvando…' : propertyId ? 'Salvar alterações' : 'Cadastrar propriedade' }}
          </button>
        </div>
      </form></RequestState
    >
  </div>
</template>
