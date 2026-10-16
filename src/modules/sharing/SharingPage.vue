<script setup>
import { ref, computed, watch, onMounted, onScopeDispose } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import { listActiveProperties } from '../../services/propertyService.js';
import { listTechnicalVisits } from '../../services/technicalVisitService.js';
import {
  listPropertyShares,
  propertyShareDetail,
  propertyShareCommand,
} from '../../services/propertySharingService.js';
import { offlineUserId } from '../../offline/runtime.js';
import { useOffline } from '../../offline/useOffline.js';
import RequestState from '../properties/components/RequestState.vue';
import VisitReport from '../visits/VisitReport.vue';
import { isNativeCameraPlatform } from '../../services/cameraService.js';
import '../properties/rural.css';

const { status } = useOffline();
const shares = useResource(listPropertyShares, []);
const properties = useResource(listActiveProperties, []);
const activeId = ref(''),
  property = ref(''),
  email = ref(''),
  visit = ref(''),
  consent = ref(false),
  report = ref(null);
const selected = computed(() => shares.data.value.find((s) => s.id === activeId.value));
const detail = useResource(
  () => (activeId.value ? propertyShareDetail(activeId.value) : Promise.resolve(null)),
  null,
  false,
);
const ownVisits = useResource(listTechnicalVisits, [], false);
const mutation = useMutation(false);
const labels = {
  pending: 'Aguardando aceite',
  active: 'Ativo',
  revoked: 'Revogado',
  declined: 'Recusado',
};
const auditLabels = {
  invite: 'Convite criado',
  accept: 'Convite aceito',
  revoke: 'Acesso revogado',
  decline: 'Convite recusado',
  share_report: 'Ficha compartilhada',
  unshare_report: 'Ficha retirada',
  expire: 'Convite expirado',
};
const native = isNativeCameraPlatform();
const when = (value) => new Date(value).toLocaleString('pt-BR');
const expired = (s) => s.status === 'pending' && new Date(s.expires_at) <= new Date();

