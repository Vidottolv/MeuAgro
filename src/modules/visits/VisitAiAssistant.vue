<script setup>
import { computed, ref, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc, workspaceFunction } from '../../services/workspaceService.js';
import { anamnesisFields } from './visitModel.js';
const props = defineProps({ visitId: { type: String, required: true }, pending: Boolean });
const w = useWorkspace(() =>
  props.pending
    ? Promise.resolve(null)
    : workspaceRpc('visit_ai_context', { p_visit: props.visitId }),
);
const consent = ref(false),
  reviewed = ref(false);
let generation = 0;
watch(
  w.invalidated,
  () => {
    generation++;
    consent.value = false;
    reviewed.value = false;
  },
  { flush: 'sync' },
);
watch(
  () => w.data.value?.source_hash,
  () => {
    consent.value = false;
    reviewed.value = false;
  },
);
watch(
  () => props.pending,
  () => {
    void w.load();
  },
);
const current = computed(() =>
  w.data.value?.jobs?.find(
    (j) => j.source_hash === w.data.value.source_hash && j.model === w.data.value.model,
  ),
);
const sections = {
  questions: 'Perguntas para o retorno',
  attention_points: 'Pontos para conferir em campo',
  next_steps: 'Próximos passos sugeridos',
  limitations: 'Limitações desta análise',
};
const labels = {
  ready: 'Rascunho disponível',
  failed: 'Falha — requer revisão do administrador',
  processing: 'Processamento pendente — atualize o histórico',
};
async function act(review = false) {
  if (w.busy.value || w.loading.value || !w.status.value.online || props.pending) return;
  const scope = generation;
  w.busy.value = true;
  w.error.value = '';
  w.notice.value = '';
  try {
    if (review) {
      if (!reviewed.value || !current.value) return;
      await workspaceRpc('visit_ai_review', { p_id: current.value.id, p_confirm: true });
    } else {
      if (!consent.value || !w.data.value?.enabled) return;
      await workspaceFunction('technical-assistant', {
        action: 'generate',
        visit_id: props.visitId,
        source_hash: w.data.value.source_hash,
        consent: true,
      });
    }
    if (scope !== generation) return;
    w.notice.value = review
      ? 'Sua revisão foi registrada. A anamnese original foi preservada.'
      : 'Histórico atualizado. Confira o resultado abaixo.';
    consent.value = false;
    reviewed.value = false;
    await w.load();
  } catch (e) {
    if (scope === generation) {
      await w.load();
      if (scope === generation) w.error.value = e.message;
    }
  } finally {
    if (scope === generation) w.busy.value = false;
  }
}
</script>
<template>
  <section class="rural-panel visit-ai" aria-label="Apoio de IA à visita">
    <h3>Apoio de IA à visita</h3>
    <p>
      Organize o relato e prepare o retorno com um rascunho de resumo, perguntas e pontos para
      conferir em campo. A IA pode errar; revise com o profissional responsável.
    </p>
    <p v-if="pending">
      Envie primeiro a visita salva neste dispositivo. A análise requer internet.
    </p>
    <p v-else-if="!w.status.value.online">
      Conecte-se para consultar o assistente. Rascunhos de IA não são armazenados para uso offline.
    </p>
    <p v-if="w.loading.value" role="status">Consultando disponibilidade…</p>
    <p v-if="w.error.value" role="alert">{{ w.error.value }}</p>
    <p v-if="w.notice.value" role="status">{{ w.notice.value }}</p>
    <template v-if="w.data.value">
      <p>
        Reserva mensal de análises: {{ w.data.value.requests_used }} /
        {{ w.data.value.requests_limit }}. Cada nova análise reserva 20.000 tokens, inclusive em
        falhas.
      </p>
      <p v-if="!w.data.value.enabled">
        O administrador precisa habilitar o piloto e provisionar uma franquia de IA para sua conta.
      </p>
      <details>
        <summary>Conferir o texto que será enviado à OpenAI</summary>
        <p>
          São enviados trechos de até 1.200 caracteres por campo da anamnese e até cinco
          observações, com até 600 caracteres por relato ou recomendação. Fotos não são enviadas.
          Nomes escritos no texto livre podem aparecer: confira os dados antes de autorizar.
        </p>
        <div class="ai-preview">
          <p><strong>Cultura:</strong> {{ w.data.value.source.crop || 'Não informada' }}</p>
          <dl>
            <template v-for="[key, label] in anamnesisFields" :key="key">
              <dt>{{ label }}</dt>
              <dd>{{ w.data.value.source.anamnesis[key] || 'Não informado' }}</dd>
            </template>
          </dl>
          <div v-for="(item, i) in w.data.value.source.observations" :key="i">
            <h4>Observação {{ i + 1 }} • {{ item.crop || 'Sem cultura específica' }}</h4>
            <p>{{ item.observation }}</p>
            <p>{{ item.recommendation }}</p>
          </div>
        </div>
      </details>
      <template v-if="!current">
        <label class="ai-check"
          ><input
            v-model="consent"
            type="checkbox"
            :disabled="w.busy.value || !w.data.value.enabled"
          />Conferi os trechos e autorizo seu envio à OpenAI para gerar este rascunho.</label
        >
        <button
          class="button"
          :disabled="!consent || !w.data.value.enabled || w.busy.value || w.loading.value"
          @click="act()"
        >
          {{ w.busy.value ? 'Gerando rascunho…' : 'Gerar apoio de IA' }}
        </button>
      </template>
      <p v-else role="status">
        {{ labels[current.status] }}. O mesmo texto e modelo são reutilizados sem uma nova chamada
        ao provedor. Falhas e pendências não são repetidas automaticamente.
      </p>
      <article v-if="current?.status === 'ready' && current.result" class="ai-draft">
        <h4>Rascunho de IA — confira antes de usar</h4>
        <p>{{ current.result.summary }}</p>
        <template v-for="(label, key) in sections" :key="key">
          <h4>{{ label }}</h4>
          <ul v-if="current.result[key]?.length">
            <li v-for="(text, i) in current.result[key]" :key="i">{{ text }}</li>
          </ul>
          <p v-else>Nenhum item sugerido.</p>
        </template>
        <p>
          Este rascunho não é diagnóstico nem prescrição. Ele não altera a anamnese nem entra
          automaticamente no relatório da visita.
        </p>
        <p v-if="current.reviewed_at">
          Revisão registrada pelo usuário em
          {{ new Date(current.reviewed_at).toLocaleString('pt-BR') }}. O registro não certifica a
          correção da IA.
        </p>
        <template v-else>
          <label class="ai-check"
            ><input v-model="reviewed" type="checkbox" :disabled="w.busy.value" />Conferi este
            rascunho e desejo registrar minha revisão.</label
          >
          <button
            class="button button--secondary"
            :disabled="!reviewed || w.busy.value || w.loading.value"
            @click="act(true)"
          >
            Registrar minha revisão
          </button>
        </template>
      </article>
      <details v-if="w.data.value.jobs?.length">
        <summary>Histórico recente de IA</summary>
        <p v-for="job in w.data.value.jobs" :key="job.id">
          {{ new Date(job.created_at).toLocaleString('pt-BR') }} • {{ labels[job.status]
          }}{{
            job.source_hash !== w.data.value.source_hash || job.model !== w.data.value.model
              ? ' • dados ou modelo anteriores'
              : ''
          }}
        </p>
      </details>
    </template>
    <button
      class="button button--secondary"
      :disabled="pending || !w.status.value.online || w.busy.value || w.loading.value"
      @click="w.load"
    >
      Atualizar disponibilidade e histórico
    </button>
  </section>
</template>
<style scoped>
.visit-ai .ai-preview {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 22rem;
  overflow: auto;
  background: #f3f6f2;
  color: #163c29;
  padding: 1rem;
  border-radius: 0.6rem;
  font-size: 0.85rem;
}
.visit-ai summary {
  cursor: pointer;
  font-weight: 600;
  margin: 1rem 0;
}
.ai-preview dt {
  font-weight: 600;
  margin-top: 0.8rem;
}
.ai-preview dd {
  margin: 0.2rem 0;
  white-space: pre-wrap;
}
.visit-ai .ai-check {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin: 1rem 0;
}
.visit-ai .ai-check input {
  width: 1.2rem;
  min-width: 1.2rem;
  height: 1.2rem;
  margin-top: 0.2rem;
}
.ai-draft {
  border-left: 4px solid #779d80;
  padding-left: 1rem;
  margin: 1.4rem 0;
  overflow-wrap: anywhere;
}
.visit-ai button {
  margin: 0.5rem 0;
}
</style>
