<script setup>
import { computed, reactive, ref, watch, onMounted, onScopeDispose, nextTick } from 'vue';
import { taskRpc } from '../../services/technicalTaskService.js';
import TaskChecklist from './TaskChecklist.vue';
import TaskComments from './TaskComments.vue';
import {
  validateChecklist,
  responsibleSummary,
  responsibleCsv,
  kanbanGroups,
} from './taskCollaboration.js';
import { useOffline } from '../../offline/useOffline.js';
import { offlineUserId } from '../../offline/runtime.js';
import { localDay, downloadVisitFile } from '../visits/visitFollowup.js';
import {
  taskStatuses,
  taskPriorities,
  taskMatches,
  taskSummary,
  tasksCsv,
  taskCalendar,
  taskDate,
  taskOpen,
} from './taskModel.js';
const props = defineProps({ visitId: String, pending: Boolean });
const { status } = useOffline();
const rows = ref([]),
  context = ref(null),
  truncated = ref(false),
  loading = ref(false),
  saving = ref(false),
  error = ref(''),
  notice = ref('');
const mode = ref('list'),
  editing = ref(''),
  history = ref([]),
  historyId = ref('');
const filters = reactive({
  search: '',
  status: 'open',
  priority: '',
  person: '',
  responsible: '',
  period: '',
  from: '',
  to: '',
});
const boardElement = ref(null);
const observationLabel = ref('');
const form = reactive({
  observation_id: null,
  checklist: [],
  title: '',
  description: '',
  due_date: '',
  priority: 'medium',
  assigned_to: '',
  status: 'pending',
  outcome: '',
  version: 0,
});
const filtered = computed(() =>
  rows.value.filter((t) => taskMatches(t, { ...filters, user: offlineUserId() })),
);
const summary = computed(() => taskSummary(filtered.value));
const responsibleOptions = computed(() => responsibleSummary(rows.value));
const responsible = computed(() => responsibleSummary(filtered.value));
const groups = computed(() =>
  [...new Set(filtered.value.map((t) => t.due_date))]
    .sort()
    .map((date) => ({ date, items: filtered.value.filter((t) => t.due_date === date) })),
);
const active = computed(() =>
  editing.value === 'new' ? null : rows.value.find((t) => t.id === editing.value),
);
const editable = computed(() => editing.value === 'new' || active.value?.can_edit);
const people = ref([]);
let epoch = 0,
  disposed = false,
  timer,
  retry = null;