function clearShared() {
  activeId.value = '';
  detail.reset();
  shares.reset();
  ownVisits.reset();
  report.value = null;
  visit.value = '';
  consent.value = false;
}
async function refresh() {
  // Hide old data before every permission check, including denied/failed responses.
  report.value = null;
  detail.reset();
  shares.reset();
  if (!status.value.online || document.hidden) return;
  await shares.reload();
  if (selected.value?.status === 'active') await detail.reload();
  else activeId.value = '';
}
watch(
  () => status.value.online,
  (online) => {
    clearShared();
    if (online) void refresh();
  },
);
watch(activeId, () => {
  detail.reset();
  ownVisits.reset();
  report.value = null;
  visit.value = '';
  consent.value = false;
  if (activeId.value && status.value.online) {
    void detail.reload();
    if (selected.value?.consultant_id === offlineUserId()) void ownVisits.reload();
  }
});
function visibility() {
  if (document.hidden) clearShared();
  else void refresh();
}
function hide() {
  clearShared();
}
let interval;
onMounted(() => {
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', hide);
  interval = setInterval(() => {
    if (!mutation.busy.value) void refresh();
  }, 30000);
});
onScopeDispose(() => {
  clearInterval(interval);
  document.removeEventListener('visibilitychange', visibility);
  window.removeEventListener('pagehide', hide);
});
async function command(action, data) {
  await mutation.run(
    async () => {
      const result = await propertyShareCommand(action, data);
      await refresh();
      return result;
    },
    () => {
      email.value = '';
      consent.value = false;
    },
  );
}
function invite() {
  void command('invite', { property_id: property.value, email: email.value });
}
function shareReport() {
  if (!consent.value || !visit.value || !selected.value) return;
  void command('share_report', { id: selected.value.id, visit_id: visit.value });
}
</script>
<template>
  <div class="rural-vue sharing-page">
    <h2>Compartilhamento técnico</h2>
    <p>
      O dono convida um consultor para acompanhar uma propriedade. O acesso é de leitura:
      identificação, talhões, plantios e histórico técnico. Financeiro, estoque e fotos não estão
      incluídos.
    </p>
    <p>
      Dados compartilhados exigem internet e não são preparados para uso offline. Convites aparecem
      na conta do e-mail informado; o aplicativo não envia e-mails.
    </p>
    <p v-if="!status.online" role="status">
      Conecte-se para consultar ou alterar compartilhamentos.
    </p>
    <template v-else>
      <section class="rural-panel">
        <h3>Convidar consultor para minha propriedade</h3>
        <RequestState
          :loading="properties.loading.value"
          :error="properties.error.value"
          @retry="properties.reload"
        >
          <form @submit.prevent="invite">
            <div class="field">
              <label for="sharing-property">Propriedade</label
              ><select
                id="sharing-property"
                v-model="property"
                required
                :disabled="mutation.busy.value"
              >
                <option value="">Selecione</option>
                <option v-for="p in properties.data.value" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>
            </div>
            <label class="field"
              >E-mail da conta do consultor<input
                v-model="email"
                type="email"
                required
                maxlength="254"
                :disabled="mutation.busy.value"
            /></label>
            <p>
              Ao convidar, você autoriza a consulta dos dados técnicos desta propriedade após o
              aceite. O convite vale por sete dias; o vínculo aceito permanece até ser revogado por
              uma das partes.
            </p>
            <button class="button button--primary" :disabled="mutation.busy.value || !property">
              Criar convite
            </button>
          </form>
        </RequestState>
      </section>
      <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
      <button
        class="button button--secondary"
        :disabled="mutation.busy.value || shares.loading.value"
        @click="refresh"
      >
        Atualizar permissões
      </button>
      <p>
        Até 200 vínculos recentes. A permissão é conferida em cada consulta e a tela é atualizada a
        cada 30 segundos enquanto estiver visível.
      </p>
      <RequestState :loading="shares.loading.value" :error="shares.error.value" @retry="refresh">
        <p v-if="!shares.data.value.length">Nenhum convite ou vínculo encontrado.</p>
        <article v-for="s in shares.data.value" :key="s.id" class="rural-panel">
          <h3>{{ s.property_name }}</h3>
          <p>
            {{
              s.owner_id === offlineUserId()
                ? 'Convite enviado para ' + s.invite_email
                : 'Produtor: ' + s.owner_name
            }}
          </p>
          <p>{{ expired(s) ? 'Convite expirado' : labels[s.status] }}</p>
          <details v-if="s.audit?.length">
            <summary>Histórico do vínculo</summary>
            <p v-for="(a, index) in s.audit" :key="index">
              {{ when(a.created_at) }} • {{ auditLabels[a.action] || a.action }}
            </p>
          </details>
          <p v-if="s.status === 'pending'">Validade: {{ when(s.expires_at) }}</p>
          <template v-if="s.status === 'pending' && s.owner_id !== offlineUserId() && !expired(s)">
            <p>
              Ao aceitar, você recebe acesso técnico de leitura. Ative seu espaço de consultor antes
              do aceite.
            </p>
            <button
              class="button button--primary"
              :disabled="mutation.busy.value"
              @click="command('accept', { id: s.id })"
            >
              Aceitar convite
            </button>
            <button
              class="button button--secondary"
              :disabled="mutation.busy.value"
              @click="command('decline', { id: s.id })"
            >
              Recusar convite
            </button>
          </template>
          <button
            v-if="s.status === 'active'"
            class="button button--secondary"
            @click="activeId = s.id"
          >
            Consultar acompanhamento
          </button>
          <button
            v-if="
              ['pending', 'active'].includes(s.status) &&
              (s.owner_id === offlineUserId() || s.consultant_id === offlineUserId())
            "
            class="button button--secondary"
            :disabled="mutation.busy.value"
            @click="command('revoke', { id: s.id })"
          >
            Revogar acesso / cancelar convite
          </button>
        </article>
      </RequestState>
      <RequestState
        v-if="activeId"
        :loading="detail.loading.value"
        :error="detail.error.value"
        @retry="refresh"
      >
        <section v-if="detail.data.value && selected" class="rural-panel">
          <h3>Acompanhamento: {{ detail.data.value.property.name }}</h3>
          <p>{{ detail.data.value.property.city }} {{ detail.data.value.property.state }}</p>
          <p>
            Consulta limitada a 200 talhões, 200 plantios e 200 eventos recentes. Somente leitura;
            não altera o cadastro do produtor.
          </p>
          <h4>Talhões</h4>
          <p v-if="!detail.data.value.areas.length">Nenhum talhão disponível.</p>
          <p v-for="a in detail.data.value.areas" :key="a.id">{{ a.name || 'Talhão sem nome' }}</p>
          <h4>Plantios</h4>
          <p v-if="!detail.data.value.cycles.length">Nenhum plantio disponível.</p>
          <p v-for="c in detail.data.value.cycles" :key="c.id">
            {{ detail.data.value.areas.find((a) => a.id === c.area_id)?.name || 'Talhão' }} •
            {{ c.crop || 'Cultura não informada' }} {{ c.variety }} •
            {{ c.planting_date || 'Sem data' }} • {{ c.status }}
          </p>
          <h4>Histórico técnico</h4>
          <p v-if="!detail.data.value.events.length">Nenhum evento disponível.</p>
          <article v-for="e in detail.data.value.events" :key="e.id">
            <h5>{{ e.title }}</h5>
            <p>{{ when(e.occurred_at) }}</p>
            <p class="shared-text">{{ e.description }}</p>
          </article>
          <h4>Fichas enviadas explicitamente pelo consultor</h4>
          <p>
            Somente o texto da ficha é compartilhado, sem fotos. O envio não libera outras visitas
            ou dados da empresa.
          </p>
          <p v-if="!detail.data.value.reports.length">Nenhuma ficha compartilhada.</p>
          <article v-for="r in detail.data.value.reports" :key="r.id">
            <p>{{ r.site_name }} • {{ r.producer_name }} • {{ when(r.visited_at) }}</p>
            <button class="button button--secondary" @click="report = r">
              Visualizar ficha compartilhada
            </button>
            <button
              v-if="selected.consultant_id === offlineUserId()"
              class="button button--secondary"
              :disabled="mutation.busy.value"
              @click="command('unshare_report', { id: selected.id, visit_id: r.id })"
            >
              Retirar ficha do compartilhamento
            </button>
          </article>
          <form v-if="selected.consultant_id === offlineUserId()" @submit.prevent="shareReport">
            <h4>Enviar uma ficha de minha autoria ao produtor</h4>
            <RequestState
              :loading="ownVisits.loading.value"
              :error="ownVisits.error.value"
              @retry="ownVisits.reload"
            >
              <div class="field">
                <label for="sharing-visit">Ficha</label
                ><select id="sharing-visit" v-model="visit" required>
                  <option value="">Selecione</option>
                  <option
                    v-for="v in ownVisits.data.value.filter((v) => !v.offline_pending)"
                    :key="v.id"
                    :value="v.id"
                  >
                    {{ v.producer_name }} — {{ v.site_name }} — {{ when(v.visited_at) }}
                  </option>
                </select>
              </div>
              <label
                ><input v-model="consent" type="checkbox" required /> Conferi a ficha e autorizo
                enviar todos os seus campos de texto ao produtor desta propriedade.</label
              >
              <button
                class="button button--primary"
                :disabled="!consent || !visit || mutation.busy.value"
              >
                Compartilhar ficha selecionada
              </button>
            </RequestState>
          </form>
          <h4>Últimas 50 ações do vínculo</h4>
          <p v-for="(a, index) in detail.data.value.audit" :key="index">
            {{ when(a.created_at) }} • {{ auditLabels[a.action] || a.action }}
          </p>
        </section>
      </RequestState>
      <VisitReport
        v-if="report && detail.data.value"
        :visit="report"
        :photos="[]"
        :photos-included="false"
        :native="native"
        @close="report = null"
      />
    </template>
  </div>
</template>
<style scoped>
.shared-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.sharing-page input[type='checkbox'] {
  width: auto;
}
.sharing-page input,
.sharing-page select {
  max-width: 100%;
}
.sharing-page button {
  margin: 0.3rem;
}
</style>
