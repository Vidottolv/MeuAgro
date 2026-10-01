<script setup lang="ts">
import { getInputCategoryLabel } from '../../constants/inputCategories.js';
import { getInputUnitLabel } from '../../constants/inputUnits.js';
import { formatDatePtBr } from '../../js/html.js';
import { stockStatusLabel } from './detailModel';
import { useInputDetail } from './useInputDetail';
import InputStockSummary from './components/InputStockSummary.vue';
import RecentLots from './components/RecentLots.vue';
import RecentTransactions from './components/RecentTransactions.vue';
import InventoryDialog from './components/InventoryDialog.vue';
import RestockDialog from './components/RestockDialog.vue';
import './inputDetail.css';
const props = defineProps<{ inputId: string }>();
const {
  input,
  loading,
  loadError,
  notFound,
  lots,
  transactions,
  lotsLoading,
  transactionsLoading,
  lotsError,
  transactionsError,
  reload,
  loadLots,
  loadTransactions,
  busy,
  actionError,
  notice,
  confirmOpen,
  restockOpen,
  restockAvailable,
  toggleActive,
} = useInputDetail(props.inputId);
const path = `/inventory/${encodeURIComponent(props.inputId)}`;
</script>
<template>
  <div class="input-detail-vue">
    <a href="/inventory" class="button button--secondary input-detail-back" data-link
      >Voltar para o Barracão</a
    >
    <p v-if="loading" role="status">Carregando insumo…</p>
    <section v-else-if="loadError" class="input-detail-section" role="alert">
      <h2>Não foi possível abrir o insumo</h2>
      <p>{{ loadError }}</p>
      <button class="button button--primary" @click="reload">Tentar novamente</button>
    </section>
    <section v-else-if="notFound" class="input-detail-section">
      <h2>Insumo não encontrado</h2>
      <p>Este registro não existe ou não está disponível para sua conta.</p>
    </section>
    <template v-else-if="input">
      <header class="input-detail-section">
        <p>{{ getInputCategoryLabel(input.category) }}</p>
        <h2>{{ input.name }}</h2>
        <p>{{ input.brand || 'Sem marca informada' }}</p>
        <p>{{ stockStatusLabel(input.stock_status) }} • {{ input.active ? 'Ativo' : 'Inativo' }}</p>
        <div class="input-detail-actions">
          <a :href="`${path}/edit`" class="button button--secondary" data-link>Editar</a
          ><button class="button button--secondary" :disabled="busy" @click="confirmOpen = true">
            {{ busy ? 'Salvando…' : input.active ? 'Desativar' : 'Reativar' }}</button
          ><button class="button button--secondary" :disabled="busy" @click="reload">
            Atualizar ficha
          </button>
        </div>
      </header>
      <p v-if="actionError" role="alert">{{ actionError }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <InputStockSummary :input="input" />
      <section v-if="restockAvailable" class="input-detail-section">
        <h3>Estoque zerado</h3>
        <p>Consulte preço e disponibilidade para repor {{ input.name }}.</p>
        <button class="button button--primary" :disabled="busy" @click="restockOpen = true">
          Solicitar reposição
        </button>
      </section>
      <nav class="input-detail-actions" aria-label="Ações do insumo">
        <a v-if="input.active" :href="`${path}/lots/new`" class="button button--primary" data-link
          >Novo lote</a
        ><a
          :href="`/inventory/transactions/new?input=${encodeURIComponent(inputId)}`"
          class="button button--secondary"
          data-link
          >Nova movimentação</a
        >
      </nav>
      <section class="input-detail-section">
        <h3>Informações do insumo</h3>
        <dl>
          <dt>Categoria</dt>
          <dd>{{ getInputCategoryLabel(input.category) }}</dd>
          <dt>Unidade principal</dt>
          <dd>{{ getInputUnitLabel(input.base_unit) }}</dd>
          <dt>Situação</dt>
          <dd>{{ input.active ? 'Ativo' : 'Inativo' }}</dd>
          <dt>Cadastrado em</dt>
          <dd>{{ formatDatePtBr(input.created_at) }}</dd>
          <dt>Descrição</dt>
          <dd class="input-detail-notes">
            {{ input.description || 'Nenhuma descrição informada.' }}
          </dd>
          <dt>Observações</dt>
          <dd class="input-detail-notes">{{ input.notes || 'Nenhuma observação informada.' }}</dd>
        </dl>
      </section>
      <RecentLots
        :items="lots"
        :input-id="inputId"
        :active="input.active"
        :loading="lotsLoading"
        :error="lotsError"
        @retry="loadLots"
      />
      <RecentTransactions
        :items="transactions"
        :input-id="inputId"
        :loading="transactionsLoading"
        :error="transactionsError"
        @retry="loadTransactions"
      />
      <InventoryDialog
        v-if="confirmOpen"
        :title="input.active ? 'Desativar insumo?' : 'Reativar insumo?'"
        @close="confirmOpen = false"
        ><p>
          {{
            input.active
              ? 'O histórico, lotes e movimentações serão preservados. Novos lotes ficarão bloqueados até a reativação.'
              : 'O insumo voltará a aceitar novos lotes.'
          }}
        </p>
        <div class="input-detail-actions">
          <button class="button button--secondary" autofocus @click="confirmOpen = false">
            Cancelar</button
          ><button class="button button--primary" :disabled="busy" @click="toggleActive">
            {{ input.active ? 'Desativar' : 'Reativar' }}
          </button>
        </div></InventoryDialog
      >
      <RestockDialog
        v-if="restockOpen && !confirmOpen"
        :input-name="input.name"
        @close="restockOpen = false"
      />
    </template>
  </div>
</template>
