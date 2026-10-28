<script setup>
import { computed, ref } from 'vue';
import {
  monitoringSummary,
  observationHistory,
  observationsBatchCsv,
  observationsCalendar,
} from './visitMonitoring.js';
import { downloadVisitFile } from './visitFollowup.js';
import { taskPriorities } from '../tasks/taskModel.js';
const props = defineProps({ visits: { type: Array, default: () => [] }, team: Boolean });
const summary = computed(() => monitoringSummary(props.visits));
const history = computed(() => observationHistory(props.visits));
const error = ref('');
function exportFile(calendar) {
  error.value = '';
  try {
    downloadVisitFile(
      calendar ? observationsCalendar(props.visits) : observationsBatchCsv(props.visits),
      calendar ? 'text/calendar;charset=utf-8' : 'text/csv;charset=utf-8',
      calendar ? 'meuagro-retornos-observacoes.ics' : 'meuagro-observacoes.csv',
    );
  } catch (e) {
    error.value = e.message || 'Não foi possível exportar. Tente pelo navegador.';
  }
}
</script>
<template>
  <section class="rural-panel" aria-label="Acompanhamento das observações">
    <h3>Acompanhamento das observações</h3>
    <p>
      Somente as visitas carregadas que atendem aos filtros atuais. Os retornos são sugestões; não
      indicam tarefas concluídas ou pendentes.
    </p>
    <dl class="monitoring-summary">
      <div>
        <dt>Visitas</dt>
        <dd>{{ summary.visits }}</dd>
      </div>
      <div>
        <dt>Observações</dt>
        <dd>{{ summary.observations }}</dd>
      </div>
      <div>
        <dt>Prioridade alta ou urgente</dt>
        <dd>{{ summary.high }}</dd>
      </div>
      <div>
        <dt>Retorno anterior a hoje</dt>
        <dd>{{ summary.past }}</dd>
      </div>
      <div>
        <dt>Retorno hoje</dt>
        <dd>{{ summary.today }}</dd>
      </div>
      <div>
        <dt>Visitas aguardando envio</dt>
        <dd>{{ summary.pending }}</dd>
      </div>
    </dl>
    <div class="monitoring-actions">
      <button
        type="button"
        class="button button--secondary"
        :disabled="!summary.observations"
        @click="exportFile(false)"
      >
        Exportar observações filtradas (CSV)
      </button>
      <button
        type="button"
        class="button button--secondary"
        :disabled="!visits.some((v) => v.field_observations?.some((o) => o.next_visit))"
        @click="exportFile(true)"
      >
        Exportar retornos das observações (ICS)
      </button>
    </div>
    <p>
      O calendário cria eventos de dia inteiro, sem alarmes. A importação é manual e não acompanha
      mudanças futuras. Dados de visitas aguardando envio também entram na exportação.
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
    <details>
      <summary>Histórico por talhão e cultura ({{ history.length }} grupos)</summary>
      <p>
        Mais recente primeiro em cada grupo. Registros de autores diferentes e setores com nomes
        diferentes permanecem separados. A sequência registra achados; não comprova evolução ou
        resolução de um problema.
      </p>
      <p v-if="!history.length">Nenhuma observação nos filtros atuais.</p>
      <details v-for="group in history" :key="group.key" class="monitoring-group">
        <summary>
          {{ group.site }} / {{ group.area }} / {{ group.crop || 'Cultura não informada' }} —
          {{ group.items.length }} registro(s)
        </summary>
        <p>{{ group.producer }}</p>
        <article v-for="{ visit, observation } in group.items" :key="visit.id + observation.id">
          <h4>
            {{ new Date(visit.visited_at).toLocaleString('pt-BR') }} —
            {{ taskPriorities[observation.priority] }}
          </h4>
          <p>
            {{ visit.technician_name }}<span v-if="visit.offline_pending"> • Aguardando envio</span>
          </p>
          <p class="monitoring-text">{{ observation.observation }}</p>
          <p class="monitoring-text">Ação: {{ observation.recommendation || 'Não informada' }}</p>
          <p v-if="observation.next_visit">
            Retorno: {{ observation.next_visit.split('-').reverse().join('/') }}
          </p>
          <a
            class="button button--secondary"
            :href="'/more/visits?id=' + encodeURIComponent(visit.id) + (team ? '&team=1' : '')"
            data-link
            >Abrir visita de origem</a
          >
        </article>
      </details>
    </details>
  </section>
</template>
<style scoped>
.monitoring-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 1rem;
}
.monitoring-summary dd {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}
.monitoring-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.monitoring-group {
  margin: 1rem 0;
  border-top: 1px solid var(--color-border, #d7dfd4);
  padding-top: 1rem;
}
summary {
  cursor: pointer;
  padding: 0.5rem 0;
  overflow-wrap: anywhere;
}
article {
  border-left: 3px solid var(--color-primary, #205c3c);
  padding-left: 1rem;
  margin: 1rem 0;
}
.monitoring-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
