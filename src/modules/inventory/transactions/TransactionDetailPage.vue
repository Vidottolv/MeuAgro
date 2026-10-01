<script setup lang="ts">
import { computed } from 'vue';
import { useResource } from '../shared/useResource';
import { fetchTransaction } from './transactionRepository';
import { cycleLabel } from './transactionModel';
import {
  getInventoryTransactionSign,
  getInventoryTransactionTypeLabel,
} from '../../../constants/inventoryTransactionTypes.js';
import {
  formatCurrencyBRL,
  formatDatePtBr,
  formatDateTimePtBr,
  formatNumberPtBr,
} from '../../../js/html.js';
import '../inputDetail.css';
import './transactions.css';
const props = defineProps<{ transactionId: string }>();
const {
  data: item,
  loading,
  error,
  reload,
} = useResource(() => fetchTransaction(props.transactionId), null);
const historyHref = computed(() =>
  item.value
    ? `/inventory/${encodeURIComponent(item.value.agricultural_input_id)}/transactions${item.value.inventory_lot_id ? '?lot=' + encodeURIComponent(item.value.inventory_lot_id) : ''}`
    : '/inventory/transactions',
);
const newHref = computed(() =>
  item.value
    ? `/inventory/transactions/new?input=${encodeURIComponent(item.value.agricultural_input_id)}${item.value.inventory_lot_id ? '&lot=' + encodeURIComponent(item.value.inventory_lot_id) : ''}`
    : '/inventory/transactions/new',
);
</script>
<template>
  <div class="input-detail-vue transactions-vue">
    <a :href="historyHref" class="button button--secondary input-detail-back" data-link
      >Voltar às movimentações</a
    >
    <p v-if="loading" role="status">Carregando movimentação…</p>
    <section v-else-if="error" class="input-detail-section" role="alert">
      <p>{{ error }}</p>
      <button class="button button--secondary" @click="reload">Tentar novamente</button>
    </section>
    <section v-else-if="!item" class="input-detail-section">
      <h2>Movimentação não encontrada</h2>
      <p>Este registro não existe ou não está disponível para sua conta.</p>
    </section>
    <template v-else>
      <section class="input-detail-section">
        <p>{{ item.agricultural_input?.name || 'Insumo' }}</p>
        <h2>{{ getInventoryTransactionTypeLabel(item.transaction_type) }}</h2>
        <p>{{ formatDateTimePtBr(item.occurred_at) }}</p>
        <strong
          >{{ getInventoryTransactionSign(item.transaction_type) > 0 ? '+' : '-'
          }}{{ formatNumberPtBr(item.quantity) }} {{ item.unit }}</strong
        >
      </section>
      <section class="input-detail-section">
        <h3>Registro imutável</h3>
        <p>
          Esta movimentação não pode ser editada ou excluída. Para corrigir uma divergência,
          registre um novo ajuste.
        </p>
        <a :href="newHref" class="button button--secondary" data-link>Registrar novo ajuste</a>
      </section>
      <section class="input-detail-summary">
        <article>
          <span>Custo unitário</span><strong>{{ formatCurrencyBRL(item.unit_cost) }}</strong>
        </article>
        <article>
          <span>Custo total</span><strong>{{ formatCurrencyBRL(item.total_cost) }}</strong>
        </article>
      </section>
      <section class="input-detail-section">
        <h3>Detalhes do registro</h3>
        <dl>
          <dt>Lote</dt>
          <dd>
            {{
              item.inventory_lot
                ? item.inventory_lot.batch_number
                  ? `Lote ${item.inventory_lot.batch_number}`
                  : `Compra de ${formatDatePtBr(item.inventory_lot.purchase_date)}`
                : 'Sem lote'
            }}
          </dd>
          <dt>Ciclo produtivo</dt>
          <dd>
            {{
              item.production_cycle ? cycleLabel(item.production_cycle) : 'Sem ciclo relacionado'
            }}
          </dd>
          <dt>Evento produtivo</dt>
          <dd>{{ item.production_event?.title || 'Sem evento relacionado' }}</dd>
          <dt>Registrado em</dt>
          <dd>{{ formatDateTimePtBr(item.created_at) }}</dd>
          <dt>Observações</dt>
          <dd class="input-detail-notes">{{ item.notes || 'Nenhuma observação informada.' }}</dd>
        </dl>
      </section>
      <div class="input-detail-actions">
        <a
          :href="`/inventory/${encodeURIComponent(item.agricultural_input_id)}`"
          class="button button--secondary"
          data-link
          >Ver insumo</a
        ><a
          v-if="item.inventory_lot_id"
          :href="`/inventory/${encodeURIComponent(item.agricultural_input_id)}/lots/${encodeURIComponent(item.inventory_lot_id)}`"
          class="button button--secondary"
          data-link
          >Ver lote</a
        >
      </div>
    </template>
  </div>
</template>
