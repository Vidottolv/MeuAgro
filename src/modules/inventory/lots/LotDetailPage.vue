<script setup lang="ts">
import { computed } from 'vue';
import { useLotPage } from './useLotPage';
import { lotStatus } from '../detailModel';
import RecentTransactions from '../components/RecentTransactions.vue';
import { formatDatePtBr, formatCurrencyBRL, formatNumberPtBr } from '../../../js/html.js';
import '../inputDetail.css';
import './lots.css';
const props = defineProps<{ inputId: string; lotId: string }>();
const {
  input,
  lot,
  history,
  loading,
  error,
  missing,
  relatedLoading,
  relatedError,
  reload,
  reloadRelated,
} = useLotPage(props.inputId, props.lotId);
const base = computed(() => `/inventory/${encodeURIComponent(props.inputId)}/lots`);
</script>
<template>
  <div class="input-detail-vue lots-vue">
    <a :href="base" class="button button--secondary input-detail-back" data-link
      >Voltar aos lotes</a
    >
    <p v-if="loading" role="status">Carregando lote…</p>
    <section v-else-if="error" class="input-detail-section" role="alert">
      <p>{{ error }}</p>
      <button class="button button--secondary" @click="reload">Tentar novamente</button>
    </section>
    <section v-else-if="missing" class="input-detail-section">
      <h2>Lote não encontrado</h2>
      <p>Este lote não existe ou não pertence a este insumo.</p>
    </section>
    <template v-else-if="input && lot">
      <section class="input-detail-section">
        <p>{{ input.name }}</p>
        <h2>
          {{
            lot.batch_number
              ? `Lote ${lot.batch_number}`
              : `Compra de ${formatDatePtBr(lot.purchase_date)}`
          }}
        </h2>
        <span class="lot-vue-status">{{ lotStatus(lot) }}</span>
        <div class="input-detail-actions">
          <a
            :href="`${base}/${encodeURIComponent(lotId)}/edit`"
            class="button button--secondary"
            data-link
            >Editar identificação</a
          ><a
            :href="`/inventory/transactions/new?input=${encodeURIComponent(inputId)}&lot=${encodeURIComponent(lotId)}`"
            class="button button--primary"
            data-link
            >Movimentar estoque</a
          >
        </div>
      </section>
      <section class="input-detail-summary">
        <article>
          <span>Saldo do lote</span
          ><strong>{{ formatNumberPtBr(lot.current_quantity) }} {{ lot.unit }}</strong
          ><small>Calculado pelas movimentações</small>
        </article>
        <article>
          <span>Quantidade comprada</span
          ><strong>{{ formatNumberPtBr(lot.purchased_quantity) }} {{ lot.unit }}</strong>
        </article>
        <article>
          <span>Preço total</span><strong>{{ formatCurrencyBRL(lot.total_price) }}</strong>
        </article>
        <article>
          <span>Preço unitário</span><strong>{{ formatCurrencyBRL(lot.unit_price) }}</strong
          ><small>por {{ lot.unit }}</small>
        </article>
      </section>
      <section class="input-detail-section">
        <h3>Identificação</h3>
        <dl>
          <dt>Fornecedor</dt>
          <dd>{{ lot.supplier || 'Não informado' }}</dd>
          <dt>Número do lote</dt>
          <dd>{{ lot.batch_number || 'Não informado' }}</dd>
          <dt>Data da compra</dt>
          <dd>{{ formatDatePtBr(lot.purchase_date) }}</dd>
          <dt>Validade</dt>
          <dd>{{ formatDatePtBr(lot.expiration_date) }}</dd>
          <dt>Observações</dt>
          <dd class="input-detail-notes">{{ lot.notes || 'Nenhuma observação informada.' }}</dd>
        </dl>
      </section>
      <RecentTransactions
        :items="history"
        :input-id="inputId"
        :lot-id="lotId"
        :limit="5"
        :loading="relatedLoading"
        :error="relatedError"
        @retry="reloadRelated"
      />
    </template>
  </div>
</template>
