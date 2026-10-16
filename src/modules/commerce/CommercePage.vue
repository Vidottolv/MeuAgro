<script setup>
import { computed, ref } from 'vue';
import {
  loadCommerce,
  commerceCommand,
  commerceError,
  sellerAccess,
} from '../../services/commerceService.js';
import { useResource } from '../inventory/shared/useResource';
import { useCommand } from './useCommand';
import RequestState from '../properties/components/RequestState.vue';
import RuralDialog from '../properties/components/RuralDialog.vue';
import CommandForm from './CommandForm.vue';
const props = defineProps({ session: { type: Object, required: true } });
const companyId = new URLSearchParams(location.search).get('id'),
  userId = props.session.user.id;
const { data, loading, error, reload } = useResource(loadCommerce, null);
const version = ref(0);
const command = useCommand(
  commerceCommand,
  async () => {
    await reload();
    if (error.value) throw Error(error.value);
    version.value++;
  },
  commerceError,
);
const busy = computed(() => command.busy.value || command.committed.value);
const pending = ref(null),
  copyMessage = ref('');
const seller = computed(() => data.value?.sellers.find((s) => s.id === companyId));
const access = computed(() =>
  seller.value ? sellerAccess(seller.value, data.value.memberships, userId) : null,
);
const members = computed(
    () => data.value?.memberships.filter((m) => m.seller_id === companyId) || [],
  ),
  invitations = computed(
    () => data.value?.invitations.filter((i) => i.seller_id === companyId) || [],
  );
const getAccess = (s) => sellerAccess(s, data.value.memberships, userId);
const manager = (s) =>
  s.kind === 'company' &&
  (getAccess(s).owner ||
    data.value.memberships.some(
      (m) =>
        m.seller_id === s.id && m.user_id === userId && m.active && m.management_role === 'manager',
    ));
