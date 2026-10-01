<script setup lang="ts">
import { computed } from 'vue';
import { useAreaForm } from './useAreaForm';
import { AREA_UNITS } from '../../constants/areaUnits.js';
import { isArchived } from './ruralModel';
import RequestState from './components/RequestState.vue';
import SizeFields from './components/SizeFields.vue';
import AreaTypeDialog from './components/AreaTypeDialog.vue';
import './rural.css';
const props = defineProps<{ propertyId: string; areaId?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const {
  data,
  loading,
  error,
  reload,
  types,
  fields,
  busy,
  feedback,
  blocked,
  typeOpen,
  typeCreated,
  submit,
} = useAreaForm(props.propertyId, props.areaId, (id) => emit('saved', id));
const { data: items, loading: typesLoading, error: typesError, reload: reloadTypes } = types;
const selectedType = computed(() => items.value.find((item) => item.id === fields.areaTypeId));
const back = `/properties/${encodeURIComponent(props.propertyId)}/areas${props.areaId ? '/' + encodeURIComponent(props.areaId) : ''}`;
</script>
<template>
  <div class="rural-vue">
    <a v-if="!busy" :href="back" class="button button--secondary rural-back" data-link>Voltar</a>
    <h2>{{ areaId ? 'Editar área' : 'Nova área' }}</h2>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="blocked" class="rural-panel">
        <h3>
          {{
            !data.property
              ? 'Propriedade não encontrada'
              : isArchived(data.property)
                ? 'Propriedade arquivada'
                : !data.area
                  ? 'Área não encontrada'
                  : 'Área arquivada'
          }}
        </h3>
        <p>Confira o cadastro e restaure os registros arquivados antes de alterar a área.</p>
        <a
          :href="`/properties/${encodeURIComponent(propertyId)}`"
          class="button button--secondary"
          data-link
          >Ver propriedade</a
        >
      </section>
      <form v-else novalidate :aria-busy="busy" @submit.prevent="submit">
        <p>{{ data.property?.name }}</p>
        <p v-if="feedback" role="alert">{{ feedback }}</p>
        <fieldset :disabled="busy || typeOpen">
          <section class="rural-panel">
            <h3>Identificação da área</h3>
            <div class="field">
              <label for="area-name">Nome da área *</label
              ><input id="area-name" v-model="fields.name" maxlength="120" required />
            </div>
            <p v-if="typesLoading" role="status">Carregando tipos…</p>
            <div v-if="typesError" role="alert">
              <p>{{ typesError }}</p>
              <button type="button" class="button button--secondary" @click="reloadTypes">
                Tentar carregar tipos
              </button>
            </div>
            <div class="field">
              <label for="area-type">Tipo da área *</label
              ><select
                id="area-type"
                v-model="fields.areaTypeId"
                :disabled="typesLoading || Boolean(typesError)"
              >
                <option value="">Selecione</option>
                <option v-for="item in items" :key="item.id" :value="item.id">
                  {{ item.name }}
                </option></select
              ><small v-if="selectedType">{{
                selectedType.description ||
                (selectedType.is_system ? 'Tipo padrão do Meu Agro.' : 'Tipo personalizado.')
              }}</small>
            </div>
            <button
              type="button"
              class="button button--secondary"
              :disabled="typesLoading || Boolean(typesError)"
              @click="typeOpen = true"
            >
              Novo tipo de área
            </button>
            <div class="field">
              <label for="area-description">Descrição</label
              ><textarea
                id="area-description"
                v-model="fields.description"
                maxlength="600"
                rows="3"
              ></textarea>
            </div>
          </section>
          <section class="rural-panel">
            <h3>Tamanho e localização</h3>
            <SizeFields
              id="area-size"
              label="Tamanho da área"
              v-model:value="fields.size"
              v-model:unit="fields.unit"
              :options="AREA_UNITS"
            />
            <div class="field">
              <label for="area-location">Localização interna</label
              ><input
                id="area-location"
                v-model="fields.locationDescription"
                maxlength="240"
                placeholder="Ex.: próximo à entrada principal"
              />
            </div>
          </section>
          <section class="rural-panel">
            <div class="field">
              <label for="area-notes">Observações</label
              ><textarea
                id="area-notes"
                v-model="fields.notes"
                maxlength="1500"
                rows="4"
              ></textarea>
            </div>
          </section>
        </fieldset>
        <div class="rural-actions">
          <a v-if="!busy" :href="back" class="button button--secondary" data-link>Cancelar</a
          ><button
            class="button button--primary"
            :disabled="busy || typeOpen || typesLoading || Boolean(typesError)"
            type="submit"
          >
            {{ busy ? 'Salvando…' : areaId ? 'Salvar alterações' : 'Cadastrar área' }}
          </button>
        </div>
      </form></RequestState
    ><AreaTypeDialog v-if="typeOpen" @close="typeOpen = false" @created="typeCreated" />
  </div>
</template>