function clear() {
  ++epoch;
  rows.value = [];
  context.value = null;
  editing.value = '';
  history.value = [];
  historyId.value = '';
  people.value = [];
  loading.value = false;
  saving.value = false;
}
async function load() {
  if (!status.value.online || props.pending || document.hidden) return;
  const token = ++epoch;
  loading.value = true;
  error.value = '';
  try {
    const [data, ctx] = await Promise.all([
      taskRpc('technical_task_list', { p_visit: props.visitId || null }),
      props.visitId
        ? taskRpc('technical_task_context', { p_visit: props.visitId })
        : Promise.resolve(null),
    ]);
    if (disposed || token !== epoch) return;
    rows.value = data?.items || [];
    truncated.value = !!data?.truncated;
    context.value = ctx;
    if (historyId.value && !rows.value.some((t) => t.id === historyId.value)) {
      history.value = [];
      historyId.value = '';
    }
    if (
      editing.value &&
      editing.value !== 'new' &&
      !rows.value.some((t) => t.id === editing.value)
    ) {
      editing.value = '';
      history.value = [];
      historyId.value = '';
    }
  } catch (e) {
    if (!disposed && token === epoch) {
      rows.value = [];
      context.value = null;
      editing.value = '';
      history.value = [];
      error.value = e.message;
    }
  } finally {
    if (token === epoch) loading.value = false;
  }
}
function visibility() {
  if (document.hidden) clear();
  else void load();
}
watch([() => props.visitId, () => props.pending, () => status.value.online], () => {
  clear();
  void load();
});
onMounted(() => {
  void load();
  document.addEventListener('visibilitychange', visibility);
  timer = setInterval(() => {
    if (!saving.value && !document.hidden) void load();
  }, 30000);
});
onScopeDispose(() => {
  disposed = true;
  clear();
  clearInterval(timer);
  document.removeEventListener('visibilitychange', visibility);
});
function create() {
  observationLabel.value = '';
  if (context.value?.collaboration_version !== 40) {
    error.value = 'Execute a etapa 40 de colaboração nas tarefas no Supabase.';
    return;
  }
  editing.value = 'new';
  history.value = [];
  error.value = '';
  notice.value = '';
  people.value = context.value?.people || [];
  Object.assign(form, {
    observation_id: null,
    checklist: [],
    title: 'Retorno da visita',
    description: '',
    due_date: context.value?.next_visit || localDay(),
    priority: 'medium',
    assigned_to: offlineUserId(),
    status: 'pending',
    outcome: '',
    version: 0,
  });
}
async function edit(task) {
  if (!Array.isArray(task.checklist)) {
    error.value = 'Execute a etapa 40 de colaboração nas tarefas no Supabase.';
    return;
  }
  editing.value = task.id;
  history.value = [];
  error.value = '';
  notice.value = '';
  Object.assign(form, task);
  form.checklist = task.checklist.map((item) => ({ ...item }));
  people.value = [{ id: task.assigned_to, name: task.assigned_name }];
  if (task.can_assign) {
    const token = epoch;
    try {
      const ctx = await taskRpc('technical_task_context', { p_visit: task.visit_id });
      if (!disposed && token === epoch && editing.value === task.id) people.value = ctx.people;
    } catch (e) {
      if (!disposed && token === epoch) error.value = e.message;
    }
  }
}
async function save() {
  if (saving.value || (editing.value !== 'new' && !active.value)) return;
  error.value = '';
  notice.value = '';
  let checklist;
  try {
    checklist = validateChecklist(form.checklist);
  } catch (e) {
    error.value = e.message;
    return;
  }
  if (
    !taskDate(form.due_date) ||
    form.title.trim().length < 2 ||
    form.title.length > 160 ||
    form.description.length > 2000 ||
    form.outcome.length > 2000
  ) {
    error.value = 'Confira título, prazo e limites dos textos.';
    return;
  }
  if (editing.value !== 'new' && form.status === 'done' && checklist.some((i) => !i.done)) {
    error.value = 'Conclua os itens do checklist antes de encerrar a tarefa.';
    return;
  }
  const action = editing.value === 'new' ? 'create' : 'update';
  const data =
    action === 'create'
      ? {
          visit_id: props.visitId,
          ...(form.observation_id ? { observation_id: form.observation_id } : {}),
          checklist,
          title: form.title.trim(),
          description: form.description,
          due_date: form.due_date,
          priority: form.priority,
          assigned_to: form.assigned_to,
        }
      : {
          id: active.value.id,
          version: form.version,
          status: form.status,
          outcome: form.outcome,
          ...(editable.value
            ? {
                title: form.title.trim(),
                checklist,
                description: form.description,
                due_date: form.due_date,
                priority: form.priority,
                ...(active.value.can_assign ? { assigned_to: form.assigned_to } : {}),
              }
            : {}),
        };
  const key = JSON.stringify({ action, data });
  if (retry?.key !== key) retry = { key, id: crypto.randomUUID() };
  const token = epoch;
  saving.value = true;
  try {
    await taskRpc('technical_task_command', {
      p_operation: retry.id,
      p_action: action,
      p_data: data,
    });
    if (disposed || token !== epoch) return;
    retry = null;
    editing.value = '';
    saving.value = false;
    notice.value = 'Tarefa salva. A situação foi registrada explicitamente.';
    await load();
  } catch (e) {
    if (!disposed && token === epoch) error.value = e.message;
  } finally {
    if (token === epoch) saving.value = false;
  }
}
async function showHistory(task) {
  history.value = [];
  historyId.value = task.id;
  error.value = '';
  const token = epoch;
  try {
    const data = await taskRpc('technical_task_history', { p_id: task.id });
    if (!disposed && token === epoch) history.value = data;
  } catch (e) {
    if (!disposed && token === epoch) error.value = e.message;
  }
}
function exportCsv() {
  downloadVisitFile(tasksCsv(filtered.value), 'text/csv;charset=utf-8', 'meuagro-tarefas.csv');
}
function exportResponsible() {
  downloadVisitFile(
    responsibleCsv(responsible.value),
    'text/csv;charset=utf-8',
    'meuagro-responsaveis.csv',
  );
}
function addChecklist() {
  if (form.checklist.length < 20)
    form.checklist.push({ id: crypto.randomUUID(), label: '', done: false });
}
function calendar(task) {
  try {
    downloadVisitFile(taskCalendar(task), 'text/calendar;charset=utf-8', 'meuagro-tarefa.ics');
  } catch (e) {
    error.value = e.message;
  }
}
async function createFromObservation(observation) {
  if (!context.value?.can_create) {
    error.value = 'Aguarde o carregamento da visita e confira sua permissão para criar tarefas.';
    return;
  }
  if (context.value.observations_version !== 41) {
    error.value = 'Execute a etapa 41 de evolução das visitas no Supabase.';
    return;
  }
  create();
  if (editing.value !== 'new') return;
  observationLabel.value =
    observation.area_name + (observation.crop_name ? ' • ' + observation.crop_name : '');
  form.observation_id = observation.id;
  form.title = (
    'Acompanhar ' +
    observation.area_name +
    (observation.crop_name ? ' — ' + observation.crop_name : '')
  ).slice(0, 160);
  form.description = [observation.observation, observation.recommendation]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 2000);
  form.due_date = observation.next_visit || context.value.next_visit || localDay();
  form.priority = observation.priority;
  await nextTick();
  boardElement.value?.querySelector('form')?.scrollIntoView({ block: 'start' });
}
defineExpose({ createFromObservation });
const date = (value) => value?.split('-').reverse().join('/');
</script>
<template>
  <section ref="boardElement" class="task-board">
    <h3>{{ visitId ? 'Tarefas desta visita' : 'Agenda e tarefas técnicas' }}</h3>
    <p>
      Transforme as ações combinadas na visita em tarefas com prazo e responsável. Conclusões são
      registradas por uma pessoa; uma nova visita não encerra tarefas automaticamente.
    </p>
    <p v-if="pending">Sincronize esta visita antes de criar ou consultar suas tarefas.</p>
    <p v-else-if="!status.online" role="status">
      Conecte-se para gerenciar tarefas. As visitas e seus rascunhos continuam disponíveis conforme
      o preparo offline.
    </p>
    <template v-else>
      <a v-if="visitId" href="/more/tasks" data-link class="button button--secondary"
        >Abrir agenda completa</a
      >
      <p v-else>Crie tarefas dentro de uma ficha de visita já sincronizada.</p>
      <button
        type="button"
        class="button button--secondary"
        :disabled="loading || saving"
        @click="load"
      >
        Atualizar tarefas
      </button>
      <button
        v-if="context?.can_create"
        type="button"
        class="button button--primary"
        :disabled="saving"
        @click="create"
      >
        Criar tarefa para esta visita
      </button>
      <p v-if="loading" role="status">Carregando tarefas…</p>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <p v-if="truncated">
        Há mais resultados: esta tela carrega até 500 tarefas autorizadas, ordenadas por prazo. Os
        filtros, indicadores e exportações consideram somente essa lista.
      </p>
      <form
        v-if="editing && (editing === 'new' || active)"
        class="rural-panel"
        @submit.prevent="save"
      >
        <h4>{{ editing === 'new' ? 'Nova tarefa' : 'Atualizar tarefa' }}</h4>
        <p v-if="editing === 'new' && form.observation_id">
          Origem: observação de {{ observationLabel }}. Revise os dados antes de salvar.
        </p>
        <p>Alterações são gravadas ao salvar; mantenha esta tela aberta até concluir.</p>
        <fieldset :disabled="saving">
          <label for="task-title">Título *</label
          ><input
            id="task-title"
            v-model="form.title"
            required
            minlength="2"
            maxlength="160"
            :disabled="!editable"
          />
          <label for="task-description">Ação a executar</label
          ><textarea
            id="task-description"
            v-model="form.description"
            maxlength="2000"
            :disabled="!editable"
          />
          <label for="task-due">Prazo *</label
          ><input
            id="task-due"
            v-model="form.due_date"
            type="date"
            required
            :disabled="!editable"
          />
          <label for="task-priority">Prioridade</label
          ><select id="task-priority" v-model="form.priority" :disabled="!editable">
            <option v-for="(label, key) in taskPriorities" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
          <label for="task-assignee">Responsável</label
          ><select
            id="task-assignee"
            v-model="form.assigned_to"
            :disabled="editing === 'new' ? !context?.can_assign : !active?.can_assign"
          >
            <option v-if="!people.some((p) => p.id === form.assigned_to)" :value="form.assigned_to">
              Responsável atual
            </option>
            <option v-for="person in people" :key="person.id" :value="person.id">
              {{ person.name }}
            </option>
          </select>
          <p>
            O responsável receberá o título, a ação, o prazo e a identificação do produtor,
            propriedade e talhão. A ficha completa mantém suas permissões próprias.
          </p>
          <h4>Checklist de execução</h4>
          <p>
            Até 20 itens. Criador e gestão definem as etapas; as pessoas autorizadas na tarefa podem
            marcar sua execução. Para concluir a tarefa, todas as etapas devem estar marcadas.
          </p>
          <div v-for="(item, index) in form.checklist" :key="item.id">
            <label :for="'task-check-' + item.id">Etapa do checklist {{ index + 1 }}</label>
            <input
              :id="'task-check-' + item.id"
              v-model="item.label"
              maxlength="160"
              required
              :disabled="!editable"
            />
            <p v-if="item.done">Etapa já marcada como concluída.</p>
            <button
              v-if="editable"
              type="button"
              class="button button--secondary"
              @click="form.checklist.splice(index, 1)"
            >
              Remover etapa {{ index + 1 }}
            </button>
          </div>
          <button
            v-if="editable"
            type="button"
            class="button button--secondary"
            :disabled="form.checklist.length >= 20"
            @click="addChecklist"
          >
            Adicionar etapa ao checklist
          </button>
          <template v-if="editing !== 'new'">
            <label for="task-state">Situação</label
            ><select id="task-state" v-model="form.status">
              <option v-for="(label, key) in taskStatuses" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
            <label for="task-outcome">Resultado / motivo do encerramento</label
            ><textarea
              id="task-outcome"
              v-model="form.outcome"
              maxlength="2000"
              :required="['done', 'cancelled'].includes(form.status)"
            />
          </template>
          <button class="button button--primary">
            {{ saving ? 'Salvando…' : 'Salvar tarefa' }}
          </button>
          <button type="button" class="button button--secondary" @click="editing = ''">
            Descartar edição
          </button>
        </fieldset>
      </form>
      <details class="task-filters" open>
        <summary>Filtros da agenda</summary>
        <label for="task-search">Buscar tarefa, responsável ou local</label
        ><input id="task-search" v-model="filters.search" type="search" />
        <label for="task-status-filter">Situação</label
        ><select id="task-status-filter" v-model="filters.status">
          <option value="">Todas</option>
          <option value="open">Pendentes e em andamento</option>
          <option v-for="(label, key) in taskStatuses" :key="key" :value="key">{{ label }}</option>
        </select>
        <label for="task-period">Prazo</label
        ><select id="task-period" v-model="filters.period">
          <option value="">Qualquer prazo</option>
          <option value="overdue">Atrasadas e abertas</option>
          <option value="today">Hoje</option>
          <option value="week">Hoje e próximos 7 dias</option>
        </select>
        <label for="task-person-filter">Participação</label
        ><select id="task-person-filter" v-model="filters.person">
          <option value="">Todas as autorizadas</option>
          <option value="mine">Sob minha responsabilidade</option>
          <option value="created">Criadas por mim</option>
        </select>
        <label for="task-responsible">Responsável e contexto</label>
        <select id="task-responsible" v-model="filters.responsible">
          <option value="">Todos os responsáveis autorizados</option>
          <option v-for="person in responsibleOptions" :key="person.key" :value="person.key">
            {{ person.name }} • {{ person.company }}
          </option>
        </select>
        <label for="task-priority-filter">Prioridade</label
        ><select id="task-priority-filter" v-model="filters.priority">
          <option value="">Todas</option>
          <option v-for="(label, key) in taskPriorities" :key="key" :value="key">
            {{ label }}
          </option>
        </select>
        <label for="task-from">Prazo a partir de</label
        ><input id="task-from" v-model="filters.from" type="date" />
        <label for="task-to">Prazo até</label
        ><input id="task-to" v-model="filters.to" type="date" />
      </details>
      <h4>Indicadores da lista filtrada</h4>
      <div class="task-metrics">
        <p>
          <strong>{{ summary.open }}</strong> abertas
        </p>
        <p>
          <strong>{{ summary.overdue }}</strong> atrasadas
        </p>
        <p>
          <strong>{{ summary.doing }}</strong> em andamento
        </p>
        <p>
          <strong>{{ summary.done }}</strong> concluídas
        </p>
      </div>
      <p>
        Indicadores calculados sobre {{ filtered.length }} tarefa(s) da lista carregada. Tarefas
        concluídas e canceladas não contam como atraso.
      </p>
      <button
        type="button"
        class="button button--secondary"
        :disabled="!filtered.length"
        @click="exportCsv"
      >
        Exportar tarefas filtradas (CSV)
      </button>
      <details class="responsible-summary">
        <summary>Resumo por responsável</summary>
        <p>
          Totais da lista filtrada, separados por pessoa e contexto pessoal/empresa. Itens pendentes
          contam somente checklists de tarefas abertas.
        </p>
        <p v-if="!responsible.length">Nenhuma tarefa na seleção atual.</p>
        <article v-for="person in responsible" :key="person.key" class="rural-card">
          <h5>{{ person.name }} • {{ person.company }}</h5>
          <p>
            {{ person.total }} tarefa(s) • {{ person.open }} aberta(s) •
            {{ person.overdue }} atrasada(s) • {{ person.done }} concluída(s)
          </p>
          <p>{{ person.remaining }} item(ns) de checklist pendente(s) em tarefas abertas.</p>
          <button
            type="button"
            class="button button--secondary"
            @click="filters.responsible = person.key"
          >
            Buscar tarefas deste responsável
          </button>
        </article>
        <button
          type="button"
          class="button button--secondary"
          :disabled="!responsible.length"
          @click="exportResponsible"
        >
          Exportar resumo por responsável (CSV)
        </button>
      </details>
      <label for="task-view">Visualização</label
      ><select id="task-view" v-model="mode">
        <option value="list">Lista</option>
        <option value="agenda">Agenda por dia</option>
        <option value="kanban">Kanban por situação</option>
      </select>
      <p v-if="!filtered.length && !loading">Nenhuma tarefa corresponde aos filtros.</p>
      <p v-if="mode === 'kanban'">
        O quadro respeita os filtros acima. Selecione Todas nas situações para ver também tarefas
        concluídas e canceladas. Use Atualizar tarefa para mudar a situação.
      </p>
      <div :class="{ 'task-kanban': mode === 'kanban' }">
        <section
          v-for="group in mode === 'kanban'
            ? kanbanGroups(filtered)
            : mode === 'agenda'
              ? groups
              : [{ date: '', items: filtered }]"
          :key="group.key || group.date"
          :class="{ 'kanban-column': mode === 'kanban' }"
        >
          <h4 v-if="group.title">{{ group.title }} ({{ group.items.length }})</h4>
          <h4 v-if="group.date">{{ date(group.date) }}</h4>
          <article v-for="task in group.items" :key="task.id" class="rural-card task-card">
            <h4>{{ task.title }}</h4>
            <p>
              {{ taskStatuses[task.status] }} • {{ taskPriorities[task.priority] }} • prazo
              {{ date(task.due_date) }}
            </p>
            <p v-if="taskOpen(task) && task.due_date < localDay()">
              <strong>Prazo vencido</strong>
            </p>
            <p>
              {{ task.site_name }} • {{ task.area_name || 'Visita geral' }} •
              {{ task.producer_name }}
            </p>
            <p>
              {{
                task.seller_id
                  ? 'Empresa: ' + (task.company_name || 'Empresa vinculada à visita')
                  : 'Tarefa pessoal'
              }}
            </p>
            <p>Responsável: {{ task.assigned_name }}</p>
            <p class="task-text">{{ task.description || 'Sem descrição adicional.' }}</p>
            <p v-if="task.outcome" class="task-text">Resultado: {{ task.outcome }}</p>
            <TaskChecklist :task="task" :disabled="!!editing || saving" @changed="load" />
            <button
              type="button"
              class="button button--secondary"
              :disabled="saving"
              @click="edit(task)"
            >
              Atualizar tarefa
            </button>
            <button type="button" class="button button--secondary" @click="showHistory(task)">
              Ver histórico da tarefa
            </button>
            <button
              v-if="taskOpen(task)"
              type="button"
              class="button button--secondary"
              @click="calendar(task)"
            >
              Exportar prazo para calendário
            </button>
            <a
              v-if="task.can_open_visit"
              :href="'/more/visits?id=' + task.visit_id + (task.seller_id ? '&team=1' : '')"
              data-link
              class="button button--secondary"
              >Abrir visita de origem</a
            >
            <p v-else>A tarefa foi atribuída a você; a ficha de origem mantém acesso restrito.</p>
            <TaskComments :task-id="task.id" />
            <section v-if="historyId === task.id">
              <h4>Últimas alterações — até 50</h4>
              <p v-if="!history.length">Carregando histórico…</p>
              <article v-for="event in history" :key="event.id">
                <p>
                  {{ new Date(event.created_at).toLocaleString('pt-BR') }} •
                  {{
                    {
                      create: 'Criação',
                      update: 'Atualização',
                      check: 'Checklist',
                      comment: 'Comentário',
                    }[event.action] || 'Atualização'
                  }}
                  • {{ taskStatuses[event.snapshot.status] }} • prazo
                  {{ date(event.snapshot.due_date) }}
                </p>
                <p>
                  Registrada por {{ event.actor_name || 'Integrante autorizado' }} • responsável
                  {{ event.assigned_name || 'Integrante atribuído' }}
                </p>
                <details>
                  <summary>Ver conteúdo registrado</summary>
                  <p>{{ event.snapshot.title }} • {{ taskPriorities[event.snapshot.priority] }}</p>
                  <p class="task-text">{{ event.snapshot.description }}</p>
                  <p v-if="event.snapshot.comment" class="task-text">
                    Comentário: {{ event.snapshot.comment }}
                  </p>
                  <ul v-if="event.snapshot.checklist?.length">
                    <li v-for="item in event.snapshot.checklist" :key="item.id">
                      {{ item.done ? 'Concluído' : 'Pendente' }}: {{ item.label }}
                    </li>
                  </ul>
                  <p v-if="event.snapshot.outcome" class="task-text">
                    Resultado: {{ event.snapshot.outcome }}
                  </p>
                </details>
              </article>
              <button
                type="button"
                class="button button--secondary"
                @click="
                  historyId = '';
                  history = [];
                "
              >
                Fechar histórico
              </button>
            </section>
          </article>
        </section>
      </div>
      <p>
        A exportação de calendário é um arquivo para importação manual, sem alarme ou sincronização
        automática. Alterar uma tarefa aqui não atualiza eventos já importados.
      </p>
    </template>
  </section>
