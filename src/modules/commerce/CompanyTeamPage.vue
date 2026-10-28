<script setup>
import { computed, ref, watch } from 'vue';
import {
  managementCompanies,
  managementTeam,
  managementTeamCommand,
  managementError,
} from '../../services/managementService.js';
import { useSensitiveResource as useResource } from '../shared/useSensitiveResource';
import { useCommand } from './useCommand';
import { field, select, when } from './tradeModel';
import CommandForm from './CommandForm.vue';
import RequestState from '../properties/components/RequestState.vue';
import RuralDialog from '../properties/components/RuralDialog.vue';
const emit = defineEmits(['navigate']);
const selected = new URLSearchParams(location.search).get('seller');
const { data, loading, error, reload } = useResource(async () => {
  const companies = await managementCompanies();
  const company = selected ? companies.find((c) => c.id === selected) : companies[0];
  if (!company) return { companies, company: null, team: null };
  return { companies, company, team: await managementTeam(company.id) };
}, null);
const version = ref(0),
  pending = ref(null),
  copied = ref('');
watch(
  data,
  (value) => {
    if (!value) {
      pending.value = null;
      copied.value = '';
    }
  },
  { flush: 'sync' },
);
const command = useCommand(
  managementTeamCommand,
  async () => {
    await reload();
    if (error.value) throw Error(error.value);
    version.value++;
  },
  managementError,
);
const busy = computed(() => command.busy.value || command.committed.value);
const active = computed(() => data.value?.team?.members.filter((m) => m.active) || []);
const role = (value) => (value === 'manager' ? 'Gerente' : 'Representante');
const current = (member) => ({
  membership_id: member.id,
  expected_role: member.role,
  expected_finance: member.finance,
});
const inviteFields = computed(() => [
  field('email', 'E-mail do convidado', '', {
    type: 'email',
    required: true,
    maxlength: 254,
    autocomplete: 'email',
  }),
  ...(data.value?.team.owner
    ? [
        select(
          'role',
          'Papel na empresa',
          [
            ['representative', 'Representante'],
            ['manager', 'Gerente'],
          ],
          'representative',
        ),
        select(
          'finance',
          'Gerente pode consultar custos e comissões?',
          [
            ['false', 'Não'],
            ['true', 'Sim, autorizado pelo dono'],
          ],
          'false',
        ),
      ]
    : []),
]);
async function invite(values) {
  const result = await command.run('invite', {
    seller_id: data.value.company.id,
    ...values,
    finance: values.role === 'manager' ? values.finance : 'false',
  });
  if (result) copied.value = '';
}
function confirmRole(member, values) {
  values = { ...values, finance: values.role === 'manager' ? values.finance : 'false' };
  pending.value = {
    action: 'set_role',
    data: { ...current(member), ...values },
    title: 'Confirmar permissões?',
    text: `${member.name} passará a atuar como ${role(values.role).toLowerCase()}. ${values.role === 'manager' && values.finance === 'true' ? 'Poderá consultar custos e comissões.' : 'Não terá acesso gerencial a custos e comissões.'}`,
  };
}
async function confirm() {
  const item = pending.value;
  if (!item) return;
  const result = await command.run(item.action, { seller_id: data.value.company.id, ...item.data });
  if (result || command.committed.value) pending.value = null;
}
async function copy(invitation) {
  try {
    await navigator.clipboard.writeText(invitation.token);
    copied.value = 'Código copiado. Compartilhe com a pessoa convidada.';
  } catch {
    copied.value = 'Selecione e copie o código exibido no convite.';
  }
}
</script>
<template>
  <div class="rural-vue commerce-page">
    <h2>Gerentes e representantes</h2>
    <p>Uma equipe por empresa, com acesso definido pelo dono.</p>
    <p v-if="command.message.value" role="status">{{ command.message.value }}</p>
    <p v-if="command.error.value" role="alert">{{ command.error.value }}</p>
    <p v-if="copied" role="status">{{ copied }}</p>
    <button
      v-if="command.committed.value"
      class="button button--secondary"
      @click="command.refresh().catch(() => {})"
    >
      Atualizar alteração salva
    </button>
    <RequestState :loading="loading" :error="error" @retry="reload">
      <section v-if="!data?.company" class="rural-panel">
        <h3>{{ selected ? 'Empresa indisponível' : 'Nenhuma empresa para administrar' }}</h3>
        <p>
          O dono cria a empresa e pode convidar um gerente. Se você recebeu um convite, ative seu
          perfil profissional e aceite o código no Meu espaço.
        </p>
        <a href="/consultor" data-link class="button button--primary">Abrir Meu espaço</a>
      </section>
      <template v-else>
        <section class="rural-panel">
          <h3>{{ data.company.name }}</h3>
          <p>
            {{ data.team.owner ? 'Você é o dono desta empresa.' : 'Você é gerente desta empresa.' }}
          </p>
          <p>
            O gerente acompanha os representantes, administra seus vínculos e distribui a carteira
            de clientes. Somente o dono autoriza gerentes e o acesso a custos e comissões.
          </p>
          <CommandForm
            v-if="data.companies.length > 1"
            :fields="[
              select(
                'seller',
                'Empresa',
                data.companies.map((c) => [c.id, c.name]),
                data.company.id,
              ),
            ]"
            label="Abrir equipe"
            @submit="emit('navigate', '/consultor/equipe?' + new URLSearchParams($event))"
          />
          <div class="rural-actions">
            <a
              :href="'/consultor/gestao?seller=' + encodeURIComponent(data.company.id)"
              data-link
              class="button button--primary"
              >Painel e carteira de clientes</a
            >
            <a
              :href="'/consultor/empresa?id=' + encodeURIComponent(data.company.id)"
              data-link
              class="button button--secondary"
              >Cadastro da empresa</a
            >
          </div>
          <p>
            {{ active.filter((m) => m.role === 'manager').length }} gerente(s) e
            {{ active.filter((m) => m.role === 'representative').length }} representante(s) ativos,
            além do dono.
          </p>
        </section>
        <section class="rural-panel">
          <h3>
            {{ data.team.owner ? 'Convidar gerente ou representante' : 'Convidar representante' }}
          </h3>
          <p>
            O código vale por 7 dias e só pode ser aceito com o e-mail confirmado do destinatário.
            Compartilhe o código com a pessoa; o aplicativo não envia e-mail automaticamente.
          </p>
          <p v-if="data.team.owner">
            Para um representante, mantenha a permissão de custos e comissões em Não.
          </p>
          <CommandForm
            :key="'invite-' + version"
            :fields="inviteFields"
            label="Gerar convite"
            :busy="busy"
            @submit="invite"
          />
        </section>
        <section class="rural-panel">
          <h3>Equipe ativa</h3>
          <p v-if="!active.length">
            Nenhum gerente ou representante vinculado. Comece gerando um convite.
          </p>
          <article v-for="member in active" :key="member.id" class="rural-card">
            <h4>{{ member.name }}</h4>
            <p>{{ role(member.role) }} • {{ member.customers }} cliente(s) na carteira</p>
            <p v-if="data.team.owner && member.role === 'manager'">
              Custos e comissões: {{ member.finance ? 'Autorizados' : 'Sem acesso' }}.
            </p>
            <CommandForm
              v-if="data.team.owner"
              :key="member.id + '-' + version"
              :fields="[
                select(
                  'role',
                  'Papel de ' + member.name,
                  [
                    ['representative', 'Representante'],
                    ['manager', 'Gerente'],
                  ],
                  member.role,
                ),
                select(
                  'finance',
                  'Acesso a custos e comissões de ' + member.name,
                  [
                    ['false', 'Não'],
                    ['true', 'Sim, para gerente'],
                  ],
                  String(member.finance),
                ),
              ]"
              label="Alterar permissões"
              :busy="busy"
              @submit="confirmRole(member, $event)"
            />
            <button
              v-if="data.team.owner || member.role === 'representative'"
              class="button button--secondary"
              :disabled="busy"
              @click="
                pending = {
                  action: 'remove_member',
                  data: current(member),
                  title: 'Encerrar vínculo?',
                  text:
                    member.name +
                    ' perderá o acesso à empresa. O histórico será preservado. ' +
                    (member.customers
                      ? 'Há clientes nesta carteira; redistribua-os pelo painel de gestão.'
                      : ''),
                }
              "
            >
              Encerrar vínculo de {{ member.name }}
            </button>
          </article>
        </section>
        <section class="rural-panel">
          <h3>Convites da equipe</h3>
          <p v-if="!data.team.invitations.length">Nenhum convite disponível.</p>
          <article
            v-for="invitation in data.team.invitations"
            :key="invitation.id"
            class="rural-card"
          >
            <h4>{{ invitation.email }}</h4>
            <p>
              {{ role(invitation.role) }} •
              {{
                invitation.status === 'accepted'
                  ? 'Aceito'
                  : invitation.status === 'revoked'
                    ? 'Cancelado'
                    : new Date(invitation.expires_at) > new Date()
                      ? 'Pendente até ' + when(invitation.expires_at)
                      : 'Expirado'
              }}
            </p>
            <template v-if="invitation.token">
              <label class="commerce-code-label"
                >Código do convite<input
                  :value="invitation.token"
                  readonly
                  class="commerce-code"
                  :aria-label="'Código para ' + invitation.email"
              /></label>
              <div class="rural-actions">
                <button class="button button--secondary" @click="copy(invitation)">
                  Copiar código
                </button>
                <button
                  class="button button--secondary"
                  :disabled="busy"
                  @click="
                    pending = {
                      action: 'revoke_invite',
                      data: { invitation_id: invitation.id },
                      title: 'Cancelar convite?',
                      text: 'O código para ' + invitation.email + ' não poderá mais ser usado.',
                    }
                  "
                >
                  Cancelar convite
                </button>
              </div>
            </template>
          </article>
        </section>
        <details v-if="data.team.members.some((m) => !m.active)" class="rural-panel">
          <summary>Vínculos encerrados</summary>
          <p v-for="member in data.team.members.filter((m) => !m.active)" :key="member.id">
            {{ member.name }} • encerrado em {{ when(member.ended_at) }}
          </p>
        </details>
      </template>
    </RequestState>
    <RuralDialog v-if="pending" :title="pending.title" :busy="busy" @close="pending = null">
      <p>{{ pending.text }}</p>
      <p v-if="command.error.value" role="alert">{{ command.error.value }}</p>
      <div class="rural-actions">
        <button class="button button--secondary" :disabled="busy" @click="pending = null">
          Cancelar</button
        ><button class="button button--primary" :disabled="busy" @click="confirm">Confirmar</button>
      </div>
    </RuralDialog>
  </div>
</template>
