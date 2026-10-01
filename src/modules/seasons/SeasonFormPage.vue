<script setup lang="ts">
import { computed } from 'vue';
import { useSeasonForm } from './useSeasonForm';
import { isArchived } from './seasonModel';
import { SEASON_STATUSES } from '../../constants/seasonStatus.js';
import RequestState from '../properties/components/RequestState.vue';
import '../properties/rural.css';
const props = defineProps<{ seasonId?: string; requestedProperty?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const { record, properties, fields, busy, feedback, submit } = useSeasonForm(
  props.seasonId,
  props.requestedProperty || '',
  (id) => emit('saved', id),
);
const { data, loading, error, reload } = record;
const unavailable = computed(
  () => !!fields.propertyId && !properties.data.value.some((p) => p.id === fields.propertyId),
);
</script>
<template>
  <div class="rural-vue">
    <a
      :href="seasonId ? `/more/seasons/${encodeURIComponent(seasonId)}` : '/more/seasons'"
      class="button button--secondary"
      data-link
      >Voltar</a
    >
    <section class="rural-panel">
      <h2>{{ seasonId ? 'Editar safra' : 'Nova safra' }}</h2>
      <p>Organize o período produtivo e a propriedade desta safra.</p>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="seasonId && !data" class="rural-panel"><h3>Safra não encontrada</h3></section>
      <section v-else-if="data && isArchived(data)" class="rural-panel">
        <h3>Safra arquivada</h3>
        <p>Restaure a safra na ficha antes de editar.</p>
      </section>
      <form v-else class="rural-panel" novalidate @submit.prevent="submit">
        <RequestState
          :loading="properties.loading.value"
          :error="properties.error.value"
          retry-label="Tentar carregar propriedades"
          @retry="properties.reload"
          ><p v-if="!properties.data.value.length">
            Cadastre ou restaure uma propriedade para salvar uma safra.
          </p>
          <a
            v-if="!properties.data.value.length"
            href="/properties/new"
            class="button button--secondary"
            data-link
            >Nova propriedade</a
          ></RequestState
        >
        <fieldset :disabled="busy" class="season-fields">
          <div class="field">
            <label for="season-property">Propriedade *</label
            ><select
              id="season-property"
              v-model="fields.propertyId"
              :disabled="properties.loading.value || !!properties.error.value"
            >
              <option value="">Selecione</option>
              <option v-if="unavailable" :value="fields.propertyId" disabled>
                Propriedade indisponível — selecione uma ativa
              </option>
              <option v-for="p in properties.data.value" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>
          <div class="field">
            <label for="season-name">Nome *</label
            ><input id="season-name" v-model="fields.name" maxlength="120" required />
          </div>
          <div class="field">
            <label for="season-status">Status *</label
            ><select id="season-status" v-model="fields.status">
              <option v-for="[value, label] in SEASON_STATUSES" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="rural-grid">
            <div class="field">
              <label for="season-start">Data inicial</label
              ><input id="season-start" v-model="fields.startDate" type="date" />
            </div>
            <div class="field">
              <label for="season-end">Data final</label
              ><input id="season-end" v-model="fields.endDate" type="date" />
            </div>
          </div>
          <div class="field">
            <label for="season-description">Descrição</label
            ><textarea
              id="season-description"
              v-model="fields.description"
              maxlength="800"
              rows="4"
            />
          </div>
        </fieldset>
        <p v-if="feedback" role="alert">{{ feedback }}</p>
        <div class="rural-actions">
          <button
            type="submit"
            class="button button--primary"
            :disabled="
              busy ||
              properties.loading.value ||
              !!properties.error.value ||
              !properties.data.value.length
            "
          >
            {{ busy ? 'Salvando…' : seasonId ? 'Salvar alterações' : 'Cadastrar safra' }}
          </button>
        </div>
      </form></RequestState
    >
  </div>
</template>
<style scoped>
.season-fields {
  display: grid;
  gap: 20px;
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
</style>
