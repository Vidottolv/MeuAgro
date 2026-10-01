<script setup lang="ts">
import { computed } from 'vue';
import { useTransactionForm } from './useTransactionForm';
import { cycleLabel } from './transactionModel';
import {
  MANUAL_INVENTORY_TRANSACTION_TYPES,
  getInventoryTransactionTypeLabel,
} from '../../../constants/inventoryTransactionTypes.js';
import { formatNumberPtBr, formatCurrencyBRL, formatDatePtBr } from '../../../js/html.js';
import InventoryDialog from '../components/InventoryDialog.vue';
import RestockDialog from '../components/RestockDialog.vue';
import '../inputDetail.css';
import './transactions.css';
const props = defineProps<{ inputId?: string; lotId?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const {
  fields,
  inputs,
  cycles,
  lots,
  events,
  selectedInput,
  selectedLot,
  projected,
  estimatedCost,
  busy,
  feedback,
  review,
  savedId,
  restockName,
  requestReview,
  confirm,
  finish,
} = useTransactionForm(props.inputId || '', props.lotId || '', (id) => emit('saved', id));
const {
  data: inputItems,
  loading: inputsLoading,
  error: inputsError,
  reload: reloadInputs,
} = inputs;
const {
  data: cycleItems,
  loading: cyclesLoading,
  error: cyclesError,
  reload: reloadCycles,
} = cycles;
const { data: lotItems, loading: lotsLoading, error: lotsError, reload: reloadLots } = lots;
const {
  data: eventItems,
  loading: eventsLoading,
  error: eventsError,
  reload: reloadEvents,
} = events;
const back = computed(() =>
  fields.inputId
    ? `/inventory/${encodeURIComponent(fields.inputId)}/transactions${fields.lotId ? '?lot=' + encodeURIComponent(fields.lotId) : ''}`
    : '/inventory/transactions',
);
</script>
<template>
  <div class="input-detail-vue transactions-vue">
    <a v-if="!busy" :href="back" class="button button--secondary input-detail-back" data-link
      >Voltar às movimentações</a
    >
    <h2>Registrar movimentação</h2>
    <p v-if="inputsLoading" role="status">Carregando insumos…</p>
    <section v-else-if="inputsError" class="input-detail-section" role="alert">
      <p>{{ inputsError }}</p>
      <button class="button button--secondary" @click="reloadInputs">
        Tentar carregar insumos
      </button>
    </section>
    <section v-else-if="!inputItems.length" class="input-detail-section">
      <h3>Cadastre um insumo primeiro</h3>
      <p>Você precisa de um insumo e de um lote para movimentar o estoque.</p>
      <a href="/inventory/new" class="button button--primary" data-link>Cadastrar insumo</a>
    </section>
    <template v-else>
      <section class="input-detail-section">
        <h3>Entradas e uso são automáticos</h3>
        <p>
          Uma compra gera a entrada pelo cadastro do lote. O uso em uma atividade produtiva gera a
          saída. Aqui você registra ajustes, perdas, vencimentos e devoluções.
        </p>
      </section>
      <p v-if="feedback" role="alert">{{ feedback }}</p>
      <section v-if="savedId" class="input-detail-section" role="status">
        <h3>Movimentação registrada</h3>
        <p>O registro foi salvo. Você já pode abrir os detalhes.</p>
        <button class="button button--primary" @click="finish">Ver registro salvo</button>
      </section>
      <form novalidate :aria-busy="busy" @submit.prevent="requestReview">
        <fieldset :disabled="busy || Boolean(review)">
          <section class="input-detail-section">
            <h3>Movimentação</h3>
            <div class="field">
              <label for="transaction-input">Insumo *</label
              ><select id="transaction-input" v-model="fields.inputId">
                <option value="">Selecione</option>
                <option v-for="item in inputItems" :key="item.id" :value="item.id">
                  {{ item.name }}{{ item.active ? '' : ' • inativo' }}
                </option>
              </select>
            </div>
            <p v-if="selectedInput && !selectedInput.active">
              Insumo inativo. Os ajustes e as baixas dos lotes existentes continuam disponíveis.
            </p>
            <div v-if="lotsError" role="alert">
              <p>{{ lotsError }}</p>
              <button type="button" class="button button--secondary" @click="reloadLots">
                Tentar carregar lotes
              </button>
            </div>
            <div class="field">
              <label for="transaction-lot">Lote *</label
              ><select
                id="transaction-lot"
                v-model="fields.lotId"
                :disabled="!fields.inputId || lotsLoading || Boolean(lotsError)"
              >
                <option value="">{{ lotsLoading ? 'Carregando lotes…' : 'Selecione' }}</option>
                <option v-for="item in lotItems" :key="item.id" :value="item.id">
                  {{
                    item.batch_number
                      ? `Lote ${item.batch_number}`
                      : `Compra ${formatDatePtBr(item.purchase_date)}`
                  }}
                  • saldo {{ formatNumberPtBr(item.current_quantity) }} {{ item.unit }}
                </option>
              </select>
            </div>
            <p v-if="fields.inputId && !lotsLoading && !lotsError && !lotItems.length">
              Nenhum lote disponível para este insumo.
            </p>
            <a
              v-if="
                selectedInput?.active && !lotsLoading && !lotsError && !lotItems.length && !busy
              "
              :href="`/inventory/${encodeURIComponent(fields.inputId)}/lots/new`"
              class="button button--secondary"
              data-link
              >Cadastrar lote</a
            >
            <div class="transaction-filter-grid">
              <div class="field">
                <label for="transaction-type">Tipo *</label
                ><select id="transaction-type" v-model="fields.transactionType">
                  <option
                    v-for="[value, label] in MANUAL_INVENTORY_TRANSACTION_TYPES"
                    :key="value"
                    :value="value"
                  >
                    {{ label }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label for="transaction-quantity">Quantidade *</label
                ><input
                  id="transaction-quantity"
                  v-model="fields.quantity"
                  type="text"
                  inputmode="decimal"
                  placeholder="Ex.: 2,5"
                /><small>Até quatro casas decimais.</small>
              </div>
            </div>
            <div class="transaction-preview" aria-live="polite">
              <article>
                <span>Saldo atual do lote</span
                ><strong>{{
                  selectedLot
                    ? formatNumberPtBr(selectedLot.current_quantity) + ' ' + selectedLot.unit
                    : '—'
                }}</strong>
              </article>
              <article>
                <span>Saldo previsto</span
                ><strong>{{
                  projected !== null ? formatNumberPtBr(projected) + ' ' + selectedLot?.unit : '—'
                }}</strong>
              </article>
              <article>
                <span>Custo estimado</span><strong>{{ formatCurrencyBRL(estimatedCost) }}</strong>
              </article>
            </div>
            <p>
              Prévia baseada no saldo carregado. O saldo será conferido novamente pelo banco ao
              salvar.
            </p>
            <div class="field">
              <label for="transaction-occurred-at">Data e horário *</label
              ><input
                id="transaction-occurred-at"
                v-model="fields.occurredAt"
                type="datetime-local"
              />
            </div>
          </section>
          <section class="input-detail-section">
            <h3>Relação com produção</h3>
            <p>Opcional. Vincule a um ciclo e, se houver, a um evento específico.</p>
            <p v-if="cyclesLoading" role="status">Carregando ciclos…</p>
            <div v-if="cyclesError" role="alert">
              <p>{{ cyclesError }}</p>
              <button type="button" class="button button--secondary" @click="reloadCycles">
                Tentar carregar ciclos
              </button>
              <p>Você pode continuar sem vínculo de produção.</p>
            </div>
            <div class="field">
              <label for="transaction-cycle">Ciclo produtivo</label
              ><select
                id="transaction-cycle"
                v-model="fields.productionCycleId"
                :disabled="cyclesLoading || Boolean(cyclesError)"
              >
                <option value="">Sem ciclo relacionado</option>
                <option v-for="item in cycleItems" :key="item.id" :value="item.id">
                  {{ cycleLabel(item) }}
                </option>
              </select>
            </div>
            <div v-if="eventsError" role="alert">
              <p>{{ eventsError }}</p>
              <button type="button" class="button button--secondary" @click="reloadEvents">
                Tentar carregar eventos
              </button>
            </div>
            <div class="field">
              <label for="transaction-event">Evento produtivo</label
              ><select
                id="transaction-event"
                v-model="fields.productionEventId"
                :disabled="!fields.productionCycleId || eventsLoading || Boolean(eventsError)"
              >
                <option value="">
                  {{ eventsLoading ? 'Carregando eventos…' : 'Sem evento específico' }}
                </option>
                <option v-for="item in eventItems" :key="item.id" :value="item.id">
                  {{ item.title }}
                </option>
              </select>
            </div>
          </section>
          <section class="input-detail-section">
            <h3>Motivo da movimentação</h3>
            <div class="field">
              <label for="transaction-notes">Observações</label
              ><textarea
                id="transaction-notes"
                v-model="fields.notes"
                maxlength="1500"
                rows="4"
                placeholder="Descreva o ajuste, a perda ou a devolução"
              ></textarea>
            </div>
          </section>
        </fieldset>
        <div v-if="!savedId" class="input-detail-actions">
          <a v-if="!busy" :href="back" class="button button--secondary" data-link>Cancelar</a
          ><button
            class="button button--primary"
            type="submit"
            :disabled="busy || lotsLoading || eventsLoading"
          >
            {{ busy ? 'Registrando…' : 'Revisar movimentação' }}
          </button>
        </div>
      </form>
    </template>
    <InventoryDialog v-if="review" title="Confirmar movimentação" @close="review = null"
      ><p>{{ selectedInput?.name }} • {{ selectedLot?.batch_number || 'Lote selecionado' }}</p>
      <p>
        {{ getInventoryTransactionTypeLabel(review.transactionType) }}: {{ review.quantity }}
        {{ selectedLot?.unit }}
      </p>
      <p>Saldo previsto: {{ formatNumberPtBr(projected) }} {{ selectedLot?.unit }}</p>
      <p>Este registro não poderá ser editado ou excluído.</p>
      <button class="button button--secondary" @click="review = null">
        Voltar ao preenchimento</button
      ><button class="button button--primary" @click="confirm">
        Confirmar registro
      </button></InventoryDialog
    >
    <RestockDialog v-if="restockName" :input-name="restockName" @close="finish" />
  </div>
</template>
