<script setup lang="ts">
import { computed, ref } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchAreaContext } from './ruralRepository';
import { isArchived, sizeLabel } from './ruralModel';
import { formatDatePtBr } from '../../js/html.js';
import type { Property, Area } from './ruralTypes';
import RequestState from './components/RequestState.vue';
import RecordStatusAction from './components/RecordStatusAction.vue';
import AreaCycles from './components/AreaCycles.vue';
import './rural.css';
const props = defineProps<{ propertyId: string; areaId: string }>();
const { data, loading, error, reload } = useResource(
  () => fetchAreaContext(props.propertyId, props.areaId),
  { property: null, area: null },
);
const item = computed(() => data.value.area),
  property = computed(() => data.value.property);
const statusBusy = ref(false),
  notice = ref('');
function changed(record: Property | Area) {
  data.value = { ...data.value, area: record as Area };
  notice.value = isArchived(record) ? 'Área arquivada.' : 'Área restaurada.';
}
</script>
<template>
  <div class="rural-vue">
    <a
      :href="`/properties/${encodeURIComponent(propertyId)}/areas`"
      class="button button--secondary rural-back"
      data-link
      >Voltar às áreas</a
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="!property || !item" class="rural-panel">
        <h2>Área não encontrada</h2>
        <p>O registro não existe ou não pertence a esta propriedade.</p>
      </section>
      <template v-else
        ><p v-if="notice" role="status">{{ notice }}</p>
        <section v-if="isArchived(property)" class="rural-panel">
          <h3>Propriedade arquivada</h3>
          <p>Restaure a propriedade para alterar a área ou registrar novos plantios.</p>
          <a
            :href="`/properties/${encodeURIComponent(propertyId)}`"
            class="button button--secondary"
            data-link
            >Ver propriedade</a
          >
        </section>
        <section class="rural-panel">
          <p>{{ property.name }}</p>
          <h2>{{ item.name }}</h2>
          <span class="rural-tag">{{ isArchived(item) ? 'Arquivada' : 'Ativa' }}</span>
          <p>{{ item.area_type?.name || 'Sem tipo' }}</p>
          <div class="rural-actions">
            <a
              v-if="!isArchived(item) && !isArchived(property)"
              :href="`/properties/${encodeURIComponent(propertyId)}/areas/${encodeURIComponent(areaId)}/edit`"
              class="button button--secondary"
              data-link
              >Editar área</a
            ><RecordStatusAction
              v-if="!isArchived(property)"
              kind="area"
              :id="item.id"
              :archived="isArchived(item)"
              @changed="changed"
              @busy="statusBusy = $event"
            /><button
              class="button button--secondary"
              :disabled="statusBusy"
              @click="
                notice = '';
                reload();
              "
            >
              Atualizar ficha
            </button>
          </div>
        </section>
        <section class="rural-panel">
          <h3>Dados da área</h3>
          <dl>
            <dt>Tamanho</dt>
            <dd>{{ sizeLabel(item.size, item.unit) }}</dd>
            <dt>Localização interna</dt>
            <dd>{{ item.location_description || 'Não informada' }}</dd>
            <dt>Cadastrada em</dt>
            <dd>{{ formatDatePtBr(item.created_at) }}</dd>
            <dt>Descrição</dt>
            <dd>{{ item.description || 'Nenhuma descrição informada.' }}</dd>
            <dt>Observações</dt>
            <dd>{{ item.notes || 'Nenhuma observação informada.' }}</dd>
          </dl>
        </section>
        <AreaCycles
          v-if="!isArchived(item) && !isArchived(property)"
          :property-id="propertyId"
          :area-id="areaId" /></template
    ></RequestState>
  </div>
</template>
