<script setup lang="ts">
import { computed } from 'vue';
import { useLotForm } from './useLotForm';
import { formatCurrencyBRL } from '../../../js/html.js';
import { getInputUnitLabel } from '../../../constants/inputUnits.js';
import '../inputDetail.css';
import './lots.css';
const props = defineProps<{ inputId: string; lotId?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const { input, lot, loading, error, missing, reload, fields, busy, feedback, unitPrice, submit } =
  useLotForm(props.inputId, props.lotId, (id) => emit('saved', id));
const editing = Boolean(props.lotId);
const back = computed(
  () =>
    `/inventory/${encodeURIComponent(props.inputId)}/lots${props.lotId ? '/' + encodeURIComponent(props.lotId) : ''}`,
);
</script>
<template>
  <div class="input-detail-vue lots-vue">
    <a v-if="!busy" :href="back" class="button button--secondary input-detail-back" data-link
      >Voltar</a
    >
    <h2>{{ editing ? 'Editar informações do lote' : 'Registrar compra / lote' }}</h2>
    <p v-if="loading" role="status">Carregando dados…</p>
    <section v-else-if="error" class="input-detail-section" role="alert">
      <p>{{ error }}</p>
      <button class="button button--secondary" @click="reload">Tentar novamente</button>
    </section>
    <section v-else-if="missing" class="input-detail-section">
      <h3>Lote ou insumo não encontrado</h3>
      <p>Confira se este lote pertence ao insumo selecionado.</p>
    </section>
    <section v-else-if="input && !editing && !input.active" class="input-detail-section">
      <h3>Insumo inativo</h3>
      <p>Reative o insumo antes de cadastrar uma nova compra.</p>
      <a
        :href="`/inventory/${encodeURIComponent(inputId)}`"
        class="button button--secondary"
        data-link
        >Voltar ao insumo</a
      >
    </section>
    <template v-else-if="input && (!editing || lot)">
      <p>{{ input.name }} • {{ getInputUnitLabel(input.base_unit) }}</p>
      <section class="input-detail-section">
        <h3>{{ editing ? 'Dados de estoque protegidos' : 'Entrada automática' }}</h3>
        <p>
          {{
            editing
              ? 'Quantidade, unidade, preço e data da compra são somente leitura. Corrija o saldo pelas movimentações.'
              : 'Ao salvar esta compra, o estoque receberá automaticamente a quantidade informada.'
          }}
        </p>
      </section>
      <p v-if="feedback" role="alert">{{ feedback }}</p>
      <form novalidate :aria-busy="busy" @submit.prevent="submit">
        <fieldset :disabled="busy">
          <section class="input-detail-section">
            <h3>Compra</h3>
            <div class="lot-form-grid">
              <div class="field">
                <label for="lot-quantity">Quantidade comprada *</label
                ><input
                  id="lot-quantity"
                  v-model="fields.purchasedQuantity"
                  type="text"
                  inputmode="decimal"
                  :readonly="editing"
                  :required="!editing"
                /><small>Até quatro casas decimais.</small>
              </div>
              <div class="field">
                <label for="lot-unit">Unidade</label
                ><input
                  id="lot-unit"
                  :value="getInputUnitLabel(lot?.unit || input.base_unit)"
                  readonly
                />
              </div>
              <div class="field">
                <label for="lot-total-price">Preço total (R$)</label
                ><input
                  id="lot-total-price"
                  v-model="fields.totalPrice"
                  type="text"
                  inputmode="decimal"
                  :readonly="editing"
                  placeholder="Ex.: 250,00"
                />
              </div>
              <div class="field">
                <label for="lot-unit-price">Preço unitário</label
                ><output id="lot-unit-price" aria-live="polite">{{
                  formatCurrencyBRL(unitPrice)
                }}</output>
              </div>
              <div class="field">
                <label for="lot-purchase-date">Data da compra *</label
                ><input
                  id="lot-purchase-date"
                  v-model="fields.purchaseDate"
                  type="date"
                  :readonly="editing"
                  :required="!editing"
                />
              </div>
            </div>
          </section>
          <section class="input-detail-section">
            <h3>Identificação do lote</h3>
            <div class="field">
              <label for="lot-supplier">Fornecedor</label
              ><input id="lot-supplier" v-model="fields.supplier" maxlength="180" />
            </div>
            <div class="lot-form-grid">
              <div class="field">
                <label for="lot-batch-number">Número do lote</label
                ><input id="lot-batch-number" v-model="fields.batchNumber" maxlength="120" />
              </div>
              <div class="field">
                <label for="lot-expiration-date">Validade</label
                ><input id="lot-expiration-date" v-model="fields.expirationDate" type="date" />
              </div>
            </div>
            <div class="field">
              <label for="lot-notes">Observações</label
              ><textarea id="lot-notes" v-model="fields.notes" maxlength="1500" rows="4"></textarea>
            </div>
          </section>
        </fieldset>
        <div class="input-detail-actions">
          <a v-if="!busy" :href="back" class="button button--secondary" data-link>Cancelar</a
          ><button class="button button--primary" :disabled="busy" type="submit">
            {{ busy ? 'Salvando…' : editing ? 'Salvar informações' : 'Cadastrar lote' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
