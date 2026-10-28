<script setup>
import { ref, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc } from '../../services/workspaceService.js';
import { downloadVisitFile } from '../visits/visitFollowup.js';
import { makeSupportDiagnostic } from './supportDiagnostic.js';
import '../properties/rural.css';
const props = defineProps({ adminMode: Boolean });
const offset = ref(0);
const w = useWorkspace(() =>
  workspaceRpc(
    props.adminMode ? 'app_operations_admin' : 'app_operations_context',
    props.adminMode ? { p_offset: offset.value } : {},
  ),
);
const { data, error, notice, loading, busy, status } = w;
const kind = ref('export'),
  confirmed = ref(false),
  selected = ref(null),
  answer = ref(''),
  nextStatus = ref('review');
const labels = {
  open: 'Aberta',
  review: 'Em atendimento',
  fulfilled: 'Atendimento concluído',
  declined: 'Não atendida — veja a resposta',
  withdrawn: 'Retirada pelo solicitante',
};
const kindLabel = (k) => (k === 'delete' ? 'Exclusão de dados' : 'Exportação de dados');
const date = (v) => new Date(v).toLocaleString('pt-BR');
watch(w.invalidated, () => {
  selected.value = null;
  answer.value = '';
  confirmed.value = false;
});
watch(kind, () => {
  confirmed.value = false;
});
async function submit() {
  if (!confirmed.value) return;
  await w.command('app_privacy_submit', { p_kind: kind.value }, () => {
    confirmed.value = false;
  });
}
async function withdraw(r) {
  if (!confirm('Retirar esta solicitação ainda não iniciada?')) return;
  await w.command('app_privacy_withdraw', { p_id: r.id, p_version: r.version });
}
function choose(r) {
  selected.value = r;
  answer.value = '';
  nextStatus.value = r.status === 'open' ? 'review' : 'fulfilled';
}
async function review() {
  const r = selected.value;
  if (!r || !confirmed.value) return;
  await w.command(
    'app_privacy_review',
    { p_id: r.id, p_version: r.version, p_status: nextStatus.value, p_note: answer.value },
    () => {
      selected.value = null;
      answer.value = '';
      confirmed.value = false;
    },
  );
}
function download() {
  if (!data.value || props.adminMode) return;
  downloadVisitFile(
    JSON.stringify(makeSupportDiagnostic(data.value, status.value), null, 2),
    'application/json',
    'meuagro-diagnostico.json',
  );
}
async function page(delta) {
  offset.value = Math.max(0, offset.value + delta);
  selected.value = null;
  confirmed.value = false;
  await w.load();
}
</script>
<template>
  <div class="rural-vue operations-page">
    <h2>{{ adminMode ? 'Operação e atendimento do MeuAgro' : 'Diagnóstico e privacidade' }}</h2>
    <p>
      Consulta manual do estado registrado. Esta tela não testa a disponibilidade dos provedores nem
      repete operações automaticamente.
    </p>
    <p v-if="!status.online">Conecte-se para consultar o servidor e acompanhar solicitações.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <button
      class="button button--secondary"
      :disabled="busy || loading || !status.online"
      @click="w.load"
    >
      Atualizar diagnóstico
    </button>
    <p v-if="loading">Consultando registros…</p>
    <template v-if="data">
      <p>Consulta em {{ date(data.generated_at) }}.</p>
      <template v-if="!adminMode">
        <section class="rural-panel">
          <h3>Recuperação de pendências</h3>
          <p>
            Envios pendentes neste dispositivo: {{ status.pending || 0 }}. A fila local não é
            visível em outros aparelhos.
          </p>
          <p>
            Contratações que pedem revisão: {{ data.checkout_review }}. Conferência de cobrança
            pendente há mais de cinco minutos: {{ data.billing_pending ? 'Sim' : 'Não' }}.
          </p>
          <p v-if="data.satellite">
            Satélite: {{ data.satellite.images_pending }} imagens e
            {{ data.satellite.searches_pending }} buscas pendentes há mais de cinco minutos;
            {{ data.satellite.images_failed }} imagens e {{ data.satellite.searches_failed }} buscas
            com falha no histórico.
          </p>
          <p>
            Uma pendência não prova falha definitiva. Antes de tentar novamente, confira o histórico
            e a fila. Não limpe os dados do navegador nem reinstale o aplicativo enquanto houver
            envios locais sem backup.
          </p>
          <div class="rural-actions">
            <a href="/more/settings" data-link>Fila e backup offline</a
            ><a href="/more/account-plan" data-link>Conferir cobrança e plano</a
            ><a href="/more/satellite" data-link>Histórico do satélite</a>
          </div>
          <button class="button button--secondary" @click="download">
            Baixar diagnóstico resumido
          </button>
          <p>
            O arquivo contém contagens e estado da conexão, sem fotos, nomes, tokens ou conteúdo de
            visitas. Revise-o antes de compartilhar. Ele não é um backup dos seus dados.
          </p>
        </section>
        <section class="rural-panel">
          <h3>Solicitar atendimento sobre seus dados</h3>
          <p>
            A exportação completa e a exclusão são atendidas pela administração. Registrar um pedido
            não exporta, apaga ou desativa a conta, não cancela cobranças e não remove cópias salvas
            em dispositivos. Você acompanhará a resposta abaixo.
          </p>
          <form @submit.prevent="submit">
            <label for="privacy-kind">Tipo de solicitação</label>
            <select id="privacy-kind" v-model="kind" :disabled="busy">
              <option value="export">Exportação de dados</option>
              <option value="delete">Exclusão de dados</option>
            </select>
            <label
              ><input v-model="confirmed" type="checkbox" :disabled="busy" /> Confirmo que desejo
              solicitar este atendimento e entendo que será feita uma revisão.</label
            >
            <button class="button button--primary" :disabled="busy || loading || !confirmed">
              Registrar solicitação
            </button>
          </form>
          <p>
            Um pedido aberto por tipo; novos pedidos do mesmo tipo aguardam ao menos 24 horas.
            Mostramos as 30 solicitações mais recentes.
          </p>
        </section>
        <a v-if="data.is_admin" href="/more/operations-admin" data-link
          >Operação e atendimento da plataforma</a
        >
      </template>
      <section v-else class="rural-panel">
        <h3>Pontos para revisão administrativa</h3>
        <p>
          Diagnósticos de cobrança com erro ou vínculo não resolvido, atualizados nas últimas 24
          horas: {{ data.billing_errors_24h }}.
        </p>
        <p>
          Contratações para revisão: {{ data.checkout_review }} • Solicitações de dados abertas ou
          em atendimento: {{ data.privacy_open }}.
        </p>
        <a href="/more/platform-admin" data-link>Abrir administração de planos e cobranças</a>
        <p>
          Não reenvie eventos nem altere reservas só para zerar os indicadores. Registre a causa e
          confira a operação no provedor antes de recuperar.
        </p>
      </section>
      <h3>Solicitações de dados</h3>
      <p v-if="!data.requests.length">Nenhuma solicitação neste histórico.</p>
      <article v-for="r in data.requests" :key="r.id" class="rural-panel">
        <h4>{{ kindLabel(r.kind) }} • {{ labels[r.status] }}</h4>
        <p>Protocolo: {{ r.id }} • Criado em {{ date(r.created_at) }}.</p>
        <p v-if="adminMode">Conta solicitante: {{ r.user_id }}.</p>
        <p v-if="r.note">Resposta do atendimento: {{ r.note }}</p>
        <p v-if="r.status === 'fulfilled'">
          O status registra a conclusão informada pelo atendimento. Confira a resposta para saber o
          escopo e como acessar uma eventual exportação.
        </p>
        <button
          v-if="!adminMode && r.status === 'open'"
          class="button button--secondary"
          :disabled="busy || loading"
          @click="withdraw(r)"
        >
          Retirar solicitação
        </button>
        <button
          v-if="adminMode && ['open', 'review'].includes(r.status)"
          class="button button--secondary"
          :disabled="busy || loading"
          @click="
            choose(r);
            confirmed = false;
          "
        >
          Atender solicitação
        </button>
      </article>
      <form v-if="adminMode && selected" class="rural-panel" @submit.prevent="review">
        <h3>Atender protocolo {{ selected.id }}</h3>
        <label for="privacy-status">Próxima situação</label>
        <select id="privacy-status" v-model="nextStatus" :disabled="busy">
          <option v-if="selected.status === 'open'" value="review">Em atendimento</option>
          <option v-if="selected.status === 'review'" value="fulfilled">
            Atendimento concluído
          </option>
          <option value="declined">Não atendida</option>
        </select>
        <label for="privacy-answer">Resposta visível ao solicitante</label>
        <textarea
          id="privacy-answer"
          v-model="answer"
          minlength="10"
          maxlength="500"
          required
          :disabled="busy"
        ></textarea>
        <p>
          Não inclua senhas, tokens, dados de terceiros nem links públicos com arquivos pessoais.
          Conclua somente após executar e verificar o atendimento por canal seguro; salvar a
          situação não executa exclusão ou exportação.
        </p>
        <label
          ><input v-model="confirmed" type="checkbox" :disabled="busy" /> Conferi a situação e o
          conteúdo da resposta.</label
        >
        <button class="button button--primary" :disabled="busy || loading || !confirmed">
          Salvar atendimento
        </button>
      </form>
      <div v-if="adminMode" class="rural-actions">
        <button :disabled="busy || loading || !offset" @click="page(-30)">Anteriores</button
        ><span
          >{{ data.count ? offset + 1 : 0 }}–{{ offset + data.requests.length }} de
          {{ data.count }}</span
        ><button :disabled="busy || loading || offset + 30 >= data.count" @click="page(30)">
          Próximas
        </button>
      </div>
    </template>
  </div>
</template>
<style scoped>
.operations-page p {
  overflow-wrap: anywhere;
}
.operations-page select,
.operations-page textarea {
  display: block;
  width: 100%;
  max-width: 100%;
  padding: 0.7rem;
  margin: 0.5rem 0;
  font: inherit;
}
.operations-page label {
  display: block;
  margin: 0.7rem 0;
}
.operations-page .button {
  margin: 0.5rem 0.5rem 0.5rem 0;
}
.operations-page input[type='checkbox'] {
  width: auto;
  display: inline-block;
  margin: 0 0.5rem 0 0;
}
</style>
