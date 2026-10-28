<script setup>
import { computed, ref } from 'vue';
import {
  managementWorkspace,
  managementCommand,
  managementError,
} from '../../services/managementService.js';
import { useSensitiveResource as useResource } from '../shared/useSensitiveResource';
import { useCommand } from './useCommand';
import { field, text, when } from './tradeModel';
import { approvalStatus, localTime } from './managementModel';
import CommandForm from './CommandForm.vue';
const request = new URLSearchParams(location.search).get('request');
const { data, loading, error, reload } = useResource(async () => {
  if (!request) throw Error('Selecione uma negociação para acompanhar.');
  return managementWorkspace(request);
}, null);
const command = useCommand(
    managementCommand,
    async () => {
      await reload();
      if (error.value) throw Error(error.value);
    },
    managementError,
  ),
  version = ref(0),
  validation = ref('');
const busy = computed(() => loading.value || command.busy.value || command.committed.value);
async function submit(action, value) {
  const payload = { ...value, request_id: request };
  validation.value = '';
  if (action === 'followup') {
    payload.expected_version = data.value.followup?.version || 0;
    if (value.due_at) {
      const d = new Date(value.due_at);
      if (!Number.isFinite(d.getTime())) {
        validation.value = 'Informe uma data válida.';
        return;
      }
      payload.due_at = d.toISOString();
    }
  }
  await command.run(action, payload);
  if (!command.error.value) version.value++;
}
async function refresh() {
  await reload();
  if (!error.value) command.committed.value = false;
}
</script>
<template>
  <div class="rural-vue">
    <a
      v-if="request"
      :href="'/consultor/negociacoes?request=' + encodeURIComponent(request)"
      data-link
      class="button button--secondary"
      >Voltar à negociação</a
    >
    <h2>Somente para a equipe</h2>
    <p>O produtor não recebe estas notas nem os lembretes internos.</p>
    <p v-if="loading" role="status">Atualizando acompanhamento…</p>
    <p v-if="error || command.error.value || validation" role="alert">
      {{ validation || command.error.value || error }}
    </p>
    <p v-if="command.message.value" role="status">{{ command.message.value }}</p>
    <button
      v-if="error || command.committed.value"
      class="button button--secondary"
      :disabled="loading"
      @click="refresh"
    >
      Atualizar acompanhamento</button
    ><template v-if="data"
      ><section class="rural-panel">
        <h3>Próxima ação</h3>
        <CommandForm
          :key="data.followup?.version || 0"
          :fields="[
            field('body', 'Próxima ação', data.followup?.next_action || '', { maxlength: 500 }),
            field('due_at', 'Data e hora do retorno', localTime(data.followup?.due_at), {
              type: 'datetime-local',
            }),
          ]"
          :busy="busy"
          label="Salvar próxima ação"
          @submit="submit('followup', $event)"
        />
      </section>
      <section class="rural-panel">
        <h3>Notas internas</h3>
        <p v-if="data.notes.length === 100">Exibindo as últimas 100 notas.</p>
        <CommandForm
          :key="version"
          :fields="[{ ...text('body', 'Nova nota interna'), required: true }]"
          :busy="busy"
          label="Adicionar nota"
          @submit="submit('note', $event)"
        />
        <p v-if="!data.notes.length">Nenhuma nota interna.</p>
        <article v-for="n in data.notes" :key="n.id" class="rural-card">
          <strong>{{ n.author }}</strong>
          <p>{{ when(n.created_at) }}</p>
          <p class="manager-note">{{ n.body }}</p>
        </article>
      </section>
      <section class="rural-panel">
        <h3>Solicitações de desconto</h3>
        <p v-if="!data.approvals.length">Nenhuma solicitação.</p>
        <p v-for="a in data.approvals" :key="a.id">
          {{ when(a.created_at) }} • {{ approvalStatus[a.status] }}
          {{ a.reason ? ' • ' + a.reason : '' }}
        </p>
      </section></template
    >
  </div>
</template>