</template>
<style scoped>
.responsible-summary {
  margin: 1.5rem 0;
}
.responsible-summary article {
  margin: 1rem 0;
}
.task-kanban {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: start;
}
.kanban-column {
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--color-border, #d7dfd4);
  border-radius: 0.75rem;
}
.kanban-column .task-card {
  padding: 0.75rem;
  min-width: 0;
  overflow-wrap: anywhere;
}
@media (max-width: 1000px) {
  .task-kanban {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .task-kanban {
    grid-template-columns: 1fr;
  }
}

input,
select,
textarea {
  box-sizing: border-box;
  min-height: 48px;
  padding: 0.75rem;
  border: 1px solid var(--color-border, #d7dfd4);
  border-radius: 0.75rem;
  font: inherit;
}
textarea {
  min-height: 6rem;
}
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--color-primary, #205c3c);
  outline-offset: 2px;
}
label {
  display: block;
  font-weight: 600;
}
.task-filters label {
  margin: 1rem 0 0.35rem;
}
.task-board {
  margin: 1rem 0;
}
.task-card {
  margin: 1rem 0;
}
.task-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}
.task-metrics p {
  border: 1px solid var(--border, #d7dfd4);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin: 0;
}
.task-metrics strong {
  display: block;
  font-size: 1.4rem;
}
.task-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.task-filters {
  margin: 1rem 0;
}
summary {
  cursor: pointer;
  font-weight: 700;
}
fieldset {
  border: 0;
  padding: 0;
  min-width: 0;
}
@media (max-width: 600px) {
  .task-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
