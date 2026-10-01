<script setup lang="ts">
import { useHistory } from './useHistory';
import { INVENTORY_TRANSACTION_TYPES } from '../../../constants/inventoryTransactionTypes.js';
import TransactionCard from '../components/TransactionCard.vue';
import PageNavigation from '../components/PageNavigation.vue';
import '../inputDetail.css';
import './transactions.css';
const props = defineProps<{ inputId?: string }>();
const {
  inputId,
  lotId,
  type,
  search,
  from,
  to,
  page,
  inputs,
  history,
  invalidPeriod,
  filtered,
  visible,
  incoming,
  selectedInput,
  missingInput,
  clear,
  newHref,
} = useHistory(props.inputId);
const {
  data: inputItems,
  loading: inputsLoading,
  error: inputsError,
  reload: reloadInputs,
} = inputs;
const { loading, error, reload } = history;
</script>
<template>
  <div class="input-detail-vue transactions-vue">
    <a
      :href="props.inputId ? `/inventory/${encodeURIComponent(props.inputId)}` : '/inventory'"
      class="button button--secondary input-detail-back"
      data-link
      >Voltar ao Barracão</a
    >
    <section class="input-detail-section">
      <header>
        <div>
          <h2>Histórico de movimentações</h2>
          <p v-if="selectedInput">{{ selectedInput.name }}</p>
          <p>Entradas, saídas e ajustes ficam preservados neste histórico.</p>
        </div>
        <a :href="newHref" class="button button--primary" data-link>Nova movimentação</a>
      </header>
    </section>
    <section class="input-detail-section" aria-label="Filtros de movimentações">
      <p v-if="inputsLoading" role="status">Carregando insumos…</p>
      <div v-if="inputsError" role="alert">
        <p>{{ inputsError }}</p>
        <button class="button button--secondary" @click="reloadInputs">
          Tentar carregar insumos
        </button>
      </div>
      <div class="transaction-filter-grid">
        <div class="field">
          <label for="history-input">Insumo</label
          ><select
            id="history-input"
            v-model="inputId"
            :disabled="Boolean(props.inputId) || inputsLoading"
          >
            <option value="">Todos os insumos</option>
            <option v-for="item in inputItems" :key="item.id" :value="item.id">
              {{ item.name }}{{ item.active ? '' : ' • inativo' }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="history-type">Tipo</label
          ><select id="history-type" v-model="type">
            <option value="">Todos os tipos</option>
            <option
              v-for="[value, label] in INVENTORY_TRANSACTION_TYPES"
              :key="value"
              :value="value"
            >
              {{ label }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="history-from">De</label><input id="history-from" v-model="from" type="date" />
        </div>
        <div class="field">
          <label for="history-to">Até</label><input id="history-to" v-model="to" type="date" />
        </div>
      </div>
      <div class="field">
        <label for="history-search">Buscar no histórico</label
        ><input
          id="history-search"
          v-model="search"
          type="search"
          placeholder="Insumo, lote, observação ou evento"
        />
      </div>
      <div v-if="lotId" class="transaction-filter-tag">
        <span>Exibindo somente o lote selecionado.</span
        ><button class="button button--secondary" @click="lotId = ''">
          Remover filtro de lote
        </button>
      </div>
      <div class="input-detail-actions">
        <button class="button button--secondary" @click="clear">Limpar filtros</button
        ><button class="button button--secondary" :disabled="loading" @click="reload">
          Atualizar histórico
        </button>
      </div>
    </section>
    <p v-if="missingInput" role="alert">Insumo não encontrado.</p>
    <p v-else-if="invalidPeriod" role="alert">{{ invalidPeriod }}</p>
    <p v-else-if="loading" role="status">Carregando movimentações…</p>
    <section v-else-if="error" class="input-detail-section" role="alert">
      <p>{{ error }}</p>
      <button class="button button--secondary" @click="reload">
        Tentar carregar movimentações
      </button>
    </section>
    <template v-else>
      <section class="input-detail-summary" aria-label="Resumo dos registros">
        <article>
          <span>Registros encontrados</span><strong>{{ filtered.length }}</strong>
        </article>
        <article>
          <span>Registros de entrada</span><strong>{{ incoming }}</strong>
        </article>
        <article>
          <span>Registros de saída</span><strong>{{ filtered.length - incoming }}</strong>
        </article>
      </section>
      <p>Contagem de registros do filtro atual; não representa quantidade de produtos nem lucro.</p>
      <div v-if="visible.length" class="input-detail-related-grid">
        <TransactionCard v-for="item in visible" :key="item.id" :item="item" />
      </div>
      <section v-else class="input-detail-section">
        <h3>Nenhuma movimentação encontrada</h3>
        <p>Confira os filtros ou registre uma movimentação.</p>
      </section>
      <PageNavigation :page="page" :total="filtered.length" :size="20" @change="page = $event" />
    </template>
  </div>
</template>