const isPending = (i) => i.status === 'pending' && new Date(i.expires_at) > new Date();
const date = (d) => new Date(d).toLocaleDateString('pt-BR');
const nameField = (value = '', label = 'Nome comercial') => ({
  name: 'name',
  label,
  value,
  required: true,
  minlength: 2,
  maxlength: 120,
});
const sellerFields = (s) => [
  nameField(s?.name || ''),
  {
    name: 'email',
    label: 'E-mail de contato',
    value: s?.email || '',
    type: 'email',
    maxlength: 254,
  },
  { name: 'phone', label: 'Telefone', value: s?.phone || '', type: 'tel', maxlength: 40 },
];
async function copy(i) {
  try {
    await navigator.clipboard.writeText(i.token);
    copyMessage.value = 'Código copiado. Compartilhe com o destinatário.';
  } catch {
    copyMessage.value = 'Selecione e copie o código exibido no convite.';
  }
}
async function confirm() {
  const item = pending.value;
  if (!item) return;
  await command.run(item.action, item.data);
  if (!command.error.value) pending.value = null;
}
</script>
<template>
  <div class="rural-vue commerce-page">
    <h2>{{ companyId ? 'Empresa e representantes' : 'Seu negócio, em um só lugar' }}</h2>
    <p>Trabalhe por conta própria e represente empresas com a mesma conta.</p>
    <p v-if="command.message.value || copyMessage" role="status">
      {{ copyMessage || command.message.value }}
    </p>
    <p v-if="command.error.value" role="alert">{{ command.error.value }}</p>
    <button
      v-if="command.committed.value"
      class="button button--secondary"
      @click="command.refresh().catch(() => {})"
    >
      Atualizar dados salvos</button
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><template v-if="data"
        ><section v-if="!data.account?.enabled" class="rural-panel">
          <h3>Ative seu perfil profissional</h3>
          <p>Use este perfil para atuar por conta própria ou aceitar um convite de gerente ou representante.</p>
          <p>Seu acesso como produtor e seus registros serão mantidos.</p>
          <CommandForm
            :fields="[nameField(session.user.user_metadata?.full_name || '', 'Nome profissional')]"
            label="Ativar perfil profissional"
            :busy="busy"
            @submit="command.run('enable', $event)"
          />
        </section>
        <template v-else-if="companyId"
          ><a href="/consultor" data-link class="button button--secondary">Voltar ao meu espaço</a>
          <p v-if="!seller">Você não possui acesso a este vendedor.</p>
          <template v-else
            ><section class="rural-panel">
              <span class="commerce-badge">{{ access.label }}</span>
              <h3>{{ seller.name }}</h3>
              <CommandForm
                v-if="access.owner"
                :key="version"
                :fields="sellerFields(seller)"
                :busy="busy"
                label="Salvar dados"
                @submit="command.run('update_seller', { ...$event, seller_id: seller.id })"
              /><template v-else
                ><p>{{ seller.email || 'E-mail não informado' }}</p>
                <p>{{ seller.phone || 'Telefone não informado' }}</p>
                <p>
                  {{
                    access.active
                      ? 'Seu vínculo permite atuar em nome desta empresa.'
                      : 'Seu vínculo foi encerrado. Este cadastro permanece no histórico.'
                  }}
                </p></template
              >
            </section>
            <template v-if="seller.kind === 'company'"
              ><section v-if="access.owner" class="rural-panel">
                <h3>Convidar representante</h3>
                <p>O código vale por 7 dias e exige o e-mail confirmado do destinatário.</p>
                <CommandForm
                  :key="version"
                  :fields="[
                    {
                      name: 'email',
                      label: 'E-mail do representante',
                      type: 'email',
                      required: true,
                      maxlength: 254,
                    },
                  ]"
                  :busy="busy"
                  label="Gerar convite"
                  @submit="command.run('invite', { ...$event, seller_id: seller.id })"
                />
              </section>
              <section class="rural-panel">
                <h3>{{ access.owner ? 'Representantes' : 'Meu vínculo' }}</h3>
                <p v-if="!members.length">Nenhum representante vinculado.</p>
                <article v-for="m in members" :key="m.id" class="rural-card">
                  <strong>{{ m.representative_name }}</strong>
                  <p>
                    {{
                      m.active
                        ? 'Ativo desde ' + date(m.joined_at)
                        : 'Encerrado em ' + date(m.ended_at)
                    }}
                  </p>
                  <button
                    v-if="m.active"
                    class="button button--secondary"
                    :disabled="busy"
                    @click="
                      pending = {
                        action: 'end_membership',
                        data: { membership_id: m.id },
                        title: 'Encerrar vínculo?',
                        text: 'A pessoa não poderá atuar pela empresa. O histórico será preservado.',
                      }
                    "
                  >
                    {{ access.owner ? 'Encerrar vínculo' : 'Sair da empresa' }}
                  </button>
                </article>
              </section>
              <section v-if="access.owner" class="rural-panel">
                <h3>Convites</h3>
                <p v-if="!invitations.length">Nenhum convite gerado.</p>
                <article v-for="i in invitations" :key="i.id" class="rural-card">
                  <strong>{{ i.email }}</strong>
                  <p>
                    {{
                      i.status === 'accepted'
                        ? 'Aceito'
                        : i.status === 'revoked'
                          ? 'Cancelado'
                          : isPending(i)
                            ? 'Pendente até ' + date(i.expires_at)
                            : 'Expirado'
                    }}
                  </p>
                  <template v-if="isPending(i)"
                    ><label class="commerce-code-label"
                      >Código do convite<input
                        class="commerce-code"
                        :value="i.token"
                        readonly
                        :aria-label="'Código para ' + i.email"
                    /></label>
                    <div class="rural-actions">
                      <button class="button button--secondary" @click="copy(i)">
                        Copiar código</button
                      ><button
                        class="button button--secondary"
                        :disabled="busy"
                        @click="
                          pending = {
                            action: 'revoke_invite',
                            data: { invitation_id: i.id },
                            title: 'Cancelar convite?',
                            text: 'Este código não poderá mais ser utilizado.',
                          }
                        "
                      >
                        Cancelar convite
                      </button>
                    </div></template
                  >
                </article>
              </section></template
            ></template
          ></template
        ><template v-else
          ><nav class="rural-actions" aria-label="Atalhos comerciais">
            <a href="/consultor/negociacoes" data-link class="button button--primary">Negociações</a
            ><a href="/consultor/resultados" data-link class="button button--secondary"
              >Vendas e resultados</a
            >
          </nav>
          <section class="rural-grid">
            <article v-for="s in data.sellers" :key="s.id" class="rural-card">
              <span class="commerce-badge"
                >{{
                  data.account.active_seller_id === s.id && getAccess(s).active
                    ? 'Atuação atual • '
                    : ''
                }}{{ getAccess(s).label }}</span
              >
              <h3>{{ s.name }}</h3>
              <div class="rural-actions">
                <button
                  v-if="getAccess(s).active && data.account.active_seller_id !== s.id"
                  class="button button--primary"
                  :disabled="busy"
                  @click="command.run('select_seller', { seller_id: s.id })"
                >
                  Selecionar atuação</button
                ><a
                  :href="'/consultor/empresa?id=' + encodeURIComponent(s.id)"
                  data-link
                  class="button button--secondary"
                  >{{ getAccess(s).owner ? 'Gerenciar cadastro' : 'Ver vínculo' }}</a
                ><a
                  v-if="manager(s)"
                  :href="'/consultor/equipe?seller=' + encodeURIComponent(s.id)"
                  data-link
                  class="button button--secondary"
                  >Gerentes e representantes</a
                ><a
                  v-if="manager(s)"
                  :href="'/consultor/gestao?seller=' + encodeURIComponent(s.id)"
                  data-link
                  class="button button--primary"
                  >Gestão da empresa</a
                >
              </div>
            </article>
          </section>
          <section class="rural-grid">
            <section class="rural-panel">
              <h3>Cadastrar minha empresa</h3>
              <p>Você será responsável pelo cadastro e convites dos representantes.</p>
              <CommandForm
                :key="version"
                :fields="sellerFields()"
                :busy="busy"
                label="Criar empresa"
                @submit="command.run('create_company', $event)"
              />
            </section>
            <section class="rural-panel">
              <h3>Aceitar convite</h3>
              <p>Use o código recebido da empresa e o e-mail confirmado do destinatário.</p>
              <CommandForm
                :key="version"
                :fields="[
                  {
                    name: 'token',
                    label: 'Código do convite',
                    required: true,
                    maxlength: 36,
                    autocomplete: 'off',
                  },
                ]"
                :busy="busy"
                label="Aceitar convite"
                @submit="command.run('accept_invite', { token: $event.token.trim() })"
              />
            </section></section></template></template></RequestState
    ><RuralDialog v-if="pending" :title="pending.title" :busy="busy" @close="pending = null"
      ><p>{{ pending.text }}</p>
      <p v-if="command.error.value" role="alert">{{ command.error.value }}</p>
      <div class="rural-actions">
        <button class="button button--secondary" :disabled="busy" @click="pending = null">
          Cancelar</button
        ><button class="button button--primary" :disabled="busy" @click="confirm">Confirmar</button>
      </div></RuralDialog
    >
  </div>
</template>
