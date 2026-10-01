<script setup lang="ts">
import { ref } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchProperty } from './ruralRepository';
import { isArchived, propertyLocation, sizeLabel } from './ruralModel';
import { formatDatePtBr } from '../../js/html.js';
import type { Property, Area } from './ruralTypes';
import RequestState from './components/RequestState.vue';
import RecordStatusAction from './components/RecordStatusAction.vue';
import PropertyAreas from './components/PropertyAreas.vue';
import PropertySeasons from './components/PropertySeasons.vue';
import './rural.css';
const props = defineProps<{ propertyId: string }>();
const {
  data: item,
  loading,
  error,
  reload,
} = useResource(() => fetchProperty(props.propertyId), null);
const statusBusy = ref(false),
  notice = ref('');
function changed(record: Property | Area) {
  item.value = record as Property;
  notice.value = isArchived(record) ? 'Propriedade arquivada.' : 'Propriedade restaurada.';
}
</script>
<template>
  <div class="rural-vue">
    <a href="/properties" class="button button--secondary rural-back" data-link
      >Voltar às propriedades</a
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="!item" class="rural-panel">
        <h2>Propriedade não encontrada</h2>
        <p>O registro não existe ou não está disponível para sua conta.</p>
      </section>
      <template v-else
        ><p v-if="notice" role="status">{{ notice }}</p>
        <section class="rural-panel">
          <h2>{{ item.name }}</h2>
          <span class="rural-tag">{{ isArchived(item) ? 'Arquivada' : 'Ativa' }}</span>
          <p>{{ propertyLocation(item) }}</p>
          <div class="rural-actions">
            <a
              v-if="!isArchived(item)"
              :href="`/properties/${encodeURIComponent(item.id)}/edit`"
              class="button button--secondary"
              data-link
              >Editar propriedade</a
            ><RecordStatusAction
              kind="property"
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
          <h3>Dados da propriedade</h3>
          <dl>
            <dt>Localização</dt>
            <dd>{{ propertyLocation(item) }}</dd>
            <dt>Área total</dt>
            <dd>{{ sizeLabel(item.total_area, item.area_unit, true) }}</dd>
            <dt>Cadastrada em</dt>
            <dd>{{ formatDatePtBr(item.created_at) }}</dd>
            <dt>Descrição</dt>
            <dd>{{ item.description || 'Nenhuma descrição informada.' }}</dd>
            <dt>Observações</dt>
            <dd>{{ item.notes || 'Nenhuma observação informada.' }}</dd>
          </dl>
        </section>
        <template v-if="!isArchived(item)"
          ><PropertyAreas :property-id="item.id" /><PropertySeasons :property-id="item.id"
        /></template>
        <p v-else>Restaure a propriedade para voltar a gerenciar suas áreas e safras.</p></template
      ></RequestState
    >
  </div>
</template>
