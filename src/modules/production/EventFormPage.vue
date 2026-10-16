<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { context, saveEvent } from './productionRepository';
import { validateEvent } from './productionModel';
import { useMutation } from './useMutation';
import { PRODUCTION_EVENT_TYPES } from '../../constants/productionEventTypes.js';
import { toDateTimeLocalValue } from '../../js/html.js';
import RequestState from '../properties/components/RequestState.vue';
import '../properties/rural.css';
const props = defineProps<{ cycleId: string; eventId?: string }>();
const emit = defineEmits<{ saved: [] }>();
const { data, loading, error, reload } = useResource(() => context(props.cycleId, props.eventId), {
  planting: null,
  event: null,
});
const fields = reactive({
  eventType: 'observation',
  title: '',
  occurredAt: toDateTimeLocalValue(new Date()),
  description: '',
  notes: '',
});
const mutation = useMutation();
watch(data, ({ event }) => {
  if (event)
    Object.assign(fields, {
      eventType: event.event_type,
      title: event.title,
      occurredAt: toDateTimeLocalValue(new Date(event.occurred_at)),
      description: event.description || '',
      notes: event.notes || '',
    });
});
function submit() {
  if (
    loading.value ||
    error.value ||
    !data.value.planting ||
    data.value.planting.deleted_at ||
    (props.eventId && !data.value.event)
  )
    return;
  mutation.error.value = validateEvent(fields);
  if (!mutation.error.value)
    void mutation.run(
      () => saveEvent(props.cycleId, props.eventId, { ...fields }),
      () => emit('saved'),
    );
}
</script>
<template>
  <div class="rural-vue">
    <a
      :href="`/plantings/${encodeURIComponent(cycleId)}#timeline`"
      class="button button--secondary"
      data-link
      >Voltar ao plantio</a
    >
    <section class="rural-panel">
      <h2>{{ eventId ? 'Editar evento' : 'Novo evento' }}</h2>
      <p v-if="!eventId">
        O evento será salvo neste dispositivo e enviado quando houver conexão. Confira o envio em
        Configurações.
      </p>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="!data.planting || (eventId && !data.event)" class="rural-panel">
        <h3>Plantio ou evento não encontrado</h3>
        <p>O evento precisa pertencer a este plantio.</p>
      </section>
      <section v-else-if="data.planting.deleted_at" class="rural-panel">
        <h3>Plantio arquivado</h3>
        <p>Restaure o plantio para registrar alterações.</p>
      </section>
      <form v-else class="rural-panel" novalidate @submit.prevent="submit">
        <fieldset :disabled="mutation.busy.value || mutation.done.value">
          <div class="field">
            <label for="event-type">Tipo *</label
            ><select id="event-type" v-model="fields.eventType">
              <option v-for="[value, label] in PRODUCTION_EVENT_TYPES" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="field">
            <label for="event-title">Título *</label
            ><input id="event-title" v-model="fields.title" maxlength="180" />
          </div>
          <div class="field">
            <label for="event-date">Data e horário *</label
            ><input id="event-date" v-model="fields.occurredAt" type="datetime-local" />
          </div>
          <div class="field">
            <label for="event-description">Descrição</label
            ><textarea
              id="event-description"
              v-model="fields.description"
              maxlength="1600"
              rows="4"
            />
          </div>
          <div class="field">
            <label for="event-notes">Observações</label
            ><textarea id="event-notes" v-model="fields.notes" maxlength="1600" rows="4" />
          </div>
        </fieldset>
        <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
        <button
          class="button button--primary"
          :disabled="mutation.busy.value || mutation.done.value"
        >
          {{
            mutation.busy.value ? 'Salvando…' : eventId ? 'Salvar alterações' : 'Registrar evento'
          }}
        </button>
      </form></RequestState
    >
  </div>
</template>
