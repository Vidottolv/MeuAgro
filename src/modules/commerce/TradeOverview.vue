<script setup>
import { computed } from 'vue';
import { requestStates } from '../../services/tradeService.js';
import { when, field, select } from './tradeModel';
import CommandForm from './CommandForm.vue';
import TradeCatalog from './TradeCatalog.vue';
const props = defineProps({
  state: Object,
  session: Object,
  commercial: Boolean,
  busy: Boolean,
  versions: Object,
});
const emit = defineEmits(['command']);
const uid = props.session.user.id,
  selected = new URLSearchParams(location.search).get('seller'),
  base = props.commercial ? '/consultor/negociacoes' : '/compras';
const owns = (s) => s.owner_id === uid;
const acts = (s) =>
  owns(s) ||
  props.state.commerce_memberships.some(
    (m) => m.user_id === uid && m.seller_id === s.id && m.active,
  );
const sellers = computed(() =>
  props.state.commerce_sellers.filter((s) =>
    props.commercial
      ? acts(s)
      : props.state.trade_connections.some(
          (c) => c.seller_id === s.id && c.buyer_id === uid && c.active,
        ),
  ),
);
const seller = computed(
  () =>
    sellers.value.find((s) => s.id === selected) ||
    sellers.value.find(
      (s) =>
        s.id === props.state.commerce_accounts.find((a) => a.user_id === uid)?.active_seller_id,
    ) ||
    sellers.value[0],
);
const connections = computed(() =>
  props.state.trade_connections.filter(
    (c) =>
      c.seller_id === seller.value?.id &&
      (props.commercial ? c.buyer_id !== uid : c.buyer_id === uid),
  ),
);
const requests = computed(() =>
  props.state.trade_requests
    .filter((r) => connections.value.some((c) => c.id === r.connection_id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
);
const invitations = computed(() =>
  props.state.trade_invitations.filter((i) => i.seller_id === seller.value?.id),
);
const pending = (i) => i.status === 'pending' && new Date(i.expires_at) > new Date();
const agents = computed(() =>
  seller.value
    ? [
        [seller.value.owner_id, 'Responsável pela empresa'],
        ...props.state.commerce_memberships
          .filter((m) => m.seller_id === seller.value.id && m.active)
          .map((m) => [m.user_id, m.representative_name]),
      ]
    : [],
);
</script>
<template>
  <h2>{{ commercial ? 'Atenda seus clientes' : 'Consulte produtos e preços' }}</h2>
  <nav class="rural-actions" aria-label="Vendedores">
    <a
      v-for="s in sellers"
      :key="s.id"
      :href="base + '?seller=' + encodeURIComponent(s.id)"
      data-link
      class="button button--secondary"
      :aria-current="s.id === seller?.id ? 'page' : undefined"
      >{{ s.name }}</a
    >
  </nav>
  <template v-if="seller"
    ><section class="rural-panel">
      <h3>{{ seller.name }}</h3>
      <p>
        {{
          commercial
            ? owns(seller)
              ? 'Você é responsável pelo catálogo.'
              : 'As alterações de catálogo são feitas pelo responsável.'
            : 'Vendedor conectado'
        }}
      </p>
    </section>
    <section class="rural-panel">
      <h3>Solicitações, propostas e pedidos</h3>
      <p v-if="!requests.length">Nenhuma solicitação para este vendedor.</p>
      <article v-for="r in requests" :key="r.id" class="rural-card">
        <strong>{{
          commercial
            ? connections.find((c) => c.id === r.connection_id)?.buyer_name
            : 'Solicitação ' + r.id.slice(0, 8)
        }}</strong>
        <p>{{ requestStates[r.state] }} • {{ when(r.created_at) }}</p>
        <a
          :href="base + '?request=' + encodeURIComponent(r.id)"
          data-link
          class="button button--secondary"
          >Abrir negociação</a
        >
      </article>
    </section>
    <TradeCatalog
      :state="state"
      :seller="seller"
      :uid="uid"
      :commercial="commercial"
      :busy="busy"
      :versions="versions"
      @command="(a, d) => emit('command', a, d)" /><template v-if="commercial"
      ><section class="rural-panel">
        <h3>Convidar produtor</h3>
        <p>Compartilhe o código com o produtor. Nenhum e-mail é enviado.</p>
        <CommandForm
          :key="versions.invite_buyer || 0"
          :fields="[
            field('email', 'E-mail do produtor', '', {
              type: 'email',
              required: true,
              maxlength: 254,
            }),
          ]"
          :busy="busy"
          label="Gerar código"
          @submit="emit('command', 'invite_buyer', { ...$event, seller_id: seller.id })"
        />
        <article v-for="i in invitations" :key="i.id" class="rural-card">
          <strong>{{ i.email }}</strong>
          <p>
            {{
              i.status === 'accepted'
                ? 'Aceito'
                : i.status === 'revoked'
                  ? 'Cancelado'
                  : pending(i)
                    ? 'Válido até ' + when(i.expires_at)
                    : 'Expirado'
            }}
          </p>
          <template v-if="pending(i)"
            ><label class="commerce-code-label"
              >Código para o produtor<input
                class="commerce-code"
                :value="i.token"
                readonly
                :aria-label="'Código para ' + i.email" /></label
            ><button
              class="button button--secondary"
              :disabled="busy"
              @click="emit('command', 'revoke_connection_invite', { invitation_id: i.id })"
            >
              Cancelar convite
            </button></template
          >
        </article>
      </section>
      <section class="rural-panel">
        <h3>Clientes conectados</h3>
        <p v-if="!connections.length">Nenhum cliente conectado.</p>
        <article v-for="c in connections" :key="c.id" class="rural-card">
          <strong>{{ c.buyer_name }}</strong>
          <p>
            {{
              c.agent_id === uid
                ? 'Atendimento sob sua responsabilidade'
                : 'Atendimento por representante'
            }}
          </p>
          <CommandForm
            v-if="owns(seller)"
            :key="c.id + '-' + c.agent_id"
            :fields="[select('agent_id', 'Responsável por ' + c.buyer_name, agents, c.agent_id)]"
            :busy="busy"
            label="Transferir atendimento"
            @submit="emit('command', 'assign_agent', { ...$event, connection_id: c.id })"
          />
        </article></section></template
  ></template>
  <section v-else-if="commercial" class="rural-panel">
    <p>Ative seu perfil e cadastre uma atuação própria ou aceite um convite de empresa.</p>
    <a href="/consultor" data-link class="button button--secondary">Meu espaço de consultor</a>
  </section>
  <section v-if="!commercial" class="rural-panel">
    <h3>Conectar a um consultor</h3>
    <CommandForm
      :key="versions.accept_connection || 0"
      :fields="[
        field('name', 'Seu nome de contato', session.user.user_metadata?.full_name || '', {
          required: true,
          minlength: 2,
          maxlength: 120,
        }),
        field('token', 'Código recebido', '', {
          required: true,
          maxlength: 36,
          autocomplete: 'off',
        }),
      ]"
      :busy="busy"
      label="Conectar"
      @submit="emit('command', 'accept_connection', $event)"
    />
  </section>
</template>
